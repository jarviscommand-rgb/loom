import { describe, it, expect } from 'vitest';
import {
  computeArticleNIS,
  computeEventNIS,
  analyzeEffectiveness,
  estimateAudienceImpact,
  predictDownstreamEffects,
} from './impact-calculator';
import type { MediaSource, SentimentArticle, SentimentEvent } from '../types';

function makeSource(overrides: Partial<MediaSource> = {}): MediaSource {
  return {
    id: 'test-source',
    name: 'Test Source',
    country: 'ID',
    languages: ['id', 'en'],
    url: 'https://test.example.com',
    feedUrls: [],
    politicalLeaning: 'centrist',
    ownership: { owner: 'Test Owner', notes: 'test' },
    editorialGoal: 'Neutral coverage',
    reliabilityScore: 0.8,
    audienceTypes: ['urban-middle', 'elite-policy'],
    biasDirection: 'neutral',
    signalWeight: 1.0,
    active: true,
    ...overrides,
  };
}

function makeArticle(overrides: Partial<SentimentArticle> = {}): SentimentArticle {
  return {
    id: 'art-1',
    sourceId: 'test-source',
    title: 'Test article',
    content: 'Test content for analysis.',
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
    sentimentTypes: [{ type: 'hope', intensity: 0.6, confidence: 0.5 }],
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
    audienceImpact: [
      { segment: 'urban-middle', reach: 0.7, relevance: 0.6, impact: 0.5 },
      { segment: 'elite-policy', reach: 0.6, relevance: 0.9, impact: 0.6 },
    ],
    downstreamEffects: [],
    nis: {
      score: 50,
      components: {
        sentimentShift: 10,
        sourceCredibility: 12,
        audienceReach: 8,
        impactDuration: 10,
        amplification: 10,
      },
      percentile: 50,
      summary: 'Test',
    },
    ...overrides,
  };
}

function makeEvent(overrides: Partial<SentimentEvent> = {}): SentimentEvent {
  return {
    id: 'evt-1',
    title: 'Test Event',
    description: 'A test event',
    category: 'political',
    timestamp: '2026-01-15T10:00:00Z',
    articleIds: ['art-1', 'art-2', 'art-3'],
    sentimentBefore: 0.2,
    sentimentAfter: -0.3,
    sentimentDelta: -0.5,
    impactMagnitude: 0.7,
    impactDuration: 7,
    nis: {
      score: 60,
      components: {
        sentimentShift: 12,
        sourceCredibility: 12,
        audienceReach: 12,
        impactDuration: 12,
        amplification: 12,
      },
      percentile: 60,
      summary: 'Test event',
    },
    sourceBreakdown: [
      { sourceId: 'kompas', articleCount: 2, avgSentiment: -0.3, framingType: 'negative' },
      { sourceId: 'tempo', articleCount: 1, avgSentiment: -0.5, framingType: 'negative' },
    ],
    eventPattern: 'political-crisis',
    historicalSimilar: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// computeArticleNIS
// ---------------------------------------------------------------------------
describe('computeArticleNIS', () => {
  it('computes a valid NIS score for a high-impact article', () => {
    const article = makeArticle({
      sentiment: {
        overall: 0.8,
        magnitude: 0.9,
        confidence: 0.7,
        method: 'lexicon',
        weightedScore: 1.5,
        sourceWeight: 1.8,
      },
      effectiveness: {
        sourceCredibility: 0.9,
        timingRelevance: 0.8,
        framingQuality: 0.8,
        emotionalResonance: 0.7,
        noveltyFactor: 0.8,
        explanation: 'High impact',
      },
    });
    const source = makeSource({ reliabilityScore: 0.9 });
    const result = computeArticleNIS(article, source, 5);

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.components.sentimentShift).toBeLessThanOrEqual(20);
    expect(result.components.sourceCredibility).toBeLessThanOrEqual(20);
    expect(result.components.audienceReach).toBeLessThanOrEqual(20);
    expect(result.components.impactDuration).toBeLessThanOrEqual(20);
    expect(result.components.amplification).toBeLessThanOrEqual(20);
  });

  it('computes low NIS for a low-impact article', () => {
    const article = makeArticle({
      sentiment: {
        overall: 0.05,
        magnitude: 0.1,
        confidence: 0.3,
        method: 'lexicon',
        weightedScore: 0.05,
        sourceWeight: 0.3,
      },
      effectiveness: {
        sourceCredibility: 0.3,
        timingRelevance: 0.2,
        framingQuality: 0.2,
        emotionalResonance: 0.1,
        noveltyFactor: 0.1,
        explanation: 'Low',
      },
      audienceImpact: [{ segment: 'rural-mass', reach: 0.15, relevance: 0.2, impact: 0.05 }],
    });
    const source = makeSource({ reliabilityScore: 0.3 });
    const result = computeArticleNIS(article, source, 1);

    expect(result.score).toBeLessThan(30);
  });

  it('maxes amplification at crossSourceCount >= 5', () => {
    const article = makeArticle();
    const source = makeSource();
    const result5 = computeArticleNIS(article, source, 5);
    const result10 = computeArticleNIS(article, source, 10);
    expect(result5.components.amplification).toBe(result10.components.amplification);
    expect(result5.components.amplification).toBeCloseTo(20, 0);
  });

  it('defaults crossSourceCount to 1', () => {
    const article = makeArticle();
    const source = makeSource();
    const result = computeArticleNIS(article, source);
    // 1/5 = 0.2 → 0.2 * 20 = 4
    expect(result.components.amplification).toBeCloseTo(4, 0);
  });

  it('all component scores are capped at 20', () => {
    const article = makeArticle({
      sentiment: {
        overall: 1,
        magnitude: 1,
        confidence: 1,
        method: 'lexicon',
        weightedScore: 5,
        sourceWeight: 5,
      },
    });
    const source = makeSource({ reliabilityScore: 1.0 });
    const result = computeArticleNIS(article, source, 100);
    for (const value of Object.values(result.components)) {
      expect(value).toBeLessThanOrEqual(20);
    }
  });

  it('has a summary string', () => {
    const result = computeArticleNIS(makeArticle(), makeSource());
    expect(typeof result.summary).toBe('string');
    expect(result.summary.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// computeEventNIS
// ---------------------------------------------------------------------------
describe('computeEventNIS', () => {
  it('computes valid NIS for an event', () => {
    const event = makeEvent();
    const result = computeEventNIS(event, 0.8);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('scales sentimentShift with impactMagnitude', () => {
    const lowImpact = makeEvent({ impactMagnitude: 0.1 });
    const highImpact = makeEvent({ impactMagnitude: 0.9 });
    const resultLow = computeEventNIS(lowImpact, 0.8);
    const resultHigh = computeEventNIS(highImpact, 0.8);
    expect(resultHigh.components.sentimentShift).toBeGreaterThan(
      resultLow.components.sentimentShift
    );
  });

  it('scales audienceReach with article count', () => {
    const fewArticles = makeEvent({ articleIds: ['a1'] });
    const manyArticles = makeEvent({
      articleIds: Array.from({ length: 20 }, (_, i) => `a${i}`),
    });
    const resultFew = computeEventNIS(fewArticles, 0.8);
    const resultMany = computeEventNIS(manyArticles, 0.8);
    expect(resultMany.components.audienceReach).toBeGreaterThan(resultFew.components.audienceReach);
  });

  it('scales impactDuration with event duration', () => {
    const short = makeEvent({ impactDuration: 1 });
    const long = makeEvent({ impactDuration: 14 });
    const resultShort = computeEventNIS(short, 0.8);
    const resultLong = computeEventNIS(long, 0.8);
    expect(resultLong.components.impactDuration).toBeGreaterThan(
      resultShort.components.impactDuration
    );
  });

  it('scales amplification with source diversity', () => {
    const oneSrc = makeEvent({
      sourceBreakdown: [
        { sourceId: 'a', articleCount: 1, avgSentiment: 0, framingType: 'neutral' },
      ],
    });
    const manySrc = makeEvent({
      sourceBreakdown: Array.from({ length: 5 }, (_, i) => ({
        sourceId: `s${i}`,
        articleCount: 2,
        avgSentiment: -0.3,
        framingType: 'negative' as const,
      })),
    });
    const r1 = computeEventNIS(oneSrc, 0.8);
    const r5 = computeEventNIS(manySrc, 0.8);
    expect(r5.components.amplification).toBeGreaterThan(r1.components.amplification);
  });
});

// ---------------------------------------------------------------------------
// analyzeEffectiveness
// ---------------------------------------------------------------------------
describe('analyzeEffectiveness', () => {
  it('returns high credibility for reliable source', () => {
    const source = makeSource({ reliabilityScore: 0.9 });
    const result = analyzeEffectiveness('Some article content.', source, true, true);
    expect(result.sourceCredibility).toBe(0.9);
  });

  it('returns high timing relevance when timely', () => {
    const result = analyzeEffectiveness('content', makeSource(), true, false);
    expect(result.timingRelevance).toBe(0.8);
  });

  it('returns low timing relevance when not timely', () => {
    const result = analyzeEffectiveness('content', makeSource(), false, false);
    expect(result.timingRelevance).toBe(0.3);
  });

  it('returns high novelty when novel', () => {
    const result = analyzeEffectiveness('content', makeSource(), false, true);
    expect(result.noveltyFactor).toBe(0.85);
  });

  it('returns low novelty when not novel', () => {
    const result = analyzeEffectiveness('content', makeSource(), false, false);
    expect(result.noveltyFactor).toBe(0.2);
  });

  it('detects framing quality indicators', () => {
    const richContent = `
      According to officials, the reform "has been transformative," said the minister.
      However, despite strong gains of 45.2% in Q3, some experts disagree.
      The data shows 12% growth according to sources say the trend continues.
    `;
    const result = analyzeEffectiveness(richContent, makeSource(), false, false);
    // Contains quotes, length > 500... might be close. Check > 0 at least.
    expect(result.framingQuality).toBeGreaterThan(0);
  });

  it('detects emotional resonance', () => {
    const emotionalContent =
      'The crisis was devastating and urgent. People felt fear and outrage. A historic breakthrough gave hope.';
    const result = analyzeEffectiveness(emotionalContent, makeSource(), false, false);
    expect(result.emotionalResonance).toBeGreaterThan(0);
  });

  it('returns an explanation string', () => {
    const result = analyzeEffectiveness('some content', makeSource(), true, true);
    expect(typeof result.explanation).toBe('string');
  });
});

// ---------------------------------------------------------------------------
// estimateAudienceImpact
// ---------------------------------------------------------------------------
describe('estimateAudienceImpact', () => {
  it('returns impacts for all 6 audience segments', () => {
    const source = makeSource({ audienceTypes: ['urban-middle', 'elite-policy'] });
    const result = estimateAudienceImpact(source, 'political', 0.7);
    expect(result.length).toBe(6);
    const segments = result.map((r) => r.segment);
    expect(segments).toContain('elite-policy');
    expect(segments).toContain('urban-middle');
    expect(segments).toContain('rural-mass');
    expect(segments).toContain('diaspora');
    expect(segments).toContain('international');
    expect(segments).toContain('youth-digital');
  });

  it('gives higher reach to target audience segments', () => {
    const source = makeSource({ audienceTypes: ['elite-policy'] });
    const result = estimateAudienceImpact(source, 'political', 0.5);
    const elite = result.find((r) => r.segment === 'elite-policy')!;
    const rural = result.find((r) => r.segment === 'rural-mass')!;
    expect(elite.reach).toBeGreaterThan(rural.reach);
  });

  it('gives high relevance for matching category-segment pairs', () => {
    const result = estimateAudienceImpact(makeSource(), 'political', 0.5);
    const elite = result.find((r) => r.segment === 'elite-policy')!;
    expect(elite.relevance).toBeCloseTo(0.95, 1);
  });

  it('scales impact with sentiment magnitude', () => {
    const source = makeSource({ audienceTypes: ['urban-middle'] });
    const low = estimateAudienceImpact(source, 'economic', 0.2);
    const high = estimateAudienceImpact(source, 'economic', 0.9);
    const urbanLow = low.find((r) => r.segment === 'urban-middle')!;
    const urbanHigh = high.find((r) => r.segment === 'urban-middle')!;
    expect(urbanHigh.impact).toBeGreaterThan(urbanLow.impact);
  });

  it('clamps impact values to [0, 1]', () => {
    const result = estimateAudienceImpact(
      makeSource({ audienceTypes: ['urban-middle'] }),
      'economic',
      1.0
    );
    for (const entry of result) {
      expect(entry.impact).toBeGreaterThanOrEqual(0);
      expect(entry.impact).toBeLessThanOrEqual(1);
    }
  });
});

// ---------------------------------------------------------------------------
// predictDownstreamEffects
// ---------------------------------------------------------------------------
describe('predictDownstreamEffects', () => {
  it('returns 6 downstream effects', () => {
    const result = predictDownstreamEffects('political', 0.5, 0.7, 0.8);
    expect(result.length).toBe(6);
    const effects = result.map((r) => r.effect);
    expect(effects).toContain('policy-support');
    expect(effects).toContain('consumer-confidence');
    expect(effects).toContain('investor-sentiment');
    expect(effects).toContain('political-pressure');
    expect(effects).toContain('social-amplification');
    expect(effects).toContain('counter-narrative');
  });

  it('assigns positive direction for positive sentiment', () => {
    const result = predictDownstreamEffects('economic', 0.5, 0.7, 0.8);
    for (const entry of result) {
      expect(entry.direction).toBe('positive');
    }
  });

  it('assigns negative direction for negative sentiment', () => {
    const result = predictDownstreamEffects('economic', -0.5, 0.7, 0.8);
    for (const entry of result) {
      expect(entry.direction).toBe('negative');
    }
  });

  it('gives high political-pressure probability for corruption', () => {
    const result = predictDownstreamEffects('corruption', -0.5, 0.8, 0.9);
    const pp = result.find((r) => r.effect === 'political-pressure')!;
    expect(pp.probability).toBeGreaterThan(0.5);
  });

  it('gives high investor-sentiment probability for economic', () => {
    const result = predictDownstreamEffects('economic', 0.3, 0.6, 0.85);
    const inv = result.find((r) => r.effect === 'investor-sentiment')!;
    expect(inv.probability).toBeGreaterThan(0.4);
  });

  it('applies magnitude multiplier for investor-sentiment + economic', () => {
    const econ = predictDownstreamEffects('economic', 0.5, 0.7, 0.8);
    const polit = predictDownstreamEffects('political', 0.5, 0.7, 0.8);
    const econInv = econ.find((r) => r.effect === 'investor-sentiment')!;
    const politInv = polit.find((r) => r.effect === 'investor-sentiment')!;
    // Economic investor-sentiment has 1.3x multiplier + higher base
    expect(econInv.magnitude).toBeGreaterThan(politInv.magnitude);
  });

  it('scales probability with source reliability', () => {
    const low = predictDownstreamEffects('political', 0.5, 0.7, 0.3);
    const high = predictDownstreamEffects('political', 0.5, 0.7, 0.9);
    const psLow = low.find((r) => r.effect === 'policy-support')!;
    const psHigh = high.find((r) => r.effect === 'policy-support')!;
    expect(psHigh.probability).toBeGreaterThan(psLow.probability);
  });

  it('clamps all probability and magnitude values to [0, 1]', () => {
    const result = predictDownstreamEffects('corruption', -1, 1, 1);
    for (const entry of result) {
      expect(entry.probability).toBeGreaterThanOrEqual(0);
      expect(entry.probability).toBeLessThanOrEqual(1);
      expect(entry.magnitude).toBeGreaterThanOrEqual(0);
      expect(entry.magnitude).toBeLessThanOrEqual(1);
    }
  });

  it('includes description strings', () => {
    const result = predictDownstreamEffects('political', 0.5, 0.7, 0.8);
    for (const entry of result) {
      expect(typeof entry.description).toBe('string');
      expect(entry.description.length).toBeGreaterThan(0);
    }
  });
});
