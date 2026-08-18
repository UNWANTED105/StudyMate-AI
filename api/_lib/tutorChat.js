import { generateTutorResponse, getAiProvider } from './aiProvider.js'
import { extractAttachmentContent } from './attachments.js'
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

export const processTutorChat = async (body = {}) => {
  const message = String(body.message || body.question || '').trim()
  const level = String(body.level || 'Class 9-10').trim()
  const subject = String(body.subject || 'General').trim()
  const topic = String(body.topic || '').trim()
  const mode = String(body.mode || 'Explain').trim()
  const history = normalizeHistory(body.history)
  const attachment = body.attachment
  const selectedProvider = getAiProvider()

  console.info('[tutor-provider]', { provider: selectedProvider })

  console.info('[tutor-process]', {
    hasAttachment: Boolean(attachment),
    filename: attachment?.filename,
    mimeType: attachment?.mimeType,
    byteSize: attachment?.buffer?.length,
    selectedProvider,
  })

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

  let attachmentContent = null
  if (attachment) {
    attachmentContent = await extractAttachmentContent(attachment)
    if (!attachmentContent.ok) {
      return {
        status: 400,
        body: { error: attachmentContent.error },
      }
    }
  }

  const systemPrompt = buildTutorSystemPrompt({
    level,
    subject,
    topic,
    mode,
    attachmentKind: attachmentContent?.kind,
  })

  try {
    console.info('[tutor-process]', {
      hasAttachment: Boolean(attachmentContent),
      filename: attachmentContent?.filename,
      mimeType: attachmentContent?.mimeType,
      byteSize: attachmentContent?.byteSize || attachment?.buffer?.length,
      selectedProvider,
      attachmentKind: attachmentContent?.kind || null,
    })

    const result = await generateTutorResponse({
      systemPrompt,
      history,
      message,
      attachmentContent,
      level,
      subject,
      topic,
      mode,
    })

    if (!result.ok) {
      return {
        status: result.status || 502,
        body: { error: result.error || 'AI provider is currently unavailable.' },
      }
    }

    return {
      status: 200,
      body: {
        answer: result.answer,
        mode,
        provider: result.provider,
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
