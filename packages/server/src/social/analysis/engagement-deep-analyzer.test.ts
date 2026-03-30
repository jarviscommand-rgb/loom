import { describe, it, expect } from 'vitest';
import {
  predictDecayHalfLife,
  detectResurgence,
  compareEngagementPatterns,
  generateEngagementReport,
} from './engagement-deep-analyzer.js';
import type { EngagementMetrics, EngagementPattern } from '../types.js';

/** Creates engagement metrics at a given timestamp with configurable engagement levels */
function createMetrics(overrides: Partial<EngagementMetrics> = {}): EngagementMetrics {
  return {
    platform: 'twitter',
    likes: 100,
    shares: 20,
    comments: 30,
    views: 5000,
    reachEstimate: 10000,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/** Creates a time series of metrics with linearly declining engagement */
function createDecliningMetrics(count: number, startLikes = 1000): EngagementMetrics[] {
  const metrics: EngagementMetrics[] = [];
  for (let i = 0; i < count; i++) {
    const factor = 1 - i * 0.15;
    const timestamp = new Date(Date.now() - (count - i) * 3600000).toISOString();
    metrics.push(
      createMetrics({
        likes: Math.max(10, Math.round(startLikes * factor)),
        shares: Math.max(2, Math.round(50 * factor)),
        comments: Math.max(1, Math.round(30 * factor)),
        views: Math.max(100, Math.round(20000 * factor)),
        reachEstimate: Math.max(200, Math.round(40000 * factor)),
        timestamp,
      })
    );
  }
  return metrics;
}

/** Creates metrics with a spike-decay-resurgence pattern */
function createResurgenceMetrics(): EngagementMetrics[] {
  const baseTime = Date.now();
  const hourMs = 3600000;
  // Ramp up, peak, decline, then resurgence
  const engagementLevels = [100, 500, 1000, 800, 400, 200, 150, 300, 500];
  return engagementLevels.map((likes, index) =>
    createMetrics({
      likes,
      shares: Math.round(likes * 0.1),
      comments: Math.round(likes * 0.05),
      views: likes * 10,
      reachEstimate: likes * 20,
      timestamp: new Date(baseTime - (engagementLevels.length - index) * hourMs).toISOString(),
    })
  );
}

/** Creates a spike-decay pattern (no resurgence) */
function createSpikeDecayMetrics(): EngagementMetrics[] {
  const baseTime = Date.now();
  const hourMs = 3600000;
  const levels = [100, 300, 800, 1200, 900, 600, 400, 250, 150, 100];
  return levels.map((likes, index) =>
    createMetrics({
      likes,
      shares: Math.round(likes * 0.08),
      comments: Math.round(likes * 0.04),
      views: likes * 12,
      reachEstimate: likes * 25,
      timestamp: new Date(baseTime - (levels.length - index) * hourMs).toISOString(),
    })
  );
}

/** Creates an engagement pattern for comparison tests */
function createPattern(overrides: Partial<EngagementPattern> = {}): EngagementPattern {
  return {
    type: 'spike-decay',
    confidence: 0.8,
    peakValue: 5000,
    peakTimestamp: new Date().toISOString(),
    decayRate: 0.15,
    halfLifeHours: 24,
    viralCoefficient: 1.2,
    timeSeries: [],
    ...overrides,
  };
}

describe('predictDecayHalfLife', () => {
  it('should return defaults when fewer than 2 metrics are provided', () => {
    const result = predictDecayHalfLife([createMetrics()]);

    expect(result.halfLifeHours).toBe(48);
    expect(result.confidence).toBe(0.3);
    expect(result.currentDecayPercentage).toBe(0);
  });

  it('should return defaults for empty metrics array', () => {
    const result = predictDecayHalfLife([]);

    expect(result.halfLifeHours).toBe(48);
    expect(result.confidence).toBe(0.3);
    expect(result.currentDecayPercentage).toBe(0);
  });

  it('should increase confidence with more data points', () => {
    const twoMetrics = createDecliningMetrics(2);
    const tenMetrics = createDecliningMetrics(10);

    const resultTwo = predictDecayHalfLife(twoMetrics);
    const resultTen = predictDecayHalfLife(tenMetrics);

    expect(resultTen.confidence).toBeGreaterThan(resultTwo.confidence);
  });

  it('should cap confidence at 0.9', () => {
    const manyMetrics = createDecliningMetrics(20);
    const result = predictDecayHalfLife(manyMetrics);

    expect(result.confidence).toBeLessThanOrEqual(0.9);
  });

  it('should compute confidence as min(0.4 + length * 0.05, 0.9)', () => {
    const metrics = createDecliningMetrics(6);
    const result = predictDecayHalfLife(metrics);

    // confidence = min(0.4 + 6 * 0.05, 0.9) = min(0.7, 0.9) = 0.7
    expect(result.confidence).toBeCloseTo(0.7, 1);
  });

  it('should return a positive half-life for declining metrics', () => {
    const metrics = createDecliningMetrics(5);
    const result = predictDecayHalfLife(metrics);

    expect(result.halfLifeHours).toBeGreaterThan(0);
  });

  it('should include currentDecayPercentage for multi-point data', () => {
    const metrics = createDecliningMetrics(5);
    const result = predictDecayHalfLife(metrics);

    expect(typeof result.currentDecayPercentage).toBe('number');
  });
});

describe('detectResurgence', () => {
  it('should not detect resurgence with fewer than 4 metrics', () => {
    const metrics = createDecliningMetrics(3);
    const result = detectResurgence(metrics);

    expect(result.detected).toBe(false);
  });

  it('should not detect resurgence with empty array', () => {
    const result = detectResurgence([]);

    expect(result.detected).toBe(false);
  });

  it('should detect resurgence with uptick pattern after decline', () => {
    const metrics = createResurgenceMetrics();
    const result = detectResurgence(metrics);

    expect(result.detected).toBe(true);
    expect(result.resurgenceStrength).toBeGreaterThan(0);
    expect(typeof result.resurgenceIndex).toBe('number');
  });

  it('should not detect resurgence with steady decline', () => {
    const metrics = createDecliningMetrics(8);
    const result = detectResurgence(metrics);

    expect(result.detected).toBe(false);
  });

  it('should return resurgenceIndex indicating where resurgence starts', () => {
    const metrics = createResurgenceMetrics();
    const result = detectResurgence(metrics);

    if (result.detected) {
      expect(result.resurgenceIndex).toBeGreaterThanOrEqual(0);
      expect(result.resurgenceIndex).toBeLessThan(metrics.length);
    }
  });
});

describe('compareEngagementPatterns', () => {
  it('should give higher similarity for same type patterns', () => {
    const patternA = createPattern({ type: 'spike-decay' });
    const patternB = createPattern({ type: 'spike-decay' });
    const patternC = createPattern({ type: 'slow-burn' });

    const sameType = compareEngagementPatterns(patternA, patternB);
    const diffType = compareEngagementPatterns(patternA, patternC);

    expect(sameType.similarity).toBeGreaterThan(diffType.similarity);
  });

  it('should report patternMatch true when types match', () => {
    const patternA = createPattern({ type: 'spike-decay' });
    const patternB = createPattern({ type: 'spike-decay' });

    const result = compareEngagementPatterns(patternA, patternB);

    expect(result.patternMatch).toBe(true);
  });

  it('should report patternMatch false when types differ', () => {
    const patternA = createPattern({ type: 'spike-decay' });
    const patternB = createPattern({ type: 'slow-burn' });

    const result = compareEngagementPatterns(patternA, patternB);

    expect(result.patternMatch).toBe(false);
  });

  it('should give high similarity for identical patterns', () => {
    const pattern = createPattern({
      type: 'spike-decay',
      peakValue: 5000,
      decayRate: 0.15,
      viralCoefficient: 1.2,
    });

    const result = compareEngagementPatterns(pattern, pattern);

    expect(result.similarity).toBeGreaterThan(0.8);
  });

  it('should compute peakDifference between two patterns', () => {
    const patternA = createPattern({ peakValue: 5000 });
    const patternB = createPattern({ peakValue: 3000 });

    const result = compareEngagementPatterns(patternA, patternB);

    expect(result.peakDifference).toBeDefined();
    expect(typeof result.peakDifference).toBe('number');
  });

  it('should compute decayRateDifference between two patterns', () => {
    const patternA = createPattern({ decayRate: 0.15 });
    const patternB = createPattern({ decayRate: 0.3 });

    const result = compareEngagementPatterns(patternA, patternB);

    expect(result.decayRateDifference).toBeDefined();
    expect(typeof result.decayRateDifference).toBe('number');
  });

  it('should include a summary string', () => {
    const patternA = createPattern();
    const patternB = createPattern();

    const result = compareEngagementPatterns(patternA, patternB);

    expect(typeof result.summary).toBe('string');
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it('should return low similarity for very different patterns', () => {
    const patternA = createPattern({
      type: 'spike-decay',
      peakValue: 100000,
      decayRate: 0.5,
      viralCoefficient: 3.0,
    });
    const patternB = createPattern({
      type: 'slow-burn',
      peakValue: 100,
      decayRate: 0.01,
      viralCoefficient: 0.1,
    });

    const result = compareEngagementPatterns(patternA, patternB);

    expect(result.similarity).toBeLessThan(0.5);
  });
});

describe('generateEngagementReport', () => {
  it('should include all required fields in the report', () => {
    const metrics = createDecliningMetrics(5);
    const report = generateEngagementReport(metrics);

    expect(report).toHaveProperty('pattern');
    expect(report).toHaveProperty('decay');
    expect(report).toHaveProperty('resurgence');
    expect(report).toHaveProperty('viralPotential');
    expect(report).toHaveProperty('peakPrediction');
    expect(report).toHaveProperty('summary');
  });

  it('should generate a report with a single metric', () => {
    const metrics = [createMetrics()];
    const report = generateEngagementReport(metrics);

    expect(report).toHaveProperty('pattern');
    expect(report).toHaveProperty('summary');
    expect(typeof report.summary).toBe('string');
  });

  it('should generate a report for spike-decay pattern data', () => {
    const metrics = createSpikeDecayMetrics();
    const report = generateEngagementReport(metrics);

    expect(report).toHaveProperty('pattern');
    expect(report).toHaveProperty('decay');
    expect(report.decay).toHaveProperty('halfLifeHours');
    expect(report.summary.length).toBeGreaterThan(0);
  });

  it('should detect resurgence within the report when present', () => {
    const metrics = createResurgenceMetrics();
    const report = generateEngagementReport(metrics);

    expect(report.resurgence).toBeDefined();
  });

  it('should include viralPotential in the report', () => {
    const metrics = createDecliningMetrics(6);
    const report = generateEngagementReport(metrics);

    expect(report.viralPotential).toBeDefined();
    expect(typeof report.viralPotential).not.toBe('undefined');
  });

  it('should include peakPrediction in the report', () => {
    const metrics = createSpikeDecayMetrics();
    const report = generateEngagementReport(metrics);

    expect(report.peakPrediction).toBeDefined();
  });

  it('should produce a meaningful summary string', () => {
    const metrics = createDecliningMetrics(8);
    const report = generateEngagementReport(metrics);

    expect(typeof report.summary).toBe('string');
    expect(report.summary.length).toBeGreaterThan(10);
  });
});
