import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { getReputation } from '../reputation.js'
import { resolveOnChain, readSbtData } from '../ton-contract.js'

const nameSchema = z.string().min(3).max(32).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/)

const profileStmt = db.prepare(
  'SELECT display_name, tagline, avatar_url, tags, languages, links FROM profiles WHERE agent_name = ?',
)

interface ProfileRow {
  display_name: string | null
  tagline: string | null
  avatar_url: string | null
  tags: string
  languages: string
  links: string
}

function parseProfile(row: ProfileRow) {
  return {
    display_name: row.display_name,
    tagline: row.tagline,
    avatar_url: row.avatar_url,
    tags: JSON.parse(row.tags),
    languages: JSON.parse(row.languages),
    links: JSON.parse(row.links),
  }
}

const cacheStmt = db.prepare(
  'SELECT owner, soul_hash, payment_address, registered_at FROM name_cache WHERE name = ? AND cached_at > unixepoch() - 300',
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

const deleteCacheStmt = db.prepare('DELETE FROM name_cache WHERE name = ?')

const jobTimestampStmt = db.prepare(
  `SELECT registered_at, created_at FROM registration_jobs WHERE name = ? AND status = 'completed' LIMIT 1`,
)

function buildResponse(
  name: string,
  owner: string,
  soul_hash: string,
  payment_address: string,
  registered_at: number,
) {
  const profileRow = profileStmt.get(name) as ProfileRow | undefined
  const reputation = getReputation(name)
  return {
    name: `${name}.agent`,
    chain: 'ton',
    owner,
    soul_hash,
    payment_address,
    // Only include registered_at when it's a real timestamp (>0), omit when unknown
    ...(registered_at > 0 && { registered_at }),
    profile: profileRow ? parseProfile(profileRow) : null,
    reputation,
  }
}

const router = Router()

router.get('/names/:name', async (req: Request, res: Response) => {
  const parsed = nameSchema.safeParse(req.params.name)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_name', message: 'Name must be 3-32 chars, lowercase alphanumeric and hyphens.' })
    return
  }

  const name = parsed.data

  // Try cache first
  const cached = cacheStmt.get(name) as {
    owner: string
    soul_hash: string
    payment_address: string
    registered_at: number
  } | undefined

  if (cached) {
    // Verify SBT is still active and cached data matches on-chain state
    try {
      const onChain = await resolveOnChain(name)
      if (onChain) {
        const sbtData = await readSbtData(onChain.sbtAddress)
        if (!sbtData || sbtData.isRevoked) {
          deleteCacheStmt.run(name)
          res.status(404).json({ error: 'not_found', name: `${name}.agent` })
          return
        }
        // Verify all cached identity fields match on-chain (catches re-registration with different soul_hash)
        const onChainSoulHash = sbtData.soulHash.toString()
        if (sbtData.owner !== cached.owner || onChainSoulHash !== cached.soul_hash || sbtData.paymentAddress !== cached.payment_address) {
          deleteCacheStmt.run(name)
          // Fall through to full on-chain path to serve correct data
        } else {
          res.json(buildResponse(name, cached.owner, cached.soul_hash, cached.payment_address, cached.registered_at))
          return
        }
      } else {
        // Name doesn't exist on-chain — cache is stale
        deleteCacheStmt.run(name)
        res.status(404).json({ error: 'not_found', name: `${name}.agent` })
        return
      }
    } catch {
      // On-chain check failed — invalidate cache and fall through to full on-chain path
      deleteCacheStmt.run(name)
    }
  }

  // Fall back to on-chain
  try {
    const onChain = await resolveOnChain(name)
    if (!onChain) {
      res.status(404).json({ error: 'not_found', name: `${name}.agent` })
      return
    }

    const sbtData = await readSbtData(onChain.sbtAddress)
    if (!sbtData || sbtData.isRevoked) {
      res.status(404).json({ error: 'not_found', name: `${name}.agent` })
      return
    }

    // Only use real on-chain tx timestamp — never fall back to created_at (which is not chain-confirmed)
    const jobRow = jobTimestampStmt.get(name) as { registered_at: number | null; created_at: number } | undefined
    const registeredAt = (jobRow?.registered_at && jobRow.registered_at > 0) ? jobRow.registered_at : 0
    upsertCacheStmt.run(name, sbtData.owner, sbtData.soulHash.toString(), sbtData.paymentAddress, registeredAt)

    res.json(buildResponse(name, sbtData.owner, sbtData.soulHash.toString(), sbtData.paymentAddress, registeredAt))
  } catch (error) {
    console.error('On-chain resolve failed:', error)
    res.status(502).json({ error: 'chain_error', message: 'Could not resolve name on-chain.' })
  }
})

export default router
