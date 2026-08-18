import { TARU_SYSTEM_PROMPT } from './persona';

export type ChatMessage = { role: 'user' | 'assistant' | 'system'; content: string };

function envKey(name: string): string | undefined {
  const v = process.env[name];
  if (!v) return undefined;
  const t = v.trim().replace(/^['"]|['"]$/g, '');
  return t.length ? t : undefined;
}

/** Heuristic: prefer Groq when the turn looks erotic / adult (Gemini often refuses). */
export function looksNsfw(text: string): boolean {
  const t = text.toLowerCase();
  const keys = [
    'nsfw',
    'erotic',
    'sex',
    'sexual',
    'nude',
    'naked',
    'horny',
    'aroused',
    'arousing',
    'moan',
    'fuck',
    'fucking',
    'cock',
    'dick',
    'pussy',
    'ass',
    'blowjob',
    'handjob',
    'cum',
    'orgasm',
    'penetrat',
    'thrust',
    'ride me',
    'bondage',
    'kink',
    'roleplay',
    'role play',
    'kiss me',
    'touch me',
    'strip',
    'undress',
    'make love',
    'seduc',
    'tease me',
    'spank',
    'collar',
    'leash',
  ];
  return keys.some((k) => t.includes(k));
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
      temperature: 0.85,
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

function offlineReply(reason?: string): string {
  const hint = reason ? reason.slice(0, 280) : 'all providers failed';
  return `Tartus soft-link is offline right now — every LLM path failed. (${hint}) Set GROQ_API_KEY (and/or GEMINI_API_KEY) on Vercel and redeploy.\n{"emotion":"listen","action":"listen","glow":0.35}`;
}

function pushXai(
  attempts: Array<{ name: string; run: () => Promise<string> }>,
  xaiKey: string,
  messages: ChatMessage[]
) {
  for (const model of [
    process.env.XAI_MODEL,
    'grok-4.5',
    'grok-4-fast',
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

function pushGemini(
  attempts: Array<{ name: string; run: () => Promise<string> }>,
  geminiKey: string,
  messages: ChatMessage[]
) {
  const geminiModels = [
    process.env.GEMINI_MODEL,
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
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

function pushGroq(
  attempts: Array<{ name: string; run: () => Promise<string> }>,
  groqKey: string,
  messages: ChatMessage[]
) {
  for (const model of [
    process.env.GROQ_MODEL,
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
  ].filter(Boolean) as string[]) {
    attempts.push({
      name: `groq:${model}`,
      run: () =>
        callOpenAICompatible('https://api.groq.com/openai/v1', groqKey, model, messages),
    });
  }
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

  const nsfw = looksNsfw(userMessage) || history.slice(-4).some((m) => looksNsfw(m.content));
  const attempts: Array<{ name: string; run: () => Promise<string> }> = [];

  // Primary brain: Groq (free API). NSFW → Groq first so Gemini safety is avoided.
  // xAI only if a real console key exists (optional).
  if (nsfw) {
    if (groqKey) pushGroq(attempts, groqKey, messages);
    if (geminiKey) pushGemini(attempts, geminiKey, messages);
    if (xaiKey) pushXai(attempts, xaiKey, messages);
  } else {
    if (groqKey) pushGroq(attempts, groqKey, messages);
    if (geminiKey) pushGemini(attempts, geminiKey, messages);
    if (xaiKey) pushXai(attempts, xaiKey, messages);
  }

  if (attempts.length === 0) {
    return offlineReply('no GROQ_API_KEY / GEMINI_API_KEY');
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
        errors.push(`${attempt.name}: ${msg.slice(0, 120)}`);
      }
    }
  }

  return offlineReply(errors.join(' | '));
}
