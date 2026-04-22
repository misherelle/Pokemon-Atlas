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
        <path d="M4.5 11.5 12 5l7.5 6.5" />
        <path d="M6.8 10.6v8.7h10.4v-8.7" />
        <path d="M10.2 19.3v-4.8h3.6v4.8" />
      </svg>
    )
  }

  if (name === 'timeline') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 17.5c2.2-5.2 4.5-7.8 7-7.8 2 0 2.9 1.8 4.5 1.8 1.4 0 2.7-1.3 4.5-5" />
        <circle cx="6.2" cy="14.2" r="1.6" />
        <circle cx="12" cy="9.8" r="1.6" />
        <circle cx="18.8" cy="7.2" r="1.6" />
      </svg>
    )
  }

  if (name === 'market') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19h16" />
        <path d="M6.5 16v-4" />
        <path d="M11.5 16V8" />
        <path d="M16.5 16v-6" />
        <path d="M5.8 9.8 10 7l3.4 2.5 5-5" />
      </svg>
    )
  }

  if (name === 'collection') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 5.5h10.8c.7 0 1.2.5 1.2 1.2v12.1H7.2A1.2 1.2 0 0 1 6 17.6Z" />
        <path d="M9 5.5v13.3" />
        <path d="M12 8.5h3.2" />
        <path d="M12 11.5h3.2" />
      </svg>
    )
  }

  if (name === 'cards') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="6.5" y="5" width="9.5" height="13.5" rx="1.8" />
        <path d="M10 8h2.5" />
        <path d="M9.2 15.2h4.1" />
        <path d="M12 3.8h5.5v11.8" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.5 8.5h13l-1.3 9.2H6.8Z" />
      <path d="M8 8.5 9.2 5h5.6L16 8.5" />
      <path d="M10.2 12.8h3.4a1.7 1.7 0 0 1 0 3.4h-3.4" />
      <path d="M12 11.5v5.8" />
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
