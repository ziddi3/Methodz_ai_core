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
    throw new Error(`LLM error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');
  return content;
}

async function callGemini(
  apiKey: string,
  model: string,
  messages: ChatMessage[]
): Promise<string> {
  const system = messages.find((m) => m.role === 'system')?.content || '';
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      contents,
      generationConfig: { temperature: 0.85, maxOutputTokens: 600 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`LLM error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
  if (!content) throw new Error('Empty Gemini response');
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
    ...history.slice(-12),
    { role: 'user', content: userMessage },
  ];

  const xaiKey = process.env.XAI_API_KEY?.trim();
  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  // OPENAI intentionally skipped — account not paid; re-enable when billing is active

  const attempts: Array<{ name: string; run: () => Promise<string> }> = [];

  if (xaiKey) {
    for (const model of [process.env.XAI_MODEL, 'grok-4.6', 'grok-3', 'grok-3-mini'].filter(Boolean) as string[]) {
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

  if (geminiKey) {
    for (const model of [process.env.GEMINI_MODEL, 'gemini-2.0-flash', 'gemini-1.5-flash'].filter(Boolean) as string[]) {
      attempts.push({
        name: `gemini:${model}`,
        run: () => callGemini(geminiKey, model, messages),
      });
    }
  }

  if (attempts.length === 0) {
    return offlineReply(userMessage, 'no XAI_API_KEY or GEMINI_API_KEY on deployment');
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
