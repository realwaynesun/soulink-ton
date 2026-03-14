import { Address } from '@ton/core'
import { db } from './db.js'
import { registerOnChain, resolveOnChain, readSbtData, cleanGhostOnChain, isNameTakenOnChain } from './ton-contract.js'

interface QueuedJob {
  id: string
  name: string
  owner: string
  soul_hash: string
  payment_address: string
  payment_tx: string
  created_at: number
}

// Atomic claim: set status to 'registering' and return the row in one statement
const claimJobStmt = db.prepare(
  `UPDATE registration_jobs SET status = 'registering', updated_at = unixepoch()
   WHERE id = (SELECT id FROM registration_jobs WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1)
   RETURNING id, name, owner, soul_hash, payment_address, payment_tx, created_at`,
)

const updateStatusStmt = db.prepare(
  `UPDATE registration_jobs SET status = ?, tx_hash = ?, error = ?, updated_at = unixepoch() WHERE id = ?`,
)

const updateRegisteredAtStmt = db.prepare(
  `UPDATE registration_jobs SET registered_at = ? WHERE id = ?`,
)

const upsertCacheStmt = db.prepare(`
  INSERT INTO name_cache (name, owner, soul_hash, payment_address, registered_at, cached_at)
  VALUES (?, ?, ?, ?, ?, unixepoch())
  ON CONFLICT(name) DO UPDATE SET
    owner = excluded.owner,
    soul_hash = excluded.soul_hash,
    payment_address = excluded.payment_address,
    registered_at = excluded.registered_at,
    cached_at = unixepoch()
`)

// Release the specific payment so user can retry (by tx_hash, not agent_name — avoids deleting unrelated payments)
const releasePaymentStmt = db.prepare(
  'DELETE FROM used_payments WHERE tx_hash = ?',
)

async function processJob(job: QueuedJob): Promise<void> {
  // Job already claimed as 'registering' by claimJobStmt

  let result: { txHash: string; registeredAt: number }
  try {
    result = await registerOnChain(job.name, job.owner, job.soul_hash, job.payment_address)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    // Timeout: tx was sent but not confirmed — leave in 'registering' for stuck-job recovery
    if (message.startsWith('TIMEOUT:')) {
      console.log(`Job ${job.name} timed out — leaving in registering for recovery`)
      return
    }
    // Detect ghost names: nameHash exists on-chain but SBT not initialized (failed deploy)
    // Triggered by pre-send check ("Name already registered") or post-send verify ("SBT not initialized")
    const isGhostCandidate = message === 'Name already registered on-chain'
      || message === 'Transaction confirmed but SBT not initialized'
    if (isGhostCandidate) {
      try {
        const resolved = await resolveOnChain(job.name)
        if (resolved) {
          const sbtData = await readSbtData(resolved.sbtAddress)
          if (!sbtData) {
            insertGhostStmt.run(job.name, Number(resolved.index))
            console.log(`Ghost candidate queued for ${job.name} (will clean after 5 min)`)
          }
        }
      } catch { /* detection failed, just proceed with normal failure */ }
    }
    // Definitive failure — mark failed and release payment
    db.transaction(() => {
      updateStatusStmt.run('failed', null, message, job.id)
      releasePaymentStmt.run(job.payment_tx)
    })()
    return
  }

  // Mint succeeded and owner+soul_hash verified — mark completed. Cache failure is non-fatal.
  updateStatusStmt.run('completed', result.txHash, null, job.id)
  updateRegisteredAtStmt.run(result.registeredAt, job.id)
  try {
    upsertCacheStmt.run(job.name, job.owner, job.soul_hash, job.payment_address, result.registeredAt)
  } catch (error) {
    console.error(`Cache write failed for ${job.name} (mint succeeded):`, error)
  }
}

// Only recover jobs stuck in 'registering' for > 5 minutes (grace period for in-flight txs)
const fetchStuckStmt = db.prepare(
  `SELECT id, name, owner, soul_hash, payment_address, payment_tx, created_at FROM registration_jobs
   WHERE status = 'registering' AND updated_at < unixepoch() - 300`,
)

async function recoverStuckJobs(): Promise<void> {
  const stuck = fetchStuckStmt.all() as QueuedJob[]
  for (const job of stuck) {
    try {
      const resolved = await resolveOnChain(job.name)
      if (!resolved) {
        // Name not on-chain — safe to re-queue
        updateStatusStmt.run('queued', null, null, job.id)
        console.log(`Recovered stuck job ${job.name}: re-queued for retry`)
        continue
      }
      const sbtData = await readSbtData(resolved.sbtAddress)
      if (!sbtData) {
        // nameHash exists but SBT not initialized — could be slow deploy or ghost
        // Queue as ghost candidate; don't re-queue job (would waste gas on duplicate tx)
        // Ghost cleanup will clear the nameHash after another 5 min, then next recovery re-queues
        insertGhostStmt.run(job.name, Number(resolved.index))
        console.log(`Recovered stuck job ${job.name}: SBT not initialized, queued ghost candidate`)
        continue
      }
      // Verify on-chain owner AND soul_hash match — soul_hash is the unique fingerprint
      const onChainOwner = Address.parse(sbtData.owner)
      const jobOwner = Address.parse(job.owner)
      const soulHashMatch = sbtData.soulHash === BigInt(job.soul_hash)
      if (onChainOwner.equals(jobOwner) && soulHashMatch) {
        updateStatusStmt.run('completed', null, null, job.id)
        // registered_at = 0 (unknown — on-chain tx timestamp not available in recovery)
        updateRegisteredAtStmt.run(0, job.id)
        try {
          upsertCacheStmt.run(job.name, job.owner, job.soul_hash, job.payment_address, 0)
        } catch { /* cache write non-fatal */ }
        console.log(`Recovered stuck job ${job.name}: already minted with matching soul_hash`)
      } else {
        // Name taken by different owner or different soul_hash — our tx was rejected
        db.transaction(() => {
          updateStatusStmt.run('failed', null, 'Name registered by different registration', job.id)
          releasePaymentStmt.run(job.payment_tx)
        })()
        console.log(`Recovered stuck job ${job.name}: on-chain data doesn't match, marked failed`)
      }
    } catch (error) {
      console.error(`Failed to recover stuck job ${job.name}:`, error)
    }
  }
}

const insertGhostStmt = db.prepare(
  `INSERT INTO ghost_candidates (name, item_index) VALUES (?, ?)
   ON CONFLICT(name) DO NOTHING`,
)

// Only process ghosts detected > 5 minutes ago (in-flight deploys complete in seconds)
const fetchMatureGhostsStmt = db.prepare(
  'SELECT name, item_index FROM ghost_candidates WHERE detected_at < unixepoch() - 300',
)

const deleteGhostStmt = db.prepare(
  'DELETE FROM ghost_candidates WHERE name = ?',
)

async function processGhostCandidates(): Promise<void> {
  const ghosts = fetchMatureGhostsStmt.all() as { name: string; item_index: number }[]
  for (const ghost of ghosts) {
    try {
      // Re-verify: is SBT still uninitialized after 5 minutes?
      const resolved = await resolveOnChain(ghost.name)
      if (!resolved) {
        deleteGhostStmt.run(ghost.name)
        continue
      }
      const sbtData = await readSbtData(resolved.sbtAddress)
      if (sbtData) {
        // SBT is now initialized — not a ghost, just remove from candidates
        deleteGhostStmt.run(ghost.name)
        continue
      }
      // Still uninitialized after 5 min — confirmed ghost, clean it up
      await cleanGhostOnChain(BigInt(ghost.item_index))
      // Verify cleanup actually worked (seqno advance doesn't prove the internal message succeeded)
      const stillTaken = await isNameTakenOnChain(ghost.name)
      if (stillTaken) {
        console.error(`Ghost cleanup sent for ${ghost.name} but name still taken — will retry`)
        continue // Keep candidate for next cycle
      }
      deleteGhostStmt.run(ghost.name)
      console.log(`Ghost name ${ghost.name} cleaned up on-chain`)
    } catch (error) {
      console.error(`Ghost cleanup failed for ${ghost.name}:`, error)
    }
  }
}

export function startRegistrationWorker(intervalMs = 5_000): NodeJS.Timeout {
  let processing = false

  const timer = setInterval(async () => {
    if (processing) return
    processing = true
    try {
      await recoverStuckJobs()
      await processGhostCandidates()
      // Claim and process jobs one at a time (atomic claim prevents multi-worker races)
      for (;;) {
        const job = claimJobStmt.get() as QueuedJob | undefined
        if (!job) break
        await processJob(job)
      }
    } finally {
      processing = false
    }
  }, intervalMs)

  return timer
}
