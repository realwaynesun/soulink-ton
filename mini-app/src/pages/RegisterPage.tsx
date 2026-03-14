import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useTonConnectUI } from '@tonconnect/ui-react'
import { beginCell } from '@ton/core'
import { useApi } from '../hooks/useApi'
import type { Wallet } from '@tonconnect/ui-react'

interface Props {
  wallet: Wallet | null
}

interface OperatorInfo {
  address: string
  network: 'mainnet' | 'testnet'
  pricing: {
    short_ton: number
    standard_ton: number
    short_nanoton: string
    standard_nanoton: string
  }
}

export function RegisterPage({ wallet }: Props) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [tonConnectUI] = useTonConnectUI()
  const rawName = searchParams.get('name') ?? ''
  const name = rawName.toLowerCase()
  const [status, setStatus] = useState<'idle' | 'paying' | 'registering' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [operatorInfo, setOperatorInfo] = useState<OperatorInfo | null>(null)
  const { call } = useApi()

  const isShort = name.length <= 4

  async function pollForCompletion(apiBase: string, pollUrl: string) {
    let pollErrors = 0
    for (let i = 0; i < 30; i++) {
      await new Promise(r => setTimeout(r, 3000))
      try {
        const res = await fetch(`${apiBase}${pollUrl}`)
        if (!res.ok) { pollErrors++; if (pollErrors >= 3) break; continue }
        const poll = await res.json()
        pollErrors = 0
        if (poll.status === 'completed') {
          setTxHash(poll.tx_hash ?? null)
          setStatus('done')
          localStorage.removeItem(`soulink:poll:${name}`)
          return
        }
        if (poll.status === 'failed') {
          setStatus('error')
          setError(poll.error ?? 'Registration failed on-chain')
          localStorage.removeItem(`soulink:poll:${name}`)
          return
        }
      } catch { pollErrors++; if (pollErrors >= 3) break }
    }
    setStatus('error')
    setError('Registration timed out. Your registration may still complete — check your agent page.')
  }

  // Fetch operator info on mount so price is visible immediately
  useEffect(() => {
    let cancelled = false
    call<OperatorInfo>('/operator').then(info => {
      if (!cancelled && info) setOperatorInfo(info)
    })
    return () => { cancelled = true }
  }, [])

  // Resume polling if we have a saved poll_url from a previous session
  useEffect(() => {
    const savedPollUrl = localStorage.getItem(`soulink:poll:${name}`)
    if (!savedPollUrl || !name) return
    setStatus('registering')
    const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4022/api/v1'
    pollForCompletion(apiBase, savedPollUrl)
  }, [name])

  async function handleRegister() {
    if (!wallet) {
      tonConnectUI.openModal()
      return
    }

    setStatus('paying')
    setError(null)

    try {
      if (!operatorInfo) {
        setStatus('error')
        setError('Operator info not loaded yet. Please try again.')
        return
      }

      // Validate name format before any payment
      if (name.length < 3 || name.length > 32 || !/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(name)) {
        setStatus('error')
        setError('Invalid name format. Must be 3-32 chars, lowercase alphanumeric and hyphens.')
        return
      }

      // Verify wallet network matches backend network
      const walletChain = wallet.account.chain
      const expectedChain = operatorInfo.network === 'mainnet' ? '-239' : '-3'
      if (walletChain !== expectedChain) {
        setStatus('error')
        setError(`Wrong network: wallet is on ${walletChain === '-239' ? 'mainnet' : 'testnet'}, but server expects ${operatorInfo.network}. Please switch networks.`)
        return
      }

      const soulHash = '0x' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0')).join('')

      const amount = isShort ? operatorInfo.pricing.short_nanoton : operatorInfo.pricing.standard_nanoton
      const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4022/api/v1'

      // Try /register first WITHOUT new payment — recovers if user already paid previously
      try {
        const probeRes = await fetch(`${apiBase}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, owner: wallet.account.address }),
        })
        const probeData = await probeRes.json()
        if (probeRes.ok) {
          // Previous payment found! Skip to polling
          setStatus('registering')
          localStorage.setItem(`soulink:poll:${name}`, probeData.poll_url)
          await pollForCompletion(apiBase, probeData.poll_url)
          return
        }
        if (probeData.error === 'name_pending' && probeData.poll_url) {
          // Our existing job — resume polling
          setStatus('registering')
          localStorage.setItem(`soulink:poll:${name}`, probeData.poll_url)
          await pollForCompletion(apiBase, probeData.poll_url)
          return
        }
        if (probeData.error === 'name_taken') {
          setStatus('error')
          setError(`${name}.agent is already registered.`)
          return
        }
        // Only proceed to payment on explicit payment_not_found
        if (probeData.error !== 'payment_not_found') {
          setStatus('error')
          setError(probeData.message ?? 'Could not verify registration status. Please try again.')
          return
        }
      } catch {
        // Network error on probe — don't risk payment without knowing state
        setStatus('error')
        setError('Could not reach server. Please check your connection and try again.')
        return
      }

      // Build comment payload: text comment with name + soul_hash commitment
      const payload = beginCell()
        .storeUint(0, 32)
        .storeStringTail(`${name}:${soulHash}`)
        .endCell()
        .toBoc()
        .toString('base64')

      // Send TON payment via TON Connect
      const txResult = await tonConnectUI.sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: [{
          address: operatorInfo.address,
          amount,
          payload,
        }],
      })

      setStatus('registering')

      // Wait for tx to appear on-chain — TON Connect returns the BOC before
      // the transaction is confirmed, so we retry /register on payment_not_found
      const registerBody = JSON.stringify({ name, owner: wallet.account.address })
      let result: { registration_id: string; status: string; poll_url: string } | null = null
      for (let attempt = 0; attempt < 10; attempt++) {
        await new Promise(r => setTimeout(r, attempt === 0 ? 5000 : 3000))
        const res = await fetch(`${apiBase}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: registerBody,
        })
        const data = await res.json()
        if (res.ok) {
          result = data
          localStorage.setItem(`soulink:poll:${name}`, data.poll_url)
          break
        }
        // name_pending with poll_url = our own in-progress job, resume polling
        if (data.error === 'name_pending' && data.poll_url) {
          result = { registration_id: '', status: 'queued', poll_url: data.poll_url }
          localStorage.setItem(`soulink:poll:${name}`, data.poll_url)
          break
        }
        // name_pending without poll_url = someone else is registering this name
        if (data.error === 'name_pending') {
          setStatus('error')
          setError(`${name}.agent is being registered by another user. Please contact support for a refund.`)
          return
        }
        // name_taken = already registered
        if (data.error === 'name_taken') {
          setStatus('error')
          setError(data.message ?? `${name}.agent is already registered.`)
          return
        }
        // Only retry if payment hasn't appeared on-chain yet
        if (data.error !== 'payment_not_found') {
          setStatus('error')
          setError(data.message ?? data.error ?? 'Registration failed')
          return
        }
      }

      if (!result) {
        setStatus('error')
        setError('Payment not detected on-chain after 30s. Please try again.')
        return
      }

      // Poll for completion
      await pollForCompletion(apiBase, result.poll_url)
    } catch (e) {
      setStatus('error')
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }

  function formatPrice(): string {
    if (operatorInfo) {
      const p = isShort ? operatorInfo.pricing.short_ton : operatorInfo.pricing.standard_ton
      return `${p} TON`
    }
    return 'Loading...'
  }

  if (status === 'done') {
    return (
      <div className="mt-12 text-center">
        <div className="text-5xl mb-4">&#x2705;</div>
        <h2 className="text-2xl font-bold mb-2">{name}.agent</h2>
        <p className="text-[var(--tg-theme-hint-color)] mb-6">Your agent identity is live on TON!</p>
        {txHash && (
          <a
            href={`https://${operatorInfo?.network === 'testnet' ? 'testnet.' : ''}tonviewer.com/transaction/${txHash}`}
            target="_blank"
            rel="noopener"
            className="text-[var(--tg-theme-link-color)] text-sm"
          >
            View transaction
          </a>
        )}
        <button
          onClick={() => navigate(`/agent/${name}`)}
          className="mt-6 w-full py-3 rounded-xl bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] font-medium"
        >
          View My Agent
        </button>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Register {name}.agent</h2>

      <div className="rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4 mb-6">
        <div className="flex justify-between mb-2">
          <span>Name</span>
          <span className="font-medium">{name}.agent</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Chain</span>
          <span className="font-medium">TON</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Price</span>
          <span className="font-medium">{formatPrice()}</span>
        </div>
        <div className="flex justify-between">
          <span>Duration</span>
          <span className="font-medium">Permanent</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 text-red-600 p-4 mb-4 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={status === 'paying' || status === 'registering'}
        className="w-full py-3 rounded-xl bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] font-medium disabled:opacity-50"
      >
        {!wallet && 'Connect Wallet to Register'}
        {wallet && status === 'idle' && 'Pay & Register'}
        {status === 'paying' && 'Sending payment...'}
        {status === 'registering' && 'Minting on TON...'}
      </button>
    </div>
  )
}
