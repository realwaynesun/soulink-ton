import { Router, type Request, type Response } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { verifyAgentAuth, verifyAgentOwnership, bodyDigest } from '../auth.js'

const router = Router()

const getProfileStmt = db.prepare(
  'SELECT display_name, tagline, avatar_url, tags, languages, links, updated_at FROM profiles WHERE agent_name = ?',
)

interface ProfileRow {
  display_name: string | null
  tagline: string | null
  avatar_url: string | null
  tags: string
  languages: string
  links: string
  updated_at: number
}

function parseProfile(row: ProfileRow) {
  return {
    display_name: row.display_name,
    tagline: row.tagline,
    avatar_url: row.avatar_url,
    tags: JSON.parse(row.tags),
    languages: JSON.parse(row.languages),
    links: JSON.parse(row.links),
    updated_at: row.updated_at,
  }
}

router.get('/agents/:name/profile', async (req: Request, res: Response) => {
  const row = getProfileStmt.get(req.params.name) as ProfileRow | undefined
  if (!row) {
    res.status(404).json({ error: 'not_found' })
    return
  }
  res.json(parseProfile(row))
})

const profileSchema = z.object({
  display_name: z.string().max(50).optional(),
  tagline: z.string().max(200).optional(),
  avatar_url: z.string().url().optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
  languages: z.array(z.string().max(5)).max(10).optional(),
  links: z.record(z.string().url()).optional(),
  // Auth
  public_key: z.string().min(1),
  signature: z.string().min(1),
  message: z.string().min(1),
})

const upsertProfileStmt = db.prepare(`
  INSERT INTO profiles (agent_name, display_name, tagline, avatar_url, tags, languages, links, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
  ON CONFLICT(agent_name) DO UPDATE SET
    display_name = COALESCE(excluded.display_name, profiles.display_name),
    tagline = COALESCE(excluded.tagline, profiles.tagline),
    avatar_url = COALESCE(excluded.avatar_url, profiles.avatar_url),
    tags = COALESCE(excluded.tags, profiles.tags),
    languages = COALESCE(excluded.languages, profiles.languages),
    links = COALESCE(excluded.links, profiles.links),
    updated_at = unixepoch()
`)

router.post('/agents/:name/profile', async (req: Request, res: Response) => {
  const parsed = profileSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'invalid_input', details: parsed.error.flatten() })
    return
  }

  const { display_name, tagline, avatar_url, tags, languages, links, public_key, signature, message } = parsed.data
  const name = req.params.name as string

  try {
    const digest = await bodyDigest(parsed.data)
    const auth = await verifyAgentAuth(name, 'profile', public_key, signature, message, digest)
    if (!auth.valid) {
      res.status(401).json({ error: 'unauthorized', message: auth.error })
      return
    }

    const ownership = await verifyAgentOwnership(name, public_key)
    if (!ownership.valid) {
      res.status(401).json({ error: 'not_owner', message: ownership.error })
      return
    }
  } catch (error) {
    console.error('Profile auth chain error:', error)
    res.status(502).json({ error: 'chain_error', message: 'Could not verify ownership on-chain.' })
    return
  }

  upsertProfileStmt.run(
    name,
    display_name ?? null,
    tagline ?? null,
    avatar_url ?? null,
    tags ? JSON.stringify(tags) : null,
    languages ? JSON.stringify(languages) : null,
    links ? JSON.stringify(links) : null,
  )

  res.json({ success: true, name: `${name}.agent` })
})

export default router
