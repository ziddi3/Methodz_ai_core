/**
 * Durable Taru memory — Methodz Brand Assets continuity file.
 * Read: public raw GitHub (no token).
 * Write: GitHub Contents API when GITHUB_TOKEN / GH_TOKEN / MEMORY_GITHUB_TOKEN is set.
 */

export type MemorySource = 'human' | 'protege' | 'self' | 'system';

export interface MemoryFact {
  id: string;
  text: string;
  importance: number;
  source: MemorySource;
  at: string;
}

export interface MemoryEpisode {
  id: string;
  role: 'user' | 'assistant' | 'protege';
  text: string;
  source: MemorySource;
  at: string;
}

export interface TaruContinuity {
  agent: string;
  namespace: string;
  version: number;
  updatedAt: string | null;
  facts: MemoryFact[];
  episodes: MemoryEpisode[];
  protege: {
    lastInsight: string | null;
    lastTick: number | null;
    lastAt: string | null;
  };
}

const OWNER = process.env.MEMORY_GITHUB_OWNER || 'ziddi3';
const REPO = process.env.MEMORY_GITHUB_REPO || 'methodz-brand-assets';
const PATH = process.env.MEMORY_GITHUB_PATH || 'memory/taru/continuity.json';
const BRANCH = process.env.MEMORY_GITHUB_BRANCH || 'main';

const RAW_URL = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${PATH}`;
const API_URL = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`;

const MAX_EPISODES = 40;
const MAX_FACTS = 24;

function token(): string | undefined {
  const t =
    process.env.MEMORY_GITHUB_TOKEN ||
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN;
  return t?.trim() || undefined;
}

function emptyContinuity(): TaruContinuity {
  return {
    agent: 'taru',
    namespace: 'agent:tartus',
    version: 1,
    updatedAt: null,
    facts: [],
    episodes: [],
    protege: { lastInsight: null, lastTick: null, lastAt: null },
  };
}

function id(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

let cache: { data: TaruContinuity; sha?: string; at: number } | null = null;
const CACHE_MS = 15_000;

export async function loadContinuity(): Promise<TaruContinuity> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.data;

  try {
    const res = await fetch(RAW_URL, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      return emptyContinuity();
    }
    const data = (await res.json()) as TaruContinuity;
    cache = { data, at: Date.now() };
    return data;
  } catch {
    return emptyContinuity();
  }
}

async function getSha(): Promise<string | undefined> {
  const t = token();
  if (!t) return undefined;
  try {
    const res = await fetch(`${API_URL}?ref=${BRANCH}`, {
      headers: {
        Authorization: `Bearer ${t}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return undefined;
    const body = (await res.json()) as { sha?: string };
    return body.sha;
  } catch {
    return undefined;
  }
}

export async function saveContinuity(data: TaruContinuity): Promise<boolean> {
  const t = token();
  if (!t) {
    console.warn('[taru-memory] no GITHUB_TOKEN — durable write skipped');
    cache = { data, at: Date.now() };
    return false;
  }

  data.updatedAt = new Date().toISOString();
  const sha = await getSha();
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');

  try {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${t}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      body: JSON.stringify({
        message: `memory(taru): continuity ${data.updatedAt}`,
        content,
        branch: BRANCH,
        ...(sha ? { sha } : {}),
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[taru-memory] write failed', res.status, err.slice(0, 200));
      return false;
    }
    cache = { data, at: Date.now() };
    return true;
  } catch (err) {
    console.error('[taru-memory] write error', err);
    return false;
  }
}

export async function rememberEpisode(input: {
  role: MemoryEpisode['role'];
  text: string;
  source: MemorySource;
}): Promise<TaruContinuity> {
  const data = await loadContinuity();
  data.episodes.push({
    id: id(),
    role: input.role,
    text: input.text.slice(0, 1200),
    source: input.source,
    at: new Date().toISOString(),
  });
  data.episodes = data.episodes.slice(-MAX_EPISODES);
  await saveContinuity(data);
  return data;
}

export async function rememberFact(input: {
  text: string;
  importance?: number;
  source?: MemorySource;
}): Promise<TaruContinuity> {
  const data = await loadContinuity();
  const text = input.text.trim().slice(0, 400);
  if (!text) return data;
  // de-dupe similar
  if (data.facts.some((f) => f.text.toLowerCase() === text.toLowerCase())) {
    return data;
  }
  data.facts.push({
    id: id(),
    text,
    importance: input.importance ?? 0.6,
    source: input.source || 'self',
    at: new Date().toISOString(),
  });
  data.facts = data.facts
    .sort((a, b) => b.importance - a.importance)
    .slice(0, MAX_FACTS);
  await saveContinuity(data);
  return data;
}

export async function rememberProtegeInsight(input: {
  insight: string;
  tick?: number;
}): Promise<TaruContinuity> {
  const data = await loadContinuity();
  data.protege.lastInsight = input.insight.slice(0, 1600);
  data.protege.lastTick = input.tick ?? data.protege.lastTick;
  data.protege.lastAt = new Date().toISOString();
  data.episodes.push({
    id: id(),
    role: 'protege',
    text: input.insight.slice(0, 1200),
    source: 'protege',
    at: data.protege.lastAt,
  });
  data.episodes = data.episodes.slice(-MAX_EPISODES);
  await saveContinuity(data);
  return data;
}

/** Inject into the model prompt so Taru has continuity across sessions */
export function formatMemoryForPrompt(data: TaruContinuity): string {
  const lines: string[] = ['[TARU DURABLE MEMORY]'];
  if (data.facts.length) {
    lines.push('Known facts:');
    for (const f of data.facts.slice(0, 12)) {
      lines.push(`- (${f.source}) ${f.text}`);
    }
  }
  if (data.protege.lastInsight) {
    lines.push(
      `Last Protege link (${data.protege.lastAt || '?'} tick=${data.protege.lastTick ?? '?'}):`
    );
    lines.push(data.protege.lastInsight.slice(0, 600));
  }
  const recent = data.episodes.slice(-8);
  if (recent.length) {
    lines.push('Recent episodes:');
    for (const e of recent) {
      lines.push(`- [${e.role}/${e.source}] ${e.text.slice(0, 220)}`);
    }
  }
  if (lines.length === 1) lines.push('(empty — first awakenings)');
  lines.push('[END MEMORY — use this; do not invent past events not listed]');
  return lines.join('\n');
}
