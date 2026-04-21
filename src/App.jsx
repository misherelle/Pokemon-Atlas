import { useEffect, useState } from 'react'
import SiteLayout from './components/SiteLayout.jsx'
import CardsPage from './pages/CardsPage.jsx'
import HomePage from './pages/HomePage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import MarketPage from './pages/MarketPage.jsx'
import CollectionPage from './pages/CollectionPage.jsx'
import PriceGuessPage from './pages/PriceGuessPage.jsx'

const routes = {
  '/': HomePage,
  '/history': HistoryPage,
  '/market': MarketPage,
  '/collection': CollectionPage,
  '/cards': CardsPage,
  '/game': PriceGuessPage,
}

const pageTitles = {
  '/': 'Pokémon Card Atlas',
  '/history': 'Pokémon Card Atlas — Timeline',
  '/market': 'Pokémon Card Atlas — Market',
  '/collection': 'Pokémon Card Atlas — Collecting',
  '/cards': 'Pokémon Card Atlas — Card Files',
  '/game': 'Pokémon Card Atlas — Price Guess',
}

function normalizeRoute(hash) {
  const clean = hash.replace(/^#/, '') || '/'
  return routes[clean] ? clean : '/'
}

function App() {
  const [route, setRoute] = useState(() => normalizeRoute(window.location.hash))

  useEffect(() => {
    const onHashChange = () => {
      setRoute(normalizeRoute(window.location.hash))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    window.addEventListener('hashchange', onHashChange)

    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    document.title = pageTitles[route] ?? 'Pokémon Card Atlas'
  }, [route])

  const Page = routes[route]

  return (
    <SiteLayout route={route}>
      <Page />
    </SiteLayout>
  )
}

export default App
