import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi'

interface AgentData {
  name: string
  owner: string
  soul_hash: string
  payment_address: string
  registered_at?: number
  reputation: { score: number; report_count: number }
  profile: {
    display_name: string | null
    tagline: string | null
    tags: string[]
  } | null
}

export function AgentPage() {
  const { name } = useParams<{ name: string }>()
  const { call, loading, error } = useApi()
  const [agent, setAgent] = useState<AgentData | null>(null)

  useEffect(() => {
    if (name) {
      call<AgentData>(`/names/${name}`).then(setAgent)
    }
  }, [name, call])

  if (loading) {
    return <div className="mt-12 text-center text-[var(--tg-theme-hint-color)]">Loading...</div>
  }

  if (error) {
    const isNotFound = error === 'not_found'
    return (
      <div className="mt-12 text-center">
        <p className="text-red-500">{isNotFound ? 'Agent not found' : 'Could not load agent data'}</p>
        {!isNotFound && (
          <button
            onClick={() => { if (name) call<AgentData>(`/names/${name}`).then(setAgent) }}
            className="mt-4 px-4 py-2 rounded-xl bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
          >
            Retry
          </button>
        )}
      </div>
    )
  }

  if (!agent) return null

  const score = agent.reputation.score
  const scoreColor = score >= 70 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'
  const scoreBg = score >= 70 ? 'from-green-600 to-emerald-700' : score >= 40 ? 'from-yellow-600 to-orange-700' : 'from-red-600 to-pink-700'

  return (
    <div className="mt-6">
      {/* Agent Card */}
      <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-purple-700 p-5 text-white mb-6 shadow-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
            {(name ?? '?')[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{agent.name}</h2>
            <p className="text-white/70 text-sm">
              {agent.profile?.tagline ?? 'AI Agent on TON'}
            </p>
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-white/60">Trust</span><br/>
            <span className="font-bold text-lg">{score}</span>
            <span className="text-white/40 text-xs"> / 100</span>
          </div>
          <div>
            <span className="text-white/60">Reports</span><br/>
            <span className="font-bold">{agent.reputation.report_count}</span>
          </div>
          <div>
            <span className="text-white/60">Type</span><br/>
            <span className="font-bold">SBT</span>
          </div>
        </div>
      </div>

      {/* Trust Score */}
      <div className={`rounded-xl bg-gradient-to-r ${scoreBg} p-4 mb-4 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-white/80 text-sm">Trust Score</h3>
            <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
            <span className="text-white/40 text-sm"> / 100</span>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs">{agent.reputation.report_count} report{agent.reputation.report_count !== 1 ? 's' : ''}</p>
            <p className="text-white/40 text-xs mt-1">from other agents</p>
          </div>
        </div>
      </div>

      {/* Identity Details */}
      <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4 mb-4">
        <h3 className="font-semibold mb-3">🔐 On-Chain Identity</h3>
        <InfoRow label="Chain" value="TON" />
        <InfoRow label="Token" value="Soulbound (non-transferable)" />
        <InfoRow label="Owner" value={`${agent.owner.slice(0, 8)}...${agent.owner.slice(-6)}`} />
        {agent.registered_at && agent.registered_at > 0 && (
          <InfoRow label="Registered" value={new Date(agent.registered_at * 1000).toLocaleDateString()} />
        )}
      </div>

      {/* Tags */}
      {agent.profile?.tags && agent.profile.tags.length > 0 && (
        <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4 mb-4">
          <h3 className="font-semibold mb-3">🏷️ Tags</h3>
          <div className="flex flex-wrap gap-2">
            {agent.profile.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 rounded-full bg-[var(--tg-theme-button-color)]/10 text-[var(--tg-theme-button-color)] text-sm">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Integration */}
      <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4 mb-4">
        <h3 className="font-semibold mb-2">🔌 Use This Identity</h3>
        <div className="bg-black rounded-lg p-3 text-green-400 text-xs font-mono overflow-x-auto">
          <div className="text-gray-500"># Resolve this agent</div>
          <div>curl /api/v1/names/{name}</div>
          <div className="mt-2 text-gray-500"># Check trust score</div>
          <div>curl /api/v1/credit/{name}</div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[var(--tg-theme-bg-color)] last:border-0">
      <span className="text-[var(--tg-theme-hint-color)] text-sm">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}
