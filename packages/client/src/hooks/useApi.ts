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

export const api = {
  getGraph: () => request<GraphSnapshot>('/graph'),
  getGraphAt: (ts: string) => request<GraphSnapshot>(`/graph/at/${ts}`),
  getEntities: () => request<Entity[]>('/entities'),
  getEvents: () => request<NarrativeEvent[]>('/events'),
  getTensions: () => request<Tension[]>('/tensions'),
  getActiveTensions: () => request<Tension[]>('/tensions/active'),
  getArcs: () => request<NarrativeArc[]>('/arcs'),
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
