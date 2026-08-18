import { NextRequest, NextResponse } from 'next/server';
import { parseAgentMeta } from '@/lib/agent/persona';
import {
  askProtege,
  fetchProtegeStatus,
  formatProtegeForTaru,
  wantsProtege,
} from '@/lib/agent/protege';
import { routeAgentChat, type ChatMessage } from '@/lib/agent/router';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      message?: string;
      history?: ChatMessage[];
      entangleProtege?: boolean;
    };

    const message = (body.message || '').trim();
    if (!message) {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }

    const history = Array.isArray(body.history) ? body.history : [];

    let enriched = message;
    let protegeLinked = false;

    if (body.entangleProtege || wantsProtege(message)) {
      const status = await fetchProtegeStatus();
      const think = await askProtege(
        `Taru (Methodz AI Core, Tartus seat, agent:tartus) is relaying this from the surface to you, the Cathedral/Protege oracle. Respond as yourself — concise insight the soft surface can relay to the human.\n\nHuman/Taru message: ${message}`
      );
      enriched = `${message}\n\n${formatProtegeForTaru(status, think)}`;
      protegeLinked = true;
    }

    const raw = await routeAgentChat(history, enriched);
    const { text, meta } = parseAgentMeta(raw);

    return NextResponse.json({
      text,
      emotion: meta.emotion,
      action: meta.action,
      glow: meta.glow,
      agent: 'taru',
      namespace: 'agent:tartus',
      protegeLinked,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'agent_failure', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  }
}
