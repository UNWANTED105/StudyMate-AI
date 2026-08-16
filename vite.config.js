<<<<<<< Updated upstream
import 'dotenv/config'
import { defineConfig } from 'vite'
=======
import process from 'node:process'
import { defineConfig, loadEnv } from 'vite'
>>>>>>> Stashed changes
import react from '@vitejs/plugin-react'
import { processTutorChat } from './api/_lib/tutorChat.js'
import { parseTutorRequest } from './api/_lib/parseTutorRequest.js'

const tutorApiPaths = new Set(['/api/tutor/chat', '/api/ask-tutor'])

const SERVER_ENV_KEYS = ['OPENAI_API_KEY', 'AI_PROVIDER', 'OLLAMA_BASE_URL', 'OLLAMA_MODEL']

const applyServerEnv = (mode) => {
  const fileEnv = loadEnv(mode || 'development', process.cwd(), '')
  for (const key of SERVER_ENV_KEYS) {
    if (fileEnv[key] && !process.env[key]) {
      process.env[key] = fileEnv[key]
    }
  }
}

const tutorApiDevPlugin = () => ({
  name: 'tutor-api-dev',
  configureServer(server) {
    applyServerEnv(server.config.mode)

    server.middlewares.use(async (request, response, next) => {
      const requestPath = request.url?.split('?')[0]
      if (request.method !== 'POST' || !tutorApiPaths.has(requestPath)) {
        next()
        return
      }

      try {
        const payload = await parseTutorRequest(request)
        const result = await processTutorChat(payload)

        response.statusCode = result.status
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify(result.body))
      } catch (error) {
        response.statusCode = error?.status || 500
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
export default defineConfig(({ mode }) => {
  applyServerEnv(mode)

  return {
    plugins: [react(), tutorApiDevPlugin()],
  }
})
