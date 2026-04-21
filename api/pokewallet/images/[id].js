import { Buffer } from 'node:buffer'
import { getCardImage } from '../_pokewallet.js'

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  const cardId = Array.isArray(request.query.id)
    ? request.query.id[0]
    : request.query.id
  const size = Array.isArray(request.query.size)
    ? request.query.size[0]
    : request.query.size

  if (!cardId) {
    response.status(400).json({ error: 'Missing card id' })
    return
  }

  try {
    const image = await getCardImage(cardId, size)

    response.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800')
    response.setHeader('Content-Type', image.contentType)
    response.status(200).send(Buffer.from(image.buffer))
  } catch (error) {
    response.status(503).json({
      error: error.message || 'Card image is unavailable.',
    })
  }
}
