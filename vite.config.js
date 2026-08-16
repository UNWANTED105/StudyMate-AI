import 'dotenv/config'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { processTutorChat } from './api/_lib/tutorChat.js'

const tutorApiPaths = new Set(['/api/tutor/chat', '/api/ask-tutor'])

const readRequestBody = (request) =>
  new Promise((resolve, reject) => {
    let body = ''

    request.on('data', (chunk) => {
      body += chunk
    })

    request.on('end', () => {
      resolve(body)
    })

    request.on('error', reject)
  })

const tutorApiDevPlugin = () => ({
  name: 'tutor-api-dev',
  configureServer(server) {
    server.middlewares.use(async (request, response, next) => {
      if (request.method !== 'POST' || !tutorApiPaths.has(request.url)) {
        next()
        return
      }

      try {
        const rawBody = await readRequestBody(request)
        const parsedBody = rawBody ? JSON.parse(rawBody) : {}
        const result = await processTutorChat(parsedBody)

        response.statusCode = result.status
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify(result.body))
      } catch (error) {
        response.statusCode = 500
        response.setHeader('Content-Type', 'application/json')
        response.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : 'Unexpected server error.',
          }),
        )
      }
    })
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tutorApiDevPlugin()],
})
