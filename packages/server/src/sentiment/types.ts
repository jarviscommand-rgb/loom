// ============================================================
// LOOM — Country Sentiment Engine Types
//
// Core type definitions for the precision sentiment measurement
// instrument. Tracks real-world news, measures impact, weights
// by source credibility, and enables predictive analysis.
// ============================================================

// --- Enums & Primitives ---

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

/** Direction of editorial bias relative to current government. */
export type BiasDirection = 'pro-government' | 'anti-government' | 'neutral';

/** Event categorization for news articles. */
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

/** Classification of emotional sentiment type (beyond positive/negative). */
export type SentimentType =
  | 'fear'
  | 'hope'
  | 'anger'
  | 'trust'
  | 'pride'
  | 'confusion'
  | 'urgency'
  | 'apathy';

/** Downstream behavioral effects of sentiment. */
export type DownstreamEffect =
  | 'policy-support'
  | 'consumer-confidence'
  | 'investor-sentiment'
  | 'political-pressure'
  | 'social-amplification'
  | 'counter-narrative';

/** Scoring method used for sentiment analysis. */
export type ScoringMethod = 'llm' | 'lexicon' | 'hybrid';

/** Trend direction for time series. */
export type TrendDirection = 'improving' | 'declining' | 'stable' | 'volatile';

/** Source framing of an event. */
export type FramingType = 'positive' | 'negative' | 'neutral' | 'mixed';

// --- Source Types ---

/** Ownership structure of a media source. */
export interface SourceOwnership {
  /** Primary owner name. */
  owner: string;
  /** Parent conglomerate, if any. */
  conglomerate?: string;
  /** Known political affiliations of the owner. */
  politicalAffiliation?: string;
  /** Additional context on ownership structure. */
  notes: string;
}

/** Full profile of a media/news source. */
export interface MediaSource {
  /** Unique identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** ISO country code. */
  country: string;
  /** Languages used (ISO 639-1). */
  languages: string[];
  /** Primary URL. */
  url: string;
  /** RSS/Atom feed URLs for ingestion. */
  feedUrls: string[];
  /** Political orientation. */
  politicalLeaning: PoliticalLeaning;
  /** Ownership information. */
  ownership: SourceOwnership;
  /** Overarching editorial goal or theme. */
  editorialGoal: string;
  /** Factual reliability score (0-1). Higher = more reliable. */
  reliabilityScore: number;
  /** Target audience segments. */
  audienceTypes: AudienceType[];
  /** Bias direction relative to current government. */
  biasDirection: BiasDirection;
  /**
   * Computed signal weight for sentiment calculations.
   * Unexpected sentiment from this source is amplified; expected is dampened.
   */
  signalWeight: number;
  /** Whether this source is currently active for ingestion. */
  active: boolean;
}

// --- Article Types ---

/** Entity mentioned in an article. */
export interface ArticleEntity {
  /** Entity name as it appears in the article. */
  name: string;
  /** Entity type. */
  type: 'person' | 'organization' | 'location' | 'topic';
  /** Article's sentiment specifically toward this entity (-1 to 1). */
  sentimentToward: number;
  /** Role this entity plays in the article. */
  role: 'subject' | 'actor' | 'mentioned';
}

/** Sentiment score breakdown for an article. */
export interface SentimentScore {
  /** Overall sentiment (-1 to 1). */
  overall: number;
  /** Magnitude/strength of sentiment (0 to 1). */
  magnitude: number;
  /** Confidence in the scoring (0 to 1). */
  confidence: number;
  /** Which method was used. */
  method: ScoringMethod;
  /** Source-weighted score (adjusted for source reliability & bias). */
  weightedScore: number;
  /** The source weight that was applied. */
  sourceWeight: number;
}

/** Emotional sentiment type distribution. */
export interface SentimentTypeBreakdown {
  /** Emotional type. */
  type: SentimentType;
  /** Intensity of this emotion (0-1). */
  intensity: number;
  /** Confidence in this classification (0-1). */
  confidence: number;
}

/** Analysis of what makes an article effective at moving sentiment. */
export interface EffectivenessAnalysis {
  /** Source credibility factor (0-1). */
  sourceCredibility: number;
  /** Timing relevance — how well-timed was this? (0-1). */
  timingRelevance: number;
  /** Framing effectiveness — how well-constructed is the narrative? (0-1). */
  framingQuality: number;
  /** Emotional resonance — does the language connect? (0-1). */
  emotionalResonance: number;
  /** Novelty — is this new information or rehash? (0-1). */
  noveltyFactor: number;
  /** Summary explanation. */
  explanation: string;
}

/** Audience segment impacted by an article/event. */
export interface AudienceImpact {
  /** Audience segment. */
  segment: AudienceType;
  /** Estimated reach within this segment (0-1). */
  reach: number;
  /** Relevance to this audience (0-1). */
  relevance: number;
  /** Impact magnitude on this audience (0-1). */
  impact: number;
}

/** Downstream behavioral effect of an article/event. */
export interface DownstreamEffectAnalysis {
  /** Type of downstream effect. */
  effect: DownstreamEffect;
  /** Probability this effect occurs (0-1). */
  probability: number;
  /** Estimated magnitude (0-1). */
  magnitude: number;
  /** Direction: positive or negative for this effect type. */
  direction: 'positive' | 'negative';
  /** Brief description. */
  description: string;
}

/**
 * Narrative Impact Score (NIS) — universal composite metric.
 * Combines reach, sentiment shift, duration, source weight,
 * and audience relevance into ONE comparable number (0-100).
 */
export interface NarrativeImpactScore {
  /** The composite score (0-100). */
  score: number;
  /** Component breakdown. */
  components: {
    /** Sentiment shift magnitude component (0-20). */
    sentimentShift: number;
    /** Source credibility component (0-20). */
    sourceCredibility: number;
    /** Audience reach component (0-20). */
    audienceReach: number;
    /** Duration of impact component (0-20). */
    impactDuration: number;
    /** Cross-source amplification component (0-20). */
    amplification: number;
  };
  /** Percentile rank vs. historical articles. */
  percentile: number;
  /** Human-readable summary. */
  summary: string;
}

/** An ingested and analyzed article. */
export interface SentimentArticle {
  /** Unique identifier. */
  id: string;
  /** Source that published this article. */
  sourceId: string;
  /** Article title. */
  title: string;
  /** Full article content (cleaned). */
  content: string;
  /** Original URL. */
  url: string;
  /** Publication timestamp (ISO). */
  publishedAt: string;
  /** Ingestion timestamp (ISO). */
  ingestedAt: string;
  /** Article language (ISO 639-1). */
  language: string;

  // --- Analysis results ---
  /** Primary event category. */
  category: EventCategory;
  /** More specific subcategory. */
  subcategory?: string;
  /** Overall sentiment score. */
  sentiment: SentimentScore;
  /** Emotional type breakdown. */
  sentimentTypes: SentimentTypeBreakdown[];
  /** Entities mentioned. */
  entities: ArticleEntity[];
  /** Extracted topic tags. */
  topics: string[];
  /** Effectiveness analysis. */
  effectiveness: EffectivenessAnalysis;
  /** Audience impact breakdown. */
  audienceImpact: AudienceImpact[];
  /** Downstream behavioral effects. */
  downstreamEffects: DownstreamEffectAnalysis[];
  /** Narrative Impact Score. */
  nis: NarrativeImpactScore;

  // --- Graph integration ---
  /** Link to NarrativeEvent in main LOOM graph. */
  narrativeEventId?: string;
}

// --- Event Impact Types ---

/** Source-level breakdown for a sentiment event. */
export interface SourceEventBreakdown {
  /** Source ID. */
  sourceId: string;
  /** Number of articles from this source about this event. */
  articleCount: number;
  /** Average sentiment from this source. */
  avgSentiment: number;
  /** How this source framed the event. */
  framingType: FramingType;
}

/**
 * A measured sentiment event — an aggregation of articles
 * about the same real-world occurrence, with before/after
 * impact measurement.
 */
export interface SentimentEvent {
  /** Unique identifier. */
  id: string;
  /** Event title. */
  title: string;
  /** Event description. */
  description: string;
  /** Event category. */
  category: EventCategory;
  /** When the event occurred (ISO). */
  timestamp: string;

  // --- Impact measurement ---
  /** Article IDs that cover this event. */
  articleIds: string[];
  /** Baseline sentiment before event. */
  sentimentBefore: number;
  /** Measured sentiment after event. */
  sentimentAfter: number;
  /** Delta (after - before). */
  sentimentDelta: number;
  /** Absolute magnitude of impact. */
  impactMagnitude: number;
  /** Days until sentiment normalized. */
  impactDuration: number;
  /** Aggregate NIS for this event. */
  nis: NarrativeImpactScore;

  // --- Source analysis ---
  /** Breakdown by source. */
  sourceBreakdown: SourceEventBreakdown[];

  // --- Pattern matching ---
  /** Normalized pattern key for matching similar events. */
  eventPattern: string;
  /** IDs of historically similar events. */
  historicalSimilar: string[];
}

// --- Time Series Types ---

/** Single data point in a sentiment time series. */
export interface TimeSeriesPoint {
  /** Timestamp (ISO). */
  timestamp: string;
  /** Raw average sentiment. */
  sentiment: number;
  /** Number of articles in this period. */
  articleCount: number;
  /** Source-weighted sentiment. */
  weightedSentiment: number;
  /** Event IDs that influenced this point. */
  events: string[];
}

/** Sentiment time series for an entity or topic. */
export interface SentimentTimeSeries {
  /** Entity/topic identifier. */
  entityId: string;
  /** Display name. */
  entityName: string;
  /** Data points (chronological). */
  dataPoints: TimeSeriesPoint[];
  /** Overall trend direction. */
  trend: TrendDirection;
  /** 7-day moving average of latest sentiment. */
  movingAverage7d: number;
  /** 30-day moving average of latest sentiment. */
  movingAverage30d: number;
}

// --- Prediction Types ---

/** Input for predictive scenario analysis. */
export interface PredictionRequest {
  /** Description of the hypothetical event/announcement. */
  description: string;
  /** Category of the event. */
  category: EventCategory;
  /** Which entities are involved. */
  entities: string[];
  /** Hypothetical source of the announcement. */
  sourceType?: BiasDirection;
}

/** Output of predictive analysis. */
export interface PredictionResult {
  /** Predicted sentiment delta. */
  predictedDelta: number;
  /** Confidence interval. */
  confidenceInterval: [number, number];
  /** Confidence in the prediction (0-1). */
  confidence: number;
  /** Historical events used as basis. */
  basedOn: string[];
  /** Predicted sentiment type breakdown. */
  sentimentTypes: SentimentTypeBreakdown[];
  /** Predicted NIS score. */
  predictedNIS: number;
  /** Narrative explanation. */
  explanation: string;
}

// --- Dashboard Types ---

/** Aggregated dashboard data for a country. */
export interface SentimentDashboard {
  /** Country code. */
  country: string;
  /** Time range of the data. */
  timeRange: { from: string; to: string };
  /** Overall current sentiment. */
  currentSentiment: number;
  /** Sentiment trend. */
  trend: TrendDirection;
  /** Top events by NIS. */
  topEvents: SentimentEvent[];
  /** Category breakdown. */
  categoryBreakdown: Array<{
    category: EventCategory;
    articleCount: number;
    avgSentiment: number;
    avgNIS: number;
  }>;
  /** Most impactful sources. */
  topSources: Array<{
    sourceId: string;
    sourceName: string;
    articleCount: number;
    avgWeightedSentiment: number;
    signalStrength: number;
  }>;
  /** Active entities with sentiment trajectories. */
  activeEntities: Array<{
    name: string;
    sentiment: number;
    trend: TrendDirection;
    articleCount: number;
  }>;
  /** Total articles ingested. */
  totalArticles: number;
  /** Total events tracked. */
  totalEvents: number;
}
