// ============================================================
// LOOM — Engagement Pattern Analyzer
//
// Classifies engagement patterns, fits decay curves, predicts
// peaks, scores viral potential, and builds full patterns.
// Deep analysis functions live in engagement-deep-analyzer.ts.
// ============================================================

import type { EngagementMetrics, EngagementPattern, EngagementPatternType } from '../types.js';

// ============================================================
// Pattern Detection
// ============================================================

/**
 * Detect the engagement pattern type from a series of metrics snapshots.
 * Classifies as spike-decay, sustained, viral-loop, or slow-burn.
 *
 * @param snapshots - Time-ordered engagement metrics
 * @returns Classified pattern type with confidence
 */
export function detectEngagementPattern(snapshots: EngagementMetrics[]): {
  type: EngagementPatternType;
  confidence: number;
} {
  if (snapshots.length < 2) {
    return { type: 'slow-burn', confidence: 0.5 };
  }

  const totals = snapshots.map((s) => s.likes + s.shares + s.comments + s.views);

  const maxIdx = totals.indexOf(Math.max(...totals));
  const maxVal = totals[maxIdx];
  const avgVal = totals.reduce((a, b) => a + b, 0) / totals.length;
  const lastVal = totals[totals.length - 1];

  // Check for viral-loop: multiple peaks or re-acceleration
  const peaks = countPeaks(totals);
  if (peaks >= 2 && maxVal > avgVal * 2) {
    return { type: 'viral-loop', confidence: Math.min(0.6 + peaks * 0.1, 0.95) };
  }

  // Check for spike-decay: early peak with rapid decline
  const peakPosition = maxIdx / (totals.length - 1);
  if (peakPosition < 0.4 && lastVal < maxVal * 0.3) {
    return { type: 'spike-decay', confidence: 0.8 + (1 - lastVal / maxVal) * 0.15 };
  }

  // Check for sustained: relatively flat engagement
  const variance = calculateVariance(totals);
  const coefficientOfVariation = Math.sqrt(variance) / avgVal;
  if (coefficientOfVariation < 0.4) {
    return { type: 'sustained', confidence: 0.7 + (1 - coefficientOfVariation) * 0.2 };
  }

  // Check for slow-burn: late peak or gradual growth
  if (peakPosition > 0.6) {
    return { type: 'slow-burn', confidence: 0.7 + peakPosition * 0.2 };
  }

  // Default classification based on decay rate
  const decayRatio = lastVal / maxVal;
  if (decayRatio < 0.3) {
    return { type: 'spike-decay', confidence: 0.7 };
  }
  return { type: 'sustained', confidence: 0.6 };
}

// ============================================================
// Decay Curve Fitting
// ============================================================

/**
 * Calculate exponential decay parameters from engagement metrics.
 * Fits the curve: engagement(t) = A * e^(-λt)
 *
 * @param snapshots - Time-ordered engagement metrics
 * @returns Decay rate (lambda) and half-life in hours
 */
export function calculateDecayCurve(snapshots: EngagementMetrics[]): {
  decayRate: number;
  halfLifeHours: number;
  peakValue: number;
} {
  if (snapshots.length < 2) {
    return { decayRate: 0, halfLifeHours: 48, peakValue: 0 };
  }

  const totals = snapshots.map((s) => s.likes + s.shares + s.comments + s.views);

  const peakValue = Math.max(...totals);
  const peakIdx = totals.indexOf(peakValue);

  // Use post-peak data for decay fitting
  const postPeak = totals.slice(peakIdx);
  if (postPeak.length < 2 || peakValue === 0) {
    return { decayRate: 0.05, halfLifeHours: Math.log(2) / 0.05, peakValue };
  }

  // Simple log-linear regression for exponential decay
  const logValues = postPeak.filter((v) => v > 0).map((v) => Math.log(v / peakValue));

  if (logValues.length < 2) {
    return { decayRate: 0.05, halfLifeHours: Math.log(2) / 0.05, peakValue };
  }

  // Estimate decay rate from slope of log values
  const decayRate = Math.abs(logValues[logValues.length - 1] / logValues.length);

  const clampedRate = Math.max(0.001, Math.min(decayRate, 1.0));
  const halfLifeHours = Math.log(2) / clampedRate;

  return { decayRate: clampedRate, halfLifeHours, peakValue };
}

// ============================================================
// Peak Prediction
// ============================================================

/**
 * Predict when engagement will peak based on current trajectory.
 *
 * @param currentMetrics - Current engagement metrics snapshots
 * @returns Predicted hours until peak and estimated peak value
 */
export function predictEngagementPeak(currentMetrics: EngagementMetrics[]): {
  hoursUntilPeak: number;
  estimatedPeakValue: number;
  confidence: number;
} {
  if (currentMetrics.length < 2) {
    return { hoursUntilPeak: 12, estimatedPeakValue: 0, confidence: 0.3 };
  }

  const totals = currentMetrics.map((s) => s.likes + s.shares + s.comments + s.views);

  const currentMax = Math.max(...totals);
  const lastTwo = totals.slice(-2);
  const growthRate =
    lastTwo.length === 2 && lastTwo[0] > 0 ? (lastTwo[1] - lastTwo[0]) / lastTwo[0] : 0;

  // If already declining, peak has passed
  if (growthRate <= 0) {
    return {
      hoursUntilPeak: 0,
      estimatedPeakValue: currentMax,
      confidence: 0.85,
    };
  }

  // Estimate hours until growth rate decelerates to zero
  // Using diminishing returns model
  const estimatedPeakMultiplier = 1 + growthRate * (1 / (1 - Math.min(growthRate, 0.9)));
  const estimatedPeakValue = Math.round(currentMax * Math.min(estimatedPeakMultiplier, 5));
  const hoursUntilPeak = Math.round(Math.log(estimatedPeakMultiplier) / Math.max(growthRate, 0.01));

  return {
    hoursUntilPeak: Math.max(1, Math.min(hoursUntilPeak, 168)),
    estimatedPeakValue,
    confidence: Math.min(0.4 + currentMetrics.length * 0.05, 0.8),
  };
}

// ============================================================
// Viral Potential Scoring
// ============================================================

/**
 * Score the viral potential of content based on engagement metrics.
 *
 * @param snapshots - Engagement metrics snapshots
 * @returns Viral potential score (0-1)
 */
export function scoreViralPotential(snapshots: EngagementMetrics[]): number {
  if (snapshots.length === 0) return 0;

  const latest = snapshots[snapshots.length - 1];
  const totalEngagement = latest.likes + latest.shares + latest.comments;

  // Share ratio is strongest viral signal
  const shareRatio = totalEngagement > 0 ? latest.shares / totalEngagement : 0;

  // Comment-to-like ratio indicates controversy/discussion (viral fuel)
  const commentToLike = latest.likes > 0 ? latest.comments / latest.likes : 0;

  // View-to-engagement ratio (low = highly engaging content)
  const viewToEngagement = latest.views > 0 ? totalEngagement / latest.views : 0;

  // Growth velocity (if multiple snapshots)
  let velocityScore = 0.5;
  if (snapshots.length >= 2) {
    const first = snapshots[0];
    const firstTotal = first.likes + first.shares + first.comments;
    if (firstTotal > 0) {
      const growthMultiple = totalEngagement / firstTotal;
      velocityScore = Math.min(growthMultiple / 10, 1);
    }
  }

  // Weighted composite score
  const viralScore =
    shareRatio * 0.35 +
    Math.min(commentToLike, 1) * 0.2 +
    Math.min(viewToEngagement * 10, 1) * 0.15 +
    velocityScore * 0.3;

  return Math.min(Math.max(viralScore, 0), 1);
}

// ============================================================
// Build Full Pattern
// ============================================================

/**
 * Build a complete engagement pattern from metrics snapshots.
 *
 * @param snapshots - Time-ordered engagement metrics
 * @returns Complete engagement pattern with classification and parameters
 */
export function buildEngagementPattern(snapshots: EngagementMetrics[]): EngagementPattern {
  const { type, confidence } = detectEngagementPattern(snapshots);
  const { decayRate, halfLifeHours, peakValue } = calculateDecayCurve(snapshots);
  const viralCoefficient = scoreViralPotential(snapshots) * 3;

  const peakIdx =
    snapshots.length > 0
      ? snapshots.reduce((maxIdx, s, i, arr) => {
          const total = s.likes + s.shares + s.comments + s.views;
          const maxTotal =
            arr[maxIdx].likes + arr[maxIdx].shares + arr[maxIdx].comments + arr[maxIdx].views;
          return total > maxTotal ? i : maxIdx;
        }, 0)
      : 0;

  return {
    type,
    confidence,
    peakValue,
    peakTimestamp: snapshots.length > 0 ? snapshots[peakIdx].timestamp : new Date().toISOString(),
    decayRate,
    halfLifeHours,
    viralCoefficient,
    timeSeries: snapshots,
  };
}

// ============================================================
// Internal helpers
// ============================================================

/** Count the number of local peaks in a numeric array. */
function countPeaks(values: number[]): number {
  let peaks = 0;
  for (let i = 1; i < values.length - 1; i++) {
    if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
      peaks++;
    }
  }
  return peaks;
}

/** Calculate variance of a numeric array. */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
}
