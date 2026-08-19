/**
 * GitHub reach for Methodz agents (Bob / Oracle / Researcher).
 * Read-only inventory + file/tree access using the same token family as memory.
 */

function token(): string | undefined {
  const t =
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    process.env.MEMORY_GITHUB_TOKEN;
  return t?.trim() || undefined;
}

const OWNER = process.env.GITHUB_OWNER || process.env.MEMORY_GITHUB_OWNER || 'ziddi3';

export type RepoSummary = {
  name: string;
  full_name: string;
  private: boolean;
  description: string | null;
  language: string | null;
  updated_at: string;
  html_url: string;
  default_branch: string;
};

async function gh<T>(path: string, init?: RequestInit): Promise<T | null> {
  const t = token();
  if (!t) {
    console.warn('[github-reach] no GITHUB_TOKEN / GH_TOKEN');
    return null;
  }
  try {
    const res = await fetch(`https://api.github.com${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${t}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        ...(init?.headers || {}),
      },
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.error('[github-reach]', path, res.status, await res.text().then((s) => s.slice(0, 200)));
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error('[github-reach] error', path, err);
    return null;
  }
}

/** List repos for the Methodz owner (default ziddi3). */
export async function listRepos(opts?: {
  perPage?: number;
  type?: 'all' | 'owner' | 'member';
}): Promise<RepoSummary[]> {
  const perPage = opts?.perPage ?? 50;
  const type = opts?.type ?? 'owner';
  const data = await gh<
    Array<{
      name: string;
      full_name: string;
      private: boolean;
      description: string | null;
      language: string | null;
      updated_at: string;
      html_url: string;
      default_branch: string;
    }>
  >(`/users/${OWNER}/repos?per_page=${perPage}&type=${type}&sort=updated`);

  if (!data) return [];
  return data.map((r) => ({
    name: r.name,
    full_name: r.full_name,
    private: r.private,
    description: r.description,
    language: r.language,
    updated_at: r.updated_at,
    html_url: r.html_url,
    default_branch: r.default_branch,
  }));
}

/** Prefer Methodz-named repos, then recent others. */
export async function listMethodzRepos(): Promise<RepoSummary[]> {
  const all = await listRepos({ perPage: 80 });
  const methodz = all.filter(
    (r) =>
      /methodz|method-|method_|bobs-|vault-|nexus|lec-|canadian/i.test(r.name) ||
      /methodz|method hub|nexus/i.test(r.description || '')
  );
  // If filter is too tight, still return a useful slice
  return methodz.length >= 5 ? methodz : all.slice(0, 40);
}

export async function getRepoTree(
  repo: string,
  ref = 'main'
): Promise<Array<{ path: string; type: string }>> {
  const data = await gh<{ tree?: Array<{ path: string; type: string }> }>(
    `/repos/${OWNER}/${repo}/git/trees/${ref}?recursive=1`
  );
  return data?.tree?.map((t) => ({ path: t.path, type: t.type })) ?? [];
}

export async function getFileText(
  repo: string,
  path: string,
  ref = 'main'
): Promise<string | null> {
  const data = await gh<{ content?: string; encoding?: string }>(
    `/repos/${OWNER}/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}?ref=${ref}`
  );
  if (!data?.content) return null;
  if (data.encoding === 'base64') {
    try {
      return Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8');
    } catch {
      return null;
    }
  }
  return data.content;
}

/** Build a compact inventory block for LLM context. */
export async function formatEcosystemInventory(): Promise<string> {
  const repos = await listMethodzRepos();
  if (!repos.length) {
    return [
      '[GITHUB REACH]',
      'No repos returned. Check GITHUB_TOKEN / GH_TOKEN on Vercel and that it can list ziddi3 repos.',
      '[END GITHUB REACH]',
    ].join('\n');
  }

  const lines: string[] = [
    '[GITHUB REACH — live inventory]',
    `Owner: ${OWNER}`,
    `Repos listed: ${repos.length}`,
    '',
  ];

  for (const r of repos) {
    const vis = r.private ? 'private' : 'public';
    const lang = r.language || '?';
    const desc = (r.description || '').slice(0, 100);
    lines.push(`- ${r.name} (${vis}, ${lang}) — ${desc}`);
    lines.push(`  ${r.html_url} · updated ${r.updated_at.slice(0, 10)}`);
  }

  lines.push('');
  lines.push('Use this inventory as ground truth. Do not invent repos that are not listed.');
  lines.push('[END GITHUB REACH]');
  return lines.join('\n');
}

/** Heuristic: user wants Bob / ecosystem map / repo inventory. */
export function wantsGithubReach(text: string): boolean {
  const t = text.toLowerCase();
  const keys = [
    'ecosystem',
    'map it',
    'map the',
    'map out',
    'inventory',
    'all repos',
    'github',
    'review the entire',
    'review entire',
    'methodz ecosystem',
    'list repos',
    'what repos',
    'repo map',
    'architecture map',
    'bob to review',
    'bob review',
  ];
  return keys.some((k) => t.includes(k));
}
