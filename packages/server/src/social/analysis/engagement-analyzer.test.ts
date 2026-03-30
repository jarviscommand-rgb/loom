import { describe, it, expect } from 'vitest';
import {
  detectEngagementPattern,
  calculateDecayCurve,
  predictEngagementPeak,
  scoreViralPotential,
  buildEngagementPattern,
} from './engagement-analyzer.js';
import type { EngagementMetrics } from '../types.js';

// ============================================================
// LOOM — Engagement Analyzer Tests
// ============================================================

/** Helper to create engagement metrics snapshots. */
function makeSnapshots(values: number[], startTime = '2026-03-01T00:00:00Z'): EngagementMetrics[] {
  const start = new Date(startTime);
  return values.map((value, i) => ({
    platform: 'twitter' as const,
    likes: Math.floor(value * 0.6),
    shares: Math.floor(value * 0.2),
    comments: Math.floor(value * 0.1),
    views: value * 10,
    reachEstimate: value * 6,
    timestamp: new Date(start.getTime() + i * 3600_000).toISOString(),
  }));
}

describe('EngagementAnalyzer', () => {
  describe('detectEngagementPattern', () => {
    it('should classify spike-decay pattern', () => {
      const snapshots = makeSnapshots([10, 5000, 4000, 2000, 500, 100, 50, 20]);
      const pattern = detectEngagementPattern(snapshots);

      expect(pattern.type).toBe('spike-decay');
      expect(pattern.confidence).toBeGreaterThan(0.5);
    });

    it('should classify sustained pattern for flat engagement', () => {
      const snapshots = makeSnapshots([100, 110, 105, 108, 112, 107, 103, 109]);
      const pattern = detectEngagementPattern(snapshots);

      expect(pattern.type).toBe('sustained');
      expect(pattern.confidence).toBeGreaterThan(0.5);
    });

    it('should classify slow-burn for late peak', () => {
      const snapshots = makeSnapshots([5, 8, 12, 20, 35, 60, 110, 200, 380, 700]);
      const pattern = detectEngagementPattern(snapshots);

      expect(['slow-burn', 'viral-loop']).toContain(pattern.type);
    });

    it('should return pattern with required fields', () => {
      const snapshots = makeSnapshots([100, 200, 300, 400, 500]);
      const pattern = detectEngagementPattern(snapshots);

      expect(pattern.type).toBeDefined();
      expect(typeof pattern.confidence).toBe('number');
      expect(pattern.confidence).toBeGreaterThanOrEqual(0);
      expect(pattern.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle single data point', () => {
      const snapshots = makeSnapshots([500]);
      const pattern = detectEngagementPattern(snapshots);

      expect(pattern.type).toBeDefined();
      expect(pattern.confidence).toBeLessThanOrEqual(0.5);
    });

    it('should handle empty snapshots', () => {
      const pattern = detectEngagementPattern([]);

      expect(pattern.type).toBe('slow-burn');
      expect(pattern.confidence).toBeLessThanOrEqual(0.5);
    });
  });

  describe('calculateDecayCurve', () => {
    it('should fit a reasonable decay curve from peak data', () => {
      const snapshots = makeSnapshots([5000, 3000, 1800, 1100, 650, 400]);
      const decay = calculateDecayCurve(snapshots);

      expect(decay).toBeDefined();
      expect(typeof decay.halfLifeHours).toBe('number');
      expect(decay.halfLifeHours).toBeGreaterThan(0);
      expect(typeof decay.decayRate).toBe('number');
      expect(decay.decayRate).toBeGreaterThan(0);
      expect(decay.decayRate).toBeLessThanOrEqual(1);
    });

    it('should return shorter half-life for rapid decay', () => {
      const rapid = calculateDecayCurve(makeSnapshots([10000, 2000, 400, 80, 16, 3]));
      const slow = calculateDecayCurve(makeSnapshots([10000, 8000, 6400, 5100, 4100, 3300]));

      expect(rapid.halfLifeHours).toBeLessThan(slow.halfLifeHours);
    });

    it('should handle empty data', () => {
      const decay = calculateDecayCurve([]);

      expect(decay.halfLifeHours).toBe(48);
      expect(decay.peakValue).toBe(0);
    });

    it('should handle single data point', () => {
      const decay = calculateDecayCurve(makeSnapshots([5000]));

      expect(decay).toBeDefined();
      expect(typeof decay.halfLifeHours).toBe('number');
    });
  });

  describe('predictEngagementPeak', () => {
    it('should predict peak for rising data', () => {
      const snapshots = makeSnapshots([100, 300, 800, 1500, 2500]);
      const prediction = predictEngagementPeak(snapshots);

      expect(prediction).toBeDefined();
      expect(typeof prediction.estimatedPeakValue).toBe('number');
      expect(typeof prediction.confidence).toBe('number');
    });

    it('should detect already-peaked data', () => {
      const snapshots = makeSnapshots([100, 500, 2000, 5000, 3000, 1000, 500]);
      const prediction = predictEngagementPeak(snapshots);

      expect(prediction.hoursUntilPeak).toBe(0);
    });

    it('should handle empty data', () => {
      const prediction = predictEngagementPeak([]);

      expect(prediction.estimatedPeakValue).toBe(0);
      expect(prediction.confidence).toBe(0.3);
    });

    it('should return higher confidence with more data points', () => {
      const short = predictEngagementPeak(makeSnapshots([100, 200, 400]));
      const long = predictEngagementPeak(
        makeSnapshots([100, 150, 200, 300, 450, 700, 1000, 1400, 1900, 2500])
      );

      expect(long.confidence).toBeGreaterThanOrEqual(short.confidence);
    });
  });

  describe('scoreViralPotential', () => {
    it('should return score between 0 and 1', () => {
      const snapshots = makeSnapshots([1000, 2000, 5000]);
      const score = scoreViralPotential(snapshots);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });

    it('should handle empty snapshots', () => {
      const score = scoreViralPotential([]);
      expect(score).toBe(0);
    });

    it('should score higher for high-share content', () => {
      const highShares: EngagementMetrics[] = [
        {
          platform: 'twitter',
          likes: 100,
          shares: 500,
          comments: 10,
          views: 10000,
          reachEstimate: 6000,
          timestamp: '2026-03-01T00:00:00Z',
        },
      ];
      const lowShares: EngagementMetrics[] = [
        {
          platform: 'twitter',
          likes: 500,
          shares: 10,
          comments: 10,
          views: 10000,
          reachEstimate: 6000,
          timestamp: '2026-03-01T00:00:00Z',
        },
      ];

      expect(scoreViralPotential(highShares)).toBeGreaterThan(scoreViralPotential(lowShares));
    });
  });

  describe('buildEngagementPattern', () => {
    it('should return complete engagement pattern', () => {
      const snapshots = makeSnapshots([100, 500, 2000, 1500, 800, 400]);
      const pattern = buildEngagementPattern(snapshots);

      expect(pattern.type).toBeDefined();
      expect(pattern.confidence).toBeGreaterThan(0);
      expect(pattern.peakValue).toBeGreaterThan(0);
      expect(pattern.peakTimestamp).toBeDefined();
      expect(typeof pattern.decayRate).toBe('number');
      expect(typeof pattern.halfLifeHours).toBe('number');
      expect(typeof pattern.viralCoefficient).toBe('number');
      expect(pattern.timeSeries).toEqual(snapshots);
    });

    it('should handle empty snapshots', () => {
      const pattern = buildEngagementPattern([]);

      expect(pattern.type).toBe('slow-burn');
      expect(pattern.peakValue).toBe(0);
    });
  });
});
