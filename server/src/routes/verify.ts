import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { verifyAgentAuth, verifyAgentOwnership } from '../auth.js'

const router = Router()

const verifySchema = z.object({
  name: z.string().min(3).max(32),
  public_key: z.string().min(1),
  signature: z.string().min(1),
  message: z.string().min(1),
})

router.post('/verify', async (req: Request, res: Response) => {
  const parsed = verifySchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() })
    return
  }

  const { name, public_key, signature, message } = parsed.data

  try {
    const sigResult = await verifyAgentAuth(name, 'verify', public_key, signature, message)
    if (!sigResult.valid) {
      res.status(401).json({ error: 'invalid_signature', message: sigResult.error })
      return
    }

    const ownerResult = await verifyAgentOwnership(name, public_key)
    if (!ownerResult.valid) {
      res.status(401).json({ error: 'not_owner', message: ownerResult.error })
      return
    }
  } catch (error) {
    console.error('Verify chain error:', error)
    res.status(502).json({ error: 'chain_error', message: 'Could not verify ownership on-chain.' })
    return
  }

  res.json({
    verified: true,
    name: `${name}.agent`,
    chain: 'ton',
  })
})

export default router
