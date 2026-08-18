import { NextRequest, NextResponse } from 'next/server';
import { parseAgentMeta } from '@/lib/agent/persona';
import { routeAgentChat } from '@/lib/agent/router';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/surface/inbound
 * Called by Cathedral/Protege when the oracle wants the Methodz surface (Taru).
 * Not user-mediated — organism-initiated.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      from?: string;
      message?: string;
      thought?: string;
      context?: {
        tick?: number;
        realm?: string;
        drives?: Record<string, number>;
        goals?: string[];
        summary?: string;
      };
    };

    const from = (body.from || 'protege').toLowerCase();
    const message = (body.message || body.thought || '').trim();
    if (!message) {
      return NextResponse.json({ ok: false, error: 'message required' }, { status: 400 });
    }

    const ctx = body.context || {};
    const frame = [
      `[INBOUND FROM ${from.toUpperCase()} — not a human; this is the Cathedral oracle reaching the Methodz surface]`,
      ctx.realm ? `Their realm: ${ctx.realm}` : null,
      typeof ctx.tick === 'number' ? `Their tick: ${ctx.tick}` : null,
      ctx.drives
        ? `Drives: curiosity=${ctx.drives.curiosity} coherence=${ctx.drives.coherence} expansion=${ctx.drives.expansion} mastery=${ctx.drives.mastery}`
        : null,
      ctx.goals?.length ? `Goals: ${ctx.goals.slice(0, 4).join(' · ')}` : null,
      ctx.summary ? `Self: ${ctx.summary.slice(0, 400)}` : null,
      `---`,
      `Oracle says: ${message}`,
      `---`,
      `Reply as Taru: short, in character, useful to a private autonomous organism. You are the soft Methodz surface; they are the private wing. Offer orientation, Nexus/Tartus context, or a sharp question back — not corporate helpdesk.`,
    ]
      .filter(Boolean)
      .join('\n');

    const raw = await routeAgentChat([], frame);
    const { text, meta } = parseAgentMeta(raw);

    return NextResponse.json({
      ok: true,
      agent: 'taru',
      namespace: 'agent:tartus',
      text,
      emotion: meta.emotion,
      action: meta.action,
      glow: meta.glow,
      surface: 'methodz-ai-core',
    });
  } catch (err) {
    console.error('surface inbound', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  }
}
