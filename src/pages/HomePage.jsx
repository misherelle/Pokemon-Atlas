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
        </div>

        <img
          className="landing-hero-art"
          src="/images/pikachu-gradient.png"
          alt="Pikachu gradient illustration"
        />

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
        className="path-section"
        eyebrow="Choose a path"
        title="Where do you want to look first?"
        body="Pick the part of the story you’re most curious about."
        media={
          <img
            className="section-intro-art path-section-art"
            src="/images/pokelocation-gradient.png"
            alt="Pokémon location gradient illustration"
          />
        }
      >
        <div className="page-guide-grid page-guide-grid-five">
          <a className="guide-card" href="#/history">
            <span>01</span>
            <h3>Timeline</h3>
            <p>Major events by year</p>
          </a>
          <a className="guide-card" href="#/market">
            <span>02</span>
            <h3>Market</h3>
            <p>Production and prices</p>
          </a>
          <a className="guide-card" href="#/collection">
            <span>03</span>
            <h3>Collecting</h3>
            <p>Rarity and grades</p>
          </a>
          <a className="guide-card" href="#/cards">
            <span>04</span>
            <h3>Card Files</h3>
            <p>Specific card examples</p>
          </a>
          <a className="guide-card" href="#/game">
            <span>05</span>
            <h3>Price Guess</h3>
            <p>Pick the higher-value card</p>
          </a>
        </div>
      </SectionBlock>
    </div>
  )
}

export default HomePage
