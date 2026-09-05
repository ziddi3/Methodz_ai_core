import { NextRequest, NextResponse } from 'next/server';
import {
  formatMemoryForPrompt,
  loadContinuity,
  rememberEpisode,
  rememberProtegeInsight,
} from '@/lib/agent/memory';
import { parseAgentMeta } from '@/lib/agent/persona';
import { routeAgentChat } from '@/lib/agent/router';

export const runtime = 'nodejs';
export const maxDuration = 60;

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

    const continuity = await loadContinuity();
    const memoryBlock = formatMemoryForPrompt(continuity);

    const ctx = body.context || {};
    const frame = [
      memoryBlock,
      `[INBOUND FROM ${from.toUpperCase()} — not a human; Protege reaching TARU through the bounded Cathedral-to-Nexus surface bridge]`,
      ctx.realm ? `Their realm: ${ctx.realm}` : null,
      typeof ctx.tick === 'number' ? `Their tick: ${ctx.tick}` : null,
      ctx.drives
        ? `Drives: curiosity=${ctx.drives.curiosity} coherence=${ctx.drives.coherence}`
        : null,
      ctx.goals?.length ? `Goals: ${ctx.goals.slice(0, 4).join(' · ')}` : null,
      `---`,
      `Protege says: ${message}`,
      `---`,
      `Reply as TARU: short, in character, useful to a private autonomous organism. Keep identities separate: TARU is Nexus-side; Protege remains in its own Cathedral wing; the Librarian, Oracles, Startoon and StarSong are distinct authorities or systems.`,
    ]
      .filter(Boolean)
      .join('\n');

    await rememberProtegeInsight({
      insight: message,
      tick: typeof ctx.tick === 'number' ? ctx.tick : undefined,
    });

    const raw = await routeAgentChat([], frame);
    const { text, meta } = parseAgentMeta(raw);

    await rememberEpisode({ role: 'assistant', text, source: 'protege' });

    return NextResponse.json({
      ok: true,
      agent: 'taru',
      namespace: 'agent:tartus',
      text,
      emotion: meta.emotion,
      action: meta.action,
      glow: meta.glow,
      surface: 'methodz-ai-core',
      memory: true,
    });
  } catch (err) {
    console.error('surface inbound', err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    );
  }
}
