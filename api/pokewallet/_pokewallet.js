import { env as processEnv } from 'node:process'

const POKEWALLET_API_BASE = 'https://api.pokewallet.io'
const DEFAULT_CACHE_MINUTES = 10
const DEFAULT_MAX_HOURLY_REQUESTS = 90
const HOURLY_REQUEST_CEILING = 90
const DEFAULT_MIN_PRICE = 20
const DEFAULT_POOL_SIZE = 15
const DEFAULT_SEARCHES_PER_REFRESH = 8
const DEFAULT_MAX_CARDS_PER_QUERY = 3
const DEFAULT_IMAGE_CACHE_MINUTES = 60

const searchQueries = [
  'charizard ex',
  'pikachu ex',
  'umbreon',
  'rayquaza',
  'lugia',
  'mewtwo',
  'mew ex',
  'gengar',
  'eevee',
  'sylveon',
  'greninja',
  'dragonite',
  'blastoise',
  'venusaur',
  'gardevoir',
  'snorlax',
  'gyarados',
  'arceus',
  'lucario',
  'magikarp',
]

const sealedProductPatterns = [
  /\bbooster\b/i,
  /\bpack\b/i,
  /\bbox\b/i,
  /\bbundle\b/i,
  /\btin\b/i,
  /\bdisplay\b/i,
  /\bcollection\b/i,
  /\belite trainer\b/i,
  /\betb\b/i,
  /\bblister\b/i,
  /\bcase\b/i,
  /\bdeck\b/i,
  /\bsleeve\b/i,
  /\bportfolio\b/i,
  /\bbinder\b/i,
  /\bplaymat\b/i,
  /\bposter\b/i,
  /\bfigure\b/i,
  /\bcalendar\b/i,
  /\bultra-premium\b/i,
  /\bpremium collection\b/i,
  /\bbuild & battle\b/i,
  /\btrainer toolkit\b/i,
  /\bcode card\b/i,
]

let poolCache = null
const imageCache = new Map()
let requestWindow = {
  startedAt: 0,
  used: 0,
}

function numberFromEnv(value, fallback) {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

function getPriceValue(priceEntry) {
  return [
    priceEntry.market_price,
    priceEntry.mid_price,
    priceEntry.low_price,
    priceEntry.high_price,
  ].find((value) => typeof value === 'number' && value > 0)
}

function hasCardNumber(cardNumber) {
  return typeof cardNumber === 'string' && /\d/.test(cardNumber)
}

function isSingleCard(card) {
  const info = card.card_info ?? {}
  const searchableText = [
    info.name,
    info.clean_name,
    card.cardmarket?.product_name,
  ]
    .filter(Boolean)
    .join(' ')

  if (!hasCardNumber(info.card_number)) {
    return false
  }

  return !sealedProductPatterns.some((pattern) => pattern.test(searchableText))
}

function getBestPrice(priceEntries = []) {
  return priceEntries
    .map((entry) => ({
      entry,
      price: getPriceValue(entry),
    }))
    .filter((candidate) => candidate.price)
    .sort((first, second) => second.price - first.price)[0]
}

function hashText(value) {
  return [...value].reduce(
    (hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0,
    0,
  )
}

function getSearchQueries(config, now = Date.now()) {
  const bucket = Math.floor(now / config.cacheMs)
  const configuredQueries = config.searchQueries.length ? config.searchQueries : searchQueries
  const seededQueries = configuredQueries
    .map((query) => ({
      query,
      sortKey: hashText(`${bucket}:${query}`),
    }))
    .sort((first, second) => first.sortKey - second.sortKey)
    .map((entry) => entry.query)

  return seededQueries.slice(0, config.searchesPerRefresh)
}

function normalizeCard(card) {
  const info = card.card_info ?? {}
  const bestPrice = getBestPrice(card.tcgplayer?.prices)

  if (!bestPrice?.price || !card.id || !info.name || !isSingleCard(card)) {
    return null
  }

  return {
    productId: card.id,
    name: info.clean_name || info.name,
    setName: info.set_name || info.set_code || 'Unknown set',
    rarity: info.rarity,
    cardNumber: info.card_number,
    cardType: info.card_type,
    imageUrl: `/api/pokewallet/images/${encodeURIComponent(card.id)}?size=low`,
    price: bestPrice.price,
    printing: bestPrice.entry.sub_type_name,
    url: card.tcgplayer?.url || card.cardmarket?.product_url || '',
    updatedAt: bestPrice.entry.updated_at,
  }
}

function getRateWindow(now = Date.now()) {
  if (!requestWindow.startedAt || now - requestWindow.startedAt >= 60 * 60 * 1000) {
    requestWindow = {
      startedAt: now,
      used: 0,
    }
  }

  return requestWindow
}

function reserveRequest(config) {
  const window = getRateWindow()

  if (window.used + 1 > config.maxHourlyRequests) {
    throw new Error('Hourly PokeWallet request budget reached. Try again later.')
  }

  window.used += 1
}

export function getPokeWalletConfig(env = processEnv) {
  const cacheMinutes = numberFromEnv(env.POKEWALLET_CACHE_MINUTES, DEFAULT_CACHE_MINUTES)
  const configuredQueries = (env.POKEWALLET_SEARCH_QUERIES || '')
    .split(',')
    .map((query) => query.trim())
    .filter(Boolean)
  const queryCount = configuredQueries.length || searchQueries.length

  const config = {
    apiKey: env.POKEWALLET_API_KEY,
    cacheMinutes,
    cacheMs: cacheMinutes * 60 * 1000,
    maxHourlyRequests: numberFromEnv(
      env.POKEWALLET_MAX_HOURLY_REQUESTS,
      DEFAULT_MAX_HOURLY_REQUESTS,
    ),
    searchesPerRefresh: numberFromEnv(
      env.POKEWALLET_SEARCHES_PER_REFRESH,
      DEFAULT_SEARCHES_PER_REFRESH,
    ),
    imageCacheMinutes: numberFromEnv(
      env.POKEWALLET_IMAGE_CACHE_MINUTES,
      DEFAULT_IMAGE_CACHE_MINUTES,
    ),
    maxCardsPerQuery: numberFromEnv(
      env.POKEWALLET_MAX_CARDS_PER_QUERY,
      DEFAULT_MAX_CARDS_PER_QUERY,
    ),
    minPrice: numberFromEnv(env.POKEWALLET_MIN_PRICE, DEFAULT_MIN_PRICE),
    poolSize: numberFromEnv(env.POKEWALLET_POOL_SIZE, DEFAULT_POOL_SIZE),
    searchQueries: configuredQueries,
  }

  config.maxHourlyRequests = Math.min(config.maxHourlyRequests, HOURLY_REQUEST_CEILING)
  config.searchesPerRefresh = Math.min(config.searchesPerRefresh, queryCount)
  config.maxCardsPerQuery = Math.min(config.maxCardsPerQuery, config.poolSize)

  return config
}

async function pokewalletRequest(config, path, options = {}) {
  if (!config.apiKey) {
    throw new Error('PokeWallet API key is not configured.')
  }

  reserveRequest(config)

  const response = await fetch(`${POKEWALLET_API_BASE}${path}`, {
    ...options,
    headers: {
      Accept: options.accept ?? 'application/json',
      'X-API-Key': config.apiKey,
      ...(options.headers ?? {}),
    },
  })

  if (response.status === 429) {
    throw new Error('PokeWallet rate limit reached. Wait a bit before refreshing.')
  }

  if (response.status === 401 || response.status === 403) {
    throw new Error(
      `PokeWallet rejected this API key (${response.status}). Check that the key is active, saved in Vercel, and included in the latest deployment.`,
    )
  }

  if (!response.ok) {
    throw new Error(`PokeWallet request failed (${response.status}).`)
  }

  return response
}

async function fetchPool(config) {
  const queries = getSearchQueries(config)
  const seen = new Set()
  const cards = []

  for (const query of queries) {
    const params = new URLSearchParams({
      q: query,
      page: '1',
      limit: '100',
    })
    const response = await pokewalletRequest(config, `/search?${params}`)
    const data = await response.json()
    const nextCards = shuffle(data.results ?? [])
      .map(normalizeCard)
      .filter((card) => {
        if (!card || card.price < config.minPrice || seen.has(card.productId)) {
          return false
        }

        seen.add(card.productId)
        return true
      })

    cards.push(...nextCards.slice(0, config.maxCardsPerQuery))

    if (cards.length >= config.poolSize) {
      break
    }
  }

  if (cards.length < config.poolSize) {
    throw new Error(
      `PokeWallet found ${cards.length} priced single cards, but the game needs ${config.poolSize}.`,
    )
  }

  return {
    cards: cards.slice(0, config.poolSize),
    queries,
  }
}

export async function getCardPool(env = processEnv) {
  const config = getPokeWalletConfig(env)
  const now = Date.now()

  if (poolCache && poolCache.expiresAt > now) {
    return {
      ...poolCache.payload,
      cached: true,
      requestsUsedThisHour: getRateWindow(now).used,
      maxHourlyRequests: config.maxHourlyRequests,
    }
  }

  const { cards, queries } = await fetchPool(config)
  const refreshedAt = new Date(now).toISOString()
  const expiresAt = now + config.cacheMs
  const payload = {
    source: 'pokewallet',
    cards,
    cacheMinutes: config.cacheMinutes,
    poolSize: cards.length,
    requestedPoolSize: config.poolSize,
    minPrice: config.minPrice,
    searchQueries: queries,
    maxCardsPerQuery: config.maxCardsPerQuery,
    filters: ['single cards only', 'sealed products removed'],
    refreshedAt,
    nextRefreshAt: new Date(expiresAt).toISOString(),
  }

  poolCache = {
    expiresAt,
    payload,
  }

  return {
    ...payload,
    cached: false,
    requestsUsedThisHour: getRateWindow(now).used,
    maxHourlyRequests: config.maxHourlyRequests,
  }
}

export async function getCardImage(cardId, size = 'low', env = processEnv) {
  const config = getPokeWalletConfig(env)
  const imageSize = size === 'high' ? 'high' : 'low'
  const cacheKey = `${cardId}:${imageSize}`
  const cachedImage = imageCache.get(cacheKey)
  const now = Date.now()

  if (cachedImage && cachedImage.expiresAt > now) {
    return cachedImage.image
  }

  const response = await pokewalletRequest(
    config,
    `/images/${encodeURIComponent(cardId)}?size=${imageSize}`,
    {
      accept: 'image/jpeg,image/png,image/*',
    },
  )

  const image = {
    contentType: response.headers.get('content-type') || 'image/jpeg',
    buffer: await response.arrayBuffer(),
  }

  imageCache.set(cacheKey, {
    expiresAt: now + config.imageCacheMinutes * 60 * 1000,
    image,
  })

  return image
}

export function getStatus(env = processEnv) {
  const config = getPokeWalletConfig(env)
  const now = Date.now()

  return {
    configured: Boolean(config.apiKey),
    cacheMinutes: config.cacheMinutes,
    maxHourlyRequests: config.maxHourlyRequests,
    searchesPerRefresh: config.searchesPerRefresh,
    maxCardsPerQuery: config.maxCardsPerQuery,
    minPrice: config.minPrice,
    poolSize: config.poolSize,
    cachedCards: poolCache?.expiresAt > now ? poolCache.payload.cards.length : 0,
    nextRefreshAt: poolCache?.expiresAt > now ? poolCache.payload.nextRefreshAt : null,
    requestsUsedThisHour: getRateWindow(now).used,
  }
}
