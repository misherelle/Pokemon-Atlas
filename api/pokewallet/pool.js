import { getCardPool, getPokeWalletErrorDetails, getStatus } from './_pokewallet.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  response.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=120')

  try {
    response.status(200).json(await getCardPool())
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
