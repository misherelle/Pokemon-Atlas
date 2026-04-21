import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { cwd } from 'node:process'

const TCGPLAYER_API_BASE = 'https://api.tcgplayer.com'
const POKEMON_CATEGORY_ID = 3

const demoCards = [
  {
    productId: 'demo-pikachu',
    name: 'Pikachu Illustrator',
    setName: '1998 Japanese Promo',
    imageUrl: '/images/pikachu-card.png',
    price: 16492000,
    url: 'https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=pikachu%20illustrator',
  },
  {
    productId: 'demo-charizard',
    name: 'Charizard Base Set 1st Edition',
    setName: 'Base Set',
    imageUrl: '/images/charizard-card.png',
    price: 550000,
    url: 'https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=charizard%20base%20set%201st%20edition',
  },
  {
    productId: 'demo-umbreon',
    name: 'Umbreon Gold Star',
    setName: 'POP Series 5',
    imageUrl: '/images/umbreon-card.png',
    price: 48500,
    url: 'https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=umbreon%20gold%20star',
  },
  {
    productId: 'demo-rayquaza',
    name: 'Rayquaza Gold Star',
    setName: 'EX Deoxys',
    imageUrl: '/images/rayquaza-card.png',
    price: 49000,
    url: 'https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=rayquaza%20gold%20star',
  },
  {
    productId: 'demo-lugia',
    name: 'Lugia Neo Genesis 1st Edition',
    setName: 'Neo Genesis',
    imageUrl: '/images/lugia-card.png',
    price: 180000,
    url: 'https://www.tcgplayer.com/search/pokemon/product?productLineName=pokemon&q=lugia%20neo%20genesis%201st%20edition',
  },
]

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5)
}

function makeDemoRound(reason = 'TCGplayer API credentials are not configured.') {
  return {
    source: 'demo',
    notice: reason,
    cards: shuffle(demoCards).slice(0, 2),
  }
}

function sendJson(response, status, data) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(data))
}

function pickPrice(priceEntry) {
  return [
    priceEntry.marketPrice,
    priceEntry.midPrice,
    priceEntry.lowPrice,
    priceEntry.highPrice,
  ].find((value) => typeof value === 'number' && value > 0)
}

function tcgplayerApiPlugin(env) {
  const publicKey = env.TCGPLAYER_PUBLIC_KEY
  const privateKey = env.TCGPLAYER_PRIVATE_KEY
  const apiVersion = env.TCGPLAYER_API_VERSION || 'v1.39.0'
  let tokenCache = null

  async function getBearerToken() {
    const now = Date.now()

    if (tokenCache && tokenCache.expiresAt - 60000 > now) {
      return tokenCache.token
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: publicKey,
      client_secret: privateKey,
    })
    const response = await fetch(`${TCGPLAYER_API_BASE}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    if (!response.ok) {
      throw new Error(`TCGplayer token request failed (${response.status})`)
    }

    const data = await response.json()
    tokenCache = {
      token: data.access_token,
      expiresAt: now + (Number(data.expires_in) || 0) * 1000,
    }

    return tokenCache.token
  }

  async function tcgplayerRequest(path) {
    const token = await getBearerToken()
    const urls = [
      `${TCGPLAYER_API_BASE}/${apiVersion}${path}`,
      `${TCGPLAYER_API_BASE}${path}`,
    ]

    for (const url of urls) {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          Authorization: `bearer ${token}`,
        },
      })

      if (response.status === 404 && url.includes(`/${apiVersion}/`)) {
        continue
      }

      if (!response.ok) {
        throw new Error(`TCGplayer request failed (${response.status})`)
      }

      return response.json()
    }

    throw new Error('TCGplayer endpoint was not found.')
  }

  async function getTcgplayerRound() {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const offset = Math.floor(Math.random() * 9000)
      const params = new URLSearchParams({
        categoryId: String(POKEMON_CATEGORY_ID),
        productTypes: 'Cards',
        getExtendedFields: 'true',
        limit: '50',
        offset: String(offset),
      })
      const catalog = await tcgplayerRequest(`/catalog/products?${params}`)
      const products = (catalog.results ?? []).filter(
        (product) => product.productId && product.name && product.imageUrl,
      )
      const productIds = products.map((product) => product.productId).join(',')

      if (!productIds) {
        continue
      }

      const prices = await tcgplayerRequest(`/pricing/product/${productIds}`)
      const priceByProductId = new Map(
        (prices.results ?? []).map((entry) => [entry.productId, entry]),
      )
      const pricedCards = products
        .map((product) => {
          const priceEntry = priceByProductId.get(product.productId)
          const price = priceEntry ? pickPrice(priceEntry) : null

          if (!price) {
            return null
          }

          return {
            productId: product.productId,
            name: product.cleanName || product.name,
            setName: product.groupName || `Group ${product.groupId}`,
            imageUrl: product.imageUrl,
            price,
            url: product.url,
          }
        })
        .filter(Boolean)

      const cards = shuffle(pricedCards).slice(0, 2)

      if (cards.length === 2 && cards[0].price !== cards[1].price) {
        return {
          source: 'tcgplayer',
          cards,
        }
      }
    }

    throw new Error('Could not find two priced Pokémon cards.')
  }

  return {
    name: 'tcgplayer-api',
    configureServer(server) {
      server.middlewares.use('/api/tcgplayer/status', (_request, response) => {
        sendJson(response, 200, {
          configured: Boolean(publicKey && privateKey),
          apiVersion,
        })
      })

      server.middlewares.use('/api/tcgplayer/round', async (_request, response) => {
        if (!publicKey || !privateKey) {
          sendJson(response, 200, makeDemoRound())
          return
        }

        try {
          sendJson(response, 200, await getTcgplayerRound())
        } catch (error) {
          sendJson(response, 200, makeDemoRound(error.message))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '')

  return {
    plugins: [react(), tcgplayerApiPlugin(env)],
  }
})
