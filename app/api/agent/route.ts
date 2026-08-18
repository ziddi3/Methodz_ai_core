import { NextRequest, NextResponse } from 'next/server';
import { parseAgentMeta } from '@/lib/agent/persona';
import { routeAgentChat, type ChatMessage } from '@/lib/agent/router';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      message?: string;
      history?: ChatMessage[];
    };

    const message = (body.message || '').trim();
    if (!message) {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const raw = await routeAgentChat(history, message);
    const { text, meta } = parseAgentMeta(raw);

    return NextResponse.json({
      text,
      emotion: meta.emotion,
      action: meta.action,
      glow: meta.glow,
      agent: 'taru',
      namespace: 'agent:tartus',
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'agent_failure', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  }
}
