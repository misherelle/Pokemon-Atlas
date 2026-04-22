import PageHero from '../components/PageHero.jsx'
import SectionBlock from '../components/SectionBlock.jsx'
import HistoryTimeline from '../components/HistoryTimeline.jsx'
import { timelineEvents } from '../data/siteData.js'

function HistoryPage() {
  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Timeline"
        title="Timeline"
        body="Key Pokémon card milestones from 1996 to 2026."
        highlights={[
          { label: 'Start', value: '1996', note: 'Game Boy era begins', tone: 'cool' },
          { label: 'Events', value: '30', note: 'Main points on the timeline', tone: 'soft' },
          { label: 'Years', value: '30 years', note: '1996 to 2026', tone: 'warm' },
        ]}
      />

      <SectionBlock
        eyebrow="Timeline"
        title="30 key moments"
        body="Tap or hover to see what changed and when."
      >
        <HistoryTimeline events={timelineEvents} />
      </SectionBlock>

      <SectionBlock
        eyebrow="Then and now"
        title="How collecting changed"
        body="From playground trades to grading, resale, and daily collecting apps."
      >
        <div className="three-up-grid">
          <article className="info-card">
            <h3>1990s</h3>
            <p>playground trades</p>
          </article>
          <article className="info-card">
            <h3>2020s</h3>
            <p>grading and resale</p>
          </article>
          <article className="info-card">
            <h3>Now+</h3>
            <p>apps and daily collecting</p>
          </article>
        </div>
      </SectionBlock>
    </div>
  )
}

export default HistoryPage
