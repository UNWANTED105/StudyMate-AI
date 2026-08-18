import { Buffer } from 'node:buffer'

const indexOfSequence = (buffer, sequence, start = 0) => buffer.indexOf(sequence, start)

const stripTrailingCrlf = (buffer) => {
  if (buffer.length >= 2 && buffer[buffer.length - 2] === 13 && buffer[buffer.length - 1] === 10) {
    return buffer.subarray(0, -2)
  }
  return buffer
}

const parseContentDisposition = (headerText) => {
  const nameMatch = /name="([^"]*)"/i.exec(headerText)
  const filenameMatch = /filename\*?=(?:UTF-8''[^;]*|"(.*?)")/i.exec(headerText)
  const plainFilenameMatch = /filename="([^"]*)"/i.exec(headerText)
  const contentTypeMatch = /content-type:\s*([^\r\n]+)/i.exec(headerText)

  return {
    name: nameMatch?.[1] || '',
    filename: filenameMatch?.[1] || plainFilenameMatch?.[1] || '',
    mimeType: (contentTypeMatch?.[1] || '').trim(),
  }
}

const splitMultipartParts = (buffer, boundary) => {
  const boundaryToken = Buffer.from(`--${boundary}`)
  const parts = []
  let cursor = indexOfSequence(buffer, boundaryToken)

  if (cursor === -1) {
    return parts
  }

  cursor += boundaryToken.length

  while (cursor < buffer.length) {
    if (buffer[cursor] === 45 && buffer[cursor + 1] === 45) {
      break
    }

    if (buffer[cursor] === 13 && buffer[cursor + 1] === 10) {
      cursor += 2
    }

    const nextBoundary = indexOfSequence(buffer, Buffer.from(`\r\n--${boundary}`), cursor)
    if (nextBoundary === -1) {
      break
    }

    parts.push(buffer.subarray(cursor, nextBoundary))
    cursor = nextBoundary + 2 + boundaryToken.length
  }

  return parts
}

export const parseMultipartFormData = (buffer, contentType) => {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(String(contentType || ''))
  const boundary = (boundaryMatch?.[1] || boundaryMatch?.[2] || '').trim()

  if (!boundary) {
    const error = new Error('Malformed multipart request: missing boundary.')
    error.status = 400
    throw error
  }

  const fields = {}
  let attachment = null

  for (const part of splitMultipartParts(buffer, boundary)) {
    const headerEnd = indexOfSequence(part, Buffer.from('\r\n\r\n'))
    if (headerEnd === -1) {
      continue
    }

    const headerText = part.subarray(0, headerEnd).toString('utf8')
    const body = stripTrailingCrlf(part.subarray(headerEnd + 4))
    const { name, filename, mimeType } = parseContentDisposition(headerText)

    if (!name) {
      continue
    }

    if (filename || name === 'attachment' || name === 'file' || name === 'image') {
      if (filename || body.length) {
        attachment = {
          filename: filename || 'upload',
          mimeType,
          buffer: Buffer.from(body),
        }
      }
      continue
    }

    fields[name] = body.toString('utf8')
  }

  return { fields, attachment }
}

const readRequestBuffer = (request) => {
  if (Buffer.isBuffer(request.rawBody)) {
    return Promise.resolve(request.rawBody)
  }

  if (Buffer.isBuffer(request.body)) {
    return Promise.resolve(request.body)
  }

  if (typeof request.body === 'string') {
    return Promise.resolve(Buffer.from(request.body))
  }

  return new Promise((resolve, reject) => {
    const chunks = []
    request.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    request.on('end', () => resolve(Buffer.concat(chunks)))
    request.on('error', reject)
  })
}

const getContentType = (request) => {
  const headers = request.headers || {}
  return String(headers['content-type'] || headers['Content-Type'] || '')
}

const bodyFromFields = (fields, attachment) => {
  let history = []
  if (fields.history) {
    try {
      history = JSON.parse(fields.history)
    } catch {
      history = []
    }
  }

  return {
    message: fields.message || fields.question || '',
    question: fields.question || fields.message || '',
    level: fields.level || '',
    subject: fields.subject || '',
    topic: fields.topic || '',
    mode: fields.mode || '',
    history,
    attachment,
  }
}

export const parseTutorRequest = async (request) => {
  const contentType = getContentType(request)

  if (request.body && typeof request.body === 'object' && !Buffer.isBuffer(request.body) && !contentType.includes('multipart/form-data')) {
    const parsed = request.body
    console.info('[tutor-parse]', {
      hasAttachment: Boolean(parsed.attachment),
      filename: parsed.attachment?.filename,
      mimeType: parsed.attachment?.mimeType,
      byteSize: parsed.attachment?.buffer?.length || parsed.attachment?.size,
    })
    return parsed
  }

  const buffer = await readRequestBuffer(request)

  if (contentType.includes('multipart/form-data')) {
    const { fields, attachment } = parseMultipartFormData(buffer, contentType)
    const parsed = bodyFromFields(fields, attachment)
    console.info('[tutor-parse]', {
      hasAttachment: Boolean(parsed.attachment),
      filename: parsed.attachment?.filename,
      mimeType: parsed.attachment?.mimeType,
      byteSize: parsed.attachment?.buffer?.length,
    })
    return parsed
  }

  const text = buffer.toString('utf8').trim()
  const parsed = text ? JSON.parse(text) : {}
  console.info('[tutor-parse]', {
    hasAttachment: Boolean(parsed.attachment),
    filename: parsed.attachment?.filename,
    mimeType: parsed.attachment?.mimeType,
    byteSize: parsed.attachment?.buffer?.length,
  })
  return parsed
}
