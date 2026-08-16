import { buildTutorSystemPrompt } from './tutorPrompt.js'

const MAX_MESSAGE_LENGTH = 4000
const MAX_HISTORY_MESSAGES = 20

const normalizeHistory = (history) => {
  if (!Array.isArray(history)) {
    return []
  }

  return history
    .filter((entry) => entry && typeof entry.content === 'string' && entry.content.trim())
    .slice(-MAX_HISTORY_MESSAGES)
    .map((entry) => ({
      role: entry.role === 'assistant' ? 'assistant' : 'user',
      content: entry.content.trim(),
    }))
}

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

const callOpenAi = async ({ systemPrompt, history, message, apiKey }) => {
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history,
    { role: 'user', content: message },
  ]

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
    const errorMessage = data?.error?.message || 'OpenAI request failed.'
    return { ok: false, error: errorMessage }
  }

  const answer = data?.choices?.[0]?.message?.content?.trim()

  if (!answer) {
    return { ok: false, error: 'No answer was returned by the tutor.' }
  }

  return { ok: true, answer }
}

export const processTutorChat = async (body = {}) => {
  const message = String(body.message || body.question || '').trim()
  const level = String(body.level || 'Class 9-10').trim()
  const subject = String(body.subject || 'General').trim()
  const topic = String(body.topic || '').trim()
  const mode = String(body.mode || 'Explain').trim()
  const history = normalizeHistory(body.history)

  if (!message) {
    return {
      status: 400,
      body: { error: 'Question is required.' },
    }
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return {
      status: 400,
      body: { error: `Question must be under ${MAX_MESSAGE_LENGTH} characters.` },
    }
  }

  const systemPrompt = buildTutorSystemPrompt({ level, subject, topic, mode })
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return {
      status: 200,
      body: {
        answer: buildStubAnswer({ message, level, subject, topic, mode }),
        mode,
        provider: 'stub',
      },
    }
  }

  try {
    const result = await callOpenAi({ systemPrompt, history, message, apiKey })

    if (!result.ok) {
      return {
        status: 502,
        body: { error: result.error },
      }
    }

    return {
      status: 200,
      body: {
        answer: result.answer,
        mode,
        provider: 'openai',
      },
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unexpected server error.'
    return {
      status: 500,
      body: { error: errorMessage },
    }
  }
}
