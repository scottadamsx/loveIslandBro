import { useState } from 'react'
import { Header } from './components/Header'
import type { Tab } from './components/Header'
import { StoreProvider } from './store'
import { IslandersTab } from './tabs/IslandersTab'
import { CouplesTab } from './tabs/CouplesTab'
import { ScenesTab } from './tabs/ScenesTab'
import { TiersTab } from './tabs/TiersTab'

export default function App() {
  const [tab, setTab] = useState<Tab>('scenes')
  return (
    <StoreProvider>
      <Header tab={tab} setTab={setTab} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {tab === 'islanders' && <IslandersTab />}
        {tab === 'couples' && <CouplesTab />}
        {tab === 'scenes' && <ScenesTab />}
        {tab === 'tiers' && <TiersTab />}
      </main>
    </StoreProvider>
  )
}
