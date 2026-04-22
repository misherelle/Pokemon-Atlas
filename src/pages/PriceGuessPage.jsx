import { useCallback, useEffect, useMemo, useState } from 'react'

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const PRICE_GUESS_STATS_KEY = 'pokemon-atlas-price-guess-stats'

const defaultStats = {
  score: 0,
  rounds: 0,
  streak: 0,
  bestStreak: 0,
  bestScore: 0,
  bestScoreRounds: 0,
}

function cleanNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) >= 0 ? Number(value) : 0
}

function normalizeStats(stats) {
  return {
    ...defaultStats,
    score: cleanNumber(stats?.score),
    rounds: cleanNumber(stats?.rounds),
    streak: cleanNumber(stats?.streak),
    bestStreak: cleanNumber(stats?.bestStreak),
    bestScore: cleanNumber(stats?.bestScore),
    bestScoreRounds: cleanNumber(stats?.bestScoreRounds),
  }
}

function loadSavedStats() {
  if (typeof window === 'undefined') {
    return defaultStats
  }

  try {
    return normalizeStats(JSON.parse(window.localStorage.getItem(PRICE_GUESS_STATS_KEY)))
  } catch {
    return defaultStats
  }
}

function saveStats(stats) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(PRICE_GUESS_STATS_KEY, JSON.stringify(stats))
  } catch {
    // Local storage can be blocked in private or restricted browser modes.
  }
}

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

function getAccuracy(score, rounds) {
  return rounds > 0 ? Math.round((score / rounds) * 100) : 0
}

function formatScore(score, rounds) {
  return rounds > 0 ? `${score}/${rounds} (${getAccuracy(score, rounds)}%)` : '0/0'
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

function getPairKey(pair) {
  if (pair.length !== 2) {
    return ''
  }

  return pair
    .map((card) => card.productId)
    .sort()
    .join('|')
}

function buildPairQueue(pool, lastPairKey = '') {
  const pairs = []

  for (let firstIndex = 0; firstIndex < pool.length; firstIndex += 1) {
    for (let secondIndex = firstIndex + 1; secondIndex < pool.length; secondIndex += 1) {
      if (pool[firstIndex].price !== pool[secondIndex].price) {
        pairs.push([pool[firstIndex], pool[secondIndex]])
      }
    }
  }

  const queue = pairs.sort(() => Math.random() - 0.5)
  const repeatIndex = queue.findIndex((pair) => getPairKey(pair) !== lastPairKey)

  if (repeatIndex > 0) {
    const firstPair = queue[0]
    queue[0] = queue[repeatIndex]
    queue[repeatIndex] = firstPair
  }

  return queue
}

function PriceGuessPage() {
  const [cards, setCards] = useState([])
  const [cardPool, setCardPool] = useState([])
  const [pairQueue, setPairQueue] = useState([])
  const [poolMeta, setPoolMeta] = useState(null)
  const [notice, setNotice] = useState('')
  const [apiError, setApiError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [isCorrect, setIsCorrect] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [minPrice, setMinPrice] = useState(20)
  const [now, setNow] = useState(() => Date.now())
  const [stats, setStats] = useState(loadSavedStats)
  const [isRefreshPromptOpen, setIsRefreshPromptOpen] = useState(false)
  const [unavailableImageIds, setUnavailableImageIds] = useState(() => new Set())
  const { score, rounds, streak, bestStreak, bestScore, bestScoreRounds } = stats

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

  const isPoolExpired = useMemo(() => {
    if (!poolMeta?.nextRefreshAt) {
      return false
    }

    const refreshAt = Date.parse(poolMeta.nextRefreshAt)

    return Number.isFinite(refreshAt) && now >= refreshAt
  }, [now, poolMeta?.nextRefreshAt])

  const loadPool = useCallback(async () => {
    setIsLoading(true)
    setSelectedId(null)
    setIsCorrect(null)
    setApiError('')
    setIsRefreshPromptOpen(false)

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
      const nextPairQueue = buildPairQueue(data.cards)
      setCards(nextPairQueue[0] ?? pickCardPair(data.cards))
      setPairQueue(nextPairQueue.slice(1))
      setPoolMeta(data)
      setMinPrice(data.minPrice ?? 20)
      setNotice(data.notice ?? '')
    } catch (error) {
      setCards([])
      setCardPool([])
      setPairQueue([])
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
    saveStats(stats)
  }, [stats])

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
      setIsRefreshPromptOpen(true)
      return
    }

    const currentPairKey = getPairKey(cards)
    const nextPairQueue =
      pairQueue.length > 0 ? pairQueue : buildPairQueue(cardPool, currentPairKey)
    const [nextPair, ...remainingPairs] = nextPairQueue

    setCards(nextPair ?? pickCardPair(cardPool))
    setPairQueue(remainingPairs)
  }

  function handleGuess(card) {
    if (selectedId || !higherCard) {
      return
    }

    const correct = card.productId === higherCard.productId

    setSelectedId(card.productId)
    setIsCorrect(correct)
    setStats((currentStats) => {
      const current = normalizeStats(currentStats)
      const nextScore = current.score + (correct ? 1 : 0)
      const nextRounds = current.rounds + 1
      const nextStreak = correct ? current.streak + 1 : 0
      const bestScoreImproved =
        nextScore > 0 &&
        (nextScore > current.bestScore ||
          (nextScore === current.bestScore &&
            (current.bestScoreRounds === 0 || nextRounds < current.bestScoreRounds)))

      return {
        ...current,
        score: nextScore,
        rounds: nextRounds,
        streak: nextStreak,
        bestStreak: Math.max(current.bestStreak, nextStreak),
        bestScore: bestScoreImproved ? nextScore : current.bestScore,
        bestScoreRounds: bestScoreImproved ? nextRounds : current.bestScoreRounds,
      }
    })
  }

  function handleRestartScore() {
    setStats((currentStats) => ({
      ...normalizeStats(currentStats),
      score: 0,
      rounds: 0,
      streak: 0,
    }))
    setSelectedId(null)
    setIsCorrect(null)
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
            <div className="price-score-stat">
              <span>Score</span>
              <strong>{score}/{rounds}</strong>
            </div>
            <div className="price-score-stat">
              <span>Accuracy</span>
              <strong>{getAccuracy(score, rounds)}%</strong>
            </div>
            <div className="price-score-stat">
              <span>Streak</span>
              <strong>{streak}</strong>
            </div>
            <div className="price-score-stat">
              <span>Longest</span>
              <strong>{bestStreak}</strong>
            </div>
            <div className="price-score-stat is-wide">
              <span>Best run</span>
              <strong>{formatScore(bestScore, bestScoreRounds)}</strong>
            </div>
            <button
              type="button"
              className="price-score-reset"
              onClick={handleRestartScore}
              disabled={rounds === 0 && streak === 0}
            >
              Restart score
            </button>
          </div>
        </div>

        {notice ? (
          <p className="price-game-note">{notice}</p>
        ) : null}

        {isCorrect != null ? (
          <p className={`price-game-result${isCorrect ? ' is-correct' : ' is-wrong'}`}>
            {isCorrect ? 'Correct.' : `Not quite. ${higherCard.name} was higher.`}
          </p>
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
              const isImageUnavailable =
                !card.imageUrl || unavailableImageIds.has(card.productId)
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
                    {isImageUnavailable ? (
                      <span className="price-card-image-unavailable">
                        Image is not available.
                      </span>
                    ) : (
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="price-card-image"
                        onError={() => {
                          setUnavailableImageIds((currentIds) => {
                            const nextIds = new Set(currentIds)
                            nextIds.add(card.productId)
                            return nextIds
                          })
                        }}
                      />
                    )}
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
          <span className="price-game-meta">
            <span className="price-game-meta-line">
              Pool of {poolMeta?.poolSize ?? 15} single cards, compared against each
              other. New pools are ready on the clock every 10 minutes (:00, :10,
              :20...)
              {poolMeta?.nextRefreshAt ? (
                refreshCountdown && !isPoolExpired ? (
                  <>
                    {' '}
                    <strong className="price-refresh-countdown">({refreshCountdown} left)</strong>
                  </>
                ) : (
                  <strong className="price-refresh-countdown"> (ready now)</strong>
                )
              ) : null}
              .
            </span>
            <span className="price-game-meta-line">
              Cards above {formatPrice(minPrice)}. Source: PokéWallet API.
            </span>
          </span>
        </div>

        {isPoolExpired || isRefreshPromptOpen ? (
          <div className="price-refresh-prompt" role="status">
            <div>
              <strong>New cards are ready.</strong>
              <p>Your current pool stays the same until you refresh, so it will not change while you are playing.</p>
            </div>
            <button type="button" onClick={() => window.location.reload()}>
              Refresh cards
            </button>
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default PriceGuessPage
