import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { getPrice, isNameTakenOnChain } from '../ton-client.js'

const router = Router()

const searchQuery = z.object({
  q: z.string().min(1).max(32),
})

const checkCacheStmt = db.prepare(
  'SELECT name FROM name_cache WHERE name = ? AND cached_at > unixepoch() - 300',
)

const checkJobStmt = db.prepare(
  `SELECT name FROM registration_jobs WHERE name = ? AND status IN ('queued', 'registering', 'completed')`,
)

function unavailableResponse(name: string) {
  const suggestions = [
    `${name}-ai`,
    `${name}-bot`,
    `${name}-x`,
  ].filter((s) => s.length <= 32)

  return {
    available: false,
    name: `${name}.agent`,
    suggestions: suggestions.map((s) => `${s}.agent`),
  }
}

router.get('/names/search', async (req: Request, res: Response) => {
  const parsed = searchQuery.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_query', message: 'Provide ?q= with 1-32 chars.' })
    return
  }

  const name = parsed.data.q.toLowerCase()

  // Validate name format
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name) && !/^[a-z0-9]{1,2}$/.test(name)) {
    res.status(400).json({
      available: false,
      error: 'invalid_name',
      message: 'Name must be 3-32 chars, lowercase alphanumeric and hyphens.',
    })
    return
  }

  if (name.length < 3) {
    res.status(400).json({
      available: false,
      error: 'too_short',
      message: 'Name must be at least 3 characters.',
    })
    return
  }

  // Jobs in queued/registering — trust local state for these
  const inProgressJob = db.prepare(
    `SELECT name FROM registration_jobs WHERE name = ? AND status IN ('queued', 'registering')`,
  ).get(name) as { name: string } | undefined

  if (inProgressJob) {
    res.json(unavailableResponse(name))
    return
  }

  // On-chain is authoritative for everything else (catches stale cache/completed records)
  try {
    const takenOnChain = await isNameTakenOnChain(name)
    if (takenOnChain) {
      res.json(unavailableResponse(name))
      return
    }
  } catch (error) {
    console.error('On-chain name check failed:', error)
    // RPC failed — fall back to local state as best-effort
    const cached = checkCacheStmt.get(name) as { name: string } | undefined
    const completedJob = checkJobStmt.get(name) as { name: string } | undefined
    if (cached || completedJob) {
      res.json(unavailableResponse(name))
      return
    }
    res.status(502).json({ error: 'chain_error', message: 'Could not verify name availability on-chain.' })
    return
  }

  res.json({
    available: true,
    name: `${name}.agent`,
    price_ton: getPrice(name).toString(),
  })
})

export default router
