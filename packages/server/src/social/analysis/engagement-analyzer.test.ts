import { describe, it, expect } from 'vitest';
import {
  detectEngagementPattern,
  calculateDecayCurve,
  predictEngagementPeak,
  scoreViralPotential,
} from './engagement-analyzer.js';
import type { EngagementMetrics, EngagementTimeSeries } from '../types.js';

// ============================================================
// LOOM — Engagement Analyzer Tests
//
// Tests for engagement pattern detection, decay curve fitting,
// peak prediction, and viral potential scoring.
// ============================================================

/** Helper to create engagement time series data. */
function makeTimeSeries(
  values: number[],
  startTime = '2026-03-01T00:00:00Z'
): EngagementTimeSeries {
  const start = new Date(startTime);
  return {
    points: values.map((value, i) => ({
      timestamp: new Date(start.getTime() + i * 3600_000).toISOString(),
      engagement: value,
    })),
    interval: 'hourly',
  };
}

/** Helper to create engagement metrics. */
function makeMetrics(overrides: Partial<EngagementMetrics> = {}): EngagementMetrics {
  return {
    likes: 1000,
    shares: 200,
    comments: 50,
    views: 25000,
    ...overrides,
  };
}

describe('EngagementAnalyzer', () => {
  // -------------------------------------------------------------------------
  // detectEngagementPattern
  // -------------------------------------------------------------------------
  describe('detectEngagementPattern', () => {
    it('should classify viral pattern for explosive growth', () => {
      // Exponential-like curve: 1, 10, 100, 500, 2000, 5000, 3000, 1000
      const series = makeTimeSeries([1, 10, 100, 500, 2000, 5000, 3000, 1000]);
      const pattern = detectEngagementPattern(series);

      expect(pattern.type).toBe('viral');
      expect(pattern.confidence).toBeGreaterThan(0.5);
    });

    it('should classify steady pattern for linear growth', () => {
      // Linear growth: 100, 110, 120, 130, 140, 150, 160, 170
      const series = makeTimeSeries([100, 110, 120, 130, 140, 150, 160, 170]);
      const pattern = detectEngagementPattern(series);

      expect(pattern.type).toBe('steady');
      expect(pattern.confidence).toBeGreaterThan(0.5);
    });

    it('should classify spike-decay pattern', () => {
      // Sharp spike then rapid decline
      const series = makeTimeSeries([10, 5000, 4000, 2000, 500, 100, 50, 20]);
      const pattern = detectEngagementPattern(series);

      expect(pattern.type).toBe('spike-decay');
    });

    it('should classify slow-burn for gradual accumulation', () => {
      // Slow start, gradually increasing
      const series = makeTimeSeries([5, 8, 12, 20, 35, 60, 110, 200, 380, 700]);
      const pattern = detectEngagementPattern(series);

      expect(['slow-burn', 'viral']).toContain(pattern.type);
    });

    it('should classify flat pattern for minimal engagement', () => {
      const series = makeTimeSeries([10, 11, 10, 12, 10, 11, 10, 10]);
      const pattern = detectEngagementPattern(series);

      expect(pattern.type).toBe('flat');
    });

    it('should return pattern with required fields', () => {
      const series = makeTimeSeries([100, 200, 300, 400, 500]);
      const pattern = detectEngagementPattern(series);

      expect(pattern.type).toBeDefined();
      expect(typeof pattern.confidence).toBe('number');
      expect(pattern.confidence).toBeGreaterThanOrEqual(0);
      expect(pattern.confidence).toBeLessThanOrEqual(1);
      expect(pattern.description).toBeDefined();
    });

    it('should handle empty metrics gracefully', () => {
      const series = makeTimeSeries([]);
      const pattern = detectEngagementPattern(series);

      expect(pattern.type).toBe('flat');
      expect(pattern.confidence).toBeLessThanOrEqual(0.5);
    });

    it('should handle single data point', () => {
      const series = makeTimeSeries([500]);
      const pattern = detectEngagementPattern(series);

      expect(pattern.type).toBeDefined();
      expect(pattern.confidence).toBeLessThanOrEqual(0.5);
    });
  });

  // -------------------------------------------------------------------------
  // calculateDecayCurve
  // -------------------------------------------------------------------------
  describe('calculateDecayCurve', () => {
    it('should fit a reasonable decay curve from peak data', () => {
      // Post-peak engagement: 5000, 3000, 1800, 1100, 650, 400
      const postPeakData = makeTimeSeries([5000, 3000, 1800, 1100, 650, 400]);
      const decay = calculateDecayCurve(postPeakData);

      expect(decay).toBeDefined();
      expect(typeof decay.halfLife).toBe('number');
      expect(decay.halfLife).toBeGreaterThan(0);
      expect(typeof decay.decayRate).toBe('number');
      expect(decay.decayRate).toBeGreaterThan(0);
      expect(decay.decayRate).toBeLessThanOrEqual(1);
      expect(Array.isArray(decay.projectedCurve)).toBe(true);
    });

    it('should return shorter half-life for rapid decay', () => {
      const rapidDecay = makeTimeSeries([10000, 2000, 400, 80, 16, 3]);
      const slowDecay = makeTimeSeries([10000, 8000, 6400, 5100, 4100, 3300]);

      const rapid = calculateDecayCurve(rapidDecay);
      const slow = calculateDecayCurve(slowDecay);

      expect(rapid.halfLife).toBeLessThan(slow.halfLife);
    });

    it('should handle flat data (no decay)', () => {
      const flatData = makeTimeSeries([1000, 1000, 1000, 1000, 1000]);
      const decay = calculateDecayCurve(flatData);

      expect(decay.decayRate).toBeLessThanOrEqual(0.1);
    });

    it('should handle empty data', () => {
      const emptyData = makeTimeSeries([]);
      const decay = calculateDecayCurve(emptyData);

      expect(decay.halfLife).toBe(0);
      expect(decay.projectedCurve).toEqual([]);
    });

    it('should handle single data point', () => {
      const single = makeTimeSeries([5000]);
      const decay = calculateDecayCurve(single);

      expect(decay).toBeDefined();
      expect(typeof decay.halfLife).toBe('number');
    });
  });

  // -------------------------------------------------------------------------
  // predictEngagementPeak
  // -------------------------------------------------------------------------
  describe('predictEngagementPeak', () => {
    it('should predict peak for rising data', () => {
      const rising = makeTimeSeries([100, 300, 800, 1500, 2500]);
      const prediction = predictEngagementPeak(rising);

      expect(prediction).toBeDefined();
      expect(typeof prediction.predictedPeakValue).toBe('number');
      expect(prediction.predictedPeakValue).toBeGreaterThan(2500);
      expect(prediction.predictedPeakTime).toBeDefined();
      expect(typeof prediction.confidence).toBe('number');
    });

    it('should detect already-peaked data', () => {
      const peaked = makeTimeSeries([100, 500, 2000, 5000, 3000, 1000, 500]);
      const prediction = predictEngagementPeak(peaked);

      expect(prediction.alreadyPeaked).toBe(true);
      expect(prediction.predictedPeakValue).toBeLessThanOrEqual(5000);
    });

    it('should handle flat data', () => {
      const flat = makeTimeSeries([100, 100, 100, 100, 100]);
      const prediction = predictEngagementPeak(flat);

      expect(prediction).toBeDefined();
      expect(prediction.confidence).toBeLessThanOrEqual(0.5);
    });

    it('should handle empty data', () => {
      const empty = makeTimeSeries([]);
      const prediction = predictEngagementPeak(empty);

      expect(prediction.predictedPeakValue).toBe(0);
      expect(prediction.confidence).toBe(0);
    });

    it('should return higher confidence with more data points', () => {
      const short = makeTimeSeries([100, 200, 400]);
      const long = makeTimeSeries([100, 150, 200, 300, 450, 700, 1000, 1400, 1900, 2500]);

      const shortPred = predictEngagementPeak(short);
      const longPred = predictEngagementPeak(long);

      expect(longPred.confidence).toBeGreaterThanOrEqual(shortPred.confidence);
    });
  });

  // -------------------------------------------------------------------------
  // scoreViralPotential
  // -------------------------------------------------------------------------
  describe('scoreViralPotential', () => {
    it('should score high for viral-like metrics', () => {
      const viralMetrics = makeMetrics({
        likes: 50000,
        shares: 25000,
        comments: 8000,
        views: 2_000_000,
      });

      const score = scoreViralPotential(viralMetrics);

      expect(typeof score.score).toBe('number');
      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
      expect(score.score).toBeGreaterThan(50);
    });

    it('should score low for minimal metrics', () => {
      const lowMetrics = makeMetrics({
        likes: 5,
        shares: 0,
        comments: 1,
        views: 100,
      });

      const score = scoreViralPotential(lowMetrics);
      expect(score.score).toBeLessThan(30);
    });

    it('should weight shares higher than likes', () => {
      const highShares = makeMetrics({ likes: 100, shares: 500, comments: 10, views: 10000 });
      const highLikes = makeMetrics({ likes: 500, shares: 100, comments: 10, views: 10000 });

      const shareScore = scoreViralPotential(highShares);
      const likeScore = scoreViralPotential(highLikes);

      expect(shareScore.score).toBeGreaterThan(likeScore.score);
    });

    it('should return score within valid range', () => {
      const metrics = makeMetrics();
      const score = scoreViralPotential(metrics);

      expect(score.score).toBeGreaterThanOrEqual(0);
      expect(score.score).toBeLessThanOrEqual(100);
      expect(Array.isArray(score.factors)).toBe(true);
      expect(score.factors.length).toBeGreaterThan(0);
    });

    it('should handle zero metrics', () => {
      const zeroMetrics = makeMetrics({ likes: 0, shares: 0, comments: 0, views: 0 });
      const score = scoreViralPotential(zeroMetrics);

      expect(score.score).toBe(0);
    });

    it('should include contributing factors', () => {
      const metrics = makeMetrics({ likes: 1000, shares: 500, comments: 200, views: 50000 });
      const score = scoreViralPotential(metrics);

      expect(score.factors).toBeDefined();
      for (const factor of score.factors) {
        expect(factor.name).toBeDefined();
        expect(typeof factor.contribution).toBe('number');
      }
    });
  });
});
