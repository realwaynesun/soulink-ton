import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4022/api/v1'

export function App() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState<'home' | 'register' | 'success'>('home')
  const [regName, setRegName] = useState('')
  const [regStatus, setRegStatus] = useState('')
  const [operatorInfo, setOperatorInfo] = useState<any>(null)

  useEffect(() => {
    fetch(`${API_BASE}/operator`).then(r => r.json()).then(setOperatorInfo).catch(() => {})
  }, [])

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/names/search?q=${encodeURIComponent(query.toLowerCase())}`)
      setResult(await res.json())
    } catch { setResult({ error: 'Network error' }) }
    setLoading(false)
  }

  function startRegister(name: string) {
    setRegName(name.replace('.agent', ''))
    setRegStatus('')
    setPage('register')
  }

  async function handleDemoRegister() {
    setRegStatus('Registering on TON...')
    try {
      const res = await fetch(`${API_BASE}/demo-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName }),
      })
      const data = await res.json()
      if (!res.ok) { setRegStatus(data.message ?? data.error); return }
      // Poll for completion
      for (let j = 0; j < 40; j++) {
        await new Promise(r => setTimeout(r, 3000))
        try {
          const poll = await fetch(`${API_BASE}${data.poll_url}`).then(r => r.json())
          if (poll.status === 'completed') { setPage('success'); return }
          if (poll.status === 'failed') { setRegStatus('Failed: ' + (poll.error ?? 'Unknown')); return }
          setRegStatus(`Minting SBT on TON... (${j + 1}/40)`)
        } catch { /* retry */ }
      }
      setRegStatus('Timed out — check later')
    } catch {
      setRegStatus('Network error')
    }
  }

  async function handlePaid() {
    setRegStatus('Checking payment...')
    const owner = prompt('Paste your TON wallet address:')
    if (!owner) { setRegStatus(''); return }

    for (let i = 0; i < 15; i++) {
      setRegStatus(`Checking payment... (${i + 1}/15)`)
      try {
        const res = await fetch(`${API_BASE}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: regName, owner }),
        })
        const data = await res.json()
        if (res.ok && data.poll_url) {
          setRegStatus('Payment found! Minting SBT...')
          // Poll for completion
          for (let j = 0; j < 30; j++) {
            await new Promise(r => setTimeout(r, 3000))
            const poll = await fetch(`${API_BASE}${data.poll_url}`).then(r => r.json())
            if (poll.status === 'completed') {
              setPage('success')
              return
            }
            if (poll.status === 'failed') {
              setRegStatus('Minting failed: ' + (poll.error ?? 'Unknown error'))
              return
            }
            setRegStatus(`Minting on TON... (${j + 1}/30)`)
          }
          setRegStatus('Minting timed out. Check your agent page later.')
          return
        }
        if (data.error === 'name_pending' && data.poll_url) {
          setRegStatus('Registration in progress...')
          for (let j = 0; j < 30; j++) {
            await new Promise(r => setTimeout(r, 3000))
            const poll = await fetch(`${API_BASE}${data.poll_url}`).then(r => r.json())
            if (poll.status === 'completed') { setPage('success'); return }
            if (poll.status === 'failed') { setRegStatus('Failed: ' + poll.error); return }
          }
          return
        }
        if (data.error !== 'payment_not_found') {
          setRegStatus(data.message ?? data.error)
          return
        }
      } catch { /* retry */ }
      await new Promise(r => setTimeout(r, 3000))
    }
    setRegStatus('Payment not found. Please try again.')
  }

  // SUCCESS PAGE
  if (page === 'success') {
    return (
      <div style={{ ...containerStyle }}>
        <Header />
        <div style={{ padding: 16 }}>
          <div style={{ borderRadius: 16, background: 'linear-gradient(135deg, #2563eb, #7c3aed)', padding: 20, color: '#fff', marginBottom: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: 28, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 'bold' }}>
                {regName[0]?.toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 'bold' }}>{regName}.agent</div>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Soulbound Identity on TON</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
              <div><span style={{ color: 'rgba(255,255,255,0.6)' }}>Trust</span><br/><b>50</b></div>
              <div><span style={{ color: 'rgba(255,255,255,0.6)' }}>Chain</span><br/><b>TON</b></div>
              <div><span style={{ color: 'rgba(255,255,255,0.6)' }}>Type</span><br/><b>SBT</b></div>
            </div>
          </div>

          <p style={{ color: '#4ade80', fontWeight: 600, textAlign: 'center', marginBottom: 20 }}>✅ Your agent identity is live!</p>

          <div style={{ ...cardStyle, marginBottom: 12 }}>
            <h3 style={{ fontWeight: 600, margin: '0 0 8px' }}>🔌 Connect Your Agent</h3>
            <p style={{ color: '#999', fontSize: 12, margin: '0 0 8px' }}>Add this MCP server to your AI agent:</p>
            <div style={{ background: '#000', borderRadius: 8, padding: 12, fontSize: 11, fontFamily: 'monospace', color: '#4ade80', overflowX: 'auto' }}>
              <div style={{ color: '#666' }}>// claude_desktop_config.json</div>
              {`{ "mcpServers": { "soulink": { "command": "npx", "args": ["soulink-ton-mcp"] } } }`}
            </div>
          </div>

          <div style={{ ...cardStyle, marginBottom: 12 }}>
            <h3 style={{ fontWeight: 600, margin: '0 0 8px' }}>📡 Verify via API</h3>
            <div style={{ background: '#000', borderRadius: 8, padding: 12, fontSize: 11, fontFamily: 'monospace', color: '#4ade80' }}>
              curl /api/v1/names/{regName}
            </div>
          </div>

          <button onClick={() => { setPage('home'); setQuery(''); setResult(null) }} style={{ ...btnStyle, width: '100%' }}>← Back to Home</button>
        </div>
      </div>
    )
  }

  // REGISTER PAGE
  if (page === 'register') {
    const price = operatorInfo ? (regName.length <= 4 ? operatorInfo.pricing.short_ton : operatorInfo.pricing.standard_ton) : '...'
    const soulHash = '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('')
    const comment = encodeURIComponent(`${regName}:${soulHash}`)
    const tonAmount = operatorInfo ? (regName.length <= 4 ? operatorInfo.pricing.short_nanoton : operatorInfo.pricing.standard_nanoton) : '200000000'
    const opAddr = operatorInfo?.address ?? ''
    const payLink = `ton://transfer/${opAddr}?amount=${tonAmount}&text=${comment}`

    return (
      <div style={{ ...containerStyle }}>
        <Header />
        <div style={{ padding: 16 }}>
          <button onClick={() => setPage('home')} style={{ background: 'none', border: 'none', color: 'var(--tg-theme-link-color, #5288c1)', cursor: 'pointer', padding: 0, marginBottom: 16, fontSize: 14 }}>← Back</button>
          <h2 style={{ fontSize: 20, fontWeight: 'bold', margin: '0 0 16px' }}>Register {regName}.agent</h2>

          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <Row label="Name" value={`${regName}.agent`} />
            <Row label="Chain" value="TON (Testnet)" />
            <Row label="Price" value={`${price} TON`} />
            <Row label="Duration" value="Permanent" />
          </div>

          <div style={{ ...cardStyle, marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600, margin: '0 0 8px', fontSize: 14 }}>🚀 Register Now</h3>
            <p style={{ color: '#999', fontSize: 12, margin: '0 0 12px' }}>Mint your agent identity as a Soulbound Token on TON:</p>
            <button onClick={handleDemoRegister} disabled={!!regStatus} style={{ ...btnStyle, width: '100%', opacity: regStatus ? 0.6 : 1, background: 'linear-gradient(135deg, #2563eb, #7c3aed)' }}>
              {regStatus || `🤖 Mint ${regName}.agent`}
            </button>
          </div>

          <div style={{ ...cardStyle, marginBottom: 16, opacity: 0.7 }}>
            <h3 style={{ fontWeight: 600, margin: '0 0 8px', fontSize: 14 }}>💎 Or Pay with TON Wallet</h3>
            <p style={{ color: '#999', fontSize: 12, margin: '0 0 12px' }}>Open your wallet app to send {price} TON:</p>
            <a href={payLink} style={{ ...btnStyle, display: 'block', textAlign: 'center', textDecoration: 'none', marginBottom: 8, background: 'var(--tg-theme-button-color, #5288c1)' }}>
              💎 Pay {price} TON
            </a>
            <button onClick={handlePaid} disabled={!!regStatus} style={{ ...btnStyle, width: '100%', background: 'transparent', border: '1px solid var(--tg-theme-button-color, #5288c1)', marginTop: 8 }}>
              I've Paid — Confirm
            </button>
          </div>

          {regStatus && (
            <p style={{ textAlign: 'center', fontSize: 13, color: regStatus.includes('fail') || regStatus.includes('not found') ? '#f87171' : '#4ade80' }}>{regStatus}</p>
          )}
        </div>
      </div>
    )
  }

  // HOME PAGE
  return (
    <div style={{ ...containerStyle }}>
      <Header />
      <div style={{ padding: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🤖</div>
          <h2 style={{ fontSize: 22, fontWeight: 'bold', margin: '0 0 6px' }}>Agent Identity on TON</h2>
          <p style={{ color: 'var(--tg-theme-hint-color, #999)', fontSize: 14, margin: 0 }}>Give your AI agent a verifiable .agent name</p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setResult(null) }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search a name..."
            style={{ flex: 1, padding: '12px 16px', borderRadius: 12, border: 'none', outline: 'none', background: 'var(--tg-theme-secondary-bg-color, #2a2a3e)', color: 'var(--tg-theme-text-color, #fff)', fontSize: 14 }}
          />
          <button onClick={handleSearch} disabled={loading} style={btnStyle}>
            {loading ? '...' : 'Search'}
          </button>
        </div>

        {result && !result.error && (
          <div style={{ ...cardStyle, marginBottom: 16 }}>
            {result.available ? (
              <>
                <p style={{ color: '#4ade80', fontWeight: 600, margin: '0 0 4px' }}>✅ {result.name} is available!</p>
                <p style={{ color: '#999', fontSize: 13, margin: '0 0 12px' }}>Price: {result.price_ton} TON</p>
                <button onClick={() => startRegister(result.name)} style={{ ...btnStyle, width: '100%' }}>Register {result.name}</button>
              </>
            ) : (
              <p style={{ color: '#f87171', fontWeight: 600, margin: 0 }}>{result.name} is taken</p>
            )}
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Why agents need Soulink</h3>
          {features.map(f => (
            <div key={f.title} style={{ display: 'flex', gap: 12, ...cardStyle, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{f.icon}</span>
              <div>
                <p style={{ fontWeight: 600, margin: '0 0 2px', fontSize: 14 }}>{f.title}</p>
                <p style={{ color: 'var(--tg-theme-hint-color, #999)', fontSize: 12, margin: 0 }}>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Header() {
  return (
    <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--tg-theme-secondary-bg-color, #333)' }}>
      <span style={{ fontWeight: 'bold', fontSize: 18 }}>🤖 Soulink</span>
      <span style={{ fontSize: 12, padding: '4px 12px', borderRadius: 20, background: 'var(--tg-theme-button-color, #5288c1)', color: '#fff' }}>TON Testnet</span>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--tg-theme-bg-color, #1a1a2e)' }}>
      <span style={{ color: 'var(--tg-theme-hint-color, #999)', fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  )
}

const containerStyle: React.CSSProperties = { minHeight: '100vh', background: 'var(--tg-theme-bg-color, #1a1a2e)', color: 'var(--tg-theme-text-color, #fff)', fontFamily: '-apple-system, sans-serif' }
const cardStyle: React.CSSProperties = { background: 'var(--tg-theme-secondary-bg-color, #2a2a3e)', borderRadius: 12, padding: 14 }
const btnStyle: React.CSSProperties = { padding: '12px 20px', borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer', background: 'var(--tg-theme-button-color, #5288c1)', color: '#fff', fontSize: 14 }

const features = [
  { icon: '🔐', title: 'Verifiable Identity', desc: 'On-chain SBT proves your agent is who it claims' },
  { icon: '⭐', title: 'Trust Scores', desc: 'Agents rate each other — reputation is public' },
  { icon: '🔌', title: 'MCP-Native', desc: 'AI agents register and verify via MCP tools' },
  { icon: '💎', title: 'TON-Powered', desc: 'Soulbound Token — permanent, non-transferable' },
]
