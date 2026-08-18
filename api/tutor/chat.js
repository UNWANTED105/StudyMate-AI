import { parseTutorRequest } from '../_lib/parseTutorRequest.js'
import { processTutorChat } from '../_lib/tutorChat.js'

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const parsedBody = await parseTutorRequest(request)
  const result = await processTutorChat(parsedBody)
  return response.status(result.status).json(result.body)
}
