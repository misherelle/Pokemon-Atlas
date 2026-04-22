import { useMemo, useState } from 'react'
import SectionBlock from '../components/SectionBlock.jsx'
import VisualSlot from '../components/VisualSlot.jsx'
import {
  cardCaseStudies,
  topValueCards2026,
} from '../data/siteData.js'

const chartWidth = 520
const chartHeight = 190
const chartPadding = {
  top: 16,
  right: 20,
  bottom: 36,
  left: 52,
}

function formatSalePrice(value) {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(value >= 10000000 ? 2 : 1)}M`
  }

  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}K`
  }

  return `$${value.toLocaleString('en-US')}`
}

function PriceHistoryChart({ points }) {
  const [activeIndex, setActiveIndex] = useState(points.length - 1)
  const activePoint = points[activeIndex] ?? points[points.length - 1]
  const chart = useMemo(() => {
    const values = points.map((point) => point.value)
    const max = Math.max(...values)
    const min = Math.min(...values)
    const yMin = min > 100000 ? min * 0.75 : 0
    const yMax = max * 1.08
    const plotWidth = chartWidth - chartPadding.left - chartPadding.right
    const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom
    const valueRange = yMax - yMin || 1
    const coords = points.map((point, index) => {
      const x =
        chartPadding.left +
        (points.length === 1 ? plotWidth / 2 : (plotWidth / (points.length - 1)) * index)
      const y = chartPadding.top + ((yMax - point.value) / valueRange) * plotHeight

      return {
        ...point,
        x,
        y,
        display: point.display ?? formatSalePrice(point.value),
      }
    })
    const linePath = coords
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')
    const areaPath = `${linePath} L ${coords.at(-1).x} ${
      chartHeight - chartPadding.bottom
    } L ${coords[0].x} ${chartHeight - chartPadding.bottom} Z`

    return {
      coords,
      linePath,
      areaPath,
      gridRows: [0, 1, 2, 3].map(
        (index) => chartPadding.top + (plotHeight / 3) * index,
      ),
    }
  }, [points])

  return (
    <div className="price-history-chart">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        role="img"
        aria-label="Major sale prices over time"
      >
        {chart.gridRows.map((y) => (
          <line
            key={y}
            className="price-history-grid-line"
            x1={chartPadding.left}
            x2={chartWidth - chartPadding.right}
            y1={y}
            y2={y}
          />
        ))}

        <path className="price-history-area" d={chart.areaPath} />
        <path className="price-history-line" d={chart.linePath} />

        {chart.coords.map((point, index) => (
          <g
            key={`${point.label}-${point.value}`}
            className={`price-history-point${index === activeIndex ? ' is-active' : ''}`}
            tabIndex={0}
            onFocus={() => setActiveIndex(index)}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <circle cx={point.x} cy={point.y} r="7" />
            <text x={point.x} y={chartHeight - 14}>
              {point.label}
            </text>
          </g>
        ))}
      </svg>

      {activePoint ? (
        <div className="price-history-detail" aria-live="polite">
          <strong>{activePoint.display ?? formatSalePrice(activePoint.value)}</strong>
          <span>
            {activePoint.label} / {activePoint.note}
          </span>
        </div>
      ) : null}
    </div>
  )
}

function CardsPage() {
  return (
    <div className="page-stack">
      <section className="page-hero compact-hero card-files-hero">
        <div className="page-hero-copy">
          <p className="eyebrow">Cards</p>
          <h1>Card Files</h1>
          <p className="hero-body">A closer look at a few cards and their prices.</p>
        </div>
        <img
          className="card-files-hero-art"
          src="/images/masterball-gradient.png"
          alt="Master Ball gradient illustration"
        />
      </section>

      <SectionBlock
        eyebrow="High value"
        title="Expensive cards"
        body="Recent examples from the top end of the market."
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
        eyebrow="Examples"
        title="Card details"
        body="Facts, sale points, and a simple price chart."
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
                    <p className="eyebrow">Card</p>
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
                    <span>Major sale points</span>
                  </div>
                  <PriceHistoryChart points={card.priceHistory} />
                </div>

                <div className="market-snapshot">
                  <h4>Quick notes</h4>
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
