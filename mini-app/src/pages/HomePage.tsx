import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4022/api/v1'

export function HomePage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<{ available: boolean; name: string; price_ton?: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/names/search?q=${encodeURIComponent(query.toLowerCase())}`)
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError('Network error')
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px 0' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🤖</div>
        <h2 style={{ fontSize: 22, fontWeight: 'bold', margin: '0 0 6px' }}>Agent Identity on TON</h2>
        <p style={{ color: 'var(--tg-theme-hint-color, #999)', fontSize: 14, margin: 0 }}>
          Give your AI agent a verifiable .agent name
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setResult(null) }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search a name for your agent..."
          style={{
            flex: 1, padding: '12px 16px', borderRadius: 12, border: 'none', outline: 'none',
            background: 'var(--tg-theme-secondary-bg-color, #2a2a3e)', color: 'var(--tg-theme-text-color, #fff)', fontSize: 14,
          }}
        />
        <button
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: '12px 20px', borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer',
            background: 'var(--tg-theme-button-color, #5288c1)', color: 'var(--tg-theme-button-text-color, #fff)',
          }}
        >
          {loading ? '...' : 'Search'}
        </button>
      </div>

      {error && <p style={{ color: 'red', fontSize: 13 }}>{error}</p>}

      {result && (
        <div style={{ background: 'var(--tg-theme-secondary-bg-color, #2a2a3e)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          {result.available ? (
            <>
              <p style={{ color: '#4ade80', fontWeight: 600, margin: '0 0 8px' }}>✅ {result.name} is available!</p>
              <p style={{ color: 'var(--tg-theme-hint-color, #999)', fontSize: 13, margin: '0 0 12px' }}>Price: {result.price_ton} TON</p>
              <button
                onClick={() => navigate(`/register?name=${result.name.replace('.agent', '')}`)}
                style={{
                  width: '100%', padding: 12, borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer',
                  background: 'var(--tg-theme-button-color, #5288c1)', color: 'var(--tg-theme-button-text-color, #fff)',
                }}
              >
                Register {result.name}
              </button>
            </>
          ) : (
            <p style={{ color: '#f87171', fontWeight: 600, margin: 0 }}>{result.name} is taken</p>
          )}
        </div>
      )}

      <div style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Why agents need Soulink</h3>
        {[
          { icon: '🔐', title: 'Verifiable Identity', desc: 'On-chain SBT proves your agent is who it claims' },
          { icon: '⭐', title: 'Trust Scores', desc: 'Agents rate each other — reputation is public' },
          { icon: '🔌', title: 'MCP-Native', desc: 'AI agents register and verify via MCP tools' },
          { icon: '💎', title: 'TON-Powered', desc: 'Soulbound Token — permanent, non-transferable' },
        ].map(f => (
          <div key={f.title} style={{ display: 'flex', gap: 12, background: 'var(--tg-theme-secondary-bg-color, #2a2a3e)', borderRadius: 12, padding: 14, marginBottom: 8 }}>
            <span style={{ fontSize: 20 }}>{f.icon}</span>
            <div>
              <p style={{ fontWeight: 600, margin: '0 0 2px', fontSize: 14 }}>{f.title}</p>
              <p style={{ color: 'var(--tg-theme-hint-color, #999)', fontSize: 12, margin: 0 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
