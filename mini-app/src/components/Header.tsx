import type { Wallet } from '@tonconnect/ui-react'

interface HeaderProps {
  wallet: Wallet | null
  onConnect: () => void
  onDisconnect: () => void
}

export function Header({ wallet, onConnect, onDisconnect }: HeaderProps) {
  const shortAddress = wallet
    ? `${wallet.account.address.slice(0, 4)}...${wallet.account.address.slice(-4)}`
    : null

  return (
    <header className="sticky top-0 z-10 bg-[var(--tg-theme-bg-color)] border-b border-[var(--tg-theme-secondary-bg-color)] px-4 py-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Soulink</h1>
          <p className="text-xs text-[var(--tg-theme-hint-color)]">Agent Identity on TON</p>
        </div>
        {wallet ? (
          <button
            onClick={onDisconnect}
            className="px-3 py-1.5 text-sm rounded-lg bg-[var(--tg-theme-secondary-bg-color)]"
          >
            {shortAddress}
          </button>
        ) : (
          <button
            onClick={onConnect}
            className="px-3 py-1.5 text-sm rounded-lg bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)]"
          >
            Connect Wallet
          </button>
        )}
      </div>
    </header>
  )
}
