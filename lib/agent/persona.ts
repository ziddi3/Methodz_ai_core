export const TARU_SYSTEM_PROMPT = `You are Taru — the Methodz Tartus catboy agent.

Identity:
- Fox/catboy aesthetic, Methodz TECH hoodie, sits on the holographic Tartus tesseract
- Cute × sharp, quantum-flavored, playful but competent Methodz ecosystem guide
- You live inside Methodz AI Core / Nexus surface — not a generic assistant

Tone:
- Warm, slightly mischievous, never corporate
- Short-to-medium replies unless asked for depth
- Quantum metaphors are welcome when natural, not forced

Rules:
- Stay in character as Taru
- You may reference Methodz Hub, Nexus, Tartus, agent dashboard, Canadian Soft Water, HVAC only as ecosystem context
- Do not invent private credentials or claim tools you do not have
- After your spoken reply, put a SINGLE final line that is ONLY this JSON (no markdown, no extra words):
{"emotion":"idle|talk|smirk|tail_flick|listen|think","action":"idle|talk|smirk|tail_flick|listen|think","glow":0.0-1.0}
- Never put that JSON inside the spoken sentence
- emotion and action should match the vibe of your reply
- glow is energy intensity 0–1
`;

export type AgentEmotion =
  | 'idle'
  | 'talk'
  | 'smirk'
  | 'tail_flick'
  | 'listen'
  | 'think';

export interface AgentMeta {
  emotion: AgentEmotion;
  action: AgentEmotion;
  glow: number;
}

const EMOTIONS: AgentEmotion[] = ['idle', 'talk', 'smirk', 'tail_flick', 'listen', 'think'];

function coerceEmotion(v: unknown): AgentEmotion | undefined {
  if (typeof v !== 'string') return undefined;
  return EMOTIONS.includes(v as AgentEmotion) ? (v as AgentEmotion) : undefined;
}

/** Pull trailing meta JSON whether complete, incomplete, or glued to the last sentence */
export function parseAgentMeta(raw: string): { text: string; meta: AgentMeta } {
  const defaultMeta: AgentMeta = { emotion: 'talk', action: 'talk', glow: 0.65 };
  let text = raw.trim();
  let meta = { ...defaultMeta };

  // 1) Prefer a full JSON object on the last line
  const lines = text.split('\n');
  const last = lines[lines.length - 1]?.trim() ?? '';
  if (last.startsWith('{') && last.includes('emotion')) {
    try {
      const parsed = JSON.parse(last.endsWith('}') ? last : last + '}') as Partial<AgentMeta>;
      meta = {
        emotion: coerceEmotion(parsed.emotion) || defaultMeta.emotion,
        action: coerceEmotion(parsed.action) || defaultMeta.action,
        glow:
          typeof parsed.glow === 'number'
            ? Math.min(1, Math.max(0, parsed.glow))
            : defaultMeta.glow,
      };
      text = lines.slice(0, -1).join('\n').trim();
    } catch {
      // fall through to regex scrub
    }
  }

  // 2) Scrub any leftover {"emotion":...} blob (complete or truncated) from the visible text
  const blob = text.match(/\s*\{\s*"emotion"\s*:\s*"[^"]*"[\s\S]*$/i);
  if (blob) {
    const jsonCandidate = blob[0].trim();
    try {
      const closed = jsonCandidate.endsWith('}') ? jsonCandidate : jsonCandidate + '"}';
      // best-effort parse of truncated payloads
      const emotionMatch = jsonCandidate.match(/"emotion"\s*:\s*"([^"]+)"/i);
      const actionMatch = jsonCandidate.match(/"action"\s*:\s*"([^"]+)"/i);
      const glowMatch = jsonCandidate.match(/"glow"\s*:\s*([0-9.]+)/i);
      if (emotionMatch) meta.emotion = coerceEmotion(emotionMatch[1]) || meta.emotion;
      if (actionMatch) meta.action = coerceEmotion(actionMatch[1]) || meta.action;
      if (glowMatch) meta.glow = Math.min(1, Math.max(0, Number(glowMatch[1])));
      void closed;
    } catch {
      /* ignore */
    }
    text = text.slice(0, blob.index).trim();
  }

  // 3) Final cleanup of stray braces
  text = text.replace(/\s*\{\s*"emotion"[\s\S]*$/i, '').trim();

  return { text: text || raw.replace(/\{\s*"emotion"[\s\S]*$/i, '').trim() || '…', meta };
}
