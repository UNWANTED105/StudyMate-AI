import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { performance } from 'node:perf_hooks'

const OLLAMA_CHAT_URL = 'http://127.0.0.1:11434/api/chat'
const MODEL = 'moondream'
const DIAG_TIMEOUT_MS = 10 * 60 * 1000

const MIME_BY_EXTENSION = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

const imagePath = process.argv[2]

if (!imagePath) {
  console.error('Usage: node scripts/diagnose-real-png.mjs "<path-to-image>"')
  process.exit(1)
}

const filename = path.win32.basename(imagePath)
const extension = path.win32.extname(imagePath).slice(1).toLowerCase()
const mimeType = MIME_BY_EXTENSION[extension]

if (!mimeType) {
  console.error('[real-png-diag]', {
    filename,
    errorName: 'UnsupportedType',
    errorMessage: 'Supported extensions: png, jpg, jpeg, webp',
  })
  process.exit(1)
}

let imageBuffer
try {
  imageBuffer = await readFile(imagePath)
} catch (error) {
  console.info('[real-png-diag]', {
    filename,
    mimeType,
    byteSize: null,
    model: MODEL,
    httpStatus: null,
    elapsedMs: 0,
    elapsedSeconds: 0,
    ollamaSuccess: false,
    returnedAnswerLength: 0,
    errorName: error instanceof Error ? error.name : 'Error',
    errorMessage: error instanceof Error ? error.message : String(error),
  })
  process.exit(1)
}
const rawBase64 = imageBuffer
  .toString('base64')
  .replace(/^data:[^;]+;base64,/i, '')
  .replace(/\s/g, '')

console.info('[real-png-diag]', {
  filename,
  mimeType,
  byteSize: imageBuffer.length,
  model: MODEL,
})

const payload = {
  model: MODEL,
  messages: [
    {
      role: 'user',
      content: 'What do you see in this image?',
    },
  ],
  images: [rawBase64],
  stream: false,
}

const startedAt = performance.now()

try {
  const response = await fetch(OLLAMA_CHAT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(DIAG_TIMEOUT_MS),
  })

  const text = await response.text()
  const elapsedMs = Math.round(performance.now() - startedAt)
  let parsed = null
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = null
  }

  const answer = parsed?.message?.content ? String(parsed.message.content) : ''
  const ollamaError = parsed?.error || null

  console.info('[real-png-diag]', {
    httpStatus: response.status,
    elapsedMs,
    elapsedSeconds: Number((elapsedMs / 1000).toFixed(1)),
    ollamaSuccess: response.ok && !ollamaError && Boolean(answer.trim()),
    returnedAnswerLength: answer.length,
    errorName: ollamaError ? 'OllamaError' : null,
    errorMessage: ollamaError,
  })
} catch (error) {
  const elapsedMs = Math.round(performance.now() - startedAt)
  console.info('[real-png-diag]', {
    httpStatus: null,
    elapsedMs,
    elapsedSeconds: Number((elapsedMs / 1000).toFixed(1)),
    ollamaSuccess: false,
    returnedAnswerLength: 0,
    errorName: error instanceof Error ? error.name : 'Error',
    errorMessage: error instanceof Error ? error.message : String(error),
  })
  process.exitCode = 1
}
