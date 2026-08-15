import { useEffect, useState } from 'react'
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

const initialDashboardStats = [
  { label: 'Overall Progress', value: '68%', detail: 'This week' },
  { label: 'Quiz Average', value: '76%', detail: '+8% vs last month' },
  { label: 'Study Time', value: '14.5 hrs', detail: 'Across 3 subjects' },
  { label: 'Study Streak', value: '5 days', detail: 'Current streak' },
]

const initialDashboardActivities = [
  { title: 'Completed Python loops recap', time: '2h ago', accent: 'learning' },
  { title: 'Scored 88% on logic quiz', time: '5h ago', accent: 'quiz' },
  { title: 'Updated weekly study plan', time: 'Yesterday', accent: 'schedule' },
  { title: 'Reviewed recursion exercises', time: '2 days ago', accent: 'focus' },
]

const dashboardMissions = [
  'Complete Unit 2',
  'Revise Python basics',
  'Take a 10-question quiz',
]

const SUBJECTS_STORAGE_KEY = 'studymate_subjects'

const clampProgress = (value) => {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return 0
  }

  return Math.min(100, Math.max(0, numericValue))
}

const createTopic = (name, completed = false) => ({
  id: `topic-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
  name,
  completed,
})

const calculateTopicProgress = (topics = []) => {
  if (!Array.isArray(topics) || topics.length === 0) {
    return 0
  }

  const completedCount = topics.filter((topic) => topic?.completed).length
  return Math.round((completedCount / topics.length) * 100)
}

const getSubjectStatus = (subject) => {
  const progress = typeof subject?.progress === 'number' ? subject.progress : 0

  if (progress === 0) return 'Not Started'
  if (progress === 100) return 'Completed'
  return 'In Progress'
}

const normalizeStoredSubjects = (storedSubjects) => {
  if (!Array.isArray(storedSubjects) || storedSubjects.length === 0) {
    return []
  }

  return storedSubjects.map((subject, index) => {
    const topics = Array.isArray(subject?.topics)
      ? subject.topics
          .map((topic, topicIndex) => ({
            id: topic?.id || `topic-${subject.id || index}-${topicIndex}`,
            name: String(topic?.name || '').trim() || `Topic ${topicIndex + 1}`,
            completed: Boolean(topic?.completed),
          }))
          .filter((topic) => topic.name)
      : []

    const fallbackProgress = topics.length > 0 ? calculateTopicProgress(topics) : clampProgress(subject?.progress)

    return {
      id: subject?.id || `subject-${Date.now()}-${index}`,
      name: String(subject?.name || '').trim() || `Subject ${index + 1}`,
      description: String(subject?.description || 'A focused learning path for better study habits.'),
      progress: clampProgress(fallbackProgress),
      target: clampProgress(Number(subject?.target ?? 80)),
      topics,
      createdAt: subject?.createdAt || new Date().toISOString(),
    }
  })
}

const buildDefaultSubjects = () => [
  {
    id: 'subject-python',
    name: 'Python',
    description: 'Build practical coding confidence with Python basics, logic, and real exercises.',
    progress: 80,
    target: 85,
    topics: [
      { id: 'python-variables', name: 'Variables', completed: true },
      { id: 'python-loops', name: 'Loops', completed: true },
      { id: 'python-lists', name: 'Lists', completed: true },
      { id: 'python-dictionaries', name: 'Dictionaries', completed: true },
      { id: 'python-functions', name: 'Functions', completed: true },
      { id: 'python-conditionals', name: 'Conditionals', completed: true },
      { id: 'python-recursion', name: 'Recursion', completed: true },
      { id: 'python-file-handling', name: 'File Handling', completed: true },
      { id: 'python-modules', name: 'Modules', completed: false },
      { id: 'python-project', name: 'Practice Project', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'subject-mathematics',
    name: 'Mathematics',
    description: 'Strengthen problem-solving and formula-based reasoning across core math topics.',
    progress: 60,
    target: 75,
    topics: [
      { id: 'math-fractions', name: 'Fractions', completed: true },
      { id: 'math-algebra', name: 'Algebra Basics', completed: true },
      { id: 'math-equations', name: 'Equations', completed: true },
      { id: 'math-percentages', name: 'Percentages', completed: true },
      { id: 'math-ratios', name: 'Ratios', completed: true },
      { id: 'math-probability', name: 'Probability', completed: true },
      { id: 'math-graphs', name: 'Graphs', completed: false },
      { id: 'math-statistics', name: 'Statistics', completed: false },
      { id: 'math-calculus', name: 'Calculus Basics', completed: false },
      { id: 'math-revision', name: 'Revision Sprint', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: 'subject-computer-fundamentals',
    name: 'Computer Fundamentals',
    description: 'Understand the core systems, hardware, and digital foundations behind modern computing.',
    progress: 70,
    target: 80,
    topics: [
      { id: 'computer-components', name: 'Computer Components', completed: true },
      { id: 'computer-cpu', name: 'CPU', completed: true },
      { id: 'computer-ram', name: 'RAM & Storage', completed: true },
      { id: 'computer-os', name: 'Operating Systems', completed: true },
      { id: 'computer-hardware', name: 'Hardware Basics', completed: true },
      { id: 'computer-io', name: 'Input/Output', completed: true },
      { id: 'computer-networking', name: 'Networking', completed: true },
      { id: 'computer-internet', name: 'Internet Basics', completed: false },
      { id: 'computer-security', name: 'Security Essentials', completed: false },
      { id: 'computer-database', name: 'Database Basics', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
]

const parseTopicsText = (value) => {
  if (!value || typeof value !== 'string') {
    return []
  }

  return value
    .split(/[\n,]+/)
    .map((topic) => topic.trim())
    .filter(Boolean)
    .map((name) => createTopic(name, false))
}

const quickPrompts = ['Explain simply', 'Give an example', 'Quiz me', 'Summarize']

const plannerDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const STUDY_PLANNER_STORAGE_KEY = 'studymate-planner-data'

const toInputDateValue = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDays = (date, amount) => {
  const nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + amount)
  return nextDate
}

const getTodayDate = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

const getPlannerSummary = (plan) => {
  if (!plan || !Array.isArray(plan.tasks) || plan.tasks.length === 0) {
    return {
      totalSessions: 0,
      completedSessions: 0,
      remainingSessions: 0,
      completionPercentage: 0,
      totalMinutes: 0,
      todayTasks: [],
      upcomingTasks: [],
    }
  }

  const todayKey = toInputDateValue(getTodayDate())
  const totalSessions = plan.tasks.length
  const completedSessions = plan.tasks.filter((task) => task.completed).length
  const remainingSessions = totalSessions - completedSessions
  const completionPercentage = totalSessions === 0 ? 0 : Math.round((completedSessions / totalSessions) * 100)
  const totalMinutes = plan.tasks.reduce((sum, task) => sum + Number(task.duration || 0), 0)
  const todayTasks = plan.tasks.filter((task) => task.date === todayKey)
  const upcomingTasks = plan.tasks.filter((task) => task.date > todayKey)

  return {
    totalSessions,
    completedSessions,
    remainingSessions,
    completionPercentage,
    totalMinutes,
    todayTasks,
    upcomingTasks,
  }
}

const formatStudyDuration = (minutes) => {
  if (!minutes) {
    return '0 min'
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours && remainingMinutes) {
    return `${hours} hr ${remainingMinutes} min`
  }

  if (hours) {
    return `${hours} hr`
  }

  return `${remainingMinutes} min`
}

const formatTaskDate = (value) => {
  if (!value) {
    return 'No date'
  }

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const generateStudyPlan = ({ subject, topic, examDate, dailyStudyTime, difficulty }) => {
  const sanitizedSubject = subject.trim()
  const sanitizedTopic = topic.trim()
  const normalizedStudyTime = Number(dailyStudyTime)

  const today = getTodayDate()
  const exam = new Date(`${examDate}T00:00:00`)

  if (!sanitizedSubject || !sanitizedTopic || !examDate || Number.isNaN(normalizedStudyTime) || normalizedStudyTime <= 0) {
    return null
  }

  const differenceInMs = exam.getTime() - today.getTime()
  const daysUntilExam = Math.max(1, Math.ceil(differenceInMs / (1000 * 60 * 60 * 24)))

  const tasks = Array.from({ length: daysUntilExam }, (_, index) => {
    const scheduleDate = addDays(today, index)
    const dateKey = toInputDateValue(scheduleDate)
    let type = 'Learn'

    if (index === daysUntilExam - 1) {
      type = 'Quiz'
    } else if (index >= Math.max(0, daysUntilExam - 3)) {
      type = 'Revision'
    } else if (index % 2 === 1 && difficulty !== 'Easy') {
      type = 'Practice'
    }

    return {
      id: `task-${Date.now()}-${index}`,
      date: dateKey,
      subject: sanitizedSubject,
      topic: sanitizedTopic,
      duration: normalizedStudyTime,
      type,
      completed: false,
    }
  })

  return {
    id: `plan-${Date.now()}`,
    subject: sanitizedSubject,
    topic: sanitizedTopic,
    examDate,
    difficulty,
    createdAt: new Date().toISOString(),
    tasks,
  }
}

const initialPlanner = {
  Monday: [{ id: 1, subject: 'Python', topic: 'Loops', duration: 45 }],
  Tuesday: [{ id: 2, subject: 'Mathematics', topic: 'Algebra', duration: 60 }],
  Wednesday: [{ id: 3, subject: 'Computer Fundamentals', topic: 'CPU & Memory', duration: 45 }],
  Thursday: [{ id: 4, subject: 'Python', topic: 'Functions', duration: 60 }],
  Friday: [{ id: 5, subject: 'Mathematics', topic: 'Probability', duration: 45 }],
  Saturday: [{ id: 6, subject: 'Python', topic: 'Practice Quiz', duration: 60 }],
  Sunday: [{ id: 7, subject: 'Weekly Revision', topic: 'Review & Recap', duration: 90 }],
}

const quizQuestionBank = {
  Python: [
    { id: 1, question: 'Which of the following is a valid variable name in Python?', options: ['2score', 'student-name', 'student_name', 'for'], correctAnswer: 'student_name', explanation: 'Variable names cannot begin with a number, and hyphens are not valid. Underscores are allowed, which makes student_name a correct Python identifier.' },
    { id: 2, question: 'What does a for loop in Python do?', options: ['It defines a function', 'It repeats a block of code a fixed number of times', 'It stores data in a dictionary', 'It prints only one line'], correctAnswer: 'It repeats a block of code a fixed number of times', explanation: 'A for loop is commonly used when you know how many times you want to repeat an action, such as iterating over a list or a range of numbers.' },
    { id: 3, question: 'Which statement creates a Python list?', options: ['numbers = {1, 2, 3}', 'numbers = [1, 2, 3]', 'numbers = (1, 2, 3)', 'numbers = "1, 2, 3"'], correctAnswer: 'numbers = [1, 2, 3]', explanation: 'Square brackets create a list in Python. Lists are ordered and can store multiple values in one variable.' },
    { id: 4, question: 'What is the purpose of a function in Python?', options: ['To permanently delete a variable', 'To group reusable code', 'To compare two values', 'To create a list'], correctAnswer: 'To group reusable code', explanation: 'Functions let you organize code into reusable blocks, which makes programs easier to read, test, and maintain.' },
    { id: 5, question: 'What is the result of this Python condition: age >= 18?', options: ['It always prints a message', 'It checks whether age is greater than or equal to 18', 'It creates a loop', 'It defines a list'], correctAnswer: 'It checks whether age is greater than or equal to 18', explanation: 'An if/else condition evaluates a true or false statement. In this case, it checks whether age is at least 18 before running a block of code.' },
    { id: 6, question: 'Which method converts a value to a string in Python?', options: ['toString()', 'str()', 'parse()', 'convert()'], correctAnswer: 'str()', explanation: 'The str() function converts a value into its string representation.' },
    { id: 7, question: 'What does a dictionary store?', options: ['Only numbers', 'Key-value pairs', 'A sequence of one item', 'Only strings'], correctAnswer: 'Key-value pairs', explanation: 'A dictionary stores data as key-value pairs, which makes values easy to access by name.' },
    { id: 8, question: 'Which of these is a Boolean value in Python?', options: ['"true"', '0', 'True', 'None'], correctAnswer: 'True', explanation: 'Python uses True and False as Boolean values, which are capitalized.' },
    { id: 9, question: 'What is the output of print(2 + 3 * 4)?', options: ['20', '14', '24', '10'], correctAnswer: '14', explanation: 'Python follows order of operations, so multiplication happens before addition.' },
    { id: 10, question: 'Which statement correctly checks if a value is equal to 10?', options: ['if value = 10', 'if value == 10', 'if value === 10', 'if value := 10'], correctAnswer: 'if value == 10', explanation: 'Use == to compare equality in Python; = is assignment.' },
  ],
  Mathematics: [
    { id: 1, question: 'Solve for x: 2x + 6 = 14', options: ['x = 2', 'x = 3', 'x = 4', 'x = 5'], correctAnswer: 'x = 4', explanation: 'Subtract 6 from both sides to get 2x = 8, then divide by 2 to get x = 4.' },
    { id: 2, question: 'What is 25% of 80?', options: ['10', '20', '25', '40'], correctAnswer: '20', explanation: '25% means one quarter, and 80 divided by 4 equals 20.' },
    { id: 3, question: 'What is the value of 3²?', options: ['6', '9', '12', '8'], correctAnswer: '9', explanation: '3² means 3 multiplied by itself, which is 9.' },
    { id: 4, question: 'Which fraction is equivalent to 0.5?', options: ['1/4', '1/2', '2/3', '3/4'], correctAnswer: '1/2', explanation: '0.5 equals one-half, which is 1/2.' },
    { id: 5, question: 'If a fair coin is flipped once, what is the probability of getting heads?', options: ['0.25', '0.5', '0.75', '1'], correctAnswer: '0.5', explanation: 'There are two equally likely outcomes, so the probability of heads is 1/2 or 0.5.' },
    { id: 6, question: 'Simplify: 3x + 2x', options: ['3x', '2x', '5x', '6x'], correctAnswer: '5x', explanation: 'Like terms can be combined: 3x + 2x = 5x.' },
    { id: 7, question: 'What is the perimeter of a rectangle with length 6 and width 4?', options: ['10', '12', '20', '24'], correctAnswer: '20', explanation: 'Perimeter is 2(l + w) = 2(6 + 4) = 20.' },
    { id: 8, question: 'Which angle is a right angle?', options: ['45°', '90°', '120°', '180°'], correctAnswer: '90°', explanation: 'A right angle measures exactly 90 degrees.' },
    { id: 9, question: 'What is the mean of 4, 6, and 8?', options: ['5', '6', '7', '8'], correctAnswer: '6', explanation: 'The mean is the sum divided by the number of values: (4 + 6 + 8) / 3 = 6.' },
    { id: 10, question: 'What is 7 × 8?', options: ['42', '54', '56', '64'], correctAnswer: '56', explanation: '7 times 8 equals 56.' },
  ],
  'Computer Fundamentals': [
    { id: 1, question: 'What does CPU stand for?', options: ['Central Processing Unit', 'Computer Power Utility', 'Central Program Unit', 'Control Processing Utility'], correctAnswer: 'Central Processing Unit', explanation: 'CPU stands for Central Processing Unit, which is the main processor of the computer.' },
    { id: 2, question: 'What is RAM mainly used for?', options: ['Permanent data storage', 'Running active programs temporarily', 'Sending emails', 'Printing documents'], correctAnswer: 'Running active programs temporarily', explanation: 'RAM stores data temporarily while programs and tasks are being actively used.' },
    { id: 3, question: 'Which of these is an operating system?', options: ['Windows', 'Excel', 'Chrome', 'CPU'], correctAnswer: 'Windows', explanation: 'Windows is an operating system that manages hardware and software on a computer.' },
    { id: 4, question: 'What does a network allow computers to do?', options: ['Only store files', 'Communicate and share resources', 'Replace the CPU', 'Turn off the monitor'], correctAnswer: 'Communicate and share resources', explanation: 'Networks connect devices so they can communicate and share data or hardware resources.' },
    { id: 5, question: 'Which storage type is usually non-volatile?', options: ['RAM', 'Cache', 'Hard drive', 'Register'], correctAnswer: 'Hard drive', explanation: 'A hard drive retains data even when the computer is powered off, unlike RAM.' },
    { id: 6, question: 'What is the purpose of an input device?', options: ['To display output', 'To send data into the computer', 'To store software', 'To keep the system cool'], correctAnswer: 'To send data into the computer', explanation: 'Input devices like keyboards and mice allow the user to send information into the system.' },
    { id: 7, question: 'Which of these is an output device?', options: ['Keyboard', 'Monitor', 'Mouse', 'Scanner'], correctAnswer: 'Monitor', explanation: 'A monitor displays information to the user, making it an output device.' },
    { id: 8, question: 'What does the internet rely on for communication?', options: ['Only one device', 'A complex network of connected systems', 'Only USB ports', 'Only printers'], correctAnswer: 'A complex network of connected systems', explanation: 'The internet is a global network of connected computers and systems that exchange information.' },
    { id: 9, question: 'What is a database used for?', options: ['To store and organize large amounts of data', 'To change the CPU speed', 'To remove memory', 'To replace an operating system'], correctAnswer: 'To store and organize large amounts of data', explanation: 'Databases help organize, query, and manage large collections of information efficiently.' },
    { id: 10, question: 'What does BIOS do?', options: ['It stores user files permanently', 'It checks hardware when the computer starts', 'It runs the browser', 'It draws graphics on the screen'], correctAnswer: 'It checks hardware when the computer starts', explanation: 'BIOS initializes and checks basic hardware components during startup before the OS loads.' },
  ],
}

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

function DashboardPage({ stats, activities, subjects = [] }) {
  const liveSubjects = subjects.length > 0 ? subjects : buildDefaultSubjects()

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
        {stats.map((stat) => (
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

            {liveSubjects.slice(0, 3).map((subject) => (
              <div key={subject.id || subject.name} className="subject-item">
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
          {activities.map((item) => (
            <div key={`${item.title}-${item.time}`} className="activity-item">
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

function SubjectsPage({ subjects, setSubjects }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Recently Added')
  const [selectedSubjectId, setSelectedSubjectId] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')
  const [subjectError, setSubjectError] = useState('')
  const [editError, setEditError] = useState('')
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    description: '',
    target: 80,
    progress: 0,
    topics: '',
  })
  const [editForm, setEditForm] = useState(null)

  const selectedSubject = subjects.find((subject) => subject.id === selectedSubjectId) || null

  const filteredSubjects = [...subjects]
    .filter((subject) => {
      const matchesSearch = subject.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
      const currentStatus = getSubjectStatus(subject)
      const matchesFilter =
        statusFilter === 'All' ||
        (statusFilter === 'Not Started' && currentStatus === 'Not Started') ||
        (statusFilter === 'In Progress' && currentStatus === 'In Progress') ||
        (statusFilter === 'Completed' && currentStatus === 'Completed')

      return matchesSearch && matchesFilter
    })
    .sort((left, right) => {
      switch (sortBy) {
        case 'Name A-Z':
          return left.name.localeCompare(right.name)
        case 'Progress High-Low':
          return right.progress - left.progress
        case 'Progress Low-High':
          return left.progress - right.progress
        case 'Recently Added':
        default:
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      }
    })

  const handleAddSubject = () => {
    const trimmedName = subjectForm.name.trim()
    const description = subjectForm.description.trim() || 'A new learning path to explore.'
    const target = Number(subjectForm.target)
    const progress = Number(subjectForm.progress)

    if (!trimmedName) {
      setSubjectError('Subject name cannot be empty.')
      return
    }

    if (!Number.isFinite(target) || target < 0 || target > 100) {
      setSubjectError('Target must be between 0 and 100.')
      return
    }

    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      setSubjectError('Progress must be between 0 and 100.')
      return
    }

    const parsedTopics = parseTopicsText(subjectForm.topics)
    const safeProgress = parsedTopics.length > 0 ? calculateTopicProgress(parsedTopics) : clampProgress(progress)

    const newSubject = {
      id: `subject-${Date.now()}`,
      name: trimmedName,
      description,
      progress: safeProgress,
      target: clampProgress(target),
      topics: parsedTopics,
      createdAt: new Date().toISOString(),
    }

    setSubjects((currentSubjects) => [newSubject, ...currentSubjects])
    setSelectedSubjectId(newSubject.id)
    setShowAddModal(false)
    setSubjectError('')
    setSubjectForm({ name: '', description: '', target: 80, progress: 0, topics: '' })
  }

  const handleSaveEdit = () => {
    if (!editForm || !selectedSubjectId) {
      return
    }

    const trimmedName = editForm.name.trim()
    const target = Number(editForm.target)
    const progress = Number(editForm.progress)

    if (!trimmedName) {
      setEditError('Subject name cannot be empty.')
      return
    }

    if (!Number.isFinite(target) || target < 0 || target > 100) {
      setEditError('Target must be between 0 and 100.')
      return
    }

    if (!Number.isFinite(progress) || progress < 0 || progress > 100) {
      setEditError('Progress must be between 0 and 100.')
      return
    }

    setSubjects((currentSubjects) =>
      currentSubjects.map((subject) => {
        if (subject.id !== selectedSubjectId) {
          return subject
        }

        return {
          ...subject,
          name: trimmedName,
          description: editForm.description.trim() || 'A focused learning path for better study habits.',
          target: clampProgress(target),
          progress: subject.topics.length > 0 ? calculateTopicProgress(subject.topics) : clampProgress(progress),
        }
      }),
    )

    setShowEditModal(false)
    setEditError('')
    setEditForm(null)
  }

  const handleDeleteSubject = (subjectId) => {
    const confirmed = window.confirm('Are you sure you want to delete this subject?')
    if (!confirmed) {
      return
    }

    setSubjects((currentSubjects) => currentSubjects.filter((subject) => subject.id !== subjectId))
    setSelectedSubjectId(null)
    setShowEditModal(false)
    setEditForm(null)
  }

  const handleAddTopic = () => {
    const trimmedName = newTopicName.trim()
    if (!trimmedName || !selectedSubject) {
      return
    }

    setSubjects((currentSubjects) =>
      currentSubjects.map((subject) => {
        if (subject.id !== selectedSubject.id) {
          return subject
        }

        const nextTopics = [...subject.topics, createTopic(trimmedName, false)]
        return {
          ...subject,
          topics: nextTopics,
          progress: calculateTopicProgress(nextTopics),
        }
      }),
    )

    setNewTopicName('')
  }

  const handleToggleTopic = (subjectId, topicId) => {
    setSubjects((currentSubjects) =>
      currentSubjects.map((subject) => {
        if (subject.id !== subjectId) {
          return subject
        }

        const nextTopics = subject.topics.map((topic) =>
          topic.id === topicId ? { ...topic, completed: !topic.completed } : topic,
        )

        return {
          ...subject,
          topics: nextTopics,
          progress: calculateTopicProgress(nextTopics),
        }
      }),
    )
  }

  const handleDeleteTopic = (subjectId, topicId) => {
    setSubjects((currentSubjects) =>
      currentSubjects.map((subject) => {
        if (subject.id !== subjectId) {
          return subject
        }

        const nextTopics = subject.topics.filter((topic) => topic.id !== topicId)
        return {
          ...subject,
          topics: nextTopics,
          progress: nextTopics.length > 0 ? calculateTopicProgress(nextTopics) : clampProgress(subject.progress),
        }
      }),
    )
  }

  const openEditModal = (subject) => {
    setEditForm({
      name: subject.name,
      description: subject.description,
      target: subject.target,
      progress: subject.topics.length > 0 ? calculateTopicProgress(subject.topics) : subject.progress,
    })
    setShowEditModal(true)
  }

  const totalTopics = selectedSubject ? selectedSubject.topics.length : 0
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

        <div className="subjects-controls-row">
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="All">All</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Not Started">Not Started</option>
          </select>

          <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
            <option value="Recently Added">Recently Added</option>
            <option value="Name A-Z">Name A-Z</option>
            <option value="Progress High-Low">Progress High-Low</option>
            <option value="Progress Low-High">Progress Low-High</option>
          </select>

          <button type="button" className="action-button primary" onClick={() => setShowAddModal(true)}>
            Add Subject
          </button>
        </div>
      </div>

      {!selectedSubject ? (
        subjects.length === 0 ? (
          <div className="panel subject-empty-state">
            <p>No subjects yet.</p>
            <span>Add your first subject to start tracking your learning.</span>
          </div>
        ) : filteredSubjects.length > 0 ? (
          <div className="subjects-grid">
            {filteredSubjects.map((subject) => (
              <article key={subject.id} className="panel subject-page-card">
                <div className="subject-card-header">
                  <div>
                    <p className="subject-label">{subject.name}</p>
                    <h3>{subject.progress}%</h3>
                  </div>
                  <span className="subject-chip">{subject.topics.length} topics</span>
                </div>

                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${subject.progress}%` }} />
                </div>

                <div className="subject-meta-list">
                  <div>
                    <span>Completed</span>
                    <strong>{subject.topics.filter((topic) => topic.completed).length}/{subject.topics.length || 0}</strong>
                  </div>
                  <div>
                    <span>Target</span>
                    <strong>{subject.target}%</strong>
                  </div>
                </div>

                <p className="subject-description">{subject.description}</p>

                <div className="subject-card-actions">
                  <button type="button" className="action-button primary full-width" onClick={() => setSelectedSubjectId(subject.id)}>
                    Open Subject
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="panel subject-empty-state">
            <p>No subjects match your search.</p>
          </div>
        )
      ) : (
        <div className="panel subject-detail-panel">
          <div className="subject-detail-hero">
            <div>
              <p className="eyebrow">Subject overview</p>
              <h3>{selectedSubject.name}</h3>
            </div>
            <span className="subject-chip">{selectedSubject.progress}% complete</span>
          </div>

          <div className="subject-detail-grid">
            <div className="subject-detail-stats">
              <div className="detail-stat-card">
                <span>Progress</span>
                <strong>{selectedSubject.progress}%</strong>
              </div>
              <div className="detail-stat-card">
                <span>Completed</span>
                <strong>{completedTopics}/{totalTopics}</strong>
              </div>
              <div className="detail-stat-card">
                <span>Remaining</span>
                <strong>{totalTopics - completedTopics}</strong>
              </div>
              <div className="detail-stat-card">
                <span>Target</span>
                <strong>{selectedSubject.target}%</strong>
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

            <div className="topic-editor">
              <input
                type="text"
                value={newTopicName}
                onChange={(event) => setNewTopicName(event.target.value)}
                placeholder="Add a topic"
              />
              <button type="button" className="action-button primary" onClick={handleAddTopic}>
                Add Topic
              </button>
            </div>

            <ul className="topic-list">
              {selectedSubject.topics.map((topic) => (
                <li key={topic.id} className={`topic-item ${topic.completed ? 'completed' : 'remaining'}`}>
                  <button
                    type="button"
                    className="topic-check-button"
                    onClick={() => handleToggleTopic(selectedSubject.id, topic.id)}
                    aria-label={topic.completed ? `Mark ${topic.name} incomplete` : `Mark ${topic.name} complete`}
                  >
                    {topic.completed ? '✓' : '•'}
                  </button>
                  <span>{topic.name}</span>
                  <button type="button" className="topic-delete-button" onClick={() => handleDeleteTopic(selectedSubject.id, topic.id)}>
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="detail-actions">
            <button type="button" className="action-button primary" onClick={() => openEditModal(selectedSubject)}>
              Edit Subject
            </button>
            <button type="button" className="action-button secondary" onClick={() => handleDeleteSubject(selectedSubject.id)}>
              Delete Subject
            </button>
            <button type="button" className="action-button secondary" onClick={() => setSelectedSubjectId(null)}>
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
                  value={subjectForm.name}
                  onChange={(event) => setSubjectForm((currentState) => ({ ...currentState, name: event.target.value }))}
                  placeholder="e.g. Biology"
                />
              </label>

              <label>
                <span>Description</span>
                <textarea
                  rows="4"
                  value={subjectForm.description}
                  onChange={(event) => setSubjectForm((currentState) => ({ ...currentState, description: event.target.value }))}
                  placeholder="Describe this subject..."
                />
              </label>

              <div className="subject-form-row">
                <label>
                  <span>Target %</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={subjectForm.target}
                    onChange={(event) => setSubjectForm((currentState) => ({ ...currentState, target: event.target.value }))}
                  />
                </label>

                <label>
                  <span>Initial progress %</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={subjectForm.progress}
                    onChange={(event) => setSubjectForm((currentState) => ({ ...currentState, progress: event.target.value }))}
                  />
                </label>
              </div>

              <label>
                <span>Topics</span>
                <textarea
                  rows="4"
                  value={subjectForm.topics}
                  onChange={(event) => setSubjectForm((currentState) => ({ ...currentState, topics: event.target.value }))}
                  placeholder="Topic 1, Topic 2, Topic 3"
                />
              </label>

              {subjectError && <p className="form-validation-message">{subjectError}</p>}

              <div className="modal-actions">
                <button type="button" className="action-button secondary" onClick={() => { setShowAddModal(false); setSubjectError('') }}>
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

      {showEditModal && editForm && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="panel subject-modal" onClick={(event) => event.stopPropagation()}>
            <div className="panel-heading compact">
              <p className="eyebrow">Edit Subject</p>
              <h3>Update learning track</h3>
            </div>

            <div className="subject-form">
              <label>
                <span>Subject name</span>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) => setEditForm((currentState) => ({ ...currentState, name: event.target.value }))}
                />
              </label>

              <label>
                <span>Description</span>
                <textarea
                  rows="4"
                  value={editForm.description}
                  onChange={(event) => setEditForm((currentState) => ({ ...currentState, description: event.target.value }))}
                />
              </label>

              <div className="subject-form-row">
                <label>
                  <span>Target %</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.target}
                    onChange={(event) => setEditForm((currentState) => ({ ...currentState, target: event.target.value }))}
                  />
                </label>

                <label>
                  <span>Progress %</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.progress}
                    onChange={(event) => setEditForm((currentState) => ({ ...currentState, progress: event.target.value }))}
                  />
                </label>
              </div>

              {editError && <p className="form-validation-message">{editError}</p>}

              <div className="modal-actions">
                <button type="button" className="action-button secondary" onClick={() => { setShowEditModal(false); setEditError('') }}>
                  Cancel
                </button>
                <button type="button" className="action-button primary" onClick={handleSaveEdit}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PlannerPage({ planner, setPlanner }) {
  const todayKey = toInputDateValue(getTodayDate())
  const [form, setForm] = useState({
    subject: 'Python',
    topic: '',
    examDate: toInputDateValue(addDays(getTodayDate(), 7)),
    dailyStudyTime: 45,
    difficulty: 'Medium',
  })
  const [validationError, setValidationError] = useState('')

  const summary = getPlannerSummary(planner)
  const todaysTasks = summary.todayTasks
  const upcomingTasks = summary.upcomingTasks

  const handleCreatePlan = () => {
    const subject = form.subject.trim()
    const topic = form.topic.trim()
    const dailyStudyTime = Number(form.dailyStudyTime)
    const examDate = form.examDate

    if (!subject) {
      setValidationError('Subject cannot be empty.')
      return
    }

    if (!topic) {
      setValidationError('Topic cannot be empty.')
      return
    }

    if (!examDate) {
      setValidationError('Exam date is required.')
      return
    }

    const selectedDate = new Date(`${examDate}T00:00:00`)
    const today = getTodayDate()

    if (selectedDate < today) {
      setValidationError('Exam date must be today or a future date.')
      return
    }

    if (!Number.isFinite(dailyStudyTime) || dailyStudyTime <= 0) {
      setValidationError('Daily study time must be greater than 0.')
      return
    }

    const generatedPlan = generateStudyPlan({
      subject,
      topic,
      examDate,
      dailyStudyTime,
      difficulty: form.difficulty,
    })

    if (!generatedPlan) {
      setValidationError('Unable to generate a study plan with the current details.')
      return
    }

    setPlanner(generatedPlan)
    setValidationError('')
  }

  const handleDeletePlan = () => {
    setPlanner(null)
    setValidationError('')
  }

  const handleTaskToggle = (taskId) => {
    setPlanner((currentPlan) => {
      if (!currentPlan) {
        return currentPlan
      }

      return {
        ...currentPlan,
        tasks: currentPlan.tasks.map((task) => {
          if (task.id !== taskId) {
            return task
          }

          return {
            ...task,
            completed: !task.completed,
          }
        }),
      }
    })
  }

  const emptyState = !planner || !Array.isArray(planner.tasks) || planner.tasks.length === 0

  return (
    <div className="page-shell planner-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Study Planner</p>
          <h2>Study Planner</h2>
          <p className="page-header-subtitle">Organize your revision and stay on track for exam day.</p>
        </div>
      </header>

      {!emptyState ? (
        <>
          <section className="panel planner-summary-grid">
            <div className="summary-card accent">
              <span>Total sessions</span>
              <strong>{summary.totalSessions}</strong>
            </div>
            <div className="summary-card">
              <span>Completed</span>
              <strong>{summary.completedSessions}</strong>
            </div>
            <div className="summary-card">
              <span>Remaining</span>
              <strong>{summary.remainingSessions}</strong>
            </div>
          </section>

          <section className="panel planner-progress-panel">
            <div className="planner-progress-header">
              <div>
                <p className="eyebrow">Planner progress</p>
                <h3>{summary.completedSessions} / {summary.totalSessions} sessions completed</h3>
              </div>
              <strong>{summary.completionPercentage}%</strong>
            </div>

            <div className="progress-track planner-progress-track">
              <div className="progress-fill" style={{ width: `${summary.completionPercentage}%` }} />
            </div>
          </section>

          <section className="panel todays-focus-card">
            <div className="panel-heading compact">
              <p className="eyebrow">Today&apos;s Study Plan</p>
            </div>

            <div className="focus-header">
              <div>
                <h3>{formatTaskDate(todayKey)}</h3>
                <p>{todaysTasks.length} task{todaysTasks.length === 1 ? '' : 's'} scheduled</p>
              </div>
              <span className="focus-total">
                {todaysTasks.reduce((sum, task) => sum + Number(task.duration || 0), 0)} min
              </span>
            </div>

            {todaysTasks.length > 0 ? (
              <ul className="focus-list">
                {todaysTasks.map((task) => (
                  <li key={task.id} className={task.completed ? 'task-complete' : ''}>
                    <div>
                      <strong>{task.subject}</strong>
                      <span>{task.topic}</span>
                      <small>{task.type} • {task.duration} min</small>
                    </div>
                    <button type="button" className={`mini-toggle ${task.completed ? 'done' : ''}`} onClick={() => handleTaskToggle(task.id)}>
                      {task.completed ? 'Completed' : 'Mark complete'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">Nothing scheduled for today.</p>
            )}
          </section>

          <div className="planner-action-row">
            <button type="button" className="action-button primary" onClick={() => {
              setPlanner(null)
              setValidationError('')
            }}>
              Delete Plan
            </button>
            <button type="button" className="action-button secondary" onClick={() => {
              setPlanner(null)
              setValidationError('')
            }}>
              Reset Planner Data
            </button>
          </div>

          <section className="panel planner-plan-panel">
            <div className="panel-heading compact">
              <p className="eyebrow">Upcoming plan</p>
            </div>

            {upcomingTasks.length > 0 ? (
              <div className="planner-task-list">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className={`planner-task-item ${task.completed ? 'completed' : ''}`}>
                    <div className="planner-task-main">
                      <span className="planner-day-label">{formatTaskDate(task.date)}</span>
                      <h4>{task.subject} — {task.topic}</h4>
                    </div>
                    <div className="planner-task-meta">
                      <span>{task.duration} min</span>
                      <span>{task.type}</span>
                    </div>
                    <button type="button" className="task-toggle" onClick={() => handleTaskToggle(task.id)}>
                      {task.completed ? 'Completed' : 'Mark complete'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">No upcoming study sessions.</p>
            )}
          </section>

          <section className="panel planner-all-panel">
            <div className="panel-heading compact">
              <p className="eyebrow">Full schedule</p>
            </div>

            <div className="planner-task-list">
              {planner.tasks.map((task) => (
                <div key={task.id} className={`planner-task-item ${task.completed ? 'completed' : ''}`}>
                  <div className="planner-task-main">
                    <span className="planner-day-label">{formatTaskDate(task.date)}</span>
                    <h4>{task.subject} — {task.topic}</h4>
                  </div>
                  <div className="planner-task-meta">
                    <span>{task.duration} min</span>
                    <span>{task.type}</span>
                  </div>
                  <button type="button" className="task-toggle" onClick={() => handleTaskToggle(task.id)}>
                    {task.completed ? 'Completed' : 'Mark complete'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="panel planner-empty-state">
          <div className="planner-empty-card">
            <p className="eyebrow">Study Planner</p>
            <h3>No study plan yet.</h3>
            <p>Create your first study plan to organize your preparation.</p>
          </div>
        </section>
      )}

      <section className="panel planner-form">
        <div className="planner-form-header">
          <div>
            <p className="eyebrow">Planner setup</p>
            <h3>Create study plan</h3>
          </div>
        </div>

        <div className="planner-input-grid">
          <label>
            <span>Subject name</span>
            <input
              type="text"
              value={form.subject}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, subject: event.target.value }))}
              placeholder="e.g. Python"
            />
          </label>

          <label>
            <span>Topic / chapter</span>
            <input
              type="text"
              value={form.topic}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, topic: event.target.value }))}
              placeholder="e.g. Loops"
            />
          </label>

          <label>
            <span>Exam date</span>
            <input
              type="date"
              min={toInputDateValue(getTodayDate())}
              value={form.examDate}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, examDate: event.target.value }))}
            />
          </label>

          <label>
            <span>Daily available study time</span>
            <input
              type="number"
              min="15"
              step="15"
              value={form.dailyStudyTime}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, dailyStudyTime: event.target.value }))}
            />
          </label>

          <label>
            <span>Difficulty</span>
            <select
              value={form.difficulty}
              onChange={(event) => setForm((currentForm) => ({ ...currentForm, difficulty: event.target.value }))}
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </label>
        </div>

        {validationError && <p className="planner-validation-message">{validationError}</p>}

        <div className="planner-form-actions">
          <button type="button" className="action-button primary" onClick={handleCreatePlan}>
            Create Study Plan
          </button>
        </div>
      </section>
    </div>
  )
}

function QuizPage({ onNavigate, onQuizComplete }) {
  const QUIZ_LENGTH = 10
  const QUIZ_DURATION = 10 * 60

  const [setup, setSetup] = useState({ subject: 'Python', questionCount: 10, difficulty: 'Easy' })
  const [isStarted, setIsStarted] = useState(false)
  const [questions, setQuestions] = useState([])
  const [selectedAnswers, setSelectedAnswers] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(QUIZ_DURATION)
  const [result, setResult] = useState(null)

  const totalQuestions = QUIZ_LENGTH
  const currentQuestion = questions[currentIndex]
  const selectedAnswer = selectedAnswers[currentIndex] || ''

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const getPerformanceMessage = (percentage) => {
    if (percentage >= 90) return 'Excellent'
    if (percentage >= 70) return 'Great job'
    if (percentage >= 50) return 'Keep practicing'
    return 'Needs more revision'
  }

  const getRandomQuestions = (subject) => {
    const bank = quizQuestionBank[subject] || []
    const shuffledQuestions = [...bank].sort(() => Math.random() - 0.5)
    return shuffledQuestions.slice(0, totalQuestions).map((question, index) => ({
      ...question,
      id: question.id ?? index + 1,
      options: [...question.options],
    }))
  }

  const finalizeQuiz = (timedOut = false) => {
    if (!questions.length) {
      return
    }

    let correctAnswers = 0
    const review = questions.map((question, index) => {
      const userAnswer = selectedAnswers[index] || 'No answer'
      const isCorrect = userAnswer === question.correctAnswer
      if (isCorrect) {
        correctAnswers += 1
      }

      return {
        ...question,
        userAnswer,
        isCorrect,
      }
    })

    const percentage = Math.round((correctAnswers / questions.length) * 100)
    const usedSeconds = QUIZ_DURATION - timeRemaining

    const resultSummary = {
      subject: setup.subject,
      difficulty: setup.difficulty,
      totalQuestions: questions.length,
      correctAnswers,
      incorrectAnswers: questions.length - correctAnswers,
      score: `${correctAnswers}/${questions.length}`,
      percentage,
      message: getPerformanceMessage(percentage),
      timeUsed: formatTime(Math.max(0, usedSeconds)),
      timedOut,
      review,
    }

    setResult(resultSummary)
    onQuizComplete?.(resultSummary)
  }

  useEffect(() => {
    if (!isStarted || result) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setTimeRemaining((previousTime) => {
        if (previousTime <= 1) {
          window.clearInterval(timer)
          finalizeQuiz(true)
          return 0
        }

        return previousTime - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isStarted, result, questions.length, setup.subject, setup.difficulty])

  const startQuiz = (subject = setup.subject) => {
    const availableQuestions = getRandomQuestions(subject)

    setQuestions(availableQuestions)
    setSelectedAnswers(Array(availableQuestions.length).fill(''))
    setCurrentIndex(0)
    setTimeRemaining(QUIZ_DURATION)
    setResult(null)
    setIsStarted(true)
  }

  const handleQuestionSelect = (answer) => {
    setSelectedAnswers((currentAnswers) => {
      const nextAnswers = [...currentAnswers]
      nextAnswers[currentIndex] = answer
      return nextAnswers
    })
  }

  const handleNext = () => {
    if (!selectedAnswer) {
      return
    }

    if (currentIndex === questions.length - 1) {
      finalizeQuiz(false)
      return
    }

    setCurrentIndex((previousIndex) => previousIndex + 1)
  }

  const restartQuiz = () => {
    startQuiz(setup.subject)
  }

  if (!isStarted && !result) {
    return (
      <div className="page-shell quiz-page-shell">
        <header className="page-header">
          <div>
            <p className="eyebrow">Quiz</p>
            <h2>Quiz</h2>
            <p className="page-header-subtitle">Challenge yourself with an offline practice session.</p>
          </div>
        </header>

        <section className="panel quiz-setup-panel">
          <div className="setup-form-grid">
            <label>
              <span>Choose Subject</span>
              <select value={setup.subject} onChange={(event) => setSetup((currentSetup) => ({ ...currentSetup, subject: event.target.value }))}>
                <option value="Python">Python</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Computer Fundamentals">Computer Fundamentals</option>
              </select>
            </label>

            <label>
              <span>Number of Questions</span>
              <select value={setup.questionCount} onChange={(event) => setSetup((currentSetup) => ({ ...currentSetup, questionCount: 10 }))}>
                <option value={10}>10</option>
              </select>
            </label>

            <label>
              <span>Difficulty</span>
              <select value={setup.difficulty} onChange={(event) => setSetup((currentSetup) => ({ ...currentSetup, difficulty: event.target.value }))}>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </label>
          </div>

          <button type="button" className="action-button primary start-quiz-button" onClick={() => startQuiz()}>
            Start Quiz
          </button>
        </section>
      </div>
    )
  }

  if (result) {
    return (
      <div className="page-shell">
        <header className="page-header">
          <div>
            <p className="eyebrow">Quiz</p>
            <h2>Quiz complete</h2>
          </div>
        </header>

        <section className="panel result-panel">
          <div className="result-score-ring">
            <span>{result.correctAnswers}/{result.totalQuestions}</span>
          </div>

          <h3>Score: {result.correctAnswers} / {result.totalQuestions}</h3>
          <p className="result-percentage">Percentage: {result.percentage}%</p>
          <p className="result-message">{result.message}</p>

          <div className="result-metrics">
            <div>
              <span>Correct Answers</span>
              <strong>{result.correctAnswers}</strong>
            </div>
            <div>
              <span>Incorrect Answers</span>
              <strong>{result.incorrectAnswers}</strong>
            </div>
            <div>
              <span>Time Used</span>
              <strong>{result.timeUsed}</strong>
            </div>
          </div>

          <div className="result-actions">
            <button type="button" className="action-button primary" onClick={restartQuiz}>
              Retake Quiz
            </button>
            <button type="button" className="action-button secondary" onClick={() => onNavigate('Dashboard')}>
              Back to Dashboard
            </button>
          </div>

          <div className="review-panel">
            <div className="panel-heading compact review-header">
              <p className="eyebrow">Review Answers</p>
            </div>

            <div className="review-list">
              {result.review.map((item, index) => (
                <div key={`${item.id ?? item.question}-${index}`} className={`review-item ${item.isCorrect ? 'correct' : 'incorrect'}`}>
                  <p className="review-question">Q{index + 1}. {item.question}</p>
                  <div className="review-answer-row">
                    <span>Your answer:</span>
                    <strong>{item.userAnswer}</strong>
                  </div>
                  <div className="review-answer-row">
                    <span>Correct answer:</span>
                    <strong>{item.correctAnswer}</strong>
                  </div>
                  <div className="review-status">{item.isCorrect ? 'Correct' : 'Incorrect'}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (!currentQuestion) {
    return null
  }

  return (
    <div className="page-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">Quiz</p>
          <h2>{setup.subject}</h2>
          <p className="page-header-subtitle">Answer each question before moving on.</p>
        </div>
      </header>

      <section className="panel quiz-panel">
        <div className="quiz-header-row">
          <div>
            <p className="quiz-subject-label">Subject</p>
            <strong>{setup.subject}</strong>
          </div>
          <div className="quiz-timer-box">Time left: {formatTime(timeRemaining)}</div>
        </div>

        <div className="quiz-progress-wrapper" aria-label="Quiz progress">
          <div className="quiz-progress-track">
            <div className="quiz-progress-fill" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
          </div>
        </div>

        <div className="quiz-meta-row">
          <span>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span>{setup.difficulty} Difficulty</span>
        </div>

        <h3>{currentQuestion.question}</h3>

        <div className="options-list">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedAnswer === option

            return (
              <button
                key={`${currentQuestion.id}-${option}`}
                type="button"
                className={`option-button ${isSelected ? 'selected' : ''}`}
                onClick={() => handleQuestionSelect(option)}
              >
                {option}
              </button>
            )
          })}
        </div>

        <div className="quiz-actions">
          <button type="button" className="action-button primary" onClick={handleNext} disabled={!selectedAnswer}>
            {currentIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'}
          </button>
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

function ProgressPage({ subjects = [] }) {
  const insightText =
    'You are strongest in Python. Increasing Mathematics practice by 30 minutes per day could improve your overall progress.'
  const liveSubjects = subjects.length > 0 ? subjects : buildDefaultSubjects()

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

          {liveSubjects.map((subject) => (
            <div key={subject.id || subject.name} className="subject-item">
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
  const [subjects, setSubjects] = useState(() => {
    if (typeof window === 'undefined') {
      return buildDefaultSubjects()
    }

    try {
      const storedSubjects = window.localStorage.getItem(SUBJECTS_STORAGE_KEY)
      const parsedSubjects = storedSubjects ? JSON.parse(storedSubjects) : null
      const normalizedSubjects = normalizeStoredSubjects(parsedSubjects)
      return normalizedSubjects.length > 0 ? normalizedSubjects : buildDefaultSubjects()
    } catch {
      return buildDefaultSubjects()
    }
  })
  const [planner, setPlanner] = useState(() => {
    if (typeof window === 'undefined') {
      return null
    }

    try {
      const storedPlanner = window.localStorage.getItem(STUDY_PLANNER_STORAGE_KEY)
      return storedPlanner ? JSON.parse(storedPlanner) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(SUBJECTS_STORAGE_KEY, JSON.stringify(subjects))
  }, [subjects])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    if (planner) {
      window.localStorage.setItem(STUDY_PLANNER_STORAGE_KEY, JSON.stringify(planner))
      return
    }

    window.localStorage.removeItem(STUDY_PLANNER_STORAGE_KEY)
  }, [planner])

  const plannerSummary = planner ? getPlannerSummary(planner) : null
  const dashboardStats = [...initialDashboardStats]
  const averageSubjectProgress = subjects.length > 0 ? Math.round(subjects.reduce((sum, subject) => sum + (Number(subject.progress) || 0), 0) / subjects.length) : 0

  if (plannerSummary && plannerSummary.totalSessions > 0) {
    const plannerProgress = Math.min(100, Math.round((plannerSummary.completedSessions / plannerSummary.totalSessions) * 100))
    dashboardStats[0] = {
      label: 'Overall Progress',
      value: `${Math.max(plannerProgress, averageSubjectProgress)}%`,
      detail: `${plannerSummary.completedSessions}/${plannerSummary.totalSessions} planner sessions`,
    }
  } else if (subjects.length > 0) {
    dashboardStats[0] = {
      label: 'Overall Progress',
      value: `${averageSubjectProgress}%`,
      detail: `${subjects.length} tracked subjects`,
    }
  }

  const dashboardActivities = [
    ...(plannerSummary && plannerSummary.totalSessions > 0
      ? (planner.tasks || [])
          .filter((task) => task.completed)
          .slice(0, 3)
          .map((task) => ({
            title: `Completed ${task.subject} ${task.topic} (${task.type})`,
            time: 'Just now',
            accent: 'learning',
          }))
      : []),
    ...initialDashboardActivities,
  ].slice(0, 6)

  const handleQuizComplete = (resultSummary) => {
    if (!resultSummary?.subject || !Array.isArray(subjects)) {
      return
    }

    const subjectName = resultSummary.subject
    setSubjects((currentSubjects) =>
      currentSubjects.map((subject) => {
        if (subject.name.toLowerCase() !== subjectName.toLowerCase()) {
          return subject
        }

        const nextProgress = Math.min(100, subject.progress + 5)
        return {
          ...subject,
          progress: nextProgress,
          topics: subject.topics.map((topic, index) => 
            index === 0 && !topic.completed ? { ...topic, completed: true } : topic,
          ),
        }
      }),
    )
  }

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return <DashboardPage stats={dashboardStats} activities={dashboardActivities} subjects={subjects} />
      case 'My Subjects':
        return <SubjectsPage subjects={subjects} setSubjects={setSubjects} />
      case 'AI Tutor':
        return <TutorPage />
      case 'Study Planner':
        return <PlannerPage planner={planner} setPlanner={setPlanner} />
      case 'Quiz':
        return <QuizPage onNavigate={setActivePage} onQuizComplete={handleQuizComplete} />
      case 'Progress':
        return <ProgressPage subjects={subjects} />
      case 'Settings':
        return <SettingsPage settings={settings} setSettings={setSettings} onSave={setSettings} />
      default:
        return <DashboardPage stats={dashboardStats} activities={dashboardActivities} subjects={subjects} />
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
