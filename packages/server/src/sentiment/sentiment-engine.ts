// ============================================================
// LOOM — Sentiment Engine
//
// Central orchestrator for the country sentiment analysis system.
// Ties together ingestion, analysis, source registry, and storage.
// ============================================================

import { v4 as uuid } from 'uuid';
import type {
  SentimentArticle,
  SentimentEvent,
  SentimentTimeSeries,
  SentimentDashboard,
  PredictionRequest,
  PredictionResult,
  EventCategory,
  MediaSource,
  TrendDirection,
} from './types.js';
import { SourceRegistry } from './sources/source-registry.js';
import { computeSentimentScore, classifySentimentTypes } from './analysis/sentiment-scorer.js';
import { classifyCategory } from './analysis/category-classifier.js';
import {
  computeArticleNIS,
  analyzeEffectiveness,
  estimateAudienceImpact,
  predictDownstreamEffects,
} from './analysis/impact-calculator.js';
import { buildTimeSeries } from './analysis/trend-tracker.js';
import { INDONESIA_DEMO_ARTICLES } from './demo/indonesia-demo.js';

// ============================================================
// Types for ingestion input
// ============================================================

/** Raw article input for ingestion. */
export interface ArticleInput {
  title: string;
  content: string;
  url?: string;
  sourceId: string;
  publishedAt?: string;
  language?: string;
}

// ============================================================
// Sentiment Engine
// ============================================================

/**
 * Central sentiment analysis engine.
 * Manages articles, events, sources, and analytics.
 */
export class SentimentEngine {
  private articles: Map<string, SentimentArticle> = new Map();
  private events: Map<string, SentimentEvent> = new Map();
  readonly sources: SourceRegistry;

  constructor() {
    this.sources = new SourceRegistry();
  }

  // --- Ingestion ---

  /**
   * Ingest and analyze a batch of articles.
   * Each article is scored for sentiment, categorized, and measured for impact.
   */
  ingestArticles(inputs: ArticleInput[]): SentimentArticle[] {
    const results: SentimentArticle[] = [];

    for (const input of inputs) {
      const article = this.processArticle(input);
      this.articles.set(article.id, article);
      results.push(article);
    }

    return results;
  }

  /** Process a single article through the full analysis pipeline. */
  private processArticle(input: ArticleInput): SentimentArticle {
    const id = uuid();
    const source = this.sources.getById(input.sourceId);
    const now = new Date().toISOString();

    // Default source for unknown sourceIds
    const defaultSource: MediaSource = {
      id: input.sourceId,
      name: input.sourceId,
      country: 'ID',
      languages: ['id'],
      url: '',
      feedUrls: [],
      politicalLeaning: 'independent',
      ownership: { owner: 'Unknown', notes: '' },
      editorialGoal: 'Unknown',
      reliabilityScore: 0.5,
      audienceTypes: ['urban-middle'],
      biasDirection: 'neutral',
      signalWeight: 1.0,
      active: true,
    };

    const effectiveSource = source || defaultSource;

    // Step 1: Classify category
    const { category } = classifyCategory(input.title, input.content);

    // Step 2: Score sentiment
    const sentimentDirection = this.detectDirection(input.title + ' ' + input.content);
    const aboutGovernment = this.isAboutGovernment(input.title + ' ' + input.content);
    const sentiment = computeSentimentScore(
      input.content,
      effectiveSource,
      sentimentDirection,
      aboutGovernment
    );

    // Step 3: Classify sentiment types
    const sentimentTypes = classifySentimentTypes(input.content);

    // Step 4: Extract entities (simple keyword-based)
    const entities = this.extractArticleEntities(input.title, input.content);

    // Step 5: Extract topics
    const topics = this.extractTopics(input.title, input.content);

    // Step 6: Effectiveness analysis
    const effectiveness = analyzeEffectiveness(
      input.content,
      effectiveSource,
      this.isTimely(input.publishedAt),
      true // assume novel for now
    );

    // Step 7: Audience impact
    const audienceImpact = estimateAudienceImpact(effectiveSource, category, sentiment.magnitude);

    // Step 8: Downstream effects
    const downstreamEffects = predictDownstreamEffects(
      category,
      sentiment.overall,
      sentiment.magnitude,
      effectiveSource.reliabilityScore
    );

    // Step 9: Compute NIS
    const nis = computeArticleNIS(
      { sentiment, audienceImpact, effectiveness },
      effectiveSource,
      1 // single source for now
    );

    return {
      id,
      sourceId: input.sourceId,
      title: input.title,
      content: input.content,
      url: input.url || '',
      publishedAt: input.publishedAt || now,
      ingestedAt: now,
      language: input.language || 'id',
      category,
      sentiment,
      sentimentTypes,
      entities,
      topics,
      effectiveness,
      audienceImpact,
      downstreamEffects,
      nis,
    };
  }

  // --- Retrieval ---

  /** Get all articles, sorted by publication date descending. */
  getArticles(): SentimentArticle[] {
    return Array.from(this.articles.values()).sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  /** Get a single article by ID. */
  getArticleById(id: string): SentimentArticle | undefined {
    return this.articles.get(id);
  }

  /** Get all events. */
  getEvents(): SentimentEvent[] {
    return Array.from(this.events.values());
  }

  /** Get a source by ID. */
  getSourceById(id: string): MediaSource | undefined {
    return this.sources.getById(id);
  }

  /** Get all sources. */
  getSources(): MediaSource[] {
    return this.sources.getAll();
  }

  // --- Analytics ---

  /** Build sentiment timeline for an entity. */
  getTimeline(entityName: string, intervalDays: number = 1): SentimentTimeSeries {
    return buildTimeSeries(entityName, this.getArticles(), intervalDays);
  }

  /** Get category breakdown. */
  getCategoryBreakdown(): Array<{
    category: EventCategory;
    articleCount: number;
    avgSentiment: number;
    avgNIS: number;
  }> {
    const articles = this.getArticles();
    const categoryMap = new Map<
      EventCategory,
      { count: number; sentimentSum: number; nisSum: number }
    >();

    for (const article of articles) {
      const existing = categoryMap.get(article.category) || {
        count: 0,
        sentimentSum: 0,
        nisSum: 0,
      };
      existing.count++;
      existing.sentimentSum += article.sentiment.weightedScore;
      existing.nisSum += article.nis.score;
      categoryMap.set(article.category, existing);
    }

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        articleCount: data.count,
        avgSentiment: Math.round((data.sentimentSum / data.count) * 1000) / 1000,
        avgNIS: Math.round((data.nisSum / data.count) * 10) / 10,
      }))
      .sort((a, b) => b.articleCount - a.articleCount);
  }

  /** Compare sentiment across multiple entities. */
  compareEntities(entityNames: string[]): Array<{ name: string; timeline: SentimentTimeSeries }> {
    return entityNames.map((name) => ({
      name,
      timeline: this.getTimeline(name),
    }));
  }

  /** Get aggregated dashboard data. */
  getDashboard(country: string): SentimentDashboard {
    const articles = this.getArticles();
    const events = this.getEvents();
    const categoryBreakdown = this.getCategoryBreakdown();

    // Current sentiment (average of last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const recentArticles = articles.filter((a) => a.publishedAt >= sevenDaysAgo);
    const currentSentiment =
      recentArticles.length > 0
        ? recentArticles.reduce((s, a) => s + a.sentiment.weightedScore, 0) / recentArticles.length
        : 0;

    // Trend detection
    const trend: TrendDirection =
      recentArticles.length < 3
        ? 'stable'
        : currentSentiment > 0.1
          ? 'improving'
          : currentSentiment < -0.1
            ? 'declining'
            : 'stable';

    // Top events by NIS
    const topEvents = [...events].sort((a, b) => b.nis.score - a.nis.score).slice(0, 10);

    // Top sources
    const sourceStats = new Map<
      string,
      { name: string; count: number; sentimentSum: number; signalSum: number }
    >();
    for (const article of articles) {
      const source = this.sources.getById(article.sourceId);
      const existing = sourceStats.get(article.sourceId) || {
        name: source?.name || article.sourceId,
        count: 0,
        sentimentSum: 0,
        signalSum: 0,
      };
      existing.count++;
      existing.sentimentSum += article.sentiment.weightedScore;
      existing.signalSum += article.sentiment.sourceWeight;
      sourceStats.set(article.sourceId, existing);
    }

    const topSources = Array.from(sourceStats.entries())
      .map(([sourceId, data]) => ({
        sourceId,
        sourceName: data.name,
        articleCount: data.count,
        avgWeightedSentiment: Math.round((data.sentimentSum / data.count) * 1000) / 1000,
        signalStrength: Math.round((data.signalSum / data.count) * 1000) / 1000,
      }))
      .sort((a, b) => b.articleCount - a.articleCount)
      .slice(0, 10);

    // Active entities
    const entityMentions = new Map<string, { sentiment: number; count: number }>();
    for (const article of recentArticles) {
      for (const entity of article.entities) {
        const existing = entityMentions.get(entity.name) || { sentiment: 0, count: 0 };
        existing.sentiment += entity.sentimentToward;
        existing.count++;
        entityMentions.set(entity.name, existing);
      }
    }

    const activeEntities = Array.from(entityMentions.entries())
      .map(([name, data]) => ({
        name,
        sentiment: Math.round((data.sentiment / data.count) * 1000) / 1000,
        trend: (data.sentiment / data.count > 0.1
          ? 'improving'
          : data.sentiment / data.count < -0.1
            ? 'declining'
            : 'stable') as TrendDirection,
        articleCount: data.count,
      }))
      .sort((a, b) => b.articleCount - a.articleCount)
      .slice(0, 15);

    const timeRange = {
      from:
        articles.length > 0 ? articles[articles.length - 1].publishedAt : new Date().toISOString(),
      to: articles.length > 0 ? articles[0].publishedAt : new Date().toISOString(),
    };

    return {
      country,
      timeRange,
      currentSentiment: Math.round(currentSentiment * 1000) / 1000,
      trend,
      topEvents,
      categoryBreakdown,
      topSources,
      activeEntities,
      totalArticles: articles.length,
      totalEvents: events.length,
    };
  }

  /** Predict sentiment impact of a hypothetical event. */
  predict(request: PredictionRequest): PredictionResult {
    const articles = this.getArticles();

    // Find historically similar articles by category and entities
    const similar = articles.filter(
      (a) =>
        a.category === request.category &&
        request.entities.some((e) =>
          a.entities.some((ae) => ae.name.toLowerCase().includes(e.toLowerCase()))
        )
    );

    if (similar.length === 0) {
      // Fallback: just category match
      const categorySimilar = articles.filter((a) => a.category === request.category);
      const avgDelta =
        categorySimilar.length > 0
          ? categorySimilar.reduce((s, a) => s + a.sentiment.weightedScore, 0) /
            categorySimilar.length
          : 0;

      return {
        predictedDelta: avgDelta,
        confidenceInterval: [avgDelta - 0.3, avgDelta + 0.3],
        confidence: 0.2,
        basedOn: [],
        sentimentTypes: classifySentimentTypes(request.description),
        predictedNIS: 30,
        explanation:
          'Low confidence prediction — insufficient historical data for this entity-category combination.',
      };
    }

    const avgDelta = similar.reduce((s, a) => s + a.sentiment.weightedScore, 0) / similar.length;
    const avgNIS = similar.reduce((s, a) => s + a.nis.score, 0) / similar.length;
    const stdDev = Math.sqrt(
      similar.reduce((s, a) => s + (a.sentiment.weightedScore - avgDelta) ** 2, 0) / similar.length
    );

    const confidence = Math.min(similar.length / 20, 0.85);

    return {
      predictedDelta: Math.round(avgDelta * 1000) / 1000,
      confidenceInterval: [
        Math.round((avgDelta - 1.96 * stdDev) * 1000) / 1000,
        Math.round((avgDelta + 1.96 * stdDev) * 1000) / 1000,
      ],
      confidence: Math.round(confidence * 100) / 100,
      basedOn: similar.slice(0, 5).map((a) => a.id),
      sentimentTypes: classifySentimentTypes(request.description),
      predictedNIS: Math.round(avgNIS * 10) / 10,
      explanation: `Based on ${similar.length} historically similar articles in the "${request.category}" category. Average weighted sentiment was ${avgDelta > 0 ? 'positive' : 'negative'} (${avgDelta.toFixed(3)}).`,
    };
  }

  /** Load demo data. Returns number of articles loaded. */
  loadDemoData(): number {
    const articles = this.ingestArticles(INDONESIA_DEMO_ARTICLES);
    return articles.length;
  }

  /** Clear all data. */
  clear(): void {
    this.articles.clear();
    this.events.clear();
  }

  // --- Private helpers ---

  /** Simple direction detection based on positive vs negative word density. */
  private detectDirection(text: string): 'positive' | 'negative' {
    const lower = text.toLowerCase();
    const positiveHits = [
      'success',
      'growth',
      'improve',
      'achieve',
      'progress',
      'sukses',
      'tumbuh',
      'maju',
    ].filter((w) => lower.includes(w)).length;
    const negativeHits = [
      'crisis',
      'fail',
      'decline',
      'threat',
      'scandal',
      'krisis',
      'gagal',
      'ancaman',
    ].filter((w) => lower.includes(w)).length;
    return positiveHits >= negativeHits ? 'positive' : 'negative';
  }

  /** Check if text is about government/political figures. */
  private isAboutGovernment(text: string): boolean {
    const lower = text.toLowerCase();
    const govKeywords = [
      'government',
      'president',
      'minister',
      'cabinet',
      'parliament',
      'pemerintah',
      'presiden',
      'menteri',
      'kabinet',
      'DPR',
      'prabowo',
      'jokowi',
      'gubernur',
      'kebijakan',
    ];
    return govKeywords.some((k) => lower.includes(k));
  }

  /** Check if an article is timely (within last 24 hours). */
  private isTimely(publishedAt?: string): boolean {
    if (!publishedAt) return true;
    const pubTime = new Date(publishedAt).getTime();
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return pubTime >= dayAgo;
  }

  /** Simple entity extraction from text. */
  private extractArticleEntities(title: string, content: string): SentimentArticle['entities'] {
    const text = `${title} ${content}`;
    const entities: SentimentArticle['entities'] = [];

    // Known Indonesian political entities
    const knownEntities: Array<{
      name: string;
      type: 'person' | 'organization';
      patterns: string[];
    }> = [
      { name: 'Prabowo Subianto', type: 'person', patterns: ['prabowo'] },
      { name: 'Joko Widodo', type: 'person', patterns: ['jokowi', 'joko widodo'] },
      { name: 'Gibran Rakabuming', type: 'person', patterns: ['gibran'] },
      { name: 'Bank Indonesia', type: 'organization', patterns: ['bank indonesia', 'bi '] },
      { name: 'DPR', type: 'organization', patterns: ['dpr', 'parlemen'] },
      { name: 'KPK', type: 'organization', patterns: ['kpk', 'anti-corruption'] },
      { name: 'TNI', type: 'organization', patterns: ['tni', 'military', 'militer'] },
      { name: 'ASEAN', type: 'organization', patterns: ['asean'] },
      { name: 'China', type: 'organization', patterns: ['china', 'tiongkok', 'beijing'] },
      {
        name: 'United States',
        type: 'organization',
        patterns: ['united states', 'amerika', 'washington'],
      },
    ];

    const textLower = text.toLowerCase();

    for (const entity of knownEntities) {
      const found = entity.patterns.some((p) => textLower.includes(p));
      if (found) {
        // Simple sentiment toward entity based on surrounding context
        const sentimentToward = this.estimateEntitySentiment(textLower, entity.patterns);
        entities.push({
          name: entity.name,
          type: entity.type,
          sentimentToward,
          role: title.toLowerCase().includes(entity.patterns[0]) ? 'subject' : 'mentioned',
        });
      }
    }

    return entities;
  }

  /** Estimate sentiment toward a specific entity in text. */
  private estimateEntitySentiment(text: string, patterns: string[]): number {
    // Simple: check positive/negative words near entity mentions
    for (const pattern of patterns) {
      const idx = text.indexOf(pattern);
      if (idx === -1) continue;

      const window = text.slice(Math.max(0, idx - 100), idx + pattern.length + 100);
      const positiveWords = [
        'success',
        'praise',
        'achieve',
        'reform',
        'strong',
        'sukses',
        'puji',
        'kuat',
      ];
      const negativeWords = ['fail', 'corrupt', 'scandal', 'weak', 'gagal', 'korupsi', 'lemah'];

      const pos = positiveWords.filter((w) => window.includes(w)).length;
      const neg = negativeWords.filter((w) => window.includes(w)).length;

      if (pos + neg === 0) return 0;
      return (pos - neg) / (pos + neg);
    }
    return 0;
  }

  /** Extract topic tags from text. */
  private extractTopics(title: string, content: string): string[] {
    const text = `${title} ${content}`.toLowerCase();
    const topics: string[] = [];

    const topicKeywords: Record<string, string[]> = {
      'economic-growth': ['gdp', 'growth', 'pertumbuhan', 'ekonomi'],
      'foreign-investment': ['investment', 'investor', 'investasi', 'FDI'],
      infrastructure: ['infrastructure', 'IKN', 'pembangunan', 'infrastruktur'],
      corruption: ['corruption', 'KPK', 'korupsi', 'suap'],
      defense: ['military', 'defense', 'TNI', 'pertahanan', 'alutsista'],
      'digital-economy': ['digital', 'startup', 'fintech', 'e-commerce'],
      energy: ['energy', 'oil', 'gas', 'energi', 'minyak', 'solar'],
      education: ['education', 'university', 'pendidikan', 'kampus'],
      healthcare: ['health', 'hospital', 'BPJS', 'kesehatan'],
      climate: ['climate', 'carbon', 'deforestation', 'iklim', 'hutan'],
    };

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some((k) => text.includes(k))) {
        topics.push(topic);
      }
    }

    return topics;
  }
}
