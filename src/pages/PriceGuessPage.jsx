import { useCallback, useEffect, useMemo, useState } from 'react'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const CARD_IMAGE_FALLBACK = '/images/card-fallback.svg'

function formatPrice(price) {
  if (price >= 1000000) {
    return `$${(price / 1000000).toFixed(price >= 10000000 ? 2 : 1)}M`
  }

  if (price >= 1000) {
    return `$${(price / 1000).toFixed(price >= 100000 ? 0 : 1)}K`
  }

  return currencyFormatter.format(price)
}

function formatCountdown(milliseconds) {
  if (milliseconds == null) {
    return ''
  }

  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')

  return `${minutes}:${seconds}`
}

function pickCardPair(pool) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5)
  const pair = shuffled.slice(0, 2)

  if (pair.length === 2 && pair[0].price !== pair[1].price) {
    return pair
  }

  const alternate = shuffled.find(
    (card) => card.productId !== pair[0]?.productId && card.price !== pair[0]?.price,
  )

  return alternate && pair[0] ? [pair[0], alternate] : pair
}

function handleCardImageError(event) {
  const image = event.currentTarget

  if (image.dataset.fallbackApplied === 'true') {
    return
  }

  image.dataset.fallbackApplied = 'true'
  image.alt = 'Card image unavailable'
  image.src = CARD_IMAGE_FALLBACK
}

function PriceGuessPage() {
  const [cards, setCards] = useState([])
  const [cardPool, setCardPool] = useState([])
  const [poolMeta, setPoolMeta] = useState(null)
  const [notice, setNotice] = useState('')
  const [apiError, setApiError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [minPrice, setMinPrice] = useState(20)
  const [now, setNow] = useState(() => Date.now())
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [rounds, setRounds] = useState(0)

  const higherCard = useMemo(() => {
    if (cards.length !== 2) {
      return null
    }

    return cards[0].price >= cards[1].price ? cards[0] : cards[1]
  }, [cards])

  const refreshCountdown = useMemo(() => {
    if (!poolMeta?.nextRefreshAt) {
      return ''
    }

    return formatCountdown(Date.parse(poolMeta.nextRefreshAt) - now)
  }, [now, poolMeta?.nextRefreshAt])

  const loadPool = useCallback(async () => {
    setIsLoading(true)
    setSelectedId(null)
    setIsCorrect(null)
    setApiError('')

    try {
      const response = await fetch('/api/pokewallet/pool')
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setMinPrice(data.minPrice ?? 20)
        throw new Error(data.error || 'PokéWallet prices are unavailable.')
      }

      if (!Array.isArray(data.cards) || data.cards.length < 2) {
        throw new Error('PokéWallet did not find two cards for this round. Try again.')
      }

      setCardPool(data.cards)
      setCards(pickCardPair(data.cards))
      setPoolMeta(data)
      setMinPrice(data.minPrice ?? 20)
      setNotice(data.notice ?? '')
    } catch (error) {
      setCards([])
      setCardPool([])
      setPoolMeta(null)
      setNotice('')
      setApiError(error.message || 'PokéWallet prices are unavailable.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPool()
  }, [loadPool])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  function loadNextPair() {
    setSelectedId(null)
    setIsCorrect(null)

    if (
      !cardPool.length ||
      (poolMeta?.nextRefreshAt && Date.now() >= Date.parse(poolMeta.nextRefreshAt))
    ) {
      loadPool()
      return
    }

    setCards(pickCardPair(cardPool))
  }

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
        <img
          className="price-guess-hero-art"
          src="/images/piplup-gradient.png"
          alt="Piplup gradient illustration"
        />
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

        {notice ? (
          <p className="price-game-note">{notice}</p>
        ) : null}

        {apiError && cards.length !== 2 ? (
          <div className="price-game-error" role="status">
            <strong>
              {apiError.includes('not configured')
                ? 'Live PokéWallet prices are not connected yet.'
                : 'Could not load a card pair.'}
            </strong>
            <p>{apiError}</p>
            {apiError.includes('not configured') ? (
              <p>
                Add POKEWALLET_API_KEY to your local env or Vercel Environment Variables,
                then retry.
              </p>
            ) : null}
          </div>
        ) : (
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
              const cardMeta = [card.rarity, card.printing].filter(Boolean).join(' / ')

              return (
                <button
                  key={card.productId}
                  type="button"
                  className={cardClass}
                  disabled={isLoading || isRevealed}
                  onClick={() => handleGuess(card)}
                >
                  <span className="price-card-image-wrap">
                    <img
                      src={card.imageUrl || CARD_IMAGE_FALLBACK}
                      alt={card.name}
                      className="price-card-image"
                      onError={handleCardImageError}
                    />
                  </span>
                  <span className="price-card-copy">
                    <span className="price-card-set">{card.setName}</span>
                    <strong>{card.name}</strong>
                    {cardMeta ? <span className="price-card-meta">{cardMeta}</span> : null}
                    <span className="price-card-price">
                      {isRevealed ? formatPrice(card.price) : 'Choose this card'}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        )}

        <div className="price-game-actions">
          <button
            type="button"
            className="price-game-next"
            onClick={cards.length === 2 ? loadNextPair : loadPool}
            disabled={isLoading}
          >
            {selectedId ? 'Next pair' : cards.length === 2 ? 'Skip pair' : 'Retry'}
          </button>
          <span>
            Pool of {poolMeta?.poolSize ?? 15} single cards, compared against each
            other. Refreshes every {poolMeta?.cacheMinutes ?? 10} min
            {refreshCountdown ? (
              <>
                {' '}
                <strong className="price-refresh-countdown">({refreshCountdown} left)</strong>
              </>
            ) : null}
            . Cards above {formatPrice(minPrice)}. Source: PokéWallet API.
          </span>
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
