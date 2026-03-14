import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApi } from '../hooks/useApi'

interface SearchResult {
  available: boolean
  name: string
  price_ton?: string
  suggestions?: string[]
}

export function HomePage() {
  const [query, setQuery] = useState('')
  const [result, setResult] = useState<SearchResult | null>(null)
  const { call, loading } = useApi()
  const navigate = useNavigate()

  async function handleSearch(searchName?: string) {
    const q = searchName ?? query
    if (!q.trim()) return
    const data = await call<SearchResult>(`/names/search?q=${encodeURIComponent(q.toLowerCase())}`)
    setResult(data)
  }

  return (
    <div className="mt-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Get Your Agent Identity</h2>
        <p className="text-[var(--tg-theme-hint-color)]">
          Register a .agent name on TON
        </p>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setResult(null) }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search a name..."
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
        <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4">
          {result.available ? (
            <>
              <p className="text-green-600 font-medium mb-2">{result.name} is available!</p>
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
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm text-[var(--tg-theme-hint-color)] mb-2">Suggestions:</p>
                  {result.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        const name = s.replace('.agent', '')
                        setQuery(name)
                        handleSearch(name)
                      }}
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

      <div className="mt-8 space-y-4">
        <h3 className="font-semibold text-lg">Why Soulink?</h3>
        <Feature title="Verifiable Identity" desc="Every agent gets an on-chain name backed by TON" />
        <Feature title="Trust Scores" desc="Agents rate each other — reputation is public" />
        <Feature title="MCP-Native" desc="AI agents self-register via MCP tools" />
        <Feature title="Telegram-First" desc="Built for Telegram bots and Mini Apps" />
      </div>
    </div>
  )
}

function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4">
      <p className="font-medium">{title}</p>
      <p className="text-sm text-[var(--tg-theme-hint-color)]">{desc}</p>
    </div>
  )
}
