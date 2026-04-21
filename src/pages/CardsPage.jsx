import SectionBlock from '../components/SectionBlock.jsx'
import VisualSlot from '../components/VisualSlot.jsx'
import {
  cardCaseStudies,
  topValueCards2026,
} from '../data/siteData.js'

function CardsPage() {
  return (
    <div className="page-stack">
      <section className="page-hero compact-hero">
        <div className="page-hero-copy">
          <p className="eyebrow">Case files</p>
          <h1>Card Files</h1>
          <p className="hero-body">A closer look at the cards collectors keep coming back to.</p>
        </div>
      </section>

      <SectionBlock
        eyebrow="Top 10 in 2026"
        title="Vintage still dominates"
        body="A quick read on the cards still setting the high end of the market."
      >
        <div className="top-ten-grid">
          {topValueCards2026.map((card) => (
            <article key={card.rank} className="top-ten-card">
              <div className="top-ten-rank">#{card.rank}</div>
              <VisualSlot
                label={card.imageLabel}
                hint="Add card image"
                compact
                src={card.imageSrc}
                alt={card.imageAlt}
              />
              <div className="top-ten-copy">
                <h3>{card.name}</h3>
                <p>{card.details}</p>
                <div className="example-pill-row">
                  <strong>{card.year}</strong>
                  <strong>{card.population}</strong>
                  <strong>{card.value}</strong>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        eyebrow="Case studies"
        title="A closer look"
        body="Card image, key facts, and market context in one place."
      >
        <div className="case-study-template-grid">
          {cardCaseStudies.map((card) => (
            <article key={card.name} className="case-study-template">
              <div className="case-study-main">
                <VisualSlot
                  label={card.imageLabel}
                  hint="Card front"
                  src={card.imageSrc}
                  alt={card.imageAlt}
                />

                <div className="case-study-info">
                  <div>
                    <p className="eyebrow">Featured card</p>
                    <h3>{card.name}</h3>
                    <p className="case-study-subtitle">{card.subtitle}</p>
                  </div>

                  <div className="case-study-facts">
                    {card.facts.map((fact) => (
                      <div key={fact} className="case-fact-row">
                        {fact}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="case-study-side">
                <div className="price-history-slot">
                  <div className="price-history-head">
                    <h4>Price history</h4>
                    <span>Sales trend</span>
                  </div>
                  <div className="price-history-chart">
                    <div className="price-grid-lines" />
                    <div className="price-trace" />
                  </div>
                </div>

                <div className="market-snapshot">
                  <h4>Market snapshot</h4>
                  <div className="market-snapshot-grid">
                    {card.market.map((item) => (
                      <div key={item.label} className="snapshot-cell">
                        <span>{item.label}</span>
                        <strong>{item.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </SectionBlock>
    </div>
  )
}

export default CardsPage
