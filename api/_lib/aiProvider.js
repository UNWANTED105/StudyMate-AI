import http from 'node:http'
import https from 'node:https'
import process from 'node:process'
import { Buffer } from 'node:buffer'

export const DEFAULT_OLLAMA_BASE_URL = 'http://127.0.0.1:11434'
export const DEFAULT_OLLAMA_MODEL = 'qwen3:0.6b'

const LOCAL_ATTACHMENT_ERROR =
  'Local attachment analysis requires a vision/document-capable local model. The current local model is text-only.'

const stripWrappingQuotes = (value) => String(value || '').trim().replace(/^['"]|['"]$/g, '')

export const getAiProvider = () => {
  const value = stripWrappingQuotes(process.env.AI_PROVIDER || 'open_source').toLowerCase()
  return value === 'openai' ? 'openai' : 'open_source'
}

export const getOllamaBaseUrl = () => {
  let raw = stripWrappingQuotes(process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL)
  raw = raw.replace(/\/+$/, '')
  raw = raw.replace(/\/api\/chat$/i, '')

  try {
    const parsed = new URL(raw)
    if (parsed.hostname === 'localhost' || parsed.hostname === '::1') {
      parsed.hostname = '127.0.0.1'
    }
    return `${parsed.protocol}//${parsed.hostname}${parsed.port ? `:${parsed.port}` : ''}`
  } catch {
    return DEFAULT_OLLAMA_BASE_URL
  }
}

export const getOllamaChatUrl = () => `${getOllamaBaseUrl()}/api/chat`

export const getOllamaModel = () => stripWrappingQuotes(process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL) || DEFAULT_OLLAMA_MODEL

const buildStubAnswer = ({ message, level, subject, topic, mode }) => {
  const topicLine = topic?.trim() ? ` about "${topic.trim()}"` : ''

  return [
    `StudyMate Tutor (demo mode — set OPENAI_API_KEY on the server for live AI responses).`,
    '',
    `Level: ${level}`,
    `Subject: ${subject}`,
    `Mode: ${mode}`,
    '',
    `Your question${topicLine}: ${message}`,
    '',
    'In production, the tutor will generate a full answer here based on your selected level, subject, and mode.',
  ].join('\n')
}

const buildOpenAiUserContent = ({ message, attachmentContent }) => {
  if (attachmentContent?.kind === 'image') {
    return [
      { type: 'text', text: message },
      {
        type: 'image_url',
        image_url: {
          url: `data:${attachmentContent.mimeType};base64,${attachmentContent.base64}`,
        },
      },
    ]
  }

  if (attachmentContent?.kind === 'pdf-text') {
    return [
      message,
      '',
      `The student attached a PDF named "${attachmentContent.filename}". Use the extracted text below to help answer. Do not claim you read pages that are not represented in this text.`,
      '',
      attachmentContent.text,
    ].join('\n')
  }

  return message
}

const stripThinkTags = (text) =>
  String(text || '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .trim()

const getErrorCauseCode = (error) => {
  if (!error || typeof error !== 'object') {
    return ''
  }

  if (error.cause?.code) {
    return String(error.cause.code)
  }

  if (error.code) {
    return String(error.code)
  }

  if (error.cause instanceof AggregateError) {
    return error.cause.errors.map((item) => item?.code || item?.message).filter(Boolean).join(', ')
  }

  return error.cause?.message || ''
}

const logOllamaDiagnostic = (details) => {
  console.info('[tutor-ollama]', details)
}

const postJsonWithNodeHttp = (urlString, payload) =>
  new Promise((resolve, reject) => {
    const url = new URL(urlString)
    const body = JSON.stringify(payload)
    const transport = url.protocol === 'https:' ? https : http
    const hostname = url.hostname === 'localhost' || url.hostname === '::1' ? '127.0.0.1' : url.hostname

    const request = transport.request(
      {
        protocol: url.protocol,
        hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        family: 4,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (response) => {
        const chunks = []
        response.on('data', (chunk) => {
          chunks.push(chunk)
        })
        response.on('end', () => {
          resolve({
            ok: (response.statusCode || 500) >= 200 && (response.statusCode || 500) < 300,
            status: response.statusCode || 500,
            text: Buffer.concat(chunks).toString('utf8'),
          })
        })
      },
    )

    request.on('error', reject)
    request.setTimeout(120000, () => {
      request.destroy(new Error('Ollama request timed out.'))
    })
    request.write(body)
    request.end()
  })

const postOllamaChat = async (url, payload) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const text = await response.text()
    return {
      ok: response.ok,
      status: response.status,
      text,
      reachedOllama: true,
      transport: 'fetch',
    }
  } catch (error) {
    logOllamaDiagnostic({
      provider: 'open_source',
      ollamaUrl: url,
      model: payload.model,
      reachedOllama: false,
      transport: 'fetch',
      errorName: error instanceof Error ? error.name : 'Error',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCause: getErrorCauseCode(error),
    })

    const fallback = await postJsonWithNodeHttp(url, payload)
    return {
      ...fallback,
      reachedOllama: true,
      transport: 'node-http',
    }
  }
}

const generateOpenAiResponse = async ({
  systemPrompt,
  history,
  message,
  attachmentContent,
  level,
  subject,
  topic,
  mode,
}) => {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    if (attachmentContent) {
      return {
        ok: false,
        status: 503,
        error: 'AI provider is currently unavailable.',
      }
    }

    return {
      ok: true,
      provider: 'stub',
      answer: buildStubAnswer({ message, level, subject, topic, mode }),
    }
  }

  const userContent = buildOpenAiUserContent({ message, attachmentContent })
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: userContent },
  ]

  try {
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
        max_tokens: 900,
      }),
    })

    const data = await openAiResponse.json()

    if (!openAiResponse.ok) {
      return {
        ok: false,
        status: 502,
        error: data?.error?.message || 'AI provider is currently unavailable.',
      }
    }

    const answer = data?.choices?.[0]?.message?.content?.trim()
    if (!answer) {
      return { ok: false, status: 502, error: 'No answer was returned by the tutor.' }
    }

    return { ok: true, provider: 'openai', answer }
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: error instanceof Error ? error.message : 'AI provider is currently unavailable.',
    }
  }
}

const generateOpenSourceResponse = async ({ systemPrompt, history, message, attachmentContent }) => {
  if (attachmentContent) {
    return {
      ok: false,
      status: 400,
      error: LOCAL_ATTACHMENT_ERROR,
    }
  }

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message },
  ]

  const ollamaUrl = getOllamaChatUrl()
  const model = getOllamaModel()
  const payload = {
    model,
    messages,
    stream: false,
  }

  logOllamaDiagnostic({
    provider: 'open_source',
    ollamaUrl,
    model,
  })

  try {
    const ollamaResponse = await postOllamaChat(ollamaUrl, payload)

    logOllamaDiagnostic({
      provider: 'open_source',
      ollamaUrl,
      model,
      httpStatus: ollamaResponse.status,
      reachedOllama: ollamaResponse.reachedOllama,
      transport: ollamaResponse.transport,
    })

    let data = null
    if (ollamaResponse.text) {
      try {
        data = JSON.parse(ollamaResponse.text)
      } catch {
        data = null
      }
    }

    if (!ollamaResponse.ok) {
      const detail = data?.error || String(ollamaResponse.text || '').slice(0, 300)
      return {
        ok: false,
        status: 502,
        error: `Local Ollama returned HTTP ${ollamaResponse.status}${detail ? `: ${detail}` : '.'}`,
      }
    }

    const answer = stripThinkTags(data?.message?.content)
    if (!answer) {
      return { ok: false, status: 502, error: 'No answer was returned by the tutor.' }
    }

    return { ok: true, provider: 'open_source', answer }
  } catch (error) {
    logOllamaDiagnostic({
      provider: 'open_source',
      ollamaUrl,
      model,
      reachedOllama: false,
      errorName: error instanceof Error ? error.name : 'Error',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorCause: getErrorCauseCode(error),
    })

    return {
      ok: false,
      status: 503,
      error: `Unable to connect to local Ollama at ${getOllamaBaseUrl()}. Make sure Ollama is running.`,
    }
  }
}

export const generateTutorResponse = async ({
  systemPrompt,
  history,
  message,
  attachmentContent,
  level,
  subject,
  topic,
  mode,
}) => {
  const provider = getAiProvider()
  console.info('[tutor-provider]', { provider })

  if (provider === 'openai') {
    return generateOpenAiResponse({
      systemPrompt,
      history,
      message,
      attachmentContent,
      level,
      subject,
      topic,
      mode,
    })
  }

  return generateOpenSourceResponse({
    systemPrompt,
    history,
    message,
    attachmentContent,
  })
}
