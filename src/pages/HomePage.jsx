import SectionBlock from '../components/SectionBlock.jsx'
import { homeStats } from '../data/siteData.js'

function HomePage() {
  return (
    <div className="page-stack">
      <section className="landing-hero">
        <div className="landing-copy">
          <p className="eyebrow">Cards, collecting, culture</p>
          <h1>Pokémon Card Atlas</h1>
          <p className="hero-body">A visual guide to how Pokémon cards grew from playground favorite into a collector market.</p>
          <div className="hero-quick-links">
            <a href="#/history">Timeline</a>
            <a href="#/market">Market</a>
            <a href="#/cards">Card files</a>
          </div>
        </div>

        <div className="hero-metrics hero-metrics-home">
          {homeStats.map((stat) => (
            <article key={stat.label} className="metric-card">
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </section>

      <SectionBlock
        eyebrow="Choose a path"
        title="Where do you want to look first?"
        body="Pick the part of the story you’re most curious about."
      >
        <div className="page-guide-grid page-guide-grid-four">
          <a className="guide-card" href="#/history">
            <span>01</span>
            <h3>Timeline</h3>
            <p>The big moments, spaced by time</p>
          </a>
          <a className="guide-card" href="#/market">
            <span>02</span>
            <h3>Market</h3>
            <p>Print runs, prices, and reach</p>
          </a>
          <a className="guide-card" href="#/collection">
            <span>03</span>
            <h3>Collecting</h3>
            <p>Rarity, grades, and what people chase</p>
          </a>
          <a className="guide-card" href="#/cards">
            <span>04</span>
            <h3>Card Files</h3>
            <p>A closer look at specific cards</p>
          </a>
        </div>
      </SectionBlock>
    </div>
  )
}

export default HomePage
