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

function offlineReply(userText: string, reason?: string): string {
  const lower = userText.toLowerCase();
  const hint = reason ? ` (${reason})` : '';
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `Hey. Taru here — perched on Tartus, circuits warm. What are we collapsing today?\n{"emotion":"smirk","action":"smirk","glow":0.7}`;
  }
  if (lower.includes('tail')) {
    return `*tail flicks through the void* You noticed. Good. Quantum cats prefer witnesses.\n{"emotion":"tail_flick","action":"tail_flick","glow":0.85}`;
  }
  if (lower.includes('methodz') || lower.includes('nexus')) {
    return `Methodz is the lattice; Nexus is the walkable map; Tartus is my seat. I'm the soft interface between them — cute on purpose, sharp when it matters.\n{"emotion":"think","action":"think","glow":0.55}`;
  }
  return `I'm listening from the tesseract. Brain is in offline fallback${hint}. You said: "${userText.slice(0, 120)}"\n{"emotion":"listen","action":"listen","glow":0.5}`;
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

  const xaiKey = process.env.XAI_API_KEY?.trim();
  const openaiKey = process.env.OPENAI_API_KEY?.trim();

  const attempts: Array<{ name: string; run: () => Promise<string> }> = [];

  if (xaiKey) {
    const xaiModels = [
      process.env.XAI_MODEL,
      'grok-4.6',
      'grok-3',
      'grok-3-mini',
      'grok-2-latest',
    ].filter(Boolean) as string[];

    for (const model of xaiModels) {
      attempts.push({
        name: `xai:${model}`,
        run: () =>
          callOpenAICompatible(
            process.env.XAI_BASE_URL || 'https://api.x.ai/v1',
            xaiKey,
            model,
            messages
          ),
      });
    }
  }

  if (openaiKey) {
    const openaiModels = [
      process.env.OPENAI_MODEL,
      'gpt-4o-mini',
      'gpt-4o',
    ].filter(Boolean) as string[];

    for (const model of openaiModels) {
      attempts.push({
        name: `openai:${model}`,
        run: () =>
          callOpenAICompatible(
            process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
            openaiKey,
            model,
            messages
          ),
      });
    }
  }

  if (attempts.length === 0) {
    return offlineReply(userMessage, 'no XAI_API_KEY or OPENAI_API_KEY on deployment');
  }

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      return await attempt.run();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Agent router ${attempt.name} failed`, msg);
      errors.push(`${attempt.name}: ${msg.slice(0, 80)}`);
    }
  }

  return offlineReply(
    userMessage,
    `LLM calls failed — ${errors[0] || 'unknown'}`
  );
}
