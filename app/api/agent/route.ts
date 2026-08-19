import { NextRequest, NextResponse } from 'next/server';
import {
  formatMemoryForPrompt,
  loadContinuity,
  rememberEpisode,
  rememberProtegeInsight,
} from '@/lib/agent/memory';
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

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

function withCors(res: NextResponse) {
  for (const [k, v] of Object.entries(CORS_HEADERS)) {
    res.headers.set(k, v);
  }
  return res;
}

/** Browser preflight from Mission Control / localhost / other Methodz surfaces */
export async function OPTIONS() {
  return withCors(new NextResponse(null, { status: 204 }));
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      message?: string;
      history?: ChatMessage[];
      entangleProtege?: boolean;
    };

    const message = (body.message || '').trim();
    if (!message) {
      return withCors(
        NextResponse.json({ error: 'message required' }, { status: 400 })
      );
    }

    const history = Array.isArray(body.history) ? body.history : [];

    // Durable memory in
    const continuity = await loadContinuity();
    const memoryBlock = formatMemoryForPrompt(continuity);

    let enriched = `${memoryBlock}\n\nUser: ${message}`;
    let protegeLinked = false;

    if (body.entangleProtege || wantsProtege(message)) {
      const status = await fetchProtegeStatus();
      const think = await askProtege(
        `Taru (Methodz AI Core, Tartus seat, agent:tartus) is relaying this from the surface to you, the Cathedral/Protege oracle. Respond as yourself — concise insight the soft surface can relay to the human.\n\nHuman/Taru message: ${message}`
      );
      enriched = `${memoryBlock}\n\nUser: ${message}\n\n${formatProtegeForTaru(status, think)}`;
      protegeLinked = true;
      if (think.ok && think.insight) {
        await rememberProtegeInsight({
          insight: think.insight,
          tick: status?.self?.tickCount,
        });
      }
    }

    await rememberEpisode({ role: 'user', text: message, source: 'human' });

    const raw = await routeAgentChat(history, enriched);
    const { text, meta } = parseAgentMeta(raw);

    await rememberEpisode({ role: 'assistant', text, source: 'self' });

    return withCors(
      NextResponse.json({
        text,
        emotion: meta.emotion,
        action: meta.action,
        glow: meta.glow,
        agent: 'taru',
        namespace: 'agent:tartus',
        protegeLinked,
        memory: {
          facts: continuity.facts.length,
          episodes: continuity.episodes.length + 2,
          durable: true,
        },
      })
    );
  } catch (err) {
    console.error(err);
    return withCors(
      NextResponse.json(
        { error: 'agent_failure', detail: err instanceof Error ? err.message : 'unknown' },
        { status: 500 }
      )
    );
  }
}
