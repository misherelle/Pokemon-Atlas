import { env as processEnv } from 'node:process'
import { pokemonSearchTerms } from './pokemonSearchTerms.js'

const POKEWALLET_API_BASE = 'https://api.pokewallet.io'
const DEFAULT_CACHE_MINUTES = 10
const DEFAULT_MAX_HOURLY_REQUESTS = 90
const HOURLY_REQUEST_CEILING = 90
const DEFAULT_MIN_PRICE = 20
const DEFAULT_POOL_SIZE = 15
const DEFAULT_SEARCHES_PER_REFRESH = 8
const DEFAULT_MAX_CARDS_PER_QUERY = 3
const DEFAULT_IMAGE_CACHE_MINUTES = 60
const DEFAULT_ENGLISH_ONLY = true
const DEFAULT_REQUIRE_IMAGES = true
const DEFAULT_IMAGE_CHECKS_PER_REFRESH = 5
const IMAGE_CHECK_BATCH_SIZE = 3
const FILTER_VERSION = 4

const prioritySearchQueries = [
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

const prioritySearchQuerySet = new Set(
  prioritySearchQueries.map((query) => query.toLowerCase()),
)

const builtinSearchQueries = [
  ...prioritySearchQueries,
  ...pokemonSearchTerms.filter(
    (query) => !prioritySearchQuerySet.has(query.toLowerCase()),
  ),
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

const nonEnglishSetPatterns = [
  /[\u3040-\u30ff\u3400-\u9fff]/,
  /\b(?:japanese|japan|korean|chinese|thai|indonesian|german|french|italian|spanish|portuguese)\b/i,
  /\b(?:SM|SV|S|XY|BW|DP|M|CP)\d+[A-Z]?\s*[:_]/i,
  /\bS\d+[A-Z]?-P\s*[:_]/i,
  /\b(?:pokemon card 151|expansion pack|gx ultra shiny|ultra shiny|shiny treasure|shiny star v|vstar universe|terastal festival|eevee heroes|tag bolt|tag team gx all stars|dream league|lost abyss|clay burst|snow hazard|raging surf|ancient roar|future flash|wild force|cyber judge|battle partners|night unison|ninja spinner|remix bout|miracle twin|full metal wall|sky legend|double blaze|dark phantasma|paradigm trigger|star birth|incandescent arcana|battle region|space juggler|time gazer|dark order|rocket gang strikes back|gift box|quarter deck|half deck|split earth|the best of xy|special deck set|promo card pack|pokemon-e starter deck)\b/i,
  /\b(?:S-P|XY-P|SM-P|SV-P|BW-P|DP-P|PCG-P|ADV-P|L-P)\b/i,
  /\bpromotional cards\b/i,
]

let poolCache = null
const imageCache = new Map()
const imageAvailabilityCache = new Map()
let requestWindow = {
  startedAt: 0,
  used: 0,
}

class PokeWalletRequestError extends Error {
  constructor(message, upstream) {
    super(message)
    this.name = 'PokeWalletRequestError'
    this.upstream = upstream
  }
}

function numberFromEnv(value, fallback) {
  const numberValue = Number(value)

  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : fallback
}

function booleanFromEnv(value, fallback) {
  if (value == null || value === '') {
    return fallback
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase())
}

function cleanApiKey(value) {
  if (!value) {
    return ''
  }

  return String(value)
    .trim()
    .replace(/^POKEWALLET_API_KEY\s*=\s*/, '')
    .replace(/^['"]|['"]$/g, '')
    .trim()
}

function getApiKeyKind(apiKey) {
  if (apiKey.startsWith('pk_live_')) {
    return 'live'
  }

  if (apiKey.startsWith('pk_test_')) {
    return 'test'
  }

  return apiKey ? 'unknown' : 'missing'
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

function isEnglishCard(card) {
  const info = card.card_info ?? {}
  const language = info.language ?? card.language ?? card.set?.language

  if (language) {
    return /^(en|eng|english)$/i.test(String(language))
  }

  const searchableText = [
    info.name,
    info.clean_name,
    info.set_name,
    info.set_code,
    card.cardmarket?.product_name,
  ]
    .filter(Boolean)
    .join(' ')

  return !nonEnglishSetPatterns.some((pattern) => pattern.test(searchableText))
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

  if (config.usesBuiltInPokemonSearch) {
    const priorityCount = Math.min(2, config.searchesPerRefresh)
    const priorityQueries = prioritySearchQueries
      .map((query) => ({
        query,
        sortKey: hashText(`${bucket}:priority:${query}`),
      }))
      .sort((first, second) => first.sortKey - second.sortKey)
      .slice(0, priorityCount)
      .map((entry) => entry.query)
    const prioritySet = new Set(priorityQueries)
    const pokemonQueries = builtinSearchQueries
      .filter((query) => !prioritySet.has(query))
      .map((query) => ({
        query,
        sortKey: hashText(`${bucket}:pokemon:${query}`),
      }))
      .sort((first, second) => first.sortKey - second.sortKey)
      .slice(0, config.searchesPerRefresh - priorityQueries.length)
      .map((entry) => entry.query)

    return [...priorityQueries, ...pokemonQueries]
  }

  const seededQueries = config.searchQueries
    .map((query) => ({
      query,
      sortKey: hashText(`${bucket}:${query}`),
    }))
    .sort((first, second) => first.sortKey - second.sortKey)
    .map((entry) => entry.query)

  return seededQueries.slice(0, config.searchesPerRefresh)
}

function getImageCacheKey(cardId, size = 'low') {
  return `${cardId}:${size === 'high' ? 'high' : 'low'}`
}

function setImageAvailability(cardId, size, available, config, now = Date.now()) {
  imageAvailabilityCache.set(getImageCacheKey(cardId, size), {
    available,
    expiresAt: now + config.imageCacheMinutes * 60 * 1000,
  })
}

function getCachedImageAvailability(cardId, size = 'low', now = Date.now()) {
  const cacheKey = getImageCacheKey(cardId, size)
  const cached = imageAvailabilityCache.get(cacheKey)

  if (!cached) {
    return null
  }

  if (cached.expiresAt <= now) {
    imageAvailabilityCache.delete(cacheKey)
    return null
  }

  return cached.available
}

function isKnownMissingImage(cardId, config) {
  return config.requireImages && getCachedImageAvailability(cardId) === false
}

function getPoolCacheKey(config) {
  return [
    config.minPrice,
    config.poolSize,
    config.cacheMinutes,
    config.searchesPerRefresh,
    config.maxCardsPerQuery,
    config.englishOnly,
    config.requireImages,
    config.imageChecksPerRefresh,
    FILTER_VERSION,
    hashText(config.searchQueries.join('|')),
  ].join(':')
}

function getNextRefreshAt(now, cacheMs) {
  return Math.floor(now / cacheMs) * cacheMs + cacheMs
}

function normalizeCard(card, config) {
  const info = card.card_info ?? {}

  const bestPrice = getBestPrice(card.tcgplayer?.prices)

  if (
    !bestPrice?.price ||
    !card.id ||
    !info.name ||
    !isSingleCard(card) ||
    (config.englishOnly && !isEnglishCard(card)) ||
    (config.requireImages && isKnownMissingImage(card.id, config))
  ) {
    return null
  }

  return {
    productId: card.id,
    name: info.clean_name || info.name,
    setName: info.set_name || info.set_code || 'Unknown set',
    rarity: info.rarity,
    cardNumber: info.card_number,
    cardType: info.card_type,
    imageUrl: `/api/pokewallet/images?id=${encodeURIComponent(card.id)}&size=low`,
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

function truncateDebugBody(body) {
  if (!body) {
    return ''
  }

  return body.length > 1200 ? `${body.slice(0, 1200)}...` : body
}

function getBodySummary(body) {
  if (!body) {
    return 'No response body.'
  }

  try {
    const parsed = JSON.parse(body)
    return parsed.message || parsed.error || body
  } catch {
    return body.replace(/\s+/g, ' ').trim()
  }
}

async function buildUpstreamDebug(response, url) {
  const contentType = response.headers.get('content-type') || ''
  const body = truncateDebugBody(await response.text().catch(() => ''))

  return {
    url,
    status: response.status,
    statusText: response.statusText,
    contentType,
    body,
    summary: getBodySummary(body),
    headers: {
      server: response.headers.get('server'),
      cfRay: response.headers.get('cf-ray'),
      rateLimitRemainingHour: response.headers.get('x-ratelimit-remaining-hour'),
      rateLimitRemainingDay: response.headers.get('x-ratelimit-remaining-day'),
    },
  }
}

export function getPokeWalletConfig(env = processEnv) {
  const cacheMinutes = numberFromEnv(env.POKEWALLET_CACHE_MINUTES, DEFAULT_CACHE_MINUTES)
  const configuredQueries = (env.POKEWALLET_SEARCH_QUERIES || '')
    .split(',')
    .map((query) => query.trim())
    .filter(Boolean)
  const usesBuiltInPokemonSearch =
    !configuredQueries.length ||
    configuredQueries.some((query) => query.toLowerCase() === 'all-pokemon')
  const searchQueries = usesBuiltInPokemonSearch ? builtinSearchQueries : configuredQueries
  const queryCount = searchQueries.length
  const apiKey = cleanApiKey(env.POKEWALLET_API_KEY)

  const config = {
    apiKey,
    apiKeyKind: getApiKeyKind(apiKey),
    apiKeyLooksValid: /^pk_(live|test)_[a-zA-Z0-9]+$/.test(apiKey),
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
    englishOnly: booleanFromEnv(env.POKEWALLET_ENGLISH_ONLY, DEFAULT_ENGLISH_ONLY),
    requireImages: booleanFromEnv(env.POKEWALLET_REQUIRE_IMAGES, DEFAULT_REQUIRE_IMAGES),
    imageChecksPerRefresh: numberFromEnv(
      env.POKEWALLET_IMAGE_CHECKS_PER_REFRESH,
      DEFAULT_IMAGE_CHECKS_PER_REFRESH,
    ),
    minPrice: numberFromEnv(env.POKEWALLET_MIN_PRICE, DEFAULT_MIN_PRICE),
    poolSize: numberFromEnv(env.POKEWALLET_POOL_SIZE, DEFAULT_POOL_SIZE),
    searchQueries,
    usesBuiltInPokemonSearch,
  }

  config.maxHourlyRequests = Math.min(config.maxHourlyRequests, HOURLY_REQUEST_CEILING)
  config.searchesPerRefresh = Math.min(config.searchesPerRefresh, queryCount)
  config.maxCardsPerQuery = Math.min(config.maxCardsPerQuery, config.poolSize)

  const refreshesPerHour = Math.max(1, Math.ceil(60 / config.cacheMinutes))
  const requestBudgetPerRefresh = Math.floor(config.maxHourlyRequests / refreshesPerHour)
  const imageRequestBudget = Math.max(
    0,
    requestBudgetPerRefresh - config.searchesPerRefresh - 2,
  )
  config.imageChecksPerRefresh = config.requireImages
    ? Math.min(config.imageChecksPerRefresh, imageRequestBudget)
    : 0

  return config
}

async function pokewalletRequest(config, path, options = {}) {
  if (!config.apiKey) {
    throw new Error('PokeWallet API key is not configured.')
  }

  reserveRequest(config)

  const url = `${POKEWALLET_API_BASE}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: options.accept ?? 'application/json',
      'User-Agent': 'PokemonCardAtlas/1.0',
      'X-API-Key': config.apiKey,
      ...(options.headers ?? {}),
    },
  })

  if (response.ok) {
    return response
  }

  const upstream = await buildUpstreamDebug(response, url)
  console.error('pokewallet upstream error:', upstream)

  if (response.status === 429) {
    throw new PokeWalletRequestError(
      `PokeWallet rate limit reached. ${upstream.summary}`,
      upstream,
    )
  }

  if (response.status === 401 || response.status === 403) {
    throw new PokeWalletRequestError(
      `PokeWallet auth failed (${response.status}). ${upstream.summary}`,
      upstream,
    )
  }

  throw new PokeWalletRequestError(
    `PokeWallet request failed (${response.status}). ${upstream.summary}`,
    upstream,
  )
}

async function fetchCardsForQuery(query, config) {
  const params = new URLSearchParams({
    q: query,
    page: '1',
    limit: '100',
  })

  const response = await pokewalletRequest(config, `/search?${params}`)
  const data = await response.json()
  const cards = (data.results ?? [])
    .map((card) => normalizeCard(card, config))
    .filter((card) => card && card.price >= config.minPrice)

  return {
    query,
    cards: shuffle(cards),
  }
}

async function hasCardImage(card, config) {
  const cached = getCachedImageAvailability(card.productId)

  if (cached != null) {
    return cached
  }

  try {
    await fetchCardImage(card.productId, 'low', config)
    return true
  } catch {
    return false
  }
}

async function preferCardsWithImages(cards, config) {
  if (!config.requireImages || config.imageChecksPerRefresh <= 0) {
    return cards
  }

  const confirmed = []
  const unchecked = []
  const missing = []
  let checkedCount = 0

  for (let index = 0; index < cards.length; index += IMAGE_CHECK_BATCH_SIZE) {
    const checksRemaining = config.imageChecksPerRefresh - checkedCount

    if (checksRemaining <= 0) {
      unchecked.push(...cards.slice(index))
      break
    }

    const batch = cards.slice(
      index,
      index + Math.min(IMAGE_CHECK_BATCH_SIZE, checksRemaining),
    )
    checkedCount += batch.length

    const checkedCards = await Promise.all(
      batch.map(async (card) => ({
        card,
        hasImage: await hasCardImage(card, config),
      })),
    )

    for (const checkedCard of checkedCards) {
      if (checkedCard.hasImage) {
        confirmed.push(checkedCard.card)
      } else {
        missing.push(checkedCard.card)
      }
    }

    if (confirmed.length >= config.poolSize) {
      unchecked.push(...cards.slice(index + batch.length))
      break
    }
  }

  if (confirmed.length < 2) {
    return cards.slice(0, config.poolSize)
  }

  return [...confirmed, ...unchecked, ...missing].slice(0, config.poolSize)
}

async function fetchPool(config) {
  const queries = getSearchQueries(config)
  const queryResults = await Promise.all(
    queries.map((query) => fetchCardsForQuery(query, config)),
  )
  const seen = new Set()
  const candidates = []
  const cardsPerQuery = config.maxCardsPerQuery
  const targetCandidateCount = config.poolSize * 2

  const addCandidate = (card) => {
    if (seen.has(card.productId)) {
      return false
    }

    seen.add(card.productId)
    candidates.push(card)
    return true
  }

  for (const result of queryResults) {
    let cardsFromQuery = 0

    for (const card of result.cards) {
      if (!addCandidate(card)) {
        continue
      }

      cardsFromQuery += 1

      if (cardsFromQuery >= cardsPerQuery || candidates.length >= targetCandidateCount) {
        break
      }
    }
  }

  if (candidates.length < targetCandidateCount) {
    for (const result of queryResults) {
      for (const card of result.cards) {
        addCandidate(card)

        if (candidates.length >= targetCandidateCount) {
          break
        }
      }

      if (candidates.length >= targetCandidateCount) {
        break
      }
    }
  }

  const cards = await preferCardsWithImages(shuffle(candidates), config)

  if (cards.length === 0) {
    throw new Error('PokeWallet returned no usable priced single cards.')
  }

  return {
    cards: cards.slice(0, config.poolSize),
    queries,
  }
}

export async function getCardPool(env = processEnv) {
  const config = getPokeWalletConfig(env)
  const now = Date.now()
  const cacheKey = getPoolCacheKey(config)

  if (poolCache && poolCache.expiresAt > now && poolCache.cacheKey === cacheKey) {
    return {
      ...poolCache.payload,
      cached: true,
      requestsUsedThisHour: getRateWindow(now).used,
      maxHourlyRequests: config.maxHourlyRequests,
    }
  }

  const { cards, queries } = await fetchPool(config)
  const refreshedAt = new Date(now).toISOString()
  const expiresAt = getNextRefreshAt(now, config.cacheMs)
  const payload = {
    source: 'pokewallet',
    cards,
    cacheMinutes: config.cacheMinutes,
    poolSize: cards.length,
    requestedPoolSize: config.poolSize,
    minPrice: config.minPrice,
    searchQueries: queries,
    maxCardsPerQuery: config.maxCardsPerQuery,
    filters: [
      'single cards only',
      'sealed products removed',
      ...(config.englishOnly ? ['English TCGplayer cards only'] : []),
      ...(config.requireImages ? ['cards with working images preferred'] : []),
    ],
    imageChecksPerRefresh: config.imageChecksPerRefresh,
    refreshedAt,
    nextRefreshAt: new Date(expiresAt).toISOString(),
  }

  poolCache = {
    cacheKey,
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

async function fetchCardImage(cardId, size = 'low', config) {
  const imageSize = size === 'high' ? 'high' : 'low'
  const cacheKey = getImageCacheKey(cardId, imageSize)
  const cachedImage = imageCache.get(cacheKey)
  const now = Date.now()

  if (cachedImage && cachedImage.expiresAt > now) {
    setImageAvailability(cardId, imageSize, true, config, now)
    return cachedImage.image
  }

  try {
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

    if (!image.contentType.toLowerCase().startsWith('image/')) {
      setImageAvailability(cardId, imageSize, false, config, now)
      throw new Error('PokéWallet returned a non-image response for this card.')
    }

    imageCache.set(cacheKey, {
      expiresAt: now + config.imageCacheMinutes * 60 * 1000,
      image,
    })
    setImageAvailability(cardId, imageSize, true, config, now)

    return image
  } catch (error) {
    if (
      !error.upstream ||
      (error.upstream.status !== 401 &&
        error.upstream.status !== 403 &&
        error.upstream.status !== 429)
    ) {
      setImageAvailability(cardId, imageSize, false, config, now)
    }

    throw error
  }
}

export async function getCardImage(cardId, size = 'low', env = processEnv) {
  return fetchCardImage(cardId, size, getPokeWalletConfig(env))
}

export function getStatus(env = processEnv) {
  const config = getPokeWalletConfig(env)
  const now = Date.now()
  const cacheKey = getPoolCacheKey(config)
  const hasMatchingCache = poolCache?.expiresAt > now && poolCache.cacheKey === cacheKey

  return {
    configured: Boolean(config.apiKey),
    apiKeyKind: config.apiKeyKind,
    apiKeyLooksValid: config.apiKeyLooksValid,
    apiKeyLength: config.apiKey.length,
    cacheMinutes: config.cacheMinutes,
    maxHourlyRequests: config.maxHourlyRequests,
    searchesPerRefresh: config.searchesPerRefresh,
    maxCardsPerQuery: config.maxCardsPerQuery,
    englishOnly: config.englishOnly,
    requireImages: config.requireImages,
    imageChecksPerRefresh: config.imageChecksPerRefresh,
    minPrice: config.minPrice,
    poolSize: config.poolSize,
    searchQueryCount: config.searchQueries.length,
    cachedCards: hasMatchingCache ? poolCache.payload.cards.length : 0,
    nextRefreshAt: hasMatchingCache ? poolCache.payload.nextRefreshAt : null,
    requestsUsedThisHour: getRateWindow(now).used,
  }
}

export function getPokeWalletErrorDetails(error) {
  if (!error?.upstream) {
    return {}
  }

  return {
    upstream: error.upstream,
  }
}
