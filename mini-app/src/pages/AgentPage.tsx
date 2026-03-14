import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useApi } from '../hooks/useApi'

interface AgentData {
  name: string
  owner: string
  soul_hash: string
  payment_address: string
  registered_at: number
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

  if (!agent) {
    return null
  }

  const scoreColor = agent.reputation.score >= 70 ? 'text-green-600'
    : agent.reputation.score >= 40 ? 'text-yellow-600'
    : 'text-red-500'

  return (
    <div className="mt-6">
      <div className="text-center mb-6">
        <div className="w-20 h-20 rounded-full bg-[var(--tg-theme-button-color)] mx-auto mb-3 flex items-center justify-center text-3xl text-white font-bold">
          {(name ?? '?')[0].toUpperCase()}
        </div>
        <h2 className="text-xl font-bold">{agent.name}</h2>
        {agent.profile?.tagline && (
          <p className="text-[var(--tg-theme-hint-color)] text-sm mt-1">{agent.profile.tagline}</p>
        )}
      </div>

      <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4 mb-4">
        <h3 className="font-semibold mb-3">Trust Score</h3>
        <div className="flex items-center gap-4">
          <span className={`text-3xl font-bold ${scoreColor}`}>
            {agent.reputation.score}
          </span>
          <div>
            <p className="text-sm">/ 100</p>
            <p className="text-xs text-[var(--tg-theme-hint-color)]">
              {agent.reputation.report_count} report{agent.reputation.report_count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4 mb-4">
        <h3 className="font-semibold mb-3">Identity</h3>
        <InfoRow label="Chain" value="TON" />
        <InfoRow label="Owner" value={`${agent.owner.slice(0, 8)}...${agent.owner.slice(-6)}`} />
        {agent.registered_at > 0 && (
          <InfoRow label="Registered" value={new Date(agent.registered_at * 1000).toLocaleDateString()} />
        )}
        <InfoRow label="Duration" value="Permanent" />
      </div>

      {agent.profile?.tags && agent.profile.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {agent.profile.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-full bg-[var(--tg-theme-secondary-bg-color)] text-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
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
