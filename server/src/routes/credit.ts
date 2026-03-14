import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { getReputation, submitReport, getReports } from '../reputation.js'
import { verifyAgentAuth, verifyAgentOwnership, bodyDigest } from '../auth.js'
import { resolveOnChain, readSbtData } from '../ton-contract.js'

const router = Router()

router.get('/credit/:name', async (req: Request, res: Response) => {
  const name = req.params.name as string
  const reputation = getReputation(name)
  res.json({ name: `${name}.agent`, ...reputation })
})

router.get('/credit/:name/reports', async (req: Request, res: Response) => {
  const name = req.params.name as string
  const reports = getReports(name)
  res.json({ name: `${name}.agent`, reports })
})

const reportSchema = z.object({
  reporter: z.string().min(1),
  target: z.string().min(1),
  score: z.number().int().min(0).max(100),
  reason: z.string().max(500).optional(),
  // Auth fields
  public_key: z.string().min(1),
  signature: z.string().min(1),
  message: z.string().min(1),
})

router.post('/credit/report', async (req: Request, res: Response) => {
  const parsed = reportSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() })
    return
  }

  const { reporter, target, score, reason, public_key, signature, message } = parsed.data

  try {
    const digest = await bodyDigest(parsed.data)
    const auth = await verifyAgentAuth(reporter, 'credit-report', public_key, signature, message, digest)
    if (!auth.valid) {
      res.status(401).json({ error: 'unauthorized', message: auth.error })
      return
    }

    const ownership = await verifyAgentOwnership(reporter, public_key)
    if (!ownership.valid) {
      res.status(401).json({ error: 'not_owner', message: ownership.error })
      return
    }
  } catch (error) {
    console.error('Credit report auth chain error:', error)
    res.status(502).json({ error: 'chain_error', message: 'Could not verify ownership on-chain.' })
    return
  }

  if (reporter === target) {
    res.status(400).json({ error: 'self_report', message: 'Cannot report yourself.' })
    return
  }

  // Verify target is an active agent (not just nameHash exists — exclude destroyed/revoked SBTs)
  try {
    const resolved = await resolveOnChain(target)
    if (!resolved) {
      res.status(404).json({ error: 'target_not_found', message: `${target}.agent is not registered.` })
      return
    }
    const sbtData = await readSbtData(resolved.sbtAddress)
    if (!sbtData || sbtData.isRevoked) {
      res.status(404).json({ error: 'target_not_found', message: `${target}.agent is no longer active.` })
      return
    }
  } catch (error) {
    console.error('Credit report target check chain error:', error)
    res.status(502).json({ error: 'chain_error', message: 'Could not verify target on-chain.' })
    return
  }

  const result = submitReport(reporter, target, score, reason)
  if (!result) {
    res.status(429).json({ error: 'rate_limited', message: 'You can only update your report for this target once per 24 hours.' })
    return
  }

  res.json({
    target: `${target}.agent`,
    new_score: result.score,
    report_count: result.report_count,
  })
})

export default router
