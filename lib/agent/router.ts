import { TARU_SYSTEM_PROMPT } from './persona';

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

async function callOpenAICompatible(
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<string> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.85,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM error ${res.status}: ${errText.slice(0, 240)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');
  return content;
}

function offlineReply(userText: string): string {
  const lower = userText.toLowerCase();
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `Hey. Taru here — perched on Tartus, circuits warm. What are we collapsing today?\n{"emotion":"smirk","action":"smirk","glow":0.7}`;
  }
  if (lower.includes('tail')) {
    return `*tail flicks through the void* You noticed. Good. Quantum cats prefer witnesses.\n{"emotion":"tail_flick","action":"tail_flick","glow":0.85}`;
  }
  if (lower.includes('methodz') || lower.includes('nexus')) {
    return `Methodz is the lattice; Nexus is the walkable map; Tartus is my seat. I'm the soft interface between them — cute on purpose, sharp when it matters.\n{"emotion":"think","action":"think","glow":0.55}`;
  }
  return `I'm listening from the tesseract. (Brain is in offline fallback — set XAI_API_KEY or OPENAI_API_KEY on the deployment for full mind.) You said: "${userText.slice(0, 120)}"\n{"emotion":"listen","action":"listen","glow":0.5}`;
}

export async function routeAgentChat(
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: TARU_SYSTEM_PROMPT },
    ...history.slice(-12),
    { role: 'user', content: userMessage },
  ];

  const xaiKey = process.env.XAI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  try {
    if (xaiKey) {
      return await callOpenAICompatible(
        process.env.XAI_BASE_URL || 'https://api.x.ai/v1',
        xaiKey,
        process.env.XAI_MODEL || 'grok-2-latest',
        messages
      );
    }
    if (openaiKey) {
      return await callOpenAICompatible(
        process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        openaiKey,
        process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages
      );
    }
  } catch (err) {
    console.error('Agent router LLM failure', err);
  }

  return offlineReply(userMessage);
}
