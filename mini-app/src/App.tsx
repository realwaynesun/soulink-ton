import { Routes, Route } from 'react-router-dom'
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { HomePage } from './pages/HomePage'
import { RegisterPage } from './pages/RegisterPage'
import { AgentPage } from './pages/AgentPage'
import { Header } from './components/Header'

export function App() {
  const wallet = useTonWallet()
  const [tonConnectUI] = useTonConnectUI()

  return (
    <div className="min-h-screen bg-[var(--tg-theme-bg-color)]">
      <Header
        wallet={wallet}
        onConnect={() => tonConnectUI.openModal()}
        onDisconnect={() => tonConnectUI.disconnect()}
      />
      <main className="px-4 pb-24">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<RegisterPage wallet={wallet} />} />
          <Route path="/agent/:name" element={<AgentPage />} />
        </Routes>
      </main>
    </div>
  )
}
