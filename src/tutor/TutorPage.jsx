import { useEffect, useRef, useState } from 'react'
import { TUTOR_LEVELS, TUTOR_MODES, TUTOR_SUBJECTS } from './constants.js'
import {
  buildTutorHistory,
  createWelcomeMessage,
  getResolvedSubject,
  loadTutorSession,
  saveTutorSession,
} from './tutorStorage.js'

const createMessageId = () => `msg-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`

const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
const ALLOWED_ATTACHMENT_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'pdf'])
const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

const getFileExtension = (filename = '') => filename.split('.').pop()?.toLowerCase() || ''

const isAllowedAttachment = (file) => {
  const extension = getFileExtension(file.name)
  const mimeType = (file.type || '').toLowerCase()
  return ALLOWED_ATTACHMENT_EXTENSIONS.has(extension) || ALLOWED_ATTACHMENT_MIME_TYPES.has(mimeType)
}

function TutorPage() {
  const initialSession = loadTutorSession()
  const [level, setLevel] = useState(initialSession.level)
  const [subject, setSubject] = useState(initialSession.subject)
  const [subjectOther, setSubjectOther] = useState(initialSession.subjectOther)
  const [topic, setTopic] = useState(initialSession.topic)
  const [mode, setMode] = useState(initialSession.mode)
  const [messages, setMessages] = useState(initialSession.messages)
  const [studentInput, setStudentInput] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  const [attachmentError, setAttachmentError] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatWindowRef = useRef(null)
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  useEffect(() => {
    saveTutorSession({
      id: initialSession.id,
      level,
      subject,
      subjectOther,
      topic,
      mode,
      messages,
    })
  }, [level, subject, subjectOther, topic, mode, messages, initialSession.id])

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight
    }
  }, [messages, isTyping])

  const clearAttachmentInputs = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }

  const handleNewConversation = () => {
    setMessages([createWelcomeMessage()])
    setStudentInput('')
    setAttachedFile(null)
    setAttachmentError('')
    clearAttachmentInputs()
  }

  const openFilePicker = () => {
    if (!fileInputRef.current) {
      return
    }
    fileInputRef.current.value = ''
    fileInputRef.current.click()
  }

  const openCameraPicker = () => {
    if (!cameraInputRef.current) {
      return
    }
    cameraInputRef.current.value = ''
    cameraInputRef.current.click()
  }

  const handleAttachmentChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!isAllowedAttachment(file)) {
      setAttachedFile(null)
      setAttachmentError('Please select a JPG, JPEG, PNG, WEBP, or PDF file.')
      event.target.value = ''
      return
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachedFile(null)
      setAttachmentError('File must be 10 MB or smaller.')
      event.target.value = ''
      return
    }

    if (event.target === fileInputRef.current && cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
    if (event.target === cameraInputRef.current && fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    setAttachedFile(file)
    setAttachmentError('')
  }

  const handleRemoveAttachment = () => {
    setAttachedFile(null)
    setAttachmentError('')
    clearAttachmentInputs()
  }

  const sendTutorQuestion = async (messageText) => {
    const text = messageText.trim()

    if (!text || isTyping) {
      return
    }

    const resolvedSubject = subject === 'Other' ? subjectOther.trim() || 'General' : subject
    const userMessage = {
      id: createMessageId(),
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setStudentInput('')
    setIsTyping(true)

    try {
      const response = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          level,
          subject: resolvedSubject,
          topic: topic.trim(),
          mode,
          history: buildTutorHistory(nextMessages.slice(0, -1)),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to get an answer right now.')
      }

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          role: 'ai',
          text: data.answer || 'I am here to help.',
          mode: data.mode || mode,
          createdAt: new Date().toISOString(),
        },
      ])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong while contacting the tutor.'
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: createMessageId(),
          role: 'ai',
          text: `Sorry, I could not answer that right now. ${errorMessage}`,
          createdAt: new Date().toISOString(),
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  const handleSendMessage = () => {
    sendTutorQuestion(studentInput)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="page-shell tutor-page-shell">
      <header className="page-header tutor-page-header">
        <div>
          <p className="eyebrow">AI Tutor</p>
          <h2>AI Tutor 2.0</h2>
          <p className="page-header-subtitle">Ask academic questions for school and college levels.</p>
        </div>
        <button type="button" className="action-button secondary tutor-new-chat-button" onClick={handleNewConversation}>
          New conversation
        </button>
      </header>

      <section className="panel tutor-panel">
        <div className="tutor-controls tutor-controls-grid">
          <label>
            <span>Class / Level</span>
            <select value={level} onChange={(event) => setLevel(event.target.value)}>
              {TUTOR_LEVELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Subject</span>
            <select value={subject} onChange={(event) => setSubject(event.target.value)}>
              {TUTOR_SUBJECTS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Topic (optional)</span>
            <input
              type="text"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. Quadratic equations"
            />
          </label>

          {subject === 'Other' && (
            <label className="tutor-full-width">
              <span>Other subject</span>
              <input
                type="text"
                value={subjectOther}
                onChange={(event) => setSubjectOther(event.target.value)}
                placeholder="Enter your subject"
              />
            </label>
          )}
        </div>

        <div className="tutor-mode-section">
          <span className="tutor-mode-label">Tutor mode</span>
          <div className="quick-prompts tutor-mode-prompts" role="group" aria-label="Tutor mode">
            {TUTOR_MODES.map((item) => (
              <button
                key={item}
                type="button"
                className={`quick-prompt tutor-mode-chip ${mode === item ? 'active' : ''}`}
                aria-pressed={mode === item}
                onClick={() => setMode(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="tutor-context-summary">
          <span>
            {level} · {getResolvedSubject({ subject, subjectOther })} · {mode}
          </span>
        </div>

        <div className="chat-window" aria-live="polite" ref={chatWindowRef}>
          {messages.map((message) => (
            <div key={message.id} className={`chat-message ${message.role}`}>
              {message.role === 'ai' && <span className="chat-label">AI Tutor</span>}
              <div className={`chat-bubble ${message.role}`}>
                {message.mode && message.role === 'ai' && <span className="tutor-mode-badge">{message.mode}</span>}
                {message.text}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat-message ai">
              <span className="chat-label">AI Tutor</span>
              <div className="chat-bubble ai typing-bubble">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          className="tutor-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf,.jpg,.jpeg,.png,.webp,.pdf"
          onChange={handleAttachmentChange}
          aria-hidden="true"
          tabIndex={-1}
        />
        <input
          ref={cameraInputRef}
          className="tutor-file-input"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleAttachmentChange}
          aria-hidden="true"
          tabIndex={-1}
        />

        <div className="chat-input-row">
          <button type="button" className="action-button secondary tutor-attach-button" onClick={openFilePicker} aria-label="File">
            📎 File
          </button>
          <button type="button" className="action-button secondary tutor-attach-button" onClick={openCameraPicker} aria-label="Camera">
            📷 Camera
          </button>
          <input
            type="text"
            value={studentInput}
            onChange={(event) => setStudentInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your academic question..."
            aria-label="Ask the tutor a question"
          />
          <button type="button" className="action-button primary" onClick={handleSendMessage} disabled={isTyping || !studentInput.trim()}>
            Send
          </button>
        </div>

        {attachedFile && (
          <div className="tutor-attachment-bar">
            <span className="tutor-attachment-name">{attachedFile.name}</span>
            <button type="button" className="action-button secondary tutor-remove-attachment" onClick={handleRemoveAttachment}>
              Remove
            </button>
          </div>
        )}

        {attachmentError ? <p className="tutor-attachment-error">{attachmentError}</p> : null}
      </section>
    </div>
  )
}

export default TutorPage
