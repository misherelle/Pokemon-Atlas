import LineChart from '../components/LineChart.jsx'
import PageHero from '../components/PageHero.jsx'
import SectionBlock from '../components/SectionBlock.jsx'
import {
  annualProduction,
  ecosystemMetrics,
  influenceDrivers,
  productionTotals,
  recordSales,
} from '../data/siteData.js'

function MarketPage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Market"
        title="Market"
        body="How big it got, how fast it moved, and where attention landed."
        highlights={[
          { label: 'Cards', value: '75B+', note: 'Produced by Mar. 2025', tone: 'cool' },
          { label: 'Pocket', value: '150M', note: 'Downloads by Oct. 2025', tone: 'soft' },
          { label: 'Record', value: '$16.492M', note: 'Pikachu Illustrator auction', tone: 'warm' },
        ]}
      />

      <SectionBlock
        eyebrow="Scale"
        title="Print runs got much bigger"
        body="Official production totals over time."
      >
        <LineChart
          data={productionTotals}
          ariaLabel="Chart showing cumulative Pokémon card production totals over time"
          lines={[
            { key: 'total', label: 'Total cards produced, in billions', color: '#7f6df2' },
          ]}
        />
      </SectionBlock>

      <SectionBlock
        eyebrow="Acceleration"
        title="Most of the growth is recent"
        body="Production climbed fastest in the 2020s."
      >
        <LineChart
          data={annualProduction}
          ariaLabel="Chart showing annual Pokémon card production added by year"
          lines={[
            { key: 'added', label: 'Cards added that year, in billions', color: '#63bcd6' },
          ]}
        />
      </SectionBlock>

      <SectionBlock
        eyebrow="Reach"
        title="Where the audience shows up"
        body="Store shelves, app downloads, and global reach."
      >
        <div className="driver-grid">
          {ecosystemMetrics.map((metric) => (
            <article key={metric.label} className="info-card metric-info">
              <strong>{metric.value}</strong>
              <p>{metric.label}</p>
            </article>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        eyebrow="Demand"
        title="Why demand stays high"
        body="The same few forces keep showing up."
      >
        <div className="driver-grid">
          {influenceDrivers.map((driver) => (
            <article key={driver} className="info-card">
              <p>{driver}</p>
            </article>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        eyebrow="Ceiling"
        title="Auction ceiling"
        body="Two sales show how high the top end can go."
      >
        <div className="record-sale-grid">
          <article className="record-pill">
            <strong>$5.275M</strong>
            <p>{recordSales.private.subtitle}</p>
          </article>
          <article className="record-pill">
            <strong>$16.492M</strong>
            <p>{recordSales.auction.subtitle}</p>
          </article>
        </div>
      </SectionBlock>
    </div>
  )
}

export default MarketPage
