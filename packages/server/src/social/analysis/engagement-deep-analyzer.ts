// ============================================================
// LOOM — Engagement Deep Analyzer
//
// Advanced engagement analysis: decay half-life prediction,
// resurgence detection, pattern comparison, and comprehensive
// engagement reporting.
// ============================================================

import type { EngagementMetrics, EngagementPattern } from '../types.js';
import {
  calculateDecayCurve,
  buildEngagementPattern,
  scoreViralPotential,
  predictEngagementPeak,
} from './engagement-analyzer.js';

// ============================================================
// Decay Half-Life Prediction
// ============================================================

/**
 * Predict when engagement drops to 50% of peak value.
 * Uses exponential decay fitting on the provided metrics series.
 *
 * @param metrics - Time-ordered engagement metrics
 * @returns Predicted half-life in hours and confidence
 */
export function predictDecayHalfLife(metrics: EngagementMetrics[]): {
  halfLifeHours: number;
  confidence: number;
  currentDecayPercentage: number;
} {
  if (metrics.length < 2) {
    return { halfLifeHours: 48, confidence: 0.3, currentDecayPercentage: 0 };
  }

  const { halfLifeHours, peakValue } = calculateDecayCurve(metrics);
  const lastTotal = totalEngagement(metrics[metrics.length - 1]);
  const currentDecayPercentage = peakValue > 0 ? Math.round((1 - lastTotal / peakValue) * 100) : 0;

  const confidence = Math.min(0.4 + metrics.length * 0.05, 0.9);

  return {
    halfLifeHours: Math.round(halfLifeHours * 10) / 10,
    confidence: Math.round(confidence * 100) / 100,
    currentDecayPercentage: Math.max(0, Math.min(currentDecayPercentage, 100)),
  };
}

// ============================================================
// Resurgence Detection
// ============================================================

/**
 * Detect if a declining engagement topic is experiencing a resurgence.
 * Looks for significant upticks after a decay period.
 *
 * @param metrics - Time-ordered engagement metrics
 * @returns Whether resurgence is detected and its strength
 */
export function detectResurgence(metrics: EngagementMetrics[]): {
  detected: boolean;
  resurgenceStrength: number;
  resurgenceIndex: number;
} {
  if (metrics.length < 4) {
    return { detected: false, resurgenceStrength: 0, resurgenceIndex: -1 };
  }

  const totals = metrics.map(totalEngagement);
  const peakIdx = totals.indexOf(Math.max(...totals));

  // Need at least 2 data points after peak to detect resurgence
  if (peakIdx >= totals.length - 2) {
    return { detected: false, resurgenceStrength: 0, resurgenceIndex: -1 };
  }

  const postPeak = totals.slice(peakIdx);

  // Find the trough (minimum after peak)
  let troughIdx = 0;
  let troughVal = postPeak[0];
  for (let index = 1; index < postPeak.length; index++) {
    if (postPeak[index] < troughVal) {
      troughVal = postPeak[index];
      troughIdx = index;
    }
  }

  // Check if there's growth after the trough
  if (troughIdx >= postPeak.length - 1 || troughVal === 0) {
    return { detected: false, resurgenceStrength: 0, resurgenceIndex: -1 };
  }

  const postTrough = postPeak.slice(troughIdx);
  const postTroughMax = Math.max(...postTrough);
  const resurgenceRatio = (postTroughMax - troughVal) / Math.max(troughVal, 1);

  // Resurgence if post-trough growth is >30% of trough value
  const detected = resurgenceRatio > 0.3;
  const resurgenceStrength = Math.min(resurgenceRatio, 3) / 3;

  return {
    detected,
    resurgenceStrength: Math.round(resurgenceStrength * 100) / 100,
    resurgenceIndex: detected ? peakIdx + troughIdx : -1,
  };
}

// ============================================================
// Engagement Pattern Comparison
// ============================================================

/**
 * Compare two engagement patterns and quantify their similarity.
 *
 * @param pattern1 - First engagement pattern
 * @param pattern2 - Second engagement pattern
 * @returns Similarity analysis
 */
export function compareEngagementPatterns(
  pattern1: EngagementPattern,
  pattern2: EngagementPattern
): {
  similarity: number;
  patternMatch: boolean;
  peakDifference: number;
  decayRateDifference: number;
  summary: string;
} {
  // Type match score
  const typeMatch = pattern1.type === pattern2.type ? 1 : 0;

  // Peak similarity (log-scale to handle large differences)
  const peakRatio =
    Math.min(pattern1.peakValue, pattern2.peakValue) /
    Math.max(pattern1.peakValue, pattern2.peakValue, 1);

  // Decay rate similarity
  const maxDecay = Math.max(pattern1.decayRate, pattern2.decayRate, 0.001);
  const decayDiff = Math.abs(pattern1.decayRate - pattern2.decayRate);
  const decaySimilarity = 1 - Math.min(decayDiff / maxDecay, 1);

  // Viral coefficient similarity
  const maxViral = Math.max(pattern1.viralCoefficient, pattern2.viralCoefficient, 0.1);
  const viralDiff = Math.abs(pattern1.viralCoefficient - pattern2.viralCoefficient);
  const viralSimilarity = 1 - Math.min(viralDiff / maxViral, 1);

  // Weighted composite
  const similarity =
    typeMatch * 0.35 + peakRatio * 0.2 + decaySimilarity * 0.25 + viralSimilarity * 0.2;

  const roundedSimilarity = Math.round(similarity * 100) / 100;

  return {
    similarity: roundedSimilarity,
    patternMatch: pattern1.type === pattern2.type,
    peakDifference: Math.abs(pattern1.peakValue - pattern2.peakValue),
    decayRateDifference: Math.round(decayDiff * 1000) / 1000,
    summary:
      `Patterns are ${(roundedSimilarity * 100).toFixed(0)}% similar. ` +
      `Type: ${pattern1.type === pattern2.type ? 'match' : 'different'} ` +
      `(${pattern1.type} vs ${pattern2.type}).`,
  };
}

// ============================================================
// Engagement Report
// ============================================================

/** Comprehensive engagement report for an announcement. */
export interface EngagementReport {
  /** Pattern classification. */
  pattern: EngagementPattern;
  /** Decay prediction. */
  decay: { halfLifeHours: number; confidence: number; currentDecayPercentage: number };
  /** Resurgence detection. */
  resurgence: { detected: boolean; resurgenceStrength: number; resurgenceIndex: number };
  /** Viral potential score (0-1). */
  viralPotential: number;
  /** Peak prediction. */
  peakPrediction: { hoursUntilPeak: number; estimatedPeakValue: number; confidence: number };
  /** Report summary. */
  summary: string;
}

/**
 * Generate a comprehensive engagement report from metrics.
 *
 * @param metrics - Time-ordered engagement metrics
 * @returns Full engagement report
 */
export function generateEngagementReport(metrics: EngagementMetrics[]): EngagementReport {
  const pattern = buildEngagementPattern(metrics);
  const decay = predictDecayHalfLife(metrics);
  const resurgence = detectResurgence(metrics);
  const viralPotential = scoreViralPotential(metrics);
  const peakPrediction = predictEngagementPeak(metrics);

  const summary =
    `${pattern.type} pattern (${(pattern.confidence * 100).toFixed(0)}% confidence). ` +
    `Peak: ${pattern.peakValue.toLocaleString()}, half-life: ${decay.halfLifeHours.toFixed(1)}h. ` +
    `Viral potential: ${(viralPotential * 100).toFixed(0)}%.` +
    (resurgence.detected ? ' Resurgence detected!' : '');

  return { pattern, decay, resurgence, viralPotential, peakPrediction, summary };
}

// ============================================================
// Internal helpers
// ============================================================

/** Sum total engagement from a metrics snapshot. */
function totalEngagement(m: EngagementMetrics): number {
  return m.likes + m.shares + m.comments + m.views;
}
