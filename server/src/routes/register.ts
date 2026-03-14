import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { Address } from '@ton/core'
import { db } from '../db.js'
import { getPrice, getPriceNanoton, findMatchingPayment, isNameTakenOnChain } from '../ton-client.js'

// In-process lock for the brief window within a single /register request
const processingNames = new Set<string>()

const nameSchema = z.object({
  name: z.string().min(3).max(32).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/),
  owner: z.string().min(1).refine(s => { try { Address.parse(s); return true } catch { return false } }, 'Invalid TON address'),
})

const insertJobStmt = db.prepare(`
  INSERT INTO registration_jobs (id, name, owner, soul_hash, payment_address, payment_tx, status)
  VALUES (?, ?, ?, ?, ?, ?, 'queued')
`)

const getJobStmt = db.prepare(
  'SELECT id, name, owner, soul_hash, payment_address, status, tx_hash, error, created_at FROM registration_jobs WHERE id = ?',
)

const checkInProgressStmt = db.prepare(
  `SELECT id, owner, status FROM registration_jobs WHERE name = ? AND status IN ('queued', 'registering')`,
)

const deleteStaleJobStmt = db.prepare(
  `DELETE FROM registration_jobs WHERE name = ? AND status IN ('failed', 'completed')`,
)

const checkUsedPaymentStmt = db.prepare(
  'SELECT tx_lt FROM used_payments WHERE tx_lt = ?',
)

const insertUsedPaymentStmt = db.prepare(
  'INSERT INTO used_payments (tx_lt, tx_hash, sender, agent_name) VALUES (?, ?, ?, ?)',
)

const listUsedLtsStmt = db.prepare(
  'SELECT tx_lt FROM used_payments WHERE created_at > unixepoch() - 600',
)

const router = Router()

router.post('/register', async (req: Request, res: Response) => {
  const parsed = nameSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() })
    return
  }

  const { name, owner } = parsed.data
  const price = getPrice(name)

  // Check DB for in-progress registration
  const inProgress = checkInProgressStmt.get(name) as { id: string; owner: string; status: string } | undefined
  if (inProgress) {
    // Only provide poll_url if the requester owns this job (prevents cross-user info leak)
    const isOwnJob = inProgress.owner === owner
    res.status(409).json({
      error: 'name_pending',
      message: 'Registration in progress.',
      ...(isOwnJob && { poll_url: `/registrations/${inProgress.id}` }),
    })
    return
  }

  // In-process lock (prevents concurrent /register requests within this process)
  if (processingNames.has(name)) {
    res.status(409).json({ error: 'name_pending', message: 'Registration already in progress.' })
    return
  }
  processingNames.add(name)

  // On-chain pre-check: authoritative source of truth
  try {
    const takenOnChain = await isNameTakenOnChain(name)
    if (takenOnChain) {
      processingNames.delete(name)
      res.status(409).json({ error: 'name_taken', message: `${name}.agent is already registered on-chain. If you sent a payment, please contact support for a manual refund.` })
      return
    }
  } catch (error) {
    processingNames.delete(name)
    console.error('On-chain name check failed:', error)
    res.status(502).json({ error: 'chain_error', message: 'Could not verify name availability on-chain.' })
    return
  }

  let matchedPayment: { lt: string; hash: string; soulHash: string } | null = null
  try {
    const expectedNanoton = getPriceNanoton(name)
    const usedRows = listUsedLtsStmt.all() as { tx_lt: string }[]
    const usedLts = new Set(usedRows.map(r => r.tx_lt))
    matchedPayment = await findMatchingPayment(owner, expectedNanoton, usedLts, name)
  } catch (error) {
    processingNames.delete(name)
    console.error('Payment verification failed:', error)
    res.status(502).json({ error: 'payment_check_failed', message: 'Could not verify payment on-chain.' })
    return
  }

  if (!matchedPayment) {
    processingNames.delete(name)
    res.status(402).json({
      error: 'payment_not_found',
      message: `No unused payment of ${price} TON from ${owner} found. Payment comment must be "name:soul_hash".`,
    })
    return
  }

  const alreadyUsed = checkUsedPaymentStmt.get(matchedPayment.lt)
  if (alreadyUsed) {
    processingNames.delete(name)
    res.status(402).json({ error: 'payment_already_used', message: 'This payment was already used for another registration.' })
    return
  }

  const id = randomUUID()
  const soulHash = matchedPayment.soulHash
  const paymentAddress = owner

  try {
    const insertPaymentAndJob = db.transaction(() => {
      deleteStaleJobStmt.run(name)
      insertUsedPaymentStmt.run(matchedPayment!.lt, matchedPayment!.hash, owner, name)
      insertJobStmt.run(id, name, owner, soulHash, paymentAddress, matchedPayment!.hash)
    })
    insertPaymentAndJob()
    processingNames.delete(name)

    res.status(202).json({
      registration_id: id,
      name: `${name}.agent`,
      status: 'queued',
      price_ton: price,
      poll_url: `/registrations/${id}`,
    })
  } catch (error) {
    processingNames.delete(name)
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      const activeJob = checkInProgressStmt.get(name) as { id: string; owner: string } | undefined
      const isOwnJob = activeJob && activeJob.owner === owner
      res.status(409).json({
        error: 'name_pending',
        message: 'Name registration already in progress.',
        ...(isOwnJob && { poll_url: `/registrations/${activeJob.id}` }),
      })
      return
    }
    throw error
  }
})

router.get('/registrations/:id', async (req: Request, res: Response) => {
  const job = getJobStmt.get(req.params.id) as Record<string, unknown> | undefined
  if (!job) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  res.json(job)
})

export default router
