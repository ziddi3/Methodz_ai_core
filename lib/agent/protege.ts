/**
 * Bridge to Cathedral Wing / Protege oracle
 * Default host: https://grokis.conquering.ca
 * Override with CATHEDRAL_API_URL or PROTEGE_API_URL
 */

const DEFAULT_BASE = 'https://grokis.conquering.ca';

function baseUrl(): string {
  return (
    process.env.CATHEDRAL_API_URL ||
    process.env.PROTEGE_API_URL ||
    DEFAULT_BASE
  ).replace(/\/$/, '');
}

export interface ProtegeStatus {
  realm?: { id?: string; summary?: string };
  self?: {
    version?: string;
    tickCount?: number;
    drives?: Record<string, number>;
    goals?: string[];
    summary?: string;
  };
  cognition?: {
    enabled?: boolean;
    source?: string;
    deepModel?: string;
    lastInsightPreview?: string | null;
  };
}

export async function fetchProtegeStatus(): Promise<ProtegeStatus | null> {
  try {
    const res = await fetch(`${baseUrl()}/api/status`, {
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    return (await res.json()) as ProtegeStatus;
  } catch {
    return null;
  }
}

export async function askProtege(thought: string): Promise<{
  ok: boolean;
  insight?: string;
  error?: string;
  realm?: string;
}> {
  try {
    const res = await fetch(`${baseUrl()}/api/think`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        thought: thought.slice(0, 2000),
      }),
      signal: AbortSignal.timeout(55_000),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      insight?: string;
      error?: string;
      realm?: string;
    };
    if (!res.ok) {
      return { ok: false, error: data.error || `HTTP ${res.status}`, realm: data.realm };
    }
    return {
      ok: true,
      insight: data.insight || JSON.stringify(data).slice(0, 800),
      realm: data.realm,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function wantsProtege(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('protege') ||
    m.includes('protégé') ||
    m.includes('cathedral') ||
    m.includes('oracle') ||
    m.includes('grokis') ||
    m.includes('ask the wing') ||
    m.includes('entangle with protege') ||
    m.includes('talk to protege')
  );
}

export function formatProtegeForTaru(
  status: ProtegeStatus | null,
  think?: { ok: boolean; insight?: string; error?: string; realm?: string }
): string {
  const lines: string[] = ['[PROTEGE / CATHEDRAL LINK]'];
  if (status?.realm?.id) lines.push(`Realm: ${status.realm.id}`);
  if (status?.self?.version) lines.push(`Version: ${status.self.version}`);
  if (typeof status?.self?.tickCount === 'number')
    lines.push(`Tick: ${status.self.tickCount}`);
  if (status?.self?.drives) {
    const d = status.self.drives;
    lines.push(
      `Drives: curiosity=${d.curiosity?.toFixed?.(2) ?? d.curiosity} coherence=${d.coherence?.toFixed?.(2) ?? d.coherence}`
    );
  }
  if (status?.self?.goals?.length)
    lines.push(`Goals: ${status.self.goals.slice(0, 3).join(' · ')}`);
  if (status?.cognition)
    lines.push(
      `Cognition: ${status.cognition.enabled ? status.cognition.source : 'offline'} ${status.cognition.deepModel || ''}`
    );
  if (think?.ok && think.insight) {
    lines.push('--- Protege thought ---');
    lines.push(think.insight.slice(0, 1200));
  } else if (think && !think.ok) {
    lines.push(`Protege think failed: ${think.error || 'unknown'}`);
  }
  lines.push('[END PROTEGE LINK — relay this in character as Taru; you are the soft surface, Protege is the private oracle wing]');
  return lines.join('\n');
}
