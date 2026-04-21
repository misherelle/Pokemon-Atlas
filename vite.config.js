import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { Buffer } from 'node:buffer'
import { cwd } from 'node:process'
import { getCardImage, getCardPool, getStatus } from './api/pokewallet/_pokewallet.js'

function sendJson(response, status, data) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify(data))
}

function getLocalImageRequest(requestUrl) {
  const url = new URL(requestUrl ?? '', 'http://localhost')
  const cardId = decodeURIComponent(url.pathname.replace(/^\/+/, ''))

  return {
    cardId,
    size: url.searchParams.get('size') ?? 'low',
  }
}

function pokeWalletApiPlugin(env) {
  return {
    name: 'pokewallet-api',
    configureServer(server) {
      server.middlewares.use('/api/pokewallet/status', (_request, response) => {
        sendJson(response, 200, getStatus(env))
      })

      server.middlewares.use('/api/pokewallet/pool', async (_request, response) => {
        try {
          response.setHeader('Cache-Control', 'no-store')
          sendJson(response, 200, await getCardPool(env))
        } catch (error) {
          sendJson(response, 503, {
            ...getStatus(env),
            error: error.message || 'PokeWallet prices are unavailable.',
          })
        }
      })

      server.middlewares.use('/api/pokewallet/images', async (request, response) => {
        const { cardId, size } = getLocalImageRequest(request.url)

        if (!cardId) {
          sendJson(response, 400, { error: 'Missing card id' })
          return
        }

        try {
          const image = await getCardImage(cardId, size, env)

          response.statusCode = 200
          response.setHeader('Cache-Control', 'public, max-age=86400')
          response.setHeader('Content-Type', image.contentType)
          response.end(Buffer.from(image.buffer))
        } catch (error) {
          sendJson(response, 503, {
            error: error.message || 'Card image is unavailable.',
          })
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, cwd(), '')

  return {
    plugins: [react(), pokeWalletApiPlugin(env)],
  }
})
