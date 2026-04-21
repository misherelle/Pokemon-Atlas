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
        body="A timeline that keeps the real gaps between moments."
        highlights={[
          { label: 'Start', value: '1996', note: 'Game Boy era begins', tone: 'cool' },
          { label: 'Moments', value: '30', note: 'Key points along the path', tone: 'soft' },
          { label: 'Span', value: '30 years', note: '1996 to 2026', tone: 'warm' },
        ]}
      />

      <SectionBlock
        eyebrow="Timeline map"
        title="30 moments, one path"
        body="Hover around to see what changed and when."
      >
        <HistoryTimeline events={timelineEvents} />
      </SectionBlock>

      <SectionBlock
        eyebrow="Then and now"
        title="How the role changed"
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
