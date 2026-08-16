import 'dotenv/config'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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

const loadProcessTutorChat = async () => {
  const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'api/_lib/tutorChat.js')).href
  const module = await import(moduleUrl)
  return module.processTutorChat
}

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
    applyServerEnv(server.config.mode)

    server.middlewares.use(async (request, response, next) => {
      const requestPath = request.url?.split('?')[0]
      if (request.method !== 'POST' || !tutorApiPaths.has(requestPath)) {
        next()
        return
      }

      console.info('[tutor-middleware]', {
        requestPath,
        AI_PROVIDER: process.env.AI_PROVIDER || '(unset)',
        OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || '(unset)',
        OLLAMA_MODEL: process.env.OLLAMA_MODEL || '(unset)',
      })

      try {
        const tagsResponse = await fetch('http://127.0.0.1:11434/api/tags')
        console.info('[tutor-middleware]', {
          probe: 'tags',
          httpStatus: tagsResponse.status,
          reachedOllama: true,
        })
      } catch (error) {
        console.info('[tutor-middleware]', {
          probe: 'tags',
          reachedOllama: false,
          errorName: error instanceof Error ? error.name : 'Error',
          errorMessage: error instanceof Error ? error.message : String(error),
        })
      }

      try {
        const rawBody = await readRequestBody(request)
        const parsedBody = rawBody ? JSON.parse(rawBody) : {}
        const processTutorChat = await loadProcessTutorChat()
        const result = await processTutorChat(parsedBody)

        response.statusCode = result.status
        response.setHeader('Content-Type', 'application/json')
        response.end(JSON.stringify(result.body))
      } catch (error) {
        console.info('[tutor-middleware]', {
          errorName: error instanceof Error ? error.name : 'Error',
          errorMessage: error instanceof Error ? error.message : String(error),
        })
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
