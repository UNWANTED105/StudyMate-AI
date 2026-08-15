export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const { question } = request.body || {}

  if (!question || typeof question !== 'string' || !question.trim()) {
    return response.status(400).json({ error: 'Question is required.' })
  }

  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    return response.status(500).json({ error: 'Tutor is not configured.' })
  }

  try {
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'You are a helpful study tutor for a student. Keep answers concise, clear, and educational. Use plain language and include examples when helpful.',
          },
          {
            role: 'user',
            content: question.trim(),
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    const data = await openAiResponse.json()

    if (!openAiResponse.ok) {
      const errorMessage = data?.error?.message || 'OpenAI request failed.'
      return response.status(502).json({ error: errorMessage })
    }

    const answer = data?.choices?.[0]?.message?.content?.trim()

    if (!answer) {
      return response.status(502).json({ error: 'No answer was returned by the tutor.' })
    }

    return response.status(200).json({ answer })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error.'
    return response.status(500).json({ error: message })
  }
}
