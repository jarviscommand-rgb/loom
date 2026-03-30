import { describe, it, expect } from 'vitest';
import { buildTimeSeries, measureImpact, detectTrend } from './trend-tracker';
import type { SentimentArticle, TimeSeriesPoint } from '../types';

function makeArticle(overrides: Partial<SentimentArticle> = {}): SentimentArticle {
  return {
    id: 'art-1',
    sourceId: 'test-source',
    title: 'Test article about TestEntity',
    content: 'Content mentioning TestEntity in detail.',
    url: 'https://test.example.com/article',
    publishedAt: '2026-01-15T10:00:00Z',
    ingestedAt: '2026-01-15T10:05:00Z',
    language: 'en',
    category: 'political',
    sentiment: {
      overall: 0.5,
      magnitude: 0.7,
      confidence: 0.6,
      method: 'lexicon',
      weightedScore: 0.4,
      sourceWeight: 0.8,
    },
    sentimentTypes: [],
    entities: [{ name: 'TestEntity', type: 'person', sentimentToward: 0.5, role: 'subject' }],
    topics: ['politics'],
    effectiveness: {
      sourceCredibility: 0.8,
      timingRelevance: 0.7,
      framingQuality: 0.6,
      emotionalResonance: 0.5,
      noveltyFactor: 0.7,
      explanation: 'Test',
    },
    audienceImpact: [],
    downstreamEffects: [],
    nis: {
      score: 50,
      components: {
        sentimentShift: 10,
        sourceCredibility: 10,
        audienceReach: 10,
        impactDuration: 10,
        amplification: 10,
      },
      percentile: 50,
      summary: 'Test',
    },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// buildTimeSeries
// ---------------------------------------------------------------------------
describe('buildTimeSeries', () => {
  it('returns empty data points for empty articles array', () => {
    const result = buildTimeSeries('TestEntity', []);
    expect(result.dataPoints).toHaveLength(0);
    expect(result.entityName).toBe('TestEntity');
  });

  it('builds series for a single article', () => {
    const articles = [makeArticle()];
    const result = buildTimeSeries('TestEntity', articles);
    expect(result.dataPoints.length).toBe(1);
    expect(result.dataPoints[0].articleCount).toBe(1);
    expect(result.entityName).toBe('TestEntity');
  });

  it('builds series for many articles across multiple days', () => {
    const articles = Array.from({ length: 10 }, (_, i) =>
      makeArticle({
        id: `art-${i}`,
        publishedAt: new Date(2026, 0, 15 + i).toISOString(),
        sentiment: {
          overall: 0.1 * i - 0.5,
          magnitude: 0.5,
          confidence: 0.6,
          method: 'lexicon',
          weightedScore: 0.1 * i - 0.3,
          sourceWeight: 0.8,
        },
      })
    );
    const result = buildTimeSeries('TestEntity', articles);
    expect(result.dataPoints.length).toBeGreaterThanOrEqual(1);
    // All points should have articleCount > 0
    for (const point of result.dataPoints) {
      expect(point.articleCount).toBeGreaterThan(0);
    }
  });

  it('filters articles by entity name (case-insensitive)', () => {
    const relevant = makeArticle({
      id: 'rel',
      title: 'News about TestEntity',
      entities: [{ name: 'TestEntity', type: 'person', sentimentToward: 0.5, role: 'subject' }],
    });
    const irrelevant = makeArticle({
      id: 'irr',
      title: 'Completely unrelated news',
      content: 'Nothing about that entity here.',
      entities: [{ name: 'OtherEntity', type: 'person', sentimentToward: 0.3, role: 'subject' }],
    });
    const result = buildTimeSeries('TestEntity', [relevant, irrelevant]);
    // Should include the relevant article (entity match)
    expect(result.dataPoints.length).toBeGreaterThanOrEqual(1);
    const totalArticles = result.dataPoints.reduce((sum, p) => sum + p.articleCount, 0);
    expect(totalArticles).toBeGreaterThanOrEqual(1);
  });

  it('computes 7-day and 30-day moving averages', () => {
    const articles = Array.from({ length: 35 }, (_, i) =>
      makeArticle({
        id: `art-${i}`,
        publishedAt: new Date(2026, 0, 1 + i).toISOString(),
        sentiment: {
          overall: 0.3,
          magnitude: 0.5,
          confidence: 0.6,
          method: 'lexicon',
          weightedScore: 0.3,
          sourceWeight: 0.8,
        },
      })
    );
    const result = buildTimeSeries('TestEntity', articles);
    expect(typeof result.movingAverage7d).toBe('number');
    expect(typeof result.movingAverage30d).toBe('number');
  });

  it('detects trend direction', () => {
    const articles = Array.from({ length: 10 }, (_, i) =>
      makeArticle({
        id: `art-${i}`,
        publishedAt: new Date(2026, 0, 1 + i).toISOString(),
        sentiment: {
          overall: 0.1 * i,
          magnitude: 0.5,
          confidence: 0.6,
          method: 'lexicon',
          weightedScore: 0.1 * i,
          sourceWeight: 0.8,
        },
      })
    );
    const result = buildTimeSeries('TestEntity', articles);
    expect(['improving', 'declining', 'stable', 'volatile']).toContain(result.trend);
  });
});

// ---------------------------------------------------------------------------
// measureImpact
// ---------------------------------------------------------------------------
describe('measureImpact', () => {
  it('measures sentiment before and after an event', () => {
    const eventTime = '2026-01-15T12:00:00Z';
    const articles = [
      makeArticle({
        id: 'before-1',
        publishedAt: '2026-01-14T10:00:00Z',
        sentiment: {
          overall: 0.3,
          magnitude: 0.5,
          confidence: 0.6,
          method: 'lexicon',
          weightedScore: 0.3,
          sourceWeight: 0.8,
        },
      }),
      makeArticle({
        id: 'before-2',
        publishedAt: '2026-01-13T10:00:00Z',
        sentiment: {
          overall: 0.5,
          magnitude: 0.5,
          confidence: 0.6,
          method: 'lexicon',
          weightedScore: 0.5,
          sourceWeight: 0.8,
        },
      }),
      makeArticle({
        id: 'after-1',
        publishedAt: '2026-01-16T10:00:00Z',
        sentiment: {
          overall: -0.4,
          magnitude: 0.6,
          confidence: 0.6,
          method: 'lexicon',
          weightedScore: -0.4,
          sourceWeight: 0.8,
        },
      }),
      makeArticle({
        id: 'after-2',
        publishedAt: '2026-01-17T10:00:00Z',
        sentiment: {
          overall: -0.2,
          magnitude: 0.4,
          confidence: 0.6,
          method: 'lexicon',
          weightedScore: -0.2,
          sourceWeight: 0.8,
        },
      }),
    ];
    const result = measureImpact(eventTime, articles);
    expect(result.before).toBeGreaterThan(0);
    expect(result.after).toBeLessThan(0);
    expect(result.delta).toBeLessThan(0);
    expect(typeof result.duration).toBe('number');
  });

  it('defaults to 0 when no articles before event', () => {
    const articles = [
      makeArticle({
        id: 'after-1',
        publishedAt: '2026-01-16T10:00:00Z',
        sentiment: {
          overall: 0.5,
          magnitude: 0.5,
          confidence: 0.6,
          method: 'lexicon',
          weightedScore: 0.5,
          sourceWeight: 0.8,
        },
      }),
    ];
    const result = measureImpact('2026-01-15T12:00:00Z', articles);
    expect(result.before).toBe(0);
  });

  it('defaults to 0 when no articles after event', () => {
    const articles = [
      makeArticle({
        id: 'before-1',
        publishedAt: '2026-01-13T10:00:00Z',
        sentiment: {
          overall: 0.5,
          magnitude: 0.5,
          confidence: 0.6,
          method: 'lexicon',
          weightedScore: 0.5,
          sourceWeight: 0.8,
        },
      }),
    ];
    const result = measureImpact('2026-01-15T12:00:00Z', articles);
    expect(result.after).toBe(0);
  });

  it('uses custom window days', () => {
    const articles = [
      makeArticle({
        id: 'far-before',
        publishedAt: '2026-01-05T10:00:00Z',
        sentiment: {
          overall: 0.8,
          magnitude: 0.5,
          confidence: 0.6,
          method: 'lexicon',
          weightedScore: 0.8,
          sourceWeight: 0.8,
        },
      }),
      makeArticle({
        id: 'close-before',
        publishedAt: '2026-01-14T10:00:00Z',
        sentiment: {
          overall: 0.2,
          magnitude: 0.5,
          confidence: 0.6,
          method: 'lexicon',
          weightedScore: 0.2,
          sourceWeight: 0.8,
        },
      }),
    ];
    // Window of 1 day — only close-before should match
    const result1 = measureImpact('2026-01-15T12:00:00Z', articles, 1);
    // Window of 15 days — both should match
    const result15 = measureImpact('2026-01-15T12:00:00Z', articles, 15);
    // With wider window, more articles included, different average
    expect(result1.before).not.toBe(result15.before);
  });
});

// ---------------------------------------------------------------------------
// detectTrend
// ---------------------------------------------------------------------------
describe('detectTrend', () => {
  it('returns stable for fewer than 3 data points', () => {
    expect(detectTrend([])).toBe('stable');
    expect(
      detectTrend([
        {
          timestamp: '2026-01-01T00:00:00Z',
          sentiment: 0.5,
          articleCount: 1,
          weightedSentiment: 0.5,
          events: [],
        },
      ])
    ).toBe('stable');
    expect(
      detectTrend([
        {
          timestamp: '2026-01-01T00:00:00Z',
          sentiment: 0.5,
          articleCount: 1,
          weightedSentiment: 0.5,
          events: [],
        },
        {
          timestamp: '2026-01-02T00:00:00Z',
          sentiment: 0.6,
          articleCount: 1,
          weightedSentiment: 0.6,
          events: [],
        },
      ])
    ).toBe('stable');
  });

  it('detects improving trend', () => {
    const points: TimeSeriesPoint[] = Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(2026, 0, 1 + i).toISOString(),
      sentiment: 0.1 * i,
      articleCount: 1,
      weightedSentiment: 0.1 * i,
      events: [],
    }));
    expect(detectTrend(points)).toBe('improving');
  });

  it('detects declining trend', () => {
    const points: TimeSeriesPoint[] = Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(2026, 0, 1 + i).toISOString(),
      sentiment: -0.1 * i,
      articleCount: 1,
      weightedSentiment: -0.1 * i,
      events: [],
    }));
    expect(detectTrend(points)).toBe('declining');
  });

  it('detects stable trend for flat data', () => {
    const points: TimeSeriesPoint[] = Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(2026, 0, 1 + i).toISOString(),
      sentiment: 0.5,
      articleCount: 1,
      weightedSentiment: 0.5,
      events: [],
    }));
    expect(detectTrend(points)).toBe('stable');
  });

  it('detects volatile trend for high variance data', () => {
    const points: TimeSeriesPoint[] = Array.from({ length: 10 }, (_, i) => ({
      timestamp: new Date(2026, 0, 1 + i).toISOString(),
      sentiment: i % 2 === 0 ? 0.8 : -0.8,
      articleCount: 1,
      weightedSentiment: i % 2 === 0 ? 0.8 : -0.8,
      events: [],
    }));
    expect(detectTrend(points)).toBe('volatile');
  });
});
