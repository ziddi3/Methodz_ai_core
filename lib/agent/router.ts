import { TARU_SYSTEM_PROMPT } from './persona';

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

function envKey(name: string): string | undefined {
  const v = process.env[name];
  if (!v) return undefined;
  const t = v.trim().replace(/^['"]|['"]$/g, '');
  return t.length ? t : undefined;
}

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
      temperature: 0.8,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
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
  return `I'm listening from the tesseract. Brain is in offline fallback${hint}. You said: "${userText.slice(0, 100)}"\n{"emotion":"listen","action":"listen","glow":0.5}`;
}

export async function routeAgentChat(
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const messages: ChatMessage[] = [
    { role: 'system', content: TARU_SYSTEM_PROMPT },
    ...history.slice(-10),
    { role: 'user', content: userMessage },
  ];

  const xaiKey = envKey('XAI_API_KEY');
  const geminiKey = envKey('GEMINI_API_KEY') || envKey('GOOGLE_API_KEY');
  const groqKey = envKey('GROQ_API_KEY');

  const attempts: Array<{ name: string; run: () => Promise<string> }> = [];

  if (geminiKey) {
    const geminiModels = [
      process.env.GEMINI_MODEL,
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-2.5-flash',
      'gemini-1.5-flash',
    ].filter(Boolean) as string[];

    for (const model of geminiModels) {
      attempts.push({
        name: `gemini:${model}`,
        run: () =>
          callOpenAICompatible(
            'https://generativelanguage.googleapis.com/v1beta/openai/',
            geminiKey,
            model,
            messages
          ),
      });
    }
  }

  if (groqKey) {
    for (const model of [
      process.env.GROQ_MODEL,
      'openai/gpt-oss-20b',
      'openai/gpt-oss-120b',
    ].filter(Boolean) as string[]) {
      attempts.push({
        name: `groq:${model}`,
        run: () =>
          callOpenAICompatible('https://api.groq.com/openai/v1', groqKey, model, messages),
      });
    }
  }

  if (xaiKey) {
    for (const model of [
      process.env.XAI_MODEL,
      'grok-4.5',
      'grok-4-fast',
      'grok-4.6',
      'grok-3',
    ].filter(Boolean) as string[]) {
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

  if (attempts.length === 0) {
    return offlineReply(userMessage, 'no GEMINI_API_KEY / GROQ_API_KEY / XAI_API_KEY');
  }

  const errors: string[] = [];
  for (const attempt of attempts) {
    try {
      return await attempt.run();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Agent router ${attempt.name} failed`, msg);
      const family = attempt.name.split(':')[0];
      if (!errors.some((e) => e.startsWith(family))) {
        errors.push(`${attempt.name}: ${msg.slice(0, 100)}`);
      }
    }
  }

  return offlineReply(userMessage, errors.join(' | '));
}
