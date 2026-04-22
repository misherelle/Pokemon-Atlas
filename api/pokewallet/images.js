import { Buffer } from 'node:buffer'
import { getCardImage } from './_pokewallet.js'

const FALLBACK_CARD_IMAGE = `<svg xmlns="http://www.w3.org/2000/svg" width="420" height="588" viewBox="0 0 420 588" role="img" aria-labelledby="title desc">
  <title id="title">Card image unavailable</title>
  <desc id="desc">A simple placeholder card for missing Pokemon card art.</desc>
  <defs>
    <linearGradient id="card-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f5f1ff"/>
      <stop offset="1" stop-color="#fff7f1"/>
    </linearGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#7f6df2"/>
      <stop offset="1" stop-color="#ff8ca3"/>
    </linearGradient>
  </defs>
  <rect width="420" height="588" rx="30" fill="url(#card-bg)"/>
  <rect x="20" y="20" width="380" height="548" rx="24" fill="none" stroke="#d8d2ee" stroke-width="4"/>
  <circle cx="210" cy="246" r="78" fill="none" stroke="url(#mark)" stroke-width="18"/>
  <path d="M132 246h156" stroke="url(#mark)" stroke-width="18" stroke-linecap="round"/>
  <circle cx="210" cy="246" r="24" fill="#ffffff" stroke="#d8d2ee" stroke-width="8"/>
  <text x="210" y="390" text-anchor="middle" fill="#756f90" font-family="Arial Rounded MT Bold, Trebuchet MS, sans-serif" font-size="24">image unavailable</text>
</svg>`

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
    console.warn('pokewallet image fallback:', error.message || error)
    response.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    response.setHeader('Content-Type', 'image/svg+xml; charset=utf-8')
    response.status(200).send(FALLBACK_CARD_IMAGE)
  }
}
