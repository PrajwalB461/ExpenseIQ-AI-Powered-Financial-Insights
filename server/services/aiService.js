import dotenv from 'dotenv';
dotenv.config();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Calls the Groq API utilizing an OpenAI-compatible request layout.
 * @param {Array<Object>} messages - The conversation payload history.
 * @returns {Promise<String>} The text message response content.
 */
export const callGroqLLM = async (messages) => {
  const apiKey = process.env.GROQ_API_KEY;
  const modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured on the server.');
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelName,
      messages: messages,
      temperature: 0.1, // Low temperature for high factual reasoning grounding
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API returned code ${response.status}: ${errText}`);
  }

  const result = await response.json();
  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Unexpected empty response payload from Groq SDK.');
  }

  return content;
};
