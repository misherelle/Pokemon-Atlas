import { getCardPool, getPokeWalletErrorDetails, getStatus } from './_pokewallet.js'

function getCacheSecondsUntil(nextRefreshAt) {
  const refreshTime = Date.parse(nextRefreshAt)

  if (!Number.isFinite(refreshTime)) {
    return 60
  }

  return Math.max(0, Math.floor((refreshTime - Date.now()) / 1000))
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const pool = await getCardPool()
    const cacheSeconds = getCacheSecondsUntil(pool.nextRefreshAt)

    response.setHeader(
      'Cache-Control',
      `s-maxage=${cacheSeconds}, stale-while-revalidate=20`,
    )
    response.status(200).json(pool)
  } catch (error) {
    console.error('pokewallet pool error:', error)
    console.error('pokewallet pool message:', error?.message)
    console.error('pokewallet pool stack:', error?.stack)

    response.setHeader('Cache-Control', 'no-store')
    response.status(503).json({
      ...getStatus(),
      error: error?.message || 'PokeWallet prices are unavailable.',
      ...getPokeWalletErrorDetails(error),
    })
  }
}
