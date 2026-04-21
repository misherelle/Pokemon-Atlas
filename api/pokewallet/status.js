import { getStatus } from './_pokewallet.js'

export default function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: 'Method not allowed' })
    return
  }

  response.status(200).json(getStatus())
}
