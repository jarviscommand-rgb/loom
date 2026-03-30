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

// --- Sentiment Engine Types ---

/** Political leaning of a media source. */
export type PoliticalLeaning =
  | 'pro-government'
  | 'opposition'
  | 'independent'
  | 'military-aligned'
  | 'oligarch-owned'
  | 'state-media'
  | 'centrist'
  | 'islamic-conservative'
  | 'progressive';

/** Target audience segments. */
export type AudienceType =
  | 'elite-policy'
  | 'urban-middle'
  | 'rural-mass'
  | 'diaspora'
  | 'international'
  | 'youth-digital';

/** Direction of editorial bias. */
export type BiasDirection = 'pro-government' | 'anti-government' | 'neutral';

/** Event categorization. */
export type EventCategory =
  | 'political'
  | 'economic'
  | 'regulatory'
  | 'social'
  | 'technology'
  | 'military'
  | 'diplomatic'
  | 'environmental'
  | 'corruption'
  | 'infrastructure'
  | 'education'
  | 'health';

/** Emotional sentiment type. */
export type SentimentType =
  | 'fear'
  | 'hope'
  | 'anger'
  | 'trust'
  | 'pride'
  | 'confusion'
  | 'urgency'
  | 'apathy';

/** Downstream behavioral effect type. */
export type DownstreamEffect =
  | 'policy-support'
  | 'consumer-confidence'
  | 'investor-sentiment'
  | 'political-pressure'
  | 'social-amplification'
  | 'counter-narrative';

/** Trend direction. */
export type TrendDirection = 'improving' | 'declining' | 'stable' | 'volatile';

/** Source framing. */
export type FramingType = 'positive' | 'negative' | 'neutral' | 'mixed';

/** Ownership structure of a media source. */
export interface SourceOwnership {
  owner: string;
  conglomerate?: string;
  politicalAffiliation?: string;
  notes: string;
}

/** Full profile of a media/news source. */
export interface MediaSource {
  id: string;
  name: string;
  country: string;
  languages: string[];
  url: string;
  feedUrls: string[];
  politicalLeaning: PoliticalLeaning;
  ownership: SourceOwnership;
  editorialGoal: string;
  reliabilityScore: number;
  audienceTypes: AudienceType[];
  biasDirection: BiasDirection;
  signalWeight: number;
  active: boolean;
}

/** Entity mentioned in an article. */
export interface ArticleEntity {
  name: string;
  type: 'person' | 'organization' | 'location' | 'topic';
  sentimentToward: number;
  role: 'subject' | 'actor' | 'mentioned';
}

/** Sentiment score breakdown. */
export interface SentimentScore {
  overall: number;
  magnitude: number;
  confidence: number;
  method: 'llm' | 'lexicon' | 'hybrid';
  weightedScore: number;
  sourceWeight: number;
}

/** Emotional sentiment type distribution. */
export interface SentimentTypeBreakdown {
  type: SentimentType;
  intensity: number;
  confidence: number;
}

/** Effectiveness analysis. */
export interface EffectivenessAnalysis {
  sourceCredibility: number;
  timingRelevance: number;
  framingQuality: number;
  emotionalResonance: number;
  noveltyFactor: number;
  explanation: string;
}

/** Audience segment impact. */
export interface AudienceImpact {
  segment: AudienceType;
  reach: number;
  relevance: number;
  impact: number;
}

/** Downstream behavioral effect analysis. */
export interface DownstreamEffectAnalysis {
  effect: DownstreamEffect;
  probability: number;
  magnitude: number;
  direction: 'positive' | 'negative';
  description: string;
}

/** Narrative Impact Score (NIS). */
export interface NarrativeImpactScore {
  score: number;
  components: {
    sentimentShift: number;
    sourceCredibility: number;
    audienceReach: number;
    impactDuration: number;
    amplification: number;
  };
  percentile: number;
  summary: string;
}

/** An ingested and analyzed article. */
export interface SentimentArticle {
  id: string;
  sourceId: string;
  title: string;
  content: string;
  url: string;
  publishedAt: string;
  ingestedAt: string;
  language: string;
  category: EventCategory;
  subcategory?: string;
  sentiment: SentimentScore;
  sentimentTypes: SentimentTypeBreakdown[];
  entities: ArticleEntity[];
  topics: string[];
  effectiveness: EffectivenessAnalysis;
  audienceImpact: AudienceImpact[];
  downstreamEffects: DownstreamEffectAnalysis[];
  nis: NarrativeImpactScore;
  narrativeEventId?: string;
}

/** Source-level breakdown for a sentiment event. */
export interface SourceEventBreakdown {
  sourceId: string;
  articleCount: number;
  avgSentiment: number;
  framingType: FramingType;
}

/** A measured sentiment event. */
export interface SentimentEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  timestamp: string;
  articleIds: string[];
  sentimentBefore: number;
  sentimentAfter: number;
  sentimentDelta: number;
  impactMagnitude: number;
  impactDuration: number;
  nis: NarrativeImpactScore;
  sourceBreakdown: SourceEventBreakdown[];
  eventPattern: string;
  historicalSimilar: string[];
}

/** Single data point in a sentiment time series. */
export interface TimeSeriesPoint {
  timestamp: string;
  sentiment: number;
  articleCount: number;
  weightedSentiment: number;
  events: string[];
}

/** Sentiment time series for an entity. */
export interface SentimentTimeSeries {
  entityId: string;
  entityName: string;
  dataPoints: TimeSeriesPoint[];
  trend: TrendDirection;
  movingAverage7d: number;
  movingAverage30d: number;
}

/** Aggregated dashboard data for a country. */
export interface SentimentDashboardData {
  country: string;
  timeRange: { from: string; to: string };
  currentSentiment: number;
  trend: TrendDirection;
  topEvents: SentimentEvent[];
  categoryBreakdown: Array<{
    category: EventCategory;
    articleCount: number;
    avgSentiment: number;
    avgNIS: number;
  }>;
  topSources: Array<{
    sourceId: string;
    sourceName: string;
    articleCount: number;
    avgWeightedSentiment: number;
    signalStrength: number;
  }>;
  activeEntities: Array<{
    name: string;
    sentiment: number;
    trend: TrendDirection;
    articleCount: number;
  }>;
  totalArticles: number;
  totalEvents: number;
}

/** Filters for sentiment article queries. */
export interface SentimentFilters {
  category?: EventCategory;
  sourceId?: string;
  entity?: string;
  minNIS?: number;
}

/** Sentiment API methods. */
export const sentimentApi = {
  /** Fetch aggregated dashboard data. */
  getDashboard: (country = 'ID') =>
    request<SentimentDashboardData>(`/sentiment/dashboard?country=${country}`),

  /** Fetch articles with optional filters. */
  getArticles: (filters?: SentimentFilters, params?: PaginationParams) => {
    const query = new URLSearchParams();
    if (filters?.category) query.set('category', filters.category);
    if (filters?.sourceId) query.set('sourceId', filters.sourceId);
    if (filters?.entity) query.set('entity', filters.entity);
    if (filters?.minNIS !== undefined) query.set('minNIS', String(filters.minNIS));
    if (params?.limit !== undefined) query.set('limit', String(params.limit));
    if (params?.offset !== undefined) query.set('offset', String(params.offset));
    const qs = query.toString();
    return request<PaginatedResponse<SentimentArticle>>(`/sentiment/articles${qs ? `?${qs}` : ''}`);
  },

  /** Fetch a single article by ID. */
  getArticle: (id: string) => request<SentimentArticle>(`/sentiment/articles/${id}`),

  /** Fetch sentiment timeline for an entity. */
  getTimeline: (entity: string, interval = 'day') =>
    request<SentimentTimeSeries>(
      `/sentiment/timeline/${encodeURIComponent(entity)}?interval=${interval}`
    ),

  /** Fetch all media sources. */
  getSources: () => request<MediaSource[]>('/sentiment/sources'),

  /** Fetch a single source profile. */
  getSource: (id: string) => request<MediaSource>(`/sentiment/sources/${id}`),

  /** Fetch sentiment events. */
  getEvents: (params?: PaginationParams) =>
    request<PaginatedResponse<SentimentEvent>>(`/sentiment/events${buildQuery(params)}`),

  /** Load Indonesia demo data. */
  loadDemo: () =>
    request<{ message: string; articles: number }>('/sentiment/demo/load', { method: 'POST' }),
};
