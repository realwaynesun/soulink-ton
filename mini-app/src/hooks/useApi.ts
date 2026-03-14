import { useState, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4022/api/v1'

export function useApi() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const call = useCallback(async <T>(path: string, options?: RequestInit): Promise<T | null> => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...options?.headers },
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Request failed')
        return null
      }
      return data as T
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { call, loading, error }
}
