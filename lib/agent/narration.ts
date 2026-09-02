import { routeSystemChat } from './router';

const TRUTH_STATES = new Set(['verified', 'mock', 'inferred', 'incomplete']);
const TELEMETRY_KEYS = ['sunlight', 'track_speed', 'core_speed', 'captured_at'] as const;

type NarrationContext = {
  contract_version?: string;
  task?: string;
  authority?: string;
  node?: {
    id?: string;
    label?: string;
    era?: string;
    role?: string;
    owner?: string;
    capabilities?: unknown[];
  };
  lead?: {
    fingerprint?: string | null;
    company?: string | null;
    service?: string | null;
    routing?: {
      trade?: string | null;
      requested_tenant?: string | null;
    } | null;
  } | null;
  telemetry?: Record<string, unknown> | null;
  recent_events?: Array<Record<string, unknown>>;
};

function clean(value: unknown, max = 320): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, max) : null;
}

function safeTelemetry(value: NarrationContext['telemetry']) {
  if (!value || typeof value !== 'object') return null;
  const result: Record<string, unknown> = {};
  for (const key of TELEMETRY_KEYS) {
    const item = value[key];
    if (item !== undefined && item !== null) result[key] = item;
  }
  return Object.keys(result).length ? result : null;
}

function safeEvents(events: NarrationContext['recent_events']) {
  if (!Array.isArray(events)) return [];
  return events.slice(-6).map((event) => {
    const truth = clean(event.truth, 32)?.toLowerCase() || 'incomplete';
    return {
      event_type: clean(event.event_type, 120) || 'unknown',
      truth: TRUTH_STATES.has(truth) ? truth : 'incomplete',
      message: clean(event.message, 300),
      timestamp: clean(event.timestamp, 64),
    };
  });
}

export function normalizeNarrationContext(input: NarrationContext) {
  const node = input?.node || {};
  const nodeId = clean(node.id, 120);
  const nodeLabel = clean(node.label, 160);
  const nodeRole = clean(node.role, 400);

  if (input?.task !== 'nexus_narration') throw new Error('task must be nexus_narration');
  if (input?.authority !== 'read_only_perception') throw new Error('authority must be read_only_perception');
  if (!nodeId || !nodeLabel || !nodeRole) throw new Error('node id, label, and role are required');

  const capabilities = Array.isArray(node.capabilities)
    ? node.capabilities.map((item) => clean(item, 100)).filter(Boolean).slice(0, 8)
    : [];

  return {
    contract_version: clean(input.contract_version, 32) || '1.0',
    task: 'nexus_narration',
    authority: 'read_only_perception',
    node: {
      id: nodeId,
      label: nodeLabel,
      era: clean(node.era, 80),
      role: nodeRole,
      owner: clean(node.owner, 160),
      capabilities,
    },
    lead: input.lead ? {
      fingerprint: clean(input.lead.fingerprint, 128),
      company: clean(input.lead.company, 200),
      service: clean(input.lead.service, 200),
      routing: input.lead.routing ? {
        trade: clean(input.lead.routing.trade, 120),
        requested_tenant: clean(input.lead.routing.requested_tenant, 160),
      } : null,
    } : null,
    telemetry: safeTelemetry(input.telemetry),
    recent_events: safeEvents(input.recent_events),
  };
}

export function deterministicNarration(context: ReturnType<typeof normalizeNarrationContext>) {
  const telemetry = context.telemetry
    ? ' Live Method Engine telemetry is available.'
    : ' Live telemetry is currently unavailable.';
  const lead = context.lead?.company
    ? ` The current lead is ${context.lead.company}${context.lead.routing?.trade ? `, classified for ${context.lead.routing.trade}` : ''}.`
    : '';
  return `${context.node.label} is ${context.node.role.charAt(0).toLowerCase()}${context.node.role.slice(1)}.${lead}${telemetry}`;
}

function narrationSystemPrompt() {
  return [
    'You are the read-only spatial voice of the Methodz Nexus.',
    'Describe the supplied node in 35 to 55 spoken words.',
    'Use plain speech, no Markdown, no lists, no JSON.',
    'Operational truth outranks lore or style.',
    'Never invent telemetry, persistence, buyer matches, payments, deployments, or successful actions.',
    'Treat verified, mock, inferred, and incomplete as authoritative evidence labels.',
    'If state is incomplete, say it is unavailable or incomplete rather than filling gaps.',
    'Node focus is perception only. Never claim that narration mutated a Methodz system.',
  ].join('\n');
}

export async function generateNarration(input: NarrationContext) {
  const context = normalizeNarrationContext(input);
  const fallback = deterministicNarration(context);
  const userMessage = `Narrate this bounded Nexus context:\n${JSON.stringify(context)}`;

  try {
    const text = (await routeSystemChat(narrationSystemPrompt(), userMessage, {
      temperature: 0.55,
      maxTokens: 110,
    })).replace(/\s+/g, ' ').trim();

    if (!text || text.startsWith('Tartus soft-link is offline right now')) {
      return { text: fallback, source: 'deterministic', context_version: context.contract_version };
    }

    return {
      text: text.slice(0, 900),
      source: 'methodz-ai-core',
      context_version: context.contract_version,
    };
  } catch {
    return { text: fallback, source: 'deterministic', context_version: context.contract_version };
  }
}
