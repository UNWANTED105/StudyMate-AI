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

function TutorPage() {
  const initialSession = loadTutorSession()
  const [level, setLevel] = useState(initialSession.level)
  const [subject, setSubject] = useState(initialSession.subject)
  const [subjectOther, setSubjectOther] = useState(initialSession.subjectOther)
  const [topic, setTopic] = useState(initialSession.topic)
  const [mode, setMode] = useState(initialSession.mode)
  const [messages, setMessages] = useState(initialSession.messages)
  const [studentInput, setStudentInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const chatWindowRef = useRef(null)

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

  const handleNewConversation = () => {
    setMessages([createWelcomeMessage()])
    setStudentInput('')
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

        <div className="chat-input-row">
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
      </section>
    </div>
  )
}

export default TutorPage
