import { useState } from 'react'
import PageHero from '../components/PageHero.jsx'
import SectionBlock from '../components/SectionBlock.jsx'
import {
  comparisonPoints,
  deckIdeas,
  gradingScale,
  rarityCards,
} from '../data/siteData.js'

function CollectionPage() {
  const [deckMode, setDeckMode] = useState('collector')

  return (
    <div className="page-stack">
      <PageHero
        eyebrow="Collecting"
        title="Collecting"
        body="How rarity and condition affect value."
        highlights={[
          { label: 'Basic tier', value: 'Common', note: 'Cards most players see first', tone: 'cool' },
          { label: 'Rare art', value: 'Illustration Rare', note: 'Artwork people look for', tone: 'soft' },
          { label: 'Top grade', value: 'PSA 10', note: 'Condition changes price', tone: 'warm' },
        ]}
      />

      <SectionBlock
        eyebrow="Rarity"
        title="Rarity"
        body="How the game marks harder-to-find cards."
      >
        <div className="rarity-stack">
          {rarityCards.map((card) => (
            <article key={card.label} className="rarity-card">
              <div className="rarity-row">
                <h3>{card.label}</h3>
                <span>{card.scarcity}</span>
              </div>
              <div className="rarity-meter">
                <div
                  className="rarity-fill"
                  style={{ width: `${card.visual}%` }}
                />
              </div>
              <p>{card.detail}</p>
            </article>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        eyebrow="Grading"
        title="Why condition matters"
        body="Cleaner cards usually sell for more."
      >
        <div className="grade-grid">
          {gradingScale.map((grade) => (
            <article key={grade.score} className="grade-card">
              <div className="grade-badge">{grade.score}</div>
              <div>
                <h3>{grade.title}</h3>
                <p>{grade.range}</p>
              </div>
            </article>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        eyebrow="Compare"
        title="Same card, different value"
        body="Rarity and condition can change how people price a card."
      >
        <div className="comparison-grid">
          {comparisonPoints.map((item) => (
            <article key={item.label} className="comparison-card">
              <span>{item.label}</span>
              <p>{item.detail}</p>
            </article>
          ))}
        </div>
      </SectionBlock>

      <SectionBlock
        eyebrow="Views"
        title="Different ways to collect"
        body="Collectors, players, and buyers look for different things."
      >
        <div className="toggle-row" role="tablist" aria-label="Collector mode">
          <button
            type="button"
            className={deckMode === 'collector' ? 'is-active' : ''}
            onClick={() => setDeckMode('collector')}
          >
            Collector
          </button>
          <button
            type="button"
            className={deckMode === 'player' ? 'is-active' : ''}
            onClick={() => setDeckMode('player')}
          >
            Player
          </button>
          <button
            type="button"
            className={deckMode === 'investor' ? 'is-active' : ''}
            onClick={() => setDeckMode('investor')}
          >
            Investor
          </button>
        </div>

        <div className="deck-card">
          <div className="lens-card-head">
            <div className="lens-card-title-block">
              <span className="lens-card-kicker">View</span>
              <h3>{deckIdeas[deckMode].title}</h3>
              <p className="lens-card-note">{deckIdeas[deckMode].note}</p>
            </div>

            <div className="lens-card-summary-panel">
              <span>Main focus</span>
              <p className="lens-card-summary">{deckIdeas[deckMode].summary}</p>
            </div>
          </div>

          <div className="lens-detail-grid">
            {deckIdeas[deckMode].details.map((item) => (
              <div key={item.label} className="lens-detail-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <div className="chip-row lens-chip-row">
            {deckIdeas[deckMode].cards.map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
          </div>
        </div>
      </SectionBlock>
    </div>
  )
}

export default CollectionPage
