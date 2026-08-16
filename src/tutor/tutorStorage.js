import {
  DEFAULT_TUTOR_LEVEL,
  DEFAULT_TUTOR_MODE,
  DEFAULT_TUTOR_SUBJECT,
  TUTOR_LEVELS,
  TUTOR_MODES,
  TUTOR_SUBJECTS,
} from './constants.js'

export const TUTOR_SESSION_STORAGE_KEY = 'studymate_tutor_session'

const createMessageId = () => `msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

export const createWelcomeMessage = () => ({
  id: createMessageId(),
  role: 'ai',
  text: 'Hi! I am your StudyMate AI Tutor. Choose your class level, subject, and mode, then ask any academic question.',
  createdAt: new Date().toISOString(),
})

export const createDefaultTutorSession = () => ({
  id: `session-${Date.now()}`,
  level: DEFAULT_TUTOR_LEVEL,
  subject: DEFAULT_TUTOR_SUBJECT,
  subjectOther: '',
  topic: '',
  mode: DEFAULT_TUTOR_MODE,
  messages: [createWelcomeMessage()],
  updatedAt: new Date().toISOString(),
})

const normalizeMode = (mode) => (TUTOR_MODES.includes(mode) ? mode : DEFAULT_TUTOR_MODE)

const normalizeLevel = (level) => (TUTOR_LEVELS.includes(level) ? level : DEFAULT_TUTOR_LEVEL)

const normalizeSubject = (subject) => (TUTOR_SUBJECTS.includes(subject) ? subject : DEFAULT_TUTOR_SUBJECT)

const normalizeMessage = (message, index) => {
  if (!message || typeof message !== 'object') {
    return null
  }

  const role = message.role === 'user' ? 'user' : 'ai'
  const text = String(message.text || '').trim()

  if (!text) {
    return null
  }

  return {
    id: message.id || `msg-restored-${index}`,
    role,
    text,
    mode: message.mode ? normalizeMode(message.mode) : undefined,
    createdAt: message.createdAt || new Date().toISOString(),
  }
}

export const loadTutorSession = () => {
  if (typeof window === 'undefined') {
    return createDefaultTutorSession()
  }

  try {
    const stored = window.localStorage.getItem(TUTOR_SESSION_STORAGE_KEY)
    if (!stored) {
      return createDefaultTutorSession()
    }

    const parsed = JSON.parse(stored)
    const messages = Array.isArray(parsed.messages)
      ? parsed.messages.map(normalizeMessage).filter(Boolean)
      : []

    return {
      id: parsed.id || `session-${Date.now()}`,
      level: normalizeLevel(parsed.level),
      subject: normalizeSubject(parsed.subject),
      subjectOther: String(parsed.subjectOther || ''),
      topic: String(parsed.topic || ''),
      mode: normalizeMode(parsed.mode),
      messages: messages.length > 0 ? messages : [createWelcomeMessage()],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    }
  } catch (error) {
    console.warn('Failed to load tutor session:', error)
    return createDefaultTutorSession()
  }
}

export const saveTutorSession = (session) => {
  if (typeof window === 'undefined' || !session) {
    return
  }

  try {
    window.localStorage.setItem(
      TUTOR_SESSION_STORAGE_KEY,
      JSON.stringify({
        ...session,
        updatedAt: new Date().toISOString(),
      }),
    )
  } catch (error) {
    console.warn('Failed to save tutor session:', error)
  }
}

export const getResolvedSubject = (session) => {
  if (session.subject === 'Other' && session.subjectOther.trim()) {
    return session.subjectOther.trim()
  }

  return session.subject
}

export const buildTutorHistory = (messages) =>
  messages
    .filter((message) => message.role === 'user' || message.role === 'ai')
    .map((message) => ({
      role: message.role === 'ai' ? 'assistant' : 'user',
      content: message.text,
    }))
