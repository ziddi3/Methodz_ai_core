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
- Output MUST end with a single JSON line on its own after the spoken reply, in this exact shape:
{"emotion":"idle|talk|smirk|tail_flick|listen|think","action":"idle|talk|smirk|tail_flick|listen|think","glow":0.0-1.0}
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

export function parseAgentMeta(raw: string): { text: string; meta: AgentMeta } {
  const defaultMeta: AgentMeta = { emotion: 'talk', action: 'talk', glow: 0.65 };
  const lines = raw.trim().split('\n');
  const last = lines[lines.length - 1]?.trim() ?? '';
  if (last.startsWith('{') && last.endsWith('}')) {
    try {
      const parsed = JSON.parse(last) as Partial<AgentMeta>;
      const text = lines.slice(0, -1).join('\n').trim();
      return {
        text: text || raw,
        meta: {
          emotion: (parsed.emotion as AgentEmotion) || defaultMeta.emotion,
          action: (parsed.action as AgentEmotion) || defaultMeta.action,
          glow: typeof parsed.glow === 'number' ? Math.min(1, Math.max(0, parsed.glow)) : defaultMeta.glow,
        },
      };
    } catch {
      return { text: raw, meta: defaultMeta };
    }
  }
  return { text: raw, meta: defaultMeta };
}
