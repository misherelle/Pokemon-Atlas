import BackToTopButton from './BackToTopButton.jsx'

const navigation = [
  { href: '#/', label: 'Home' },
  { href: '#/history', label: 'Timeline' },
  { href: '#/market', label: 'Market' },
  { href: '#/collection', label: 'Collecting' },
  { href: '#/cards', label: 'Card Files' },
  { href: '#/game', label: 'Price Guess' },
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
    </>
  )
}

export default SiteLayout
