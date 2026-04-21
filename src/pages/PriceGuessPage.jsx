import { useCallback, useEffect, useMemo, useState } from 'react'

const localCards = [
  {
    productId: 'local-pikachu',
    name: 'Pikachu Illustrator',
    setName: '1998 Japanese Promo',
    imageUrl: '/images/pikachu-card.png',
    price: 16492000,
    url: 'https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=pikachu%20illustrator',
  },
  {
    productId: 'local-charizard',
    name: 'Charizard Base Set 1st Edition',
    setName: 'Base Set',
    imageUrl: '/images/charizard-card.png',
    price: 550000,
    url: 'https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=charizard%20base%20set%201st%20edition',
  },
  {
    productId: 'local-lugia',
    name: 'Lugia Neo Genesis 1st Edition',
    setName: 'Neo Genesis',
    imageUrl: '/images/lugia-card.png',
    price: 180000,
    url: 'https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=lugia%20neo%20genesis%201st%20edition',
  },
  {
    productId: 'local-rayquaza',
    name: 'Rayquaza Gold Star',
    setName: 'EX Deoxys',
    imageUrl: '/images/rayquaza-card.png',
    price: 49000,
    url: 'https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=rayquaza%20gold%20star',
  },
]

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

function formatPrice(price) {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(price >= 10000000 ? 2 : 1)}M`
  }

  if (price >= 1000) {
    return `$${(price / 1000).toFixed(price >= 100000 ? 0 : 1)}K`
  }

  return currencyFormatter.format(price)
}

function makeLocalRound() {
  const shuffled = [...localCards].sort(() => Math.random() - 0.5)

  return {
    source: 'demo',
    notice: 'Demo prices are showing until TCGplayer API credentials are set.',
    cards: shuffled.slice(0, 2),
  }
}

function PriceGuessPage() {
  const [cards, setCards] = useState([])
  const [source, setSource] = useState('demo')
  const [notice, setNotice] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [rounds, setRounds] = useState(0)

  const higherCard = useMemo(() => {
    if (cards.length !== 2) {
      return null
    }

    return cards[0].price >= cards[1].price ? cards[0] : cards[1]
  }, [cards])

  const loadRound = useCallback(async () => {
    setIsLoading(true)
    setSelectedId(null)
    setIsCorrect(null)

    try {
      const response = await fetch('/api/tcgplayer/round')

      if (!response.ok) {
        throw new Error('Round request failed.')
      }

      const data = await response.json()
      const nextCards = data.cards?.length === 2 ? data.cards : makeLocalRound().cards

      setCards(nextCards)
      setSource(data.source ?? 'demo')
      setNotice(data.notice ?? '')
    } catch {
      const fallback = makeLocalRound()

      setCards(fallback.cards)
      setSource(fallback.source)
      setNotice(fallback.notice)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadRound()
  }, [loadRound])

  function handleGuess(card) {
    if (selectedId || !higherCard) {
      return
    }

    const correct = card.productId === higherCard.productId

    setSelectedId(card.productId)
    setIsCorrect(correct)
    setRounds((currentRounds) => currentRounds + 1)
    setScore((currentScore) => currentScore + (correct ? 1 : 0))
    setStreak((currentStreak) => (correct ? currentStreak + 1 : 0))
  }

  return (
    <div className="page-stack">
      <section className="page-hero compact-hero price-guess-hero">
        <div className="page-hero-copy">
          <p className="eyebrow">Game</p>
          <h1>Price Guess</h1>
          <p className="hero-body">Pick the Pokémon card with the higher market value.</p>
        </div>
      </section>

      <section className="price-game-panel" aria-label="Price Guess game">
        <div className="price-game-head">
          <div>
            <p className="eyebrow">Choose one</p>
            <h2>Which card is worth more?</h2>
          </div>
          <div className="price-game-score" aria-label="Game score">
            <span>Score</span>
            <strong>{score}/{rounds}</strong>
            <span>Streak {streak}</span>
          </div>
        </div>

        {notice ? <p className="price-game-note">{notice}</p> : null}

        <div className="price-card-grid">
          {(cards.length === 2 ? cards : [null, null]).map((card, index) => {
            if (!card) {
              return (
                <div key={`loading-${index}`} className="price-card is-loading">
                  Loading card...
                </div>
              )
            }

            const isSelected = selectedId === card.productId
            const isWinner = higherCard?.productId === card.productId
            const isRevealed = selectedId != null
            const cardClass = [
              'price-card',
              isSelected ? 'is-selected' : '',
              isRevealed && isWinner ? 'is-winner' : '',
              isRevealed && isSelected && !isWinner ? 'is-loser' : '',
            ]
              .filter(Boolean)
              .join(' ')

            return (
              <button
                key={card.productId}
                type="button"
                className={cardClass}
                disabled={isLoading || isRevealed}
                onClick={() => handleGuess(card)}
              >
                <span className="price-card-image-wrap">
                  <img src={card.imageUrl} alt={card.name} className="price-card-image" />
                </span>
                <span className="price-card-copy">
                  <span className="price-card-set">{card.setName}</span>
                  <strong>{card.name}</strong>
                  <span className="price-card-price">
                    {isRevealed ? formatPrice(card.price) : 'Tap to choose'}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        <div className="price-game-actions">
          <button
            type="button"
            className="price-game-next"
            onClick={loadRound}
            disabled={isLoading}
          >
            {selectedId ? 'Next pair' : 'Skip pair'}
          </button>
          <span>{source === 'tcgplayer' ? 'Prices via TCGplayer' : 'Demo mode'}</span>
        </div>

        {isCorrect != null ? (
          <p className={`price-game-result${isCorrect ? ' is-correct' : ' is-wrong'}`}>
            {isCorrect ? 'Correct.' : `Not quite. ${higherCard.name} was higher.`}
          </p>
        ) : null}
      </section>
    </div>
  )
}

export default PriceGuessPage
