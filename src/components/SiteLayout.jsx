import BackToTopButton from './BackToTopButton.jsx'

const navigation = [
  { href: '#/', label: 'Home', icon: 'home' },
  { href: '#/history', label: 'Timeline', icon: 'timeline' },
  { href: '#/market', label: 'Market', icon: 'market' },
  { href: '#/collection', label: 'Collecting', icon: 'collection' },
  { href: '#/cards', label: 'Card Files', icon: 'cards' },
  { href: '#/game', label: 'Price Guess', icon: 'game' },
]

const leftSideNavigation = [
  { href: '#/', label: 'Home', pixel: 'HOME' },
  { href: '#/history', label: 'Timeline', pixel: 'TIME' },
  { href: '#/market', label: 'Market', pixel: 'MARK' },
]

const rightSideNavigation = [
  { href: '#/collection', label: 'Collecting', pixel: 'COLL' },
  { href: '#/cards', label: 'Card Files', pixel: 'FILE' },
  { href: '#/game', label: 'Price Guess', pixel: 'PLAY' },
]

function MobileNavIcon({ name }) {
  if (name === 'home') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 11.5 12 5l8 6.5" />
        <path d="M7 10.5V20h10v-9.5" />
      </svg>
    )
  }

  if (name === 'timeline') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12h14" />
        <circle cx="5" cy="12" r="2" />
        <circle cx="12" cy="12" r="2" />
        <circle cx="19" cy="12" r="2" />
      </svg>
    )
  }

  if (name === 'market') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 18 9 12l4 3 7-9" />
        <path d="M4 20h16" />
      </svg>
    )
  }

  if (name === 'collection') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 5h12v14H6z" />
        <path d="M9 5v14" />
        <path d="M12 9h3" />
      </svg>
    )
  }

  if (name === 'cards') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="7" width="10" height="13" rx="2" />
        <path d="M9 4h8a2 2 0 0 1 2 2v11" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7v10" />
      <path d="M15 9.5c-.7-.7-1.7-1.1-3-1.1-1.6 0-2.6.7-2.6 1.8 0 1.2 1.1 1.6 2.8 1.9 1.7.3 2.8.8 2.8 2 0 1.1-1 1.8-2.8 1.8-1.3 0-2.5-.4-3.3-1.2" />
    </svg>
  )
}

function SiteLayout({ children, route }) {
  const currentIndex = navigation.findIndex((item) => item.href.replace('#', '') === route)
  const hasValidIndex = currentIndex >= 0
  const previousPage = hasValidIndex
    ? navigation[(currentIndex - 1 + navigation.length) % navigation.length]
    : null
  const nextPage = hasValidIndex
    ? navigation[(currentIndex + 1) % navigation.length]
    : null

  return (
    <>
      <aside className="retro-side-nav is-left" aria-label="Left side navigation">
        <div className="retro-side-panel">
          <div className="retro-side-screen">
            <span>Select</span>
          </div>
          <div className="retro-side-buttons">
            {leftSideNavigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`retro-side-button${route === item.href.replace('#', '') ? ' is-active' : ''}`}
                aria-label={item.label}
              >
                <strong>{item.pixel}</strong>
                <span>{item.label}</span>
              </a>
            ))}
            {previousPage && (
              <a href={previousPage.href} className="retro-side-button is-arrow" aria-label={`Go to ${previousPage.label}`}>
                <strong>&larr; PREV</strong>
                <span>{previousPage.label}</span>
              </a>
            )}
          </div>
          <div className="retro-dpad" aria-hidden="true">
            <span className="is-up" />
            <span className="is-left" />
            <span className="is-center" />
            <span className="is-right" />
            <span className="is-down" />
          </div>
        </div>
      </aside>

      <aside className="retro-side-nav is-right" aria-label="Right side navigation">
        <div className="retro-side-panel">
          <div className="retro-side-screen">
            <span>Start</span>
          </div>
          <div className="retro-side-buttons">
            {rightSideNavigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`retro-side-button${route === item.href.replace('#', '') ? ' is-active' : ''}`}
                aria-label={item.label}
              >
                <strong>{item.pixel}</strong>
                <span>{item.label}</span>
              </a>
            ))}
            {nextPage && (
              <a href={nextPage.href} className="retro-side-button is-arrow" aria-label={`Go to ${nextPage.label}`}>
                <strong>NEXT &rarr;</strong>
                <span>{nextPage.label}</span>
              </a>
            )}
          </div>
          <div className="retro-ab-buttons" aria-hidden="true">
            <span>A</span>
            <span>B</span>
          </div>
        </div>
      </aside>

      <div className="app-shell">
        <header className="site-header">
          <a className="site-mark" href="#/">
            <span className="site-mark-kicker">Cards, collecting, culture</span>
            <strong>Pokémon Card Atlas</strong>
          </a>

          <nav className="site-nav" aria-label="Primary">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={route === item.href.replace('#', '') ? 'is-active' : ''}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </header>

        <main>{children}</main>

        <BackToTopButton />
      </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile page navigation">
        {navigation.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={route === item.href.replace('#', '') ? 'is-active' : ''}
            aria-label={item.label}
          >
            <MobileNavIcon name={item.icon} />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
    </>
  )
}

export default SiteLayout
