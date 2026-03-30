const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

function buildQuery(params?: PaginationParams): string {
  if (!params) return '';
  const query = new URLSearchParams();
  if (params.limit !== undefined) query.set('limit', String(params.limit));
  if (params.offset !== undefined) query.set('offset', String(params.offset));
  const str = query.toString();
  return str ? `?${str}` : '';
}

/**
 * Unwraps a paginated response, returning just the data array.
 * Handles both paginated `{ data, total, limit, offset }` and raw array formats
 * for backwards compatibility.
 */
function unwrapPaginated<T>(response: PaginatedResponse<T> | T[]): T[] {
  if (Array.isArray(response)) return response;
  return response.data;
}

export const api = {
  getGraph: () => request<GraphSnapshot>('/graph'),
  getGraphAt: (ts: string) => request<GraphSnapshot>(`/graph/at/${ts}`),

  /** Fetch entities. Returns paginated response with metadata. */
  getEntitiesPaginated: (params?: PaginationParams) =>
    request<PaginatedResponse<Entity>>(`/entities${buildQuery(params)}`),
  /** Fetch entities. Returns just the data array for convenience. */
  getEntities: async (params?: PaginationParams): Promise<Entity[]> => {
    const res = await request<PaginatedResponse<Entity> | Entity[]>(
      `/entities${buildQuery(params)}`
    );
    return unwrapPaginated(res);
  },

  getEntity: (id: string) => request<Entity>(`/entities/${id}`),
  getEntityEvents: async (id: string, params?: PaginationParams): Promise<NarrativeEvent[]> => {
    const res = await request<PaginatedResponse<NarrativeEvent> | NarrativeEvent[]>(
      `/entities/${id}/events${buildQuery(params)}`
    );
    return unwrapPaginated(res);
  },

  /** Fetch events. Returns paginated response with metadata. */
  getEventsPaginated: (params?: PaginationParams) =>
    request<PaginatedResponse<NarrativeEvent>>(`/events${buildQuery(params)}`),
  /** Fetch events. Returns just the data array for convenience. */
  getEvents: async (params?: PaginationParams): Promise<NarrativeEvent[]> => {
    const res = await request<PaginatedResponse<NarrativeEvent> | NarrativeEvent[]>(
      `/events${buildQuery(params)}`
    );
    return unwrapPaginated(res);
  },

  getEventsInRange: (from: string, to: string) =>
    request<NarrativeEvent[]>(`/events/range?from=${from}&to=${to}`),

  /** Fetch tensions. Returns paginated response with metadata. */
  getTensionsPaginated: (params?: PaginationParams) =>
    request<PaginatedResponse<Tension>>(`/tensions${buildQuery(params)}`),
  /** Fetch tensions. Returns just the data array for convenience. */
  getTensions: async (params?: PaginationParams): Promise<Tension[]> => {
    const res = await request<PaginatedResponse<Tension> | Tension[]>(
      `/tensions${buildQuery(params)}`
    );
    return unwrapPaginated(res);
  },

  getActiveTensions: () => request<Tension[]>('/tensions/active'),

  /** Fetch arcs. Returns paginated response with metadata. */
  getArcsPaginated: (params?: PaginationParams) =>
    request<PaginatedResponse<NarrativeArc>>(`/arcs${buildQuery(params)}`),
  /** Fetch arcs. Returns just the data array for convenience. */
  getArcs: async (params?: PaginationParams): Promise<NarrativeArc[]> => {
    const res = await request<PaginatedResponse<NarrativeArc> | NarrativeArc[]>(
      `/arcs${buildQuery(params)}`
    );
    return unwrapPaginated(res);
  },

  getPressurePoints: () => request<PressurePoint[]>('/analysis/pressure-points'),
  generateDreams: () => request<DreamBranch[]>('/analysis/dream', { method: 'POST' }),
  extractNarrative: (text: string) =>
    request<ExtractionResult>('/extract', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
  loadDemo: () => request<GraphSnapshot>('/demo/load', { method: 'POST' }),
  reset: () => request<{ message: string }>('/demo/reset', { method: 'POST' }),
};

// Types mirrored from server
export interface Entity {
  id: string;
  name: string;
  type: string;
  motivation: string;
  capability: string;
  alliances: string[];
  description: string;
  firstSeen: string;
  lastSeen: string;
}

export interface NarrativeEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  participants: string[];
  causalPredecessors: string[];
  impact: number;
  sentiment: number;
}

export interface Tension {
  id: string;
  name: string;
  description: string;
  parties: [string, string];
  status: string;
  intensity: number;
  duration: number;
  relatedEvents: string[];
  validFrom: string;
  validTo?: string;
}

export interface NarrativeArc {
  id: string;
  name: string;
  description: string;
  phase: string;
  characters: string[];
  events: string[];
  tensions: string[];
  startDate: string;
  endDate?: string;
}

export interface DreamBranch {
  id: string;
  title: string;
  narrative: string;
  probability: number;
  triggerEvents: string[];
  consequences: string[];
  affectedEntities: string[];
}

export interface PressurePoint {
  tensionId: string;
  tensionName: string;
  score: number;
  factors: { duration: number; escalation: number; convergence: number };
  narrative: string;
}

export interface GraphSnapshot {
  entities: Entity[];
  events: NarrativeEvent[];
  tensions: Tension[];
  arcs: NarrativeArc[];
  timestamp: string;
}

export interface ExtractionResult {
  entities: Entity[];
  events: NarrativeEvent[];
  tensions: Tension[];
  arcs: NarrativeArc[];
}
