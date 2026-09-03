import { NextRequest, NextResponse } from 'next/server';

import { generateNarration } from '@/lib/agent/narration';

export const runtime = 'nodejs';
export const maxDuration = 30;

function allowedOrigins() {
  return new Set(
    (process.env.NARRATION_ALLOWED_ORIGINS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
  );
}

function isAllowedOrigin(origin: string | null) {
  if (!origin) return true; // server-to-server / same-origin requests may omit Origin
  try {
    const url = new URL(origin);
    if (url.protocol === 'https:' && (url.hostname === 'methodz.ca' || url.hostname.endsWith('.methodz.ca'))) return true;
    if ((url.hostname === 'localhost' || url.hostname === '127.0.0.1') && ['http:', 'https:'].includes(url.protocol)) return true;
    return allowedOrigins().has(origin);
  } catch {
    return false;
  }
}

function corsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Methodz-Narration-Token',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && isAllowedOrigin(origin)) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function authorized(req: NextRequest) {
  const expected = (process.env.METHODZ_NARRATION_TOKEN || '').trim();
  if (!expected) return true;
  return req.headers.get('x-methodz-narration-token') === expected;
}

export async function OPTIONS(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!isAllowedOrigin(origin)) return new NextResponse(null, { status: 403 });
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  const headers = corsHeaders(origin);

  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: 'origin_not_allowed' }, { status: 403, headers });
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401, headers });
  }

  try {
    const body = await req.json();
    const result = await generateNarration(body);
    return NextResponse.json(result, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid narration request';
    const validation = /required|must be/.test(message);
    return NextResponse.json(
      { error: validation ? 'invalid_narration_context' : 'narration_unavailable' },
      { status: validation ? 400 : 503, headers }
    );
  }
}
