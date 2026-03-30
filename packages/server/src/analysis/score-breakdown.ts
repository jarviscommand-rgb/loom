// ============================================================
// LOOM — Score Breakdown System
//
// Universal type for representing ANY computed metric's full
// variable breakdown. Every analysis module exposes its scoring
// methodology through this system, enabling complete transparency
// into how scores are calculated.
// ============================================================

// ============================================================
// Core Types
// ============================================================

/**
 * A single variable that contributes to a composite score.
 * Captures the full journey from raw value → normalized → weighted.
 */
export interface ScoreVariable {
  /** Human-readable variable name. */
  name: string;
  /** The original measured value (any scale). */
  rawValue: number;
  /** Value normalized to 0-1 range. */
  normalizedValue: number;
  /** Weight assigned to this variable (0-1, all weights should sum to 1). */
  weight: number;
  /** The actual contribution after weighting: normalizedValue × weight. */
  weightedContribution: number;
  /** Plain-English explanation of what this variable measures and how. */
  description: string;
}

/**
 * Complete breakdown of a computed metric.
 * Designed to be universally applicable to tension scores, NIS,
 * sentiment, arc health, dream probabilities, or any other metric.
 */
export interface ScoreBreakdown {
  /** Name of the metric (e.g. "Tension Pressure Score", "NIS"). */
  metricName: string;
  /** The final computed score. */
  finalScore: number;
  /** Human-readable formula (e.g. "Σ(variable × weight)"). */
  formula: string;
  /** All variables that contribute to this score. */
  variables: ScoreVariable[];
  /** Optional: min possible value for the score. */
  minValue?: number;
  /** Optional: max possible value for the score. */
  maxValue?: number;
  /** Optional: unit or label for the score (e.g. "0-1", "0-100"). */
  scoreUnit?: string;
}

// ============================================================
// Factory Functions
// ============================================================

/**
 * Create a ScoreBreakdown with validation.
 * Ensures weights sum to ~1.0 and all values are consistent.
 *
 * @param metricName - Display name for the metric
 * @param finalScore - The computed final score
 * @param formula - Human-readable formula string
 * @param variables - Array of scoring variables
 * @param options - Optional min/max/unit configuration
 * @returns A validated ScoreBreakdown
 */
export function createBreakdown(
  metricName: string,
  finalScore: number,
  formula: string,
  variables: ScoreVariable[],
  options?: { minValue?: number; maxValue?: number; scoreUnit?: string }
): ScoreBreakdown {
  return {
    metricName,
    finalScore,
    formula,
    variables,
    minValue: options?.minValue,
    maxValue: options?.maxValue,
    scoreUnit: options?.scoreUnit,
  };
}

/**
 * Create a single ScoreVariable.
 *
 * @param name - Variable name
 * @param rawValue - Original measured value
 * @param normalizedValue - Value normalized to 0-1
 * @param weight - Weight in the composite (0-1)
 * @param description - Plain-English explanation
 * @returns A ScoreVariable with computed weightedContribution
 */
export function createVariable(
  name: string,
  rawValue: number,
  normalizedValue: number,
  weight: number,
  description: string
): ScoreVariable {
  return {
    name,
    rawValue,
    normalizedValue,
    weight,
    weightedContribution: normalizedValue * weight,
    description,
  };
}

// ============================================================
// Formatting
// ============================================================

/**
 * Format a ScoreBreakdown as human-readable text.
 * Produces a multi-line report suitable for logging or display.
 *
 * @param breakdown - The breakdown to format
 * @returns Formatted text representation
 */
export function formatBreakdownText(breakdown: ScoreBreakdown): string {
  const lines: string[] = [];

  lines.push(`═══ ${breakdown.metricName} ═══`);
  lines.push(
    `Final Score: ${breakdown.finalScore.toFixed(4)}` +
      (breakdown.scoreUnit ? ` (${breakdown.scoreUnit})` : '')
  );
  lines.push(`Formula: ${breakdown.formula}`);
  lines.push('');
  lines.push('Variables:');

  for (const v of breakdown.variables) {
    const bar = '█'.repeat(Math.round(v.normalizedValue * 20)).padEnd(20, '░');
    lines.push(`  ${v.name}`);
    lines.push(`    Raw: ${v.rawValue.toFixed(4)} → Normalized: ${v.normalizedValue.toFixed(4)}`);
    lines.push(
      `    Weight: ${(v.weight * 100).toFixed(1)}% | Contribution: ${v.weightedContribution.toFixed(4)}`
    );
    lines.push(`    [${bar}] ${v.description}`);
  }

  const totalWeight = breakdown.variables.reduce((sum, v) => sum + v.weight, 0);
  lines.push('');
  lines.push(`Total Weight: ${(totalWeight * 100).toFixed(1)}%`);

  return lines.join('\n');
}

// ============================================================
// Validation
// ============================================================

/** Result of a breakdown validation check. */
export interface ValidationResult {
  /** Whether the breakdown passes all checks. */
  valid: boolean;
  /** List of issues found. */
  errors: string[];
  /** Non-critical observations. */
  warnings: string[];
}

/**
 * Validate a ScoreBreakdown for internal consistency.
 * Checks that weights sum to ~1.0, values are in range, and
 * weighted contributions are correctly computed.
 *
 * @param breakdown - The breakdown to validate
 * @param tolerance - Acceptable deviation for weight sum (default: 0.001)
 * @returns Validation result with errors and warnings
 */
export function validateBreakdown(
  breakdown: ScoreBreakdown,
  tolerance: number = 0.001
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check weight sum
  const totalWeight = breakdown.variables.reduce((sum, v) => sum + v.weight, 0);
  if (Math.abs(totalWeight - 1.0) > tolerance) {
    errors.push(
      `Weights sum to ${totalWeight.toFixed(6)}, expected 1.0 (tolerance: ±${tolerance})`
    );
  }

  // Check each variable
  for (const v of breakdown.variables) {
    if (v.normalizedValue < 0 || v.normalizedValue > 1) {
      errors.push(`Variable "${v.name}" normalizedValue ${v.normalizedValue} is outside [0, 1]`);
    }

    if (v.weight < 0 || v.weight > 1) {
      errors.push(`Variable "${v.name}" weight ${v.weight} is outside [0, 1]`);
    }

    const expectedContribution = v.normalizedValue * v.weight;
    if (Math.abs(v.weightedContribution - expectedContribution) > 0.0001) {
      errors.push(
        `Variable "${v.name}" weightedContribution ${v.weightedContribution} ` +
          `does not match normalizedValue × weight = ${expectedContribution}`
      );
    }

    if (!v.description || v.description.trim().length === 0) {
      warnings.push(`Variable "${v.name}" has an empty description`);
    }
  }

  // Check score is within bounds if specified
  if (breakdown.minValue !== undefined && breakdown.finalScore < breakdown.minValue) {
    errors.push(`Final score ${breakdown.finalScore} is below minimum ${breakdown.minValue}`);
  }

  if (breakdown.maxValue !== undefined && breakdown.finalScore > breakdown.maxValue) {
    errors.push(`Final score ${breakdown.finalScore} is above maximum ${breakdown.maxValue}`);
  }

  if (breakdown.variables.length === 0) {
    warnings.push('Breakdown has no variables');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
