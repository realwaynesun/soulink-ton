import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'

interface SearchResult {
  available: boolean
  name: string
  price_ton?: string
  suggestions?: string[]
}

interface AgentEntry {
  name: string
  owner: string
  profile: { tagline: string | null; tags: string[] } | null
  reputation: { score: number; report_count: number }
}

const AGENT_TYPE_ICONS: Record<string, string> = {
  trading: '📈', assistant: '🤖', defi: '💰', social: '💬',
  data: '📊', security: '🛡️', infra: '⚙️', creative: '🎨',
}

export function HomePage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)
  const [directory, setDirectory] = useState<AgentEntry[]>([])
  const { call, loading } = useApi()
  const navigate = useNavigate()

  // Load agent directory on mount (from cache/recent registrations)
  useEffect(() => {
    call<AgentEntry[]>('/agents/directory').then(d => {
      if (d) setDirectory(d)
    })
  }, [call])

  async function handleSearch(searchName?: string) {
    const q = searchName ?? query
    if (!q.trim()) return
    const data = await call<SearchResult>(`/names/search?q=${encodeURIComponent(q.toLowerCase())}`)
    setResult(data)
  }

  return (
    <div className="mt-6">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">🤖</div>
        <h2 className="text-2xl font-bold mb-2">Agent Identity on TON</h2>
        <p className="text-[var(--tg-theme-hint-color)]">
          Give your AI agent a verifiable .agent name
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setResult(null) }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search a name for your agent..."
          className="flex-1 px-4 py-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] outline-none"
        />
        <button
          onClick={() => handleSearch()}
          disabled={loading}
          className="px-5 py-3 rounded-xl bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] font-medium"
        >
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {result && (
        <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4 mb-6">
          {result.available ? (
            <>
              <p className="text-green-600 font-medium mb-2">✅ {result.name} is available!</p>
              <p className="text-sm text-[var(--tg-theme-hint-color)] mb-4">
                Price: {result.price_ton} TON
              </p>
              <button
                onClick={() => navigate(`/register?name=${result.name.replace('.agent', '')}`)}
                className="w-full py-3 rounded-xl bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] font-medium"
              >
                Register {result.name}
              </button>
            </>
          ) : (
            <>
              <p className="text-red-500 font-medium mb-2">{result.name} is taken</p>
              <button
                onClick={() => navigate(`/agent/${result.name.replace('.agent', '')}`)}
                className="w-full py-2 rounded-lg text-[var(--tg-theme-link-color)] text-sm"
              >
                View Agent →
              </button>
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="mt-3 border-t border-[var(--tg-theme-bg-color)] pt-3">
                  <p className="text-sm text-[var(--tg-theme-hint-color)] mb-2">Try these:</p>
                  {result.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setQuery(s.replace('.agent', '')); handleSearch(s.replace('.agent', '')) }}
                      className="block w-full text-left px-3 py-2 rounded-lg hover:bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-link-color)]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Agent Directory */}
      <div className="mb-6">
        <h3 className="font-semibold text-lg mb-3">🌐 Agent Directory</h3>
        {directory.length > 0 ? (
          <div className="space-y-2">
            {directory.map((agent) => {
              const agentType = agent.profile?.tags?.[0] ?? 'assistant'
              const icon = AGENT_TYPE_ICONS[agentType] ?? '🤖'
              return (
                <button
                  key={agent.name}
                  onClick={() => navigate(`/agent/${agent.name.replace('.agent', '')}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] text-left"
                >
                  <span className="text-2xl">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{agent.name}</p>
                    <p className="text-xs text-[var(--tg-theme-hint-color)] truncate">
                      {agent.profile?.tagline ?? `${agentType} agent`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold ${agent.reputation.score >= 70 ? 'text-green-600' : agent.reputation.score >= 40 ? 'text-yellow-600' : 'text-gray-400'}`}>
                      {agent.reputation.score}
                    </span>
                    <p className="text-xs text-[var(--tg-theme-hint-color)]">trust</p>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-6 text-center">
            <p className="text-[var(--tg-theme-hint-color)] text-sm">No agents registered yet. Be the first!</p>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Why agents need Soulink</h3>
        <Feature icon="🔐" title="Verifiable Identity" desc="On-chain SBT proves your agent is who it claims to be" />
        <Feature icon="⭐" title="Trust Scores" desc="Agents rate each other — reputation is public and on-chain" />
        <Feature icon="🔌" title="MCP-Native" desc="AI agents register and verify via MCP tools — no UI needed" />
        <Feature icon="💎" title="TON-Powered" desc="Soulbound Token on TON — permanent, non-transferable identity" />
      </div>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3 rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-[var(--tg-theme-hint-color)]">{desc}</p>
      </div>
    </div>
  )
}
