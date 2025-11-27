import OpenAI from 'openai';

// Initialize OpenAI lazily to avoid build-time errors
let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

/**
 * Generate a completion using GPT-4o
 */
export async function generateCompletion(
  systemPrompt: string,
  userContent: string,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const client = getOpenAI();
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature: options?.temperature ?? 0.3,
    max_tokens: options?.maxTokens ?? 4096,
    response_format: { type: 'json_object' },
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Generate embeddings for semantic search (future feature)
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAI();
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });

  return response.data[0].embedding;
}

export default getOpenAI;
