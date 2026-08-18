import zlib from 'node:zlib'
import { Buffer } from 'node:buffer'

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024

const ALLOWED_ATTACHMENT_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf'])
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
])
const IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])

export const getFileExtension = (filename = '') => filename.split('.').pop()?.toLowerCase() || ''

const normalizeImageMimeType = (mimeType, extension) => {
  if (mimeType === 'image/jpg' || extension === 'jpg' || extension === 'jpeg') {
    return 'image/jpeg'
  }
  if (mimeType === 'image/png' || extension === 'png') {
    return 'image/png'
  }
  if (mimeType === 'image/webp' || extension === 'webp') {
    return 'image/webp'
  }
  return mimeType
}

export const validateAttachment = (attachment) => {
  if (!attachment) {
    return { ok: false, error: 'Unsupported attachment type.' }
  }

  const buffer = Buffer.isBuffer(attachment.buffer)
    ? attachment.buffer
    : attachment.buffer instanceof Uint8Array
      ? Buffer.from(attachment.buffer)
      : null

  if (!buffer || !buffer.length) {
    return { ok: false, error: 'Unsupported attachment type.' }
  }

  attachment.buffer = buffer

  if (attachment.buffer.length > MAX_ATTACHMENT_BYTES) {
    return { ok: false, error: 'Attachment is larger than 10 MB.' }
  }

  const filename = String(attachment.filename || '')
  const extension = getFileExtension(filename)
  const mimeType = String(attachment.mimeType || '').toLowerCase()
  const allowedType = ALLOWED_ATTACHMENT_MIME_TYPES.has(mimeType) || ALLOWED_ATTACHMENT_EXTENSIONS.has(extension)

  if (!allowedType) {
    return { ok: false, error: 'Unsupported attachment type.' }
  }

  return { ok: true }
}

const decodePdfLiteral = (value) =>
  value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\n')
    .replace(/\\t/g, ' ')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\')
    .replace(/\\(\d{1,3})/g, (_, octal) => String.fromCharCode(Number.parseInt(octal, 8)))

const collectPdfStrings = (content) => {
  const pieces = []
  const literalPattern = /\((?:\\.|[^\\)])*\)/g
  let match = literalPattern.exec(content)

  while (match) {
    const decoded = decodePdfLiteral(match[0].slice(1, -1)).trim()
    if (decoded) {
      pieces.push(decoded)
    }
    match = literalPattern.exec(content)
  }

  return pieces.join(' ')
}

const looksLikeReadableText = (value) => {
  if (!value) {
    return false
  }

  const printable = value.replace(/[\t\n\r\u0020-\u007e]/g, '')
  return printable.length / value.length < 0.35
}

const extractPdfText = (buffer) => {
  const source = buffer.toString('latin1')
  if (!source.startsWith('%PDF')) {
    return ''
  }

  const collected = []
  const streamPattern = /stream\r?\n([\s\S]*?)endstream/g
  let match = streamPattern.exec(source)

  while (match) {
    const header = source.slice(Math.max(0, match.index - 500), match.index)
    let streamBytes = Buffer.from(match[1], 'latin1')

    if (streamBytes[streamBytes.length - 1] === 10) {
      streamBytes = streamBytes.subarray(0, -1)
    }
    if (streamBytes[streamBytes.length - 1] === 13) {
      streamBytes = streamBytes.subarray(0, -1)
    }

    try {
      if (/\/Filter\s*\/FlateDecode/.test(header) || /\/Filter\s*\[\s*\/FlateDecode/.test(header)) {
        streamBytes = zlib.inflateSync(streamBytes)
      }
    } catch {
      match = streamPattern.exec(source)
      continue
    }

    const streamText = streamBytes.toString('latin1')
    const extracted = collectPdfStrings(streamText)
    if (extracted && looksLikeReadableText(extracted)) {
      collected.push(extracted)
    }

    match = streamPattern.exec(source)
  }

  return collected.join('\n').replace(/[ \t]+/g, ' ').trim()
}

export const extractAttachmentContent = async (attachment) => {
  const validation = validateAttachment(attachment)
  if (!validation.ok) {
    return { ok: false, error: validation.error }
  }

  const filename = String(attachment.filename || 'attachment')
  const extension = getFileExtension(filename)
  const mimeType = String(attachment.mimeType || '').toLowerCase()

  if (IMAGE_MIME_TYPES.has(mimeType) || ['jpg', 'jpeg', 'png', 'webp'].includes(extension)) {
    const resolvedMime = normalizeImageMimeType(mimeType, extension)
    const rawBase64 = attachment.buffer.toString('base64').replace(/^data:[^;]+;base64,/i, '')
    return {
      ok: true,
      kind: 'image',
      mimeType: resolvedMime,
      filename,
      byteSize: attachment.buffer.length,
      base64: rawBase64,
    }
  }

  if (mimeType === 'application/pdf' || extension === 'pdf') {
    const text = extractPdfText(attachment.buffer)
    if (!text || text.length < 20) {
      return { ok: false, error: 'PDF analysis is not available yet' }
    }

    return {
      ok: true,
      kind: 'pdf-text',
      filename,
      text: text.slice(0, 20000),
    }
  }

  return { ok: false, error: 'Unsupported attachment type.' }
}
