import { useState } from 'react'
import './App.css'

const sidebarItems = [
  'Dashboard',
  'My Subjects',
  'AI Tutor',
  'Study Planner',
  'Quiz',
  'Progress',
  'Settings',
]

const dashboardStats = [
  { label: 'Overall Progress', value: '68%', detail: 'This week' },
  { label: 'Quiz Average', value: '76%', detail: '+8% vs last month' },
  { label: 'Study Time', value: '14.5 hrs', detail: 'Across 3 subjects' },
  { label: 'Study Streak', value: '5 days', detail: 'Current streak' },
]

const dashboardMissions = [
  'Complete Unit 2',
  'Revise Python basics',
  'Take a 10-question quiz',
]

const dashboardActivities = [
  { title: 'Completed Python loops recap', time: '2h ago', accent: 'learning' },
  { title: 'Scored 88% on logic quiz', time: '5h ago', accent: 'quiz' },
  { title: 'Updated weekly study plan', time: 'Yesterday', accent: 'schedule' },
  { title: 'Reviewed recursion exercises', time: '2 days ago', accent: 'focus' },
]

const subjectData = [
  {
    name: 'Python',
    progress: 80,
    completedTopics: 8,
    totalTopics: 10,
    studyTime: '6.5 hrs',
    nextTopic: 'Functions',
    description: 'Build practical coding confidence with Python basics, logic, and real exercises.',
    accent: 'python',
    topics: [
      { name: 'Variables', completed: true },
      { name: 'Loops', completed: true },
      { name: 'Lists', completed: true },
      { name: 'Dictionaries', completed: true },
      { name: 'Conditionals', completed: true },
      { name: 'Functions', completed: true },
      { name: 'Recursion', completed: true },
      { name: 'File Handling', completed: true },
      { name: 'Modules', completed: false },
      { name: 'Practice Project', completed: false },
    ],
  },
  {
    name: 'Mathematics',
    progress: 60,
    completedTopics: 6,
    totalTopics: 10,
    studyTime: '4.5 hrs',
    nextTopic: 'Probability',
    description: 'Strengthen problem-solving and formula-based reasoning across core math topics.',
    accent: 'math',
    topics: [
      { name: 'Fractions', completed: true },
      { name: 'Algebra Basics', completed: true },
      { name: 'Equations', completed: true },
      { name: 'Percentages', completed: true },
      { name: 'Ratios', completed: true },
      { name: 'Probability', completed: true },
      { name: 'Graphs', completed: false },
      { name: 'Statistics', completed: false },
      { name: 'Calculus Basics', completed: false },
      { name: 'Revision Sprint', completed: false },
    ],
  },
  {
    name: 'Computer Fundamentals',
    progress: 70,
    completedTopics: 7,
    totalTopics: 10,
    studyTime: '3.5 hrs',
    nextTopic: 'Networking',
    description: 'Understand the core systems, hardware, and digital foundations behind modern computing.',
    accent: 'computer',
    topics: [
      { name: 'Computer Components', completed: true },
      { name: 'CPU', completed: true },
      { name: 'RAM & Storage', completed: true },
      { name: 'Operating Systems', completed: true },
      { name: 'Hardware Basics', completed: true },
      { name: 'Input/Output', completed: true },
      { name: 'Networking', completed: true },
      { name: 'Internet Basics', completed: false },
      { name: 'Security Essentials', completed: false },
      { name: 'Database Basics', completed: false },
    ],
  },
]

const quickPrompts = ['Explain simply', 'Give an example', 'Quiz me', 'Summarize']

const plannerDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const initialPlanner = {
  Monday: [{ id: 1, subject: 'Python', topic: 'Loops', duration: 45 }],
  Tuesday: [{ id: 2, subject: 'Mathematics', topic: 'Algebra', duration: 60 }],
  Wednesday: [{ id: 3, subject: 'Computer Fundamentals', topic: 'CPU & Memory', duration: 45 }],
  Thursday: [{ id: 4, subject: 'Python', topic: 'Functions', duration: 60 }],
  Friday: [{ id: 5, subject: 'Mathematics', topic: 'Probability', duration: 45 }],
  Saturday: [{ id: 6, subject: 'Python', topic: 'Practice Quiz', duration: 60 }],
  Sunday: [{ id: 7, subject: 'Weekly Revision', topic: 'Review & Recap', duration: 90 }],
}

const pythonQuizQuestions = [
  {
    question: 'Which of the following is a valid variable name in Python?',
    options: ['2score', 'student-name', 'student_name', 'for'],
    correctAnswer: 'student_name',
    explanation: 'Variable names cannot begin with a number, and hyphens are not valid. Underscores are allowed, which makes student_name a correct Python identifier.',
  },
  {
    question: 'What does a for loop in Python do?',
    options: ['It defines a function', 'It repeats a block of code a fixed number of times', 'It stores data in a dictionary', 'It prints only one line'],
    correctAnswer: 'It repeats a block of code a fixed number of times',
    explanation: 'A for loop is commonly used when you know how many times you want to repeat an action, such as iterating over a list or a range of numbers.',
  },
  {
    question: 'Which statement creates a Python list?',
    options: ['numbers = {1, 2, 3}', 'numbers = [1, 2, 3]', 'numbers = (1, 2, 3)', 'numbers = "1, 2, 3"'],
    correctAnswer: 'numbers = [1, 2, 3]',
    explanation: 'Square brackets create a list in Python. Lists are ordered and can store multiple values in one variable.',
  },
  {
    question: 'What is the purpose of a function in Python?',
    options: ['To permanently delete a variable', 'To group reusable code', 'To compare two values', 'To create a list'],
    correctAnswer: 'To group reusable code',
    explanation: 'Functions let you organize code into reusable blocks, which makes programs easier to read, test, and maintain.',
  },
  {
    question: 'What is the result of this Python condition: age >= 18?',
    options: ['It always prints a message', 'It checks whether age is greater than or equal to 18', 'It creates a loop', 'It defines a list'],
    correctAnswer: 'It checks whether age is greater than or equal to 18',
    explanation: 'An if/else condition evaluates a true or false statement. In this case, it checks whether age is at least 18 before running a block of code.',
  },
]

const defaultSettings = {
  studentName: 'Ava Carter',
  level: 'Intermediate',
  email: 'ava@studymate.ai',
  dailyGoal: '2h',
  preferredStudyTime: 'Evening',
  weeklyStudyTarget: '6 sessions',
  studyReminders: true,
  quizReminders: true,
  weeklyProgressReport: true,
  darkMode: true,
  compactDashboard: false,
}

const recentAchievements = [
  'Finished 3 revision sprints',
  'Maintained a 5-day learning streak',
  'Improved quiz score by 8%',
  'Completed Python loops unit',
]

const weeklyStudyData = [
  { day: 'Monday', hours: 2 },
  { day: 'Tuesday', hours: 1.5 },
  { day: 'Wednesday', hours: 3 },
  { day: 'Thursday', hours: 2 },
  { day: 'Friday', hours: 1 },
  { day: 'Saturday', hours: 3 },
  { day: 'Sunday', hours: 2 },
]

const achievementCards = [
  { icon: '🔥', title: '5 Day Streak', detail: 'Daily learning habit' },
  { icon: '🧠', title: 'Quiz Master', detail: '80%+ quiz score' },
  { icon: '📚', title: '10 Topics Completed', detail: 'Strong momentum' },
  { icon: '⏱️', title: '14+ Hours Studied', detail: 'This week' },
]

function ProgressOverviewCard({ label, value, detail }) {
  return (
    <div className="stat-card panel progress-overview-card">
      <p>{label}</p>
      <h3>{value}</h3>
      <span>{detail}</span>
    </div>
  )
}

function DashboardPage() {
  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Good evening, Student 👋</h1>
          <p className="subtitle">Let&apos;s make today&apos;s study session count.</p>
        </div>

        <div className="header-actions">
          <button type="button" className="action-button secondary">
            Weekly summary
          </button>
          <button type="button" className="action-button primary">
            Start study block
          </button>
        </div>
      </header>

      <section className="stats-grid" aria-label="Study statistics">
        {dashboardStats.map((stat) => (
          <div key={stat.label} className="stat-card panel">
            <p>{stat.label}</p>
            <h3>{stat.value}</h3>
            <span>{stat.detail}</span>
          </div>
        ))}
      </section>

      <div className="content-grid">
        <div className="main-column">
          <section className="panel exam-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Exam countdown</p>
                <h2>Final Exam</h2>
              </div>
              <span className="pill">12 Days Left</span>
            </div>

            <div className="countdown-meter">
              <div className="meter-fill" style={{ width: '72%' }} />
            </div>

            <div className="pace-row">
              <span>Preparation pace</span>
              <strong>72%</strong>
            </div>
          </section>

          <section className="panel mission-panel">
            <div className="panel-heading compact">
              <p className="eyebrow">Today&apos;s Mission</p>
            </div>

            <ul className="mission-list">
              {dashboardMissions.map((item) => (
                <li key={item}>
                  <span className="mission-check" aria-hidden="true">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="side-column">
          <section className="panel recommendation-panel">
            <p className="eyebrow">AI Focus Recommendation</p>
            <p className="recommendation-text">
              “You are making good progress. Focus on recursion and nested loops today.”
            </p>
          </section>

          <section className="panel subject-panel">
            <div className="panel-heading compact">
              <p className="eyebrow">Subject progress</p>
            </div>

            {subjectData.map((subject) => (
              <div key={subject.name} className="subject-item">
                <div className="subject-row">
                  <span>{subject.name}</span>
                  <strong>{subject.progress}%</strong>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${subject.progress}%` }} />
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>

      <section className="panel activity-panel">
        <div className="panel-heading compact">
          <p className="eyebrow">Recent activity</p>
        </div>

        <div className="activity-list">
          {dashboardActivities.map((item) => (
            <div key={item.title} className="activity-item">
              <div className={`activity-badge ${item.accent}`} />
              <div className="activity-copy">
                <p>{item.title}</p>
                <span>{item.time}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function TutorPage() {
  const [selectedSubject, setSelectedSubject] = useState('Python')
  const [topic, setTopic] = useState('Loops')
  const [studentInput, setStudentInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [quizState, setQuizState] = useState(null)
  const [chat, setChat] = useState([
    {
      role: 'ai',
      text: 'Hi! I can help you understand Python, mathematics, and core tech topics. Ask me anything.',
    },
  ])

  const normalizeSubject = (subject) => {
    if (!subject) {
      return selectedSubject
    }

    const lower = subject.toLowerCase()

    if (lower.includes('python')) return 'Python'
    if (lower.includes('math') || lower.includes('algebra') || lower.includes('calculus') || lower.includes('probability')) return 'Mathematics'
    if (lower.includes('computer') || lower.includes('cpu') || lower.includes('ram') || lower.includes('network') || lower.includes('database') || lower.includes('operating system') || lower.includes('os')) return 'Computer Fundamentals'

    return selectedSubject
  }

  const parseTopicFromMessage = (message) => {
    const lower = message.toLowerCase()
    const topicMap = {
      python: ['loops', 'variables', 'functions', 'lists', 'dictionaries', 'recursion', 'conditionals'],
      mathematics: ['algebra', 'percentages', 'probability', 'calculus', 'derivatives'],
      'computer fundamentals': ['cpu', 'ram', 'operating system', 'networking', 'database'],
    }

    const resolvedSubject = normalizeSubject(message)
    const subjectTopics = topicMap[resolvedSubject.toLowerCase()] || []

    for (const candidate of subjectTopics) {
      if (lower.includes(candidate)) {
        return candidate
      }
    }

    if (lower.includes('loop')) return 'loops'
    if (lower.includes('variable')) return 'variables'
    if (lower.includes('function')) return 'functions'
    if (lower.includes('list')) return 'lists'
    if (lower.includes('dict') || lower.includes('dictionary')) return 'dictionaries'
    if (lower.includes('recursive') || lower.includes('recursion')) return 'recursion'
    if (lower.includes('condition')) return 'conditionals'
    if (lower.includes('percent')) return 'percentages'
    if (lower.includes('prob')) return 'probability'
    if (lower.includes('calc')) return 'calculus'
    if (lower.includes('cpu')) return 'cpu'
    if (lower.includes('ram')) return 'ram'
    if (lower.includes('operating system') || lower.includes('os')) return 'operating system'
    if (lower.includes('network')) return 'networking'
    if (lower.includes('database')) return 'database'

    return topic.trim() || 'this topic'
  }

  const inferAction = (message) => {
    const normalized = message.toLowerCase()

    if (normalized.includes('quiz') || normalized.includes('mcq') || normalized.includes('test me')) {
      return 'quiz'
    }

    if (normalized.includes('example') || normalized.includes('instance')) {
      return 'example'
    }

    if (normalized.includes('summarize') || normalized.includes('summary') || normalized.includes('outline')) {
      return 'summarize'
    }

    return 'explain'
  }

  const createPythonQuiz = () => {
    const topicName = topic.trim() || 'loops'

    if (topicName.toLowerCase().includes('loop')) {
      return {
        question: 'Which statement best describes a loop in Python?',
        options: ['A loop repeats a block of code multiple times', 'A loop stores values in a dictionary', 'A loop stops a program', 'A loop defines a function'],
        answer: 'A loop repeats a block of code multiple times',
      }
    }

    if (topicName.toLowerCase().includes('function')) {
      return {
        question: 'What is the purpose of a function in Python?',
        options: ['To repeat an action forever', 'To group reusable code', 'To delete a variable', 'To create a list'],
        answer: 'To group reusable code',
      }
    }

    return {
      question: 'Which of these is a correct Python variable name?',
      options: ['2score', 'student-name', 'student_name', 'for'],
      answer: 'student_name',
    }
  }

  const createMathQuiz = () => {
    const topicName = topic.trim() || 'algebra'

    if (topicName.toLowerCase().includes('percent')) {
      return {
        question: 'What is 25% of 80?',
        options: ['10', '20', '25', '40'],
        answer: '20',
      }
    }

    if (topicName.toLowerCase().includes('prob')) {
      return {
        question: 'If a fair coin is flipped once, what is the probability of heads?',
        options: ['0.25', '0.5', '0.75', '1'],
        answer: '0.5',
      }
    }

    return {
      question: 'Solve for x: 2x + 6 = 14',
      options: ['x = 2', 'x = 3', 'x = 4', 'x = 5'],
      answer: 'x = 4',
    }
  }

  const createComputerQuiz = () => {
    const topicName = topic.trim() || 'cpu'

    if (topicName.toLowerCase().includes('ram')) {
      return {
        question: 'What is RAM mainly used for?',
        options: ['Storing data permanently', 'Running active programs temporarily', 'Sending internet traffic', 'Printing documents'],
        answer: 'Running active programs temporarily',
      }
    }

    if (topicName.toLowerCase().includes('network')) {
      return {
        question: 'What does a network let computers do?',
        options: ['Only download files', 'Communicate and share resources', 'Replace the CPU', 'Store files forever'],
        answer: 'Communicate and share resources',
      }
    }

    return {
      question: 'Which part of a computer is often called the brain of the system?',
      options: ['Hard drive', 'CPU', 'Monitor', 'Keyboard'],
      answer: 'CPU',
    }
  }

  const createQuizQuestion = () => {
    if (selectedSubject === 'Python') return createPythonQuiz()
    if (selectedSubject === 'Mathematics') return createMathQuiz()
    return createComputerQuiz()
  }

  const sendTutorQuestion = async (messageText) => {
    const text = messageText.trim()

    if (!text) {
      return
    }

    setChat((currentChat) => [...currentChat, { role: 'user', text }])
    setStudentInput('')
    setIsTyping(true)

    try {
      const response = await fetch('/api/ask-tutor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: text }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.error || 'Unable to get an answer right now.')
      }

      setChat((currentChat) => [...currentChat, { role: 'ai', text: data.answer || 'I am here to help.' }])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong while contacting the tutor.'
      setChat((currentChat) => [...currentChat, { role: 'ai', text: `Sorry, I couldn’t answer that right now. ${errorMessage}` }])
    } finally {
      setIsTyping(false)
    }
  }

  const handleQuickPrompt = (action) => {
    const actionMessage = (() => {
      if (action === 'explain') return `Explain ${topic.trim() || 'this topic'} simply`
      if (action === 'example') return `Give me an example for ${topic.trim() || 'this topic'}`
      if (action === 'quiz') return 'Quiz me'
      return `Summarize ${topic.trim() || 'this topic'}`
    })()

    const context = {
      subject: normalizeSubject(actionMessage),
      topic: parseTopicFromMessage(actionMessage),
    }

    setSelectedSubject(context.subject)
    setTopic(context.topic)
    sendTutorQuestion(actionMessage)
  }

  const handleSendMessage = (messageText = studentInput) => {
    const text = messageText.trim()

    if (!text) {
      return
    }

    sendTutorQuestion(text)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AI Tutor</p>
          <h2>AI Tutor</h2>
          <p className="page-header-subtitle">Ask anything about your studies.</p>
        </div>
      </header>

      <section className="panel tutor-panel">
        <div className="tutor-controls">
          <label>
            <span>Subject</span>
            <select value={selectedSubject} onChange={(event) => setSelectedSubject(event.target.value)}>
              <option value="Python">Python</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Computer Fundamentals">Computer Fundamentals</option>
            </select>
          </label>

          <label>
            <span>Topic</span>
            <input
              type="text"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="Enter a topic"
            />
          </label>
        </div>

        <div className="quick-prompts">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="quick-prompt"
              onClick={() => {
                const actionMap = {
                  'Explain simply': 'explain',
                  'Give an example': 'example',
                  'Quiz me': 'quiz',
                  Summarize: 'summarize',
                }

                handleQuickPrompt(actionMap[prompt])
              }}
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="chat-window" aria-live="polite">
          {chat.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
              {message.role === 'ai' && <span className="chat-label">AI Tutor</span>}
              <div className={`chat-bubble ${message.role}`}>{message.text}</div>
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
            placeholder="Ask the tutor a question..."
          />
          <button type="button" className="action-button primary" onClick={() => handleSendMessage()}>
            Send
          </button>
        </div>
      </section>
    </div>
  )
}

function SubjectsPage() {
  const [subjects, setSubjects] = useState(subjectData)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newSubject, setNewSubject] = useState({ name: '', description: '' })

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(searchTerm.trim().toLowerCase()),
  )

  const handleAddSubject = () => {
    const trimmedName = newSubject.name.trim()
    const trimmedDescription = newSubject.description.trim()

    if (!trimmedName) {
      return
    }

    const subjectTemplate = {
      name: trimmedName,
      progress: 0,
      completedTopics: 0,
      totalTopics: 10,
      studyTime: '0 hrs',
      nextTopic: 'Get started',
      description: trimmedDescription || 'A new learning path to explore.',
      accent: 'python',
      topics: Array.from({ length: 5 }, (_, index) => ({
        name: `Topic ${index + 1}`,
        completed: false,
      })),
    }

    setSubjects((currentSubjects) => [subjectTemplate, ...currentSubjects])
    setNewSubject({ name: '', description: '' })
    setShowAddModal(false)
  }

  const completedTopics = selectedSubject ? selectedSubject.topics.filter((topic) => topic.completed).length : 0

  return (
    <div className="page-shell subjects-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">My Subjects</p>
          <h2>My Subjects</h2>
          <p className="page-header-subtitle">Track your learning across every subject.</p>
        </div>
      </header>

      <div className="subjects-toolbar">
        <div className="search-box">
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search subjects..."
          />
        </div>

        <button type="button" className="action-button primary" onClick={() => setShowAddModal(true)}>
          Add Subject
        </button>
      </div>

      {!selectedSubject ? (
        <div className="subjects-grid">
          {filteredSubjects.length > 0 ? (
            filteredSubjects.map((subject) => (
              <article key={subject.name} className="panel subject-page-card">
                <div className="subject-card-header">
                  <div>
                    <p className="subject-label">{subject.name}</p>
                    <h3>{subject.progress}%</h3>
                  </div>
                  <span className={`subject-chip ${subject.accent}`}>{subject.completedTopics}/{subject.totalTopics} topics</span>
                </div>

                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${subject.progress}%` }} />
                </div>

                <div className="subject-meta-list">
                  <div>
                    <span>Study time</span>
                    <strong>{subject.studyTime}</strong>
                  </div>
                  <div>
                    <span>Next topic</span>
                    <strong>{subject.nextTopic}</strong>
                  </div>
                </div>

                <p className="subject-description">{subject.description}</p>

                <button type="button" className="action-button primary full-width" onClick={() => setSelectedSubject(subject)}>
                  Continue Studying
                </button>
              </article>
            ))
          ) : (
            <div className="panel subject-empty-state">
              <p>No subjects match your search.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="panel subject-detail-panel">
          <div className="subject-detail-hero">
            <div>
              <p className="eyebrow">Subject overview</p>
              <h3>{selectedSubject.name}</h3>
            </div>
            <span className={`subject-chip ${selectedSubject.accent}`}>{selectedSubject.progress}% complete</span>
          </div>

          <div className="subject-detail-grid">
            <div className="subject-detail-stats">
              <div className="detail-stat-card">
                <span>Progress</span>
                <strong>{selectedSubject.progress}%</strong>
              </div>
              <div className="detail-stat-card">
                <span>Completed</span>
                <strong>{completedTopics}/{selectedSubject.totalTopics}</strong>
              </div>
              <div className="detail-stat-card">
                <span>Study time</span>
                <strong>{selectedSubject.studyTime}</strong>
              </div>
            </div>

            <div className="subject-progress-block">
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${selectedSubject.progress}%` }} />
              </div>
              <p>{selectedSubject.description}</p>
            </div>
          </div>

          <div className="subject-topic-panel">
            <div className="topic-panel-header">
              <h4>Topics</h4>
              <span>{completedTopics} completed</span>
            </div>

            <ul className="topic-list">
              {selectedSubject.topics.map((topic) => (
                <li key={topic.name} className={`topic-item ${topic.completed ? 'completed' : 'remaining'}`}>
                  <span className="topic-check">{topic.completed ? '✓' : '•'}</span>
                  <span>{topic.name}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="detail-actions">
            <button type="button" className="action-button primary">
              Start Study Session
            </button>
            <button type="button" className="action-button secondary" onClick={() => setSelectedSubject(null)}>
              Back to Subjects
            </button>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="panel subject-modal" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading compact">
              <p className="eyebrow">Add Subject</p>
              <h3>New learning track</h3>
            </div>

            <div className="subject-form">
              <label>
                <span>Subject name</span>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(event) => setNewSubject((currentState) => ({ ...currentState, name: event.target.value }))}
                  placeholder="e.g. Biology"
                />
              </label>

              <label>
                <span>Description</span>
                <textarea
                  rows="4"
                  value={newSubject.description}
                  onChange={(event) => setNewSubject((currentState) => ({ ...currentState, description: event.target.value }))}
                  placeholder="Describe this subject..."
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="action-button secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="button" className="action-button primary" onClick={handleAddSubject}>
                  Add Subject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlannerPage() {
  const [planner, setPlanner] = useState(initialPlanner)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [newSession, setNewSession] = useState({
    day: 'Monday',
    subject: 'Python',
    topic: 'Loops',
    duration: '45',
  })

  const formatDuration = (minutes) => {
    if (!minutes) {
      return '0 min'
    }

    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hrs && mins) {
      return `${hrs} hr ${mins} min`
    }

    if (hrs) {
      return `${hrs} hr`
    }

    return `${mins} min`
  }

  const allSessions = plannerDays.flatMap((day) => planner[day].map((session) => ({ ...session, day })))

  const totalMinutes = allSessions.reduce((sum, session) => sum + Number(session.duration), 0)
  const totalHours = totalMinutes / 60

  const subjectCounts = allSessions.reduce((counts, session) => {
    const key = session.subject
    counts[key] = (counts[key] || 0) + Number(session.duration)
    return counts
  }, {})

  const mostStudiedSubject = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]

  const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const currentDay = plannerDays.includes(todayName) ? todayName : 'Monday'
  const todaySessions = planner[currentDay] || []
  const todayMinutes = todaySessions.reduce((sum, session) => sum + Number(session.duration), 0)

  const openSessionForm = () => {
    setShowSessionForm(true)
  }

  const closeSessionForm = () => {
    setShowSessionForm(false)
    setNewSession({
      day: currentDay,
      subject: 'Python',
      topic: 'Loops',
      duration: '45',
    })
  }

  const handleAddSession = () => {
    const trimmedTopic = newSession.topic.trim()
    const durationValue = Number(newSession.duration)

    if (!newSession.day || !newSession.subject || !trimmedTopic || !durationValue || Number.isNaN(durationValue) || durationValue <= 0) {
      return
    }

    setPlanner((currentPlanner) => ({
      ...currentPlanner,
      [newSession.day]: [
        ...currentPlanner[newSession.day],
        {
          id: Date.now(),
          subject: newSession.subject,
          topic: trimmedTopic,
          duration: durationValue,
        },
      ],
    }))

    closeSessionForm()
  }

  const handleDeleteSession = (day, sessionId) => {
    setPlanner((currentPlanner) => ({
      ...currentPlanner,
      [day]: currentPlanner[day].filter((session) => session.id !== sessionId),
    }))
  }

  return (
    <div className="page-shell planner-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Study Planner</p>
          <h2>Study Planner</h2>
          <p className="page-header-subtitle">Plan your week and stay consistent.</p>
        </div>
      </header>

      <section className="panel planner-summary-grid">
        <div className="summary-card accent">
          <span>Total planned study hours</span>
          <strong>{totalHours.toFixed(1)} hrs</strong>
        </div>
        <div className="summary-card">
          <span>Number of sessions</span>
          <strong>{allSessions.length}</strong>
        </div>
        <div className="summary-card">
          <span>Most studied subject</span>
          <strong>{mostStudiedSubject ? mostStudiedSubject[0] : 'N/A'}</strong>
        </div>
      </section>

      <section className="panel todays-focus-card">
        <div className="panel-heading compact">
          <p className="eyebrow">Today&apos;s Focus</p>
        </div>

        <div className="focus-header">
          <div>
            <h3>{currentDay}</h3>
            <p>{todaySessions.length} scheduled session{todaySessions.length === 1 ? '' : 's'}</p>
          </div>
          <span className="focus-total">{formatDuration(todayMinutes)}</span>
        </div>

        {todaySessions.length > 0 ? (
          <ul className="focus-list">
            {todaySessions.map((session) => (
              <li key={session.id}>
                <div>
                  <strong>{session.subject}</strong>
                  <span>{session.topic}</span>
                </div>
                <em>{formatDuration(session.duration)}</em>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">No study sessions planned for today.</p>
        )}
      </section>

      <section className="panel planner-form">
        <div className="planner-form-header">
          <div>
            <p className="eyebrow">Weekly plan</p>
            <h3>Study sessions</h3>
          </div>
          <button type="button" className="action-button primary" onClick={openSessionForm}>
            Add Study Session
          </button>
        </div>
      </section>

      <div className="planner-grid">
        {plannerDays.map((day) => (
          <div key={day} className="panel planner-day-card">
            <div className="day-header-row">
              <h3>{day}</h3>
              <span>{planner[day].length} sessions</span>
            </div>

            {planner[day].length > 0 ? (
              <div className="session-list">
                {planner[day].map((session) => (
                  <div key={session.id} className="session-card">
                    <div className="session-header">
                      <span className="session-subject">{session.subject}</span>
                      <button type="button" className="delete-session" onClick={() => handleDeleteSession(day, session.id)}>
                        Delete
                      </button>
                    </div>

                    <p className="session-topic">{session.topic}</p>
                    <span className="session-duration">{formatDuration(session.duration)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No study blocks yet</p>
            )}
          </div>
        ))}
      </div>

      {showSessionForm && (
        <div className="modal-overlay" onClick={closeSessionForm}>
          <div className="session-modal panel" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading compact">
              <p className="eyebrow">Add study session</p>
              <h3>New session</h3>
            </div>

            <div className="session-form">
              <label>
                <span>Day</span>
                <select
                  value={newSession.day}
                  onChange={(event) => setNewSession((currentState) => ({ ...currentState, day: event.target.value }))}
                >
                  {plannerDays.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>Subject</span>
                <select
                  value={newSession.subject}
                  onChange={(event) => setNewSession((currentState) => ({ ...currentState, subject: event.target.value }))}
                >
                  <option value="Python">Python</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Computer Fundamentals">Computer Fundamentals</option>
                  <option value="Weekly Revision">Weekly Revision</option>
                </select>
              </label>

              <label>
                <span>Topic</span>
                <input
                  type="text"
                  value={newSession.topic}
                  onChange={(event) => setNewSession((currentState) => ({ ...currentState, topic: event.target.value }))}
                  placeholder="e.g. Loops"
                />
              </label>

              <label>
                <span>Duration (minutes)</span>
                <input
                  type="number"
                  min="15"
                  step="15"
                  value={newSession.duration}
                  onChange={(event) => setNewSession((currentState) => ({ ...currentState, duration: event.target.value }))}
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="action-button secondary" onClick={closeSessionForm}>
                  Cancel
                </button>
                <button type="button" className="action-button primary" onClick={handleAddSession}>
                  Add Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuizPage({ onNavigate }) {
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const totalQuestions = pythonQuizQuestions.length
  const question = pythonQuizQuestions[questionIndex]
  const progressPercent = ((questionIndex + (submitted ? 1 : 0)) / totalQuestions) * 100
  const isCorrect = selectedAnswer === question.correctAnswer

  const handleSubmit = () => {
    if (!selectedAnswer || submitted) {
      return
    }

    if (selectedAnswer === question.correctAnswer) {
      setScore((currentScore) => currentScore + 1)
    }

    setSubmitted(true)
  }

  const handleNext = () => {
    if (!submitted) {
      return
    }

    if (questionIndex === totalQuestions - 1) {
      setShowResult(true)
      return
    }

    setQuestionIndex((currentIndex) => currentIndex + 1)
    setSelectedAnswer('')
    setSubmitted(false)
  }

  const restartQuiz = () => {
    setQuestionIndex(0)
    setScore(0)
    setSelectedAnswer('')
    setSubmitted(false)
    setShowResult(false)
  }

  const percentage = Math.round((score / totalQuestions) * 100)
  const motivationalMessage =
    percentage >= 80
      ? 'Excellent work! You have a strong grasp of the basics.'
      : percentage >= 60
        ? 'Nice job! A little more practice will make you even stronger.'
        : percentage >= 40
          ? 'Good effort! Review the explanations and try again.'
          : 'Keep going! Each question is a step toward better understanding.'

  if (showResult) {
    return (
      <div className="page-shell">
        <header className="page-header">
          <div>
            <p className="eyebrow">AI Quiz</p>
            <h2>Quiz complete</h2>
          </div>
        </header>

        <section className="panel result-panel">
          <div className="result-score-ring">
            <span>{score}/{totalQuestions}</span>
          </div>

          <h3>{score} / {totalQuestions}</h3>
          <p className="result-percentage">{percentage}% accuracy</p>
          <p className="result-message">{motivationalMessage}</p>

          <div className="result-actions">
            <button type="button" className="action-button primary" onClick={restartQuiz}>
              Restart Quiz
            </button>
            <button type="button" className="action-button secondary" onClick={() => onNavigate('Dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">AI Quiz</p>
          <h2>AI Quiz</h2>
          <p className="page-header-subtitle">Test your knowledge and track your progress.</p>
        </div>
      </header>

      <section className="panel quiz-panel">
        <div className="quiz-header-row">
          <div>
            <p className="quiz-subject-label">Selected subject</p>
            <strong>Python</strong>
          </div>
          <div className="quiz-score-box">Score: {score}</div>
        </div>

        <div className="quiz-progress-wrapper" aria-label="Quiz progress">
          <div className="quiz-progress-track">
            <div className="quiz-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="quiz-meta-row">
          <span>
            Question {questionIndex + 1} of {totalQuestions}
          </span>
          <span>{Math.round(progressPercent)}% complete</span>
        </div>

        <h3>{question.question}</h3>

        <div className="options-list">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option
            const isCorrectOption = submitted && option === question.correctAnswer
            const isIncorrectOption = submitted && isSelected && option !== question.correctAnswer

            return (
              <button
                key={option}
                type="button"
                className={[
                  'option-button',
                  isSelected ? 'selected' : '',
                  isCorrectOption ? 'correct' : '',
                  isIncorrectOption ? 'incorrect' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => !submitted && setSelectedAnswer(option)}
                disabled={submitted}
              >
                {option}
              </button>
            )
          })}
        </div>

        {submitted && (
          <div className={`quiz-feedback ${isCorrect ? 'success' : 'error'}`}>
            <strong>{isCorrect ? 'Correct!' : 'Incorrect.'}</strong>
            <p>{question.explanation}</p>
          </div>
        )}

        <div className="quiz-actions">
          {!submitted ? (
            <button type="button" className="action-button primary" onClick={handleSubmit} disabled={!selectedAnswer}>
              Submit Answer
            </button>
          ) : (
            <button type="button" className="action-button primary" onClick={handleNext}>
              {questionIndex === totalQuestions - 1 ? 'View Result' : 'Next Question'}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}

function WeeklyStudyChart() {
  const maxHours = 3

  return (
    <div className="weekly-chart" aria-label="Weekly study activity chart">
      {weeklyStudyData.map(({ day, hours }) => (
        <div key={day} className="chart-column">
          <div className="chart-bar-wrap">
            <span className="chart-value">{hours}h</span>
            <div className="chart-bar" style={{ height: `${(hours / maxHours) * 100}%` }} />
          </div>
          <span className="chart-day">{day.slice(0, 3)}</span>
        </div>
      ))}
    </div>
  )
}

function ProgressPage() {
  const insightText =
    'You are strongest in Python. Increasing Mathematics practice by 30 minutes per day could improve your overall progress.'

  return (
    <div className="page-shell progress-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Progress</p>
          <h2>Your Progress</h2>
          <p className="page-header-subtitle">See how your study habits are improving over time.</p>
        </div>
      </header>

      <section className="stats-grid analytics-grid" aria-label="Progress overview cards">
        <ProgressOverviewCard label="Overall Progress" value="68%" detail="This week" />
        <ProgressOverviewCard label="Quiz Average" value="76%" detail="Strong performance" />
        <ProgressOverviewCard label="Study Streak" value="5 days" detail="Keep it going" />
        <ProgressOverviewCard label="Total Study Time" value="14.5 hrs" detail="Across all subjects" />
      </section>

      <div className="progress-content-grid">
        <section className="panel progress-panel">
          <div className="panel-heading compact">
            <p className="eyebrow">Weekly study activity</p>
          </div>

          <WeeklyStudyChart />
        </section>

        <section className="panel progress-panel">
          <div className="panel-heading compact">
            <p className="eyebrow">Subject progress</p>
          </div>

          {subjectData.map((subject) => (
            <div key={subject.name} className="subject-item">
              <div className="subject-row">
                <span>{subject.name}</span>
                <strong>{subject.progress}%</strong>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${subject.progress}%` }} />
              </div>
            </div>
          ))}
        </section>
      </div>

      <section className="panel achievement-panel">
        <div className="panel-heading compact">
          <p className="eyebrow">Achievements</p>
        </div>

        <div className="achievement-grid">
          {achievementCards.map((achievement) => (
            <div key={achievement.title} className="achievement-card">
              <div className="achievement-icon">{achievement.icon}</div>
              <div>
                <h3>{achievement.title}</h3>
                <p>{achievement.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="panel insight-panel">
        <div className="panel-heading compact">
          <p className="eyebrow">Learning insights</p>
        </div>

        <div className="insight-card">
          <span className="insight-badge">AI Insight</span>
          <p>{insightText}</p>
        </div>
      </section>
    </div>
  )
}

function SettingsSection({ title, children }) {
  return (
    <section className="panel settings-panel">
      <div className="settings-section-header">
        <p className="eyebrow">{title}</p>
      </div>
      {children}
    </section>
  )
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <span className={`switch ${checked ? 'on' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span className="switch-slider" />
      </span>
    </label>
  )
}

function SettingsPage({ settings, setSettings, onSave }) {
  const [saveMessage, setSaveMessage] = useState('')

  const handleChange = (field, value) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }))
  }

  const handleSave = () => {
    onSave(settings)
    setSaveMessage('Settings saved successfully')
  }

  return (
    <div className="page-shell settings-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Settings</h2>
          <p className="page-header-subtitle">Customize your StudyMate AI experience.</p>
        </div>
      </header>

      <SettingsSection title="Profile">
        <div className="profile-card">
          <div className="profile-avatar">AC</div>

          <div className="profile-details">
            <div className="profile-row">
              <span>Student Name</span>
              <strong>{settings.studentName}</strong>
            </div>
            <div className="profile-row">
              <span>Level</span>
              <strong>{settings.level}</strong>
            </div>
            <div className="profile-row">
              <span>Email</span>
              <strong>{settings.email}</strong>
            </div>
          </div>

          <button type="button" className="action-button secondary edit-button">
            Edit Profile
          </button>
        </div>
      </SettingsSection>

      <SettingsSection title="Study Preferences">
        <div className="settings-form-grid">
          <label>
            <span>Daily Study Goal</span>
            <select value={settings.dailyGoal} onChange={(event) => handleChange('dailyGoal', event.target.value)}>
              <option value="1h">1h</option>
              <option value="2h">2h</option>
              <option value="3h">3h</option>
              <option value="4h">4h</option>
              <option value="5h">5h</option>
            </select>
          </label>

          <label>
            <span>Preferred Study Time</span>
            <select value={settings.preferredStudyTime} onChange={(event) => handleChange('preferredStudyTime', event.target.value)}>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Evening">Evening</option>
            </select>
          </label>

          <label className="full-span">
            <span>Weekly Study Target</span>
            <input
              type="text"
              value={settings.weeklyStudyTarget}
              onChange={(event) => handleChange('weeklyStudyTarget', event.target.value)}
            />
          </label>
        </div>
      </SettingsSection>

      <SettingsSection title="Notifications">
        <div className="settings-toggle-list">
          <ToggleRow
            label="Study reminders"
            checked={settings.studyReminders}
            onChange={(value) => handleChange('studyReminders', value)}
          />
          <ToggleRow
            label="Quiz reminders"
            checked={settings.quizReminders}
            onChange={(value) => handleChange('quizReminders', value)}
          />
          <ToggleRow
            label="Weekly progress report"
            checked={settings.weeklyProgressReport}
            onChange={(value) => handleChange('weeklyProgressReport', value)}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Appearance">
        <div className="settings-toggle-list">
          <ToggleRow
            label="Dark Mode"
            checked={settings.darkMode}
            onChange={(value) => handleChange('darkMode', value)}
          />
          <ToggleRow
            label="Compact Dashboard"
            checked={settings.compactDashboard}
            onChange={(value) => handleChange('compactDashboard', value)}
          />
        </div>
      </SettingsSection>

      <div className="settings-footer">
        <button type="button" className="action-button primary" onClick={handleSave}>
          Save Changes
        </button>
        {saveMessage && <p className="save-message">{saveMessage}</p>}
      </div>
    </div>
  )
}

function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <button type="button" className="brand-button" onClick={() => setActivePage('Dashboard')}>
        <div className="brand-block">
          <div className="brand-mark">S</div>
          <div>
            <p className="brand-name">StudyMate AI</p>
            <span className="brand-tag">Learning hub</span>
          </div>
        </div>
      </button>

      <nav className="sidebar-nav" aria-label="Sidebar navigation">
        {sidebarItems.map((item) => (
          <button
            key={item}
            type="button"
            className={`nav-item ${activePage === item ? 'active' : ''}`}
            onClick={() => setActivePage(item)}
          >
            <span className="nav-dot" />
            {item}
          </button>
        ))}
      </nav>

      <div className="sidebar-card">
        <p className="sidebar-card-label">Focus mode</p>
        <h3>Deep work</h3>
        <span>Next session: 45 min</span>
      </div>
    </aside>
  )
}

function App() {
  const [activePage, setActivePage] = useState('Dashboard')
  const [settings, setSettings] = useState(defaultSettings)

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return <DashboardPage />
      case 'My Subjects':
        return <SubjectsPage />
      case 'AI Tutor':
        return <TutorPage />
      case 'Study Planner':
        return <PlannerPage />
      case 'Quiz':
        return <QuizPage onNavigate={setActivePage} />
      case 'Progress':
        return <ProgressPage />
      case 'Settings':
        return <SettingsPage settings={settings} setSettings={setSettings} onSave={setSettings} />
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className={`study-app ${settings.darkMode ? 'theme-dark' : 'theme-light'} ${settings.compactDashboard ? 'compact-dashboard' : ''}`}>
      <Sidebar activePage={activePage} setActivePage={setActivePage} />
      <main className="dashboard">{renderPage()}</main>
    </div>
  )
}

export default App
