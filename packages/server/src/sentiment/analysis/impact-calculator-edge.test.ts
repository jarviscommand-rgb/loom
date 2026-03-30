import { describe, it, expect } from 'vitest';
import {
  computeArticleNIS,
  analyzeEffectiveness,
  estimateAudienceImpact,
  predictDownstreamEffects,
} from './impact-calculator.js';
import type { MediaSource } from '../types.js';

// ============================================================
// Impact Calculator — Edge Case Tests
//
// Tests for boundary conditions: zero articles, single source,
// all-same sentiment, extreme values, and NIS at bounds.
// ============================================================

/** Helper to create a minimal media source. */
function makeSource(overrides?: Partial<MediaSource>): MediaSource {
  return {
    id: 'test-source',
    name: 'Test Source',
    country: 'ID',
    languages: ['id'],
    url: 'https://test.com',
    feedUrls: [],
    politicalLeaning: 'centrist',
    ownership: { owner: 'Test', notes: 'Test source' },
    editorialGoal: 'Testing',
    reliabilityScore: 0.7,
    audienceTypes: ['urban-middle'],
    biasDirection: 'neutral',
    signalWeight: 1.0,
    active: true,
    ...overrides,
  };
}

describe('Impact Calculator — Edge Cases', () => {
  describe('computeArticleNIS', () => {
    it('should handle zero sentiment (no signal)', () => {
      const nis = computeArticleNIS(
        {
          sentiment: {
            overall: 0,
            magnitude: 0,
            confidence: 0,
            method: 'lexicon',
            weightedScore: 0,
            sourceWeight: 0,
          },
          audienceImpact: [],
          effectiveness: {
            sourceCredibility: 0,
            timingRelevance: 0,
            framingQuality: 0,
            emotionalResonance: 0,
            noveltyFactor: 0,
            explanation: 'No signal',
          },
        },
        makeSource({ reliabilityScore: 0 }),
        0
      );

      // Audience reach defaults to 0.3 when no audience data provided
      expect(nis.score).toBeGreaterThanOrEqual(0);
      expect(nis.components.sentimentShift).toBe(0);
      expect(nis.components.sourceCredibility).toBe(0);
      expect(nis.components.amplification).toBe(0);
      // audienceReach gets a default of 0.3 × 20 = 6
      expect(nis.components.audienceReach).toBe(6);
    });

    it('should handle maximum values (all components at 20)', () => {
      const nis = computeArticleNIS(
        {
          sentiment: {
            overall: 1,
            magnitude: 1,
            confidence: 1,
            method: 'lexicon',
            weightedScore: 5,
            sourceWeight: 5,
          },
          audienceImpact: [{ segment: 'elite-policy', reach: 1, relevance: 1, impact: 1 }],
          effectiveness: {
            sourceCredibility: 1,
            timingRelevance: 1,
            framingQuality: 1,
            emotionalResonance: 1,
            noveltyFactor: 1,
            explanation: 'Maximum',
          },
        },
        makeSource({ reliabilityScore: 1 }),
        10
      );

      // Each component capped at 20, total max 100
      expect(nis.score).toBeLessThanOrEqual(100);
      expect(nis.components.sentimentShift).toBeLessThanOrEqual(20);
      expect(nis.components.sourceCredibility).toBeLessThanOrEqual(20);
      expect(nis.components.audienceReach).toBeLessThanOrEqual(20);
      expect(nis.components.impactDuration).toBeLessThanOrEqual(20);
      expect(nis.components.amplification).toBeLessThanOrEqual(20);
    });

    it('should include scoreBreakdown in the result', () => {
      const nis = computeArticleNIS(
        {
          sentiment: {
            overall: 0.5,
            magnitude: 0.3,
            confidence: 0.5,
            method: 'lexicon',
            weightedScore: 0.5,
            sourceWeight: 0.7,
          },
          audienceImpact: [{ segment: 'urban-middle', reach: 0.5, relevance: 0.6, impact: 0.3 }],
          effectiveness: {
            sourceCredibility: 0.7,
            timingRelevance: 0.5,
            framingQuality: 0.4,
            emotionalResonance: 0.3,
            noveltyFactor: 0.6,
            explanation: 'Test',
          },
        },
        makeSource(),
        2
      );

      expect(nis.scoreBreakdown).toBeDefined();
      expect(nis.scoreBreakdown!.metricName).toBe('Narrative Impact Score (NIS)');
      expect(nis.scoreBreakdown!.variables.length).toBe(5);
      expect(nis.scoreBreakdown!.maxValue).toBe(100);
    });

    it('should handle single source (amplification = low)', () => {
      const nis = computeArticleNIS(
        {
          sentiment: {
            overall: 0.5,
            magnitude: 0.5,
            confidence: 0.5,
            method: 'lexicon',
            weightedScore: 0.5,
            sourceWeight: 1.0,
          },
          audienceImpact: [],
          effectiveness: {
            sourceCredibility: 0.5,
            timingRelevance: 0.5,
            framingQuality: 0.5,
            emotionalResonance: 0.5,
            noveltyFactor: 0.5,
            explanation: 'Single source',
          },
        },
        makeSource(),
        1
      );

      // 1 source / 5 = 0.2, so amplification = 0.2 × 20 = 4
      expect(nis.components.amplification).toBe(4);
    });
  });

  describe('analyzeEffectiveness', () => {
    it('should handle empty article content', () => {
      const result = analyzeEffectiveness('', makeSource(), false, false);
      expect(result.framingQuality).toBeDefined();
      expect(result.emotionalResonance).toBe(0);
      expect(result.scoreBreakdown).toBeDefined();
    });

    it('should handle very short content (single word)', () => {
      const result = analyzeEffectiveness('crisis', makeSource(), true, true);
      expect(result.emotionalResonance).toBeGreaterThan(0);
    });

    it('should detect framing indicators', () => {
      const richArticle =
        '"The minister said" that inflation was at 5.2% overall. ' +
        'However, according to sources, the situation may improve.';
      const result = analyzeEffectiveness(richArticle, makeSource(), true, true);
      // Should detect: quotes, length > 500 is false, statistics, attribution, balanced framing
      expect(result.framingQuality).toBeGreaterThan(0);
    });
  });

  describe('estimateAudienceImpact', () => {
    it('should return impacts for all 6 audience segments', () => {
      const impacts = estimateAudienceImpact(makeSource(), 'political', 0.5);
      expect(impacts.length).toBe(6);

      const segments = impacts.map((i) => i.segment);
      expect(segments).toContain('elite-policy');
      expect(segments).toContain('urban-middle');
      expect(segments).toContain('rural-mass');
      expect(segments).toContain('diaspora');
      expect(segments).toContain('international');
      expect(segments).toContain('youth-digital');
    });

    it('should give higher reach to target audiences', () => {
      const source = makeSource({ audienceTypes: ['elite-policy'] });
      const impacts = estimateAudienceImpact(source, 'political', 0.5);
      const eliteImpact = impacts.find((i) => i.segment === 'elite-policy');
      const ruralImpact = impacts.find((i) => i.segment === 'rural-mass');

      expect(eliteImpact!.reach).toBeGreaterThan(ruralImpact!.reach);
    });

    it('should handle zero magnitude', () => {
      const impacts = estimateAudienceImpact(makeSource(), 'political', 0);
      for (const impact of impacts) {
        expect(impact.impact).toBe(0);
      }
    });
  });

  describe('predictDownstreamEffects', () => {
    it('should return all 6 effect types', () => {
      const effects = predictDownstreamEffects('political', 0.5, 0.5, 0.7);
      expect(effects.length).toBe(6);
    });

    it('should assign positive direction for positive sentiment', () => {
      const effects = predictDownstreamEffects('economic', 0.8, 0.5, 0.7);
      for (const effect of effects) {
        expect(effect.direction).toBe('positive');
      }
    });

    it('should assign negative direction for negative sentiment', () => {
      const effects = predictDownstreamEffects('economic', -0.8, 0.5, 0.7);
      for (const effect of effects) {
        expect(effect.direction).toBe('negative');
      }
    });

    it('should handle zero magnitude', () => {
      const effects = predictDownstreamEffects('political', 0, 0, 0.5);
      for (const effect of effects) {
        expect(effect.magnitude).toBe(0);
      }
    });
  });
});
