import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { getOperatorAddress, getPriceInfo } from './ton-client.js'
import { db } from './db.js'
import searchRouter from './routes/search.js'
import registerRouter from './routes/register.js'
import resolveRouter from './routes/resolve.js'
import profileRouter from './routes/profile.js'
import creditRouter from './routes/credit.js'
import verifyRouter from './routes/verify.js'
import { startRegistrationWorker } from './registration-worker.js'

const app = express()

app.use(cors({ origin: config.corsOrigin }))
app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', chain: 'ton', network: config.tonNetwork })
})

// API routes
const api = express.Router()

api.get('/operator', async (_req, res) => {
  const address = await getOperatorAddress()
  const pricing = getPriceInfo()
  res.json({ address, pricing, network: config.tonNetwork })
})

// TEP-64 NFT metadata: collection
api.get('/nft/', (_req, res) => {
  res.json({
    name: 'Soulink Agent Registry',
    description: 'AI Agent Identities on TON — soulink.dev',
    image: 'https://ton.soulink.dev/collection.png',
    external_link: 'https://ton.soulink.dev',
  })
})

// TEP-64 NFT metadata: individual item
api.get('/nft/:name', (req, res) => {
  const name = req.params.name
  const profileStmt = db.prepare(
    'SELECT display_name, tagline, avatar_url FROM profiles WHERE agent_name = ?',
  )
  const profile = profileStmt.get(name) as { display_name?: string; tagline?: string; avatar_url?: string } | undefined

  res.json({
    name: `${name}.agent`,
    description: profile?.tagline ?? `Soulink agent identity: ${name}.agent`,
    image: profile?.avatar_url ?? 'https://ton.soulink.dev/agent-nft.png',
    external_url: `https://ton.soulink.dev/agent/${name}`,
    attributes: [
      { trait_type: 'Chain', value: 'TON' },
      { trait_type: 'Type', value: 'Soulbound' },
    ],
  })
})

// Agent directory — list recently registered agents
api.get('/agents/directory', (_req, res) => {
  const agents = db.prepare(`
    SELECT j.name, j.owner, p.tagline, p.tags,
      COALESCE(c.score, 50) as score, COALESCE(c.report_count, 0) as report_count
    FROM registration_jobs j
    LEFT JOIN profiles p ON p.agent_name = j.name
    LEFT JOIN credit_scores c ON c.agent_name = j.name
    WHERE j.status = 'completed'
    ORDER BY j.created_at DESC LIMIT 20
  `).all() as { name: string; owner: string; tagline: string | null; tags: string | null; score: number; report_count: number }[]

  res.json(agents.map(a => ({
    name: `${a.name}.agent`,
    owner: a.owner,
    profile: a.tagline || a.tags ? { tagline: a.tagline, tags: a.tags ? JSON.parse(a.tags) : [] } : null,
    reputation: { score: a.score, report_count: a.report_count },
  })))
})

api.use(searchRouter)
api.use(registerRouter)
api.use(resolveRouter)
api.use(profileRouter)
api.use(creditRouter)
api.use(verifyRouter)

app.use('/api/v1', api)

// Global JSON error handler — catches unhandled throws from async routes
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred.' })
})

app.listen(config.port, () => {
  console.log(`Soulink TON server running on port ${config.port} (${config.tonNetwork})`)
  startRegistrationWorker()
  console.log('Registration worker started')
})
