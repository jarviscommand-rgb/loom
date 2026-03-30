import { describe, it, expect } from 'vitest';
import {
  createBreakdown,
  createVariable,
  validateBreakdown,
  formatBreakdownText,
  type ScoreBreakdown,
  type ScoreVariable,
} from './score-breakdown';

// ============================================================
// Helpers
// ============================================================

/** Build a standard 3-variable breakdown that sums correctly. */
function makeValidBreakdown(): ScoreBreakdown {
  const variables = [
    createVariable('Alpha', 100, 0.8, 0.5, 'Alpha measures X'),
    createVariable('Beta', 50, 0.6, 0.3, 'Beta measures Y'),
    createVariable('Gamma', 25, 0.4, 0.2, 'Gamma measures Z'),
  ];
  const finalScore = variables.reduce((sum, v) => sum + v.weightedContribution, 0);

  return createBreakdown('Test Metric', finalScore, 'Σ(variable × weight)', variables, {
    minValue: 0,
    maxValue: 1,
    scoreUnit: '0-1',
  });
}

// ============================================================
// createVariable
// ============================================================

describe('createVariable', () => {
  it('computes weightedContribution as normalizedValue × weight', () => {
    const variable = createVariable('Tension', 42, 0.7, 0.4, 'some desc');

    expect(variable.name).toBe('Tension');
    expect(variable.rawValue).toBe(42);
    expect(variable.normalizedValue).toBe(0.7);
    expect(variable.weight).toBe(0.4);
    expect(variable.weightedContribution).toBeCloseTo(0.28, 6);
    expect(variable.description).toBe('some desc');
  });

  it('returns zero contribution when weight is zero', () => {
    const variable = createVariable('ZeroWeight', 99, 0.9, 0, 'zero weight var');
    expect(variable.weightedContribution).toBe(0);
  });

  it('returns zero contribution when normalizedValue is zero', () => {
    const variable = createVariable('ZeroNorm', 0, 0, 0.5, 'zero norm var');
    expect(variable.weightedContribution).toBe(0);
  });

  it('handles weight of 1.0 (full weight)', () => {
    const variable = createVariable('FullWeight', 10, 0.75, 1.0, 'full weight');
    expect(variable.weightedContribution).toBeCloseTo(0.75, 6);
  });

  it('handles very small floating point values', () => {
    const variable = createVariable('Tiny', 0.001, 0.001, 0.001, 'tiny values');
    expect(variable.weightedContribution).toBeCloseTo(0.000001, 9);
  });
});

// ============================================================
// createBreakdown
// ============================================================

describe('createBreakdown', () => {
  it('creates a breakdown with all optional fields', () => {
    const variables = [
      createVariable('V1', 10, 0.5, 0.6, 'first'),
      createVariable('V2', 20, 0.8, 0.4, 'second'),
    ];

    const breakdown = createBreakdown('My Metric', 0.62, 'custom formula', variables, {
      minValue: 0,
      maxValue: 1,
      scoreUnit: '0-1',
    });

    expect(breakdown.metricName).toBe('My Metric');
    expect(breakdown.finalScore).toBe(0.62);
    expect(breakdown.formula).toBe('custom formula');
    expect(breakdown.variables).toHaveLength(2);
    expect(breakdown.minValue).toBe(0);
    expect(breakdown.maxValue).toBe(1);
    expect(breakdown.scoreUnit).toBe('0-1');
  });

  it('creates a breakdown without optional fields', () => {
    const breakdown = createBreakdown('Simple', 0.5, 'f(x)', []);

    expect(breakdown.metricName).toBe('Simple');
    expect(breakdown.minValue).toBeUndefined();
    expect(breakdown.maxValue).toBeUndefined();
    expect(breakdown.scoreUnit).toBeUndefined();
  });

  it('creates a breakdown with empty options object', () => {
    const breakdown = createBreakdown('Empty Opts', 0.5, 'f(x)', [], {});

    expect(breakdown.minValue).toBeUndefined();
    expect(breakdown.maxValue).toBeUndefined();
    expect(breakdown.scoreUnit).toBeUndefined();
  });
});

// ============================================================
// validateBreakdown — weights must sum to 1.0
// ============================================================

describe('validateBreakdown — weight sum', () => {
  it('passes when weights sum to exactly 1.0', () => {
    const breakdown = makeValidBreakdown();
    const result = validateBreakdown(breakdown);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('passes when weights are within default tolerance (±0.001)', () => {
    const variables = [
      createVariable('A', 10, 0.5, 0.5005, 'a'),
      createVariable('B', 20, 0.5, 0.5005, 'b'),
    ];
    const breakdown = createBreakdown('Tolerance', 0.5, 'f', variables);
    const result = validateBreakdown(breakdown);

    expect(result.valid).toBe(true);
  });

  it('fails when weights sum to well above 1.0', () => {
    const variables = [
      createVariable('A', 10, 0.5, 0.7, 'a'),
      createVariable('B', 20, 0.5, 0.7, 'b'),
    ];
    const breakdown = createBreakdown('OverWeight', 0.7, 'f', variables);
    const result = validateBreakdown(breakdown);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Weights sum to'))).toBe(true);
  });

  it('fails when weights sum to well below 1.0', () => {
    const variables = [
      createVariable('A', 10, 0.5, 0.1, 'a'),
      createVariable('B', 20, 0.5, 0.1, 'b'),
    ];
    const breakdown = createBreakdown('UnderWeight', 0.1, 'f', variables);
    const result = validateBreakdown(breakdown);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Weights sum to'))).toBe(true);
  });

  it('respects a custom tolerance parameter', () => {
    const variables = [
      createVariable('A', 10, 0.5, 0.51, 'a'),
      createVariable('B', 20, 0.5, 0.51, 'b'),
    ];
    const breakdown = createBreakdown('CustomTol', 0.51, 'f', variables);

    const strictResult = validateBreakdown(breakdown, 0.001);
    expect(strictResult.valid).toBe(false);

    const lenientResult = validateBreakdown(breakdown, 0.05);
    expect(lenientResult.valid).toBe(true);
  });
});

// ============================================================
// validateBreakdown — edge cases
// ============================================================

describe('validateBreakdown — edge cases', () => {
  it('warns when breakdown has no variables', () => {
    const breakdown = createBreakdown('Empty', 0, 'f', []);
    const result = validateBreakdown(breakdown);

    expect(result.warnings.some((w) => w.includes('no variables'))).toBe(true);
  });

  it('errors when a variable has zero weight but weights do not sum to 1', () => {
    const variables = [
      createVariable('A', 10, 0.5, 0, 'zero weight'),
      createVariable('B', 20, 0.8, 0.5, 'half weight'),
    ];
    const breakdown = createBreakdown('ZeroWeight', 0.4, 'f', variables);
    const result = validateBreakdown(breakdown);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Weights sum to'))).toBe(true);
  });

  it('errors on negative normalizedValue', () => {
    const variable: ScoreVariable = {
      name: 'Negative',
      rawValue: -5,
      normalizedValue: -0.2,
      weight: 1.0,
      weightedContribution: -0.2,
      description: 'negative normalized',
    };
    const breakdown = createBreakdown('NegNorm', -0.2, 'f', [variable]);
    const result = validateBreakdown(breakdown);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes('normalizedValue') && e.includes('outside [0, 1]'))
    ).toBe(true);
  });

  it('errors on normalizedValue above 1', () => {
    const variable: ScoreVariable = {
      name: 'Over',
      rawValue: 200,
      normalizedValue: 1.5,
      weight: 1.0,
      weightedContribution: 1.5,
      description: 'over one',
    };
    const breakdown = createBreakdown('OverNorm', 1.5, 'f', [variable]);
    const result = validateBreakdown(breakdown);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes('normalizedValue') && e.includes('outside [0, 1]'))
    ).toBe(true);
  });

  it('errors on negative weight', () => {
    const variable: ScoreVariable = {
      name: 'NegWeight',
      rawValue: 10,
      normalizedValue: 0.5,
      weight: -0.3,
      weightedContribution: -0.15,
      description: 'neg weight',
    };
    const breakdown = createBreakdown('NegW', -0.15, 'f', [variable]);
    const result = validateBreakdown(breakdown);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('weight') && e.includes('outside [0, 1]'))).toBe(
      true
    );
  });

  it('warns when a variable has an empty description', () => {
    const variables = [createVariable('NoDesc', 10, 0.5, 1.0, '')];
    const breakdown = createBreakdown('EmptyDesc', 0.5, 'f', variables);
    const result = validateBreakdown(breakdown);

    expect(result.warnings.some((w) => w.includes('empty description'))).toBe(true);
  });

  it('warns when a variable has whitespace-only description', () => {
    const variable: ScoreVariable = {
      name: 'WhitespaceDesc',
      rawValue: 10,
      normalizedValue: 0.5,
      weight: 1.0,
      weightedContribution: 0.5,
      description: '   ',
    };
    const breakdown = createBreakdown('WsDesc', 0.5, 'f', [variable]);
    const result = validateBreakdown(breakdown);

    expect(result.warnings.some((w) => w.includes('empty description'))).toBe(true);
  });
});

// ============================================================
// validateBreakdown — weightedContribution mismatch
// ============================================================

describe('validateBreakdown — weightedContribution mismatch', () => {
  it('errors when weightedContribution does not match normalizedValue × weight', () => {
    const variable: ScoreVariable = {
      name: 'Mismatch',
      rawValue: 50,
      normalizedValue: 0.8,
      weight: 0.5,
      weightedContribution: 0.99, // should be 0.4
      description: 'deliberately wrong',
    };
    // Use weight=0.5 single variable, so weight sum won't be 1.0 — add a filler
    const filler: ScoreVariable = {
      name: 'Filler',
      rawValue: 10,
      normalizedValue: 0.5,
      weight: 0.5,
      weightedContribution: 0.25,
      description: 'filler',
    };
    const breakdown = createBreakdown('MisCalc', 1.24, 'f', [variable, filler]);
    const result = validateBreakdown(breakdown);

    expect(result.valid).toBe(false);
    expect(
      result.errors.some((e) => e.includes('Mismatch') && e.includes('weightedContribution'))
    ).toBe(true);
  });

  it('passes when weightedContribution is correct within tolerance', () => {
    const breakdown = makeValidBreakdown();
    const result = validateBreakdown(breakdown);

    expect(result.valid).toBe(true);
    expect(result.errors.some((e) => e.includes('weightedContribution'))).toBe(false);
  });
});

// ============================================================
// validateBreakdown — score out of bounds
// ============================================================

describe('validateBreakdown — score out of bounds', () => {
  it('errors when finalScore is below minValue', () => {
    const variables = [createVariable('V', 0, 0, 1.0, 'zero')];
    const breakdown = createBreakdown('BelowMin', -0.5, 'f', variables, {
      minValue: 0,
      maxValue: 1,
    });
    const result = validateBreakdown(breakdown);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('below minimum'))).toBe(true);
  });

  it('errors when finalScore is above maxValue', () => {
    const variables = [createVariable('V', 100, 1.0, 1.0, 'full')];
    const breakdown = createBreakdown('AboveMax', 1.5, 'f', variables, {
      minValue: 0,
      maxValue: 1,
    });
    const result = validateBreakdown(breakdown);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('above maximum'))).toBe(true);
  });

  it('passes when finalScore equals minValue exactly', () => {
    const variables = [createVariable('V', 0, 0, 1.0, 'zero')];
    const breakdown = createBreakdown('AtMin', 0, 'f', variables, {
      minValue: 0,
      maxValue: 1,
    });
    const result = validateBreakdown(breakdown);

    expect(result.errors.some((e) => e.includes('below minimum'))).toBe(false);
  });

  it('passes when finalScore equals maxValue exactly', () => {
    const variables = [createVariable('V', 100, 1.0, 1.0, 'full')];
    const breakdown = createBreakdown('AtMax', 1.0, 'f', variables, {
      minValue: 0,
      maxValue: 1,
    });
    const result = validateBreakdown(breakdown);

    expect(result.errors.some((e) => e.includes('above maximum'))).toBe(false);
  });

  it('does not check bounds when minValue/maxValue are undefined', () => {
    const variables = [createVariable('V', 999, 0.5, 1.0, 'no bounds')];
    const breakdown = createBreakdown('NoBounds', 999, 'f', variables);
    const result = validateBreakdown(breakdown);

    expect(result.errors.some((e) => e.includes('below minimum'))).toBe(false);
    expect(result.errors.some((e) => e.includes('above maximum'))).toBe(false);
  });
});

// ============================================================
// formatBreakdownText
// ============================================================

describe('formatBreakdownText', () => {
  it('includes the metric name in the header', () => {
    const breakdown = makeValidBreakdown();
    const text = formatBreakdownText(breakdown);

    expect(text).toContain('═══ Test Metric ═══');
  });

  it('includes the final score with 4 decimal places', () => {
    const breakdown = makeValidBreakdown();
    const text = formatBreakdownText(breakdown);

    expect(text).toContain(`Final Score: ${breakdown.finalScore.toFixed(4)}`);
  });

  it('includes the score unit when provided', () => {
    const breakdown = makeValidBreakdown();
    const text = formatBreakdownText(breakdown);

    expect(text).toContain('(0-1)');
  });

  it('omits the score unit when not provided', () => {
    const breakdown = createBreakdown('NoUnit', 0.5, 'f', [
      createVariable('V', 10, 0.5, 1.0, 'desc'),
    ]);
    const text = formatBreakdownText(breakdown);

    expect(text).toContain('Final Score: 0.5000');
    expect(text).not.toMatch(/Final Score: 0\.5000 \(/);
  });

  it('includes the formula', () => {
    const breakdown = makeValidBreakdown();
    const text = formatBreakdownText(breakdown);

    expect(text).toContain('Formula: Σ(variable × weight)');
  });

  it('lists each variable with raw, normalized, weight, and contribution', () => {
    const breakdown = makeValidBreakdown();
    const text = formatBreakdownText(breakdown);

    expect(text).toContain('Alpha');
    expect(text).toContain('Raw: 100.0000 → Normalized: 0.8000');
    expect(text).toContain('Weight: 50.0%');
    expect(text).toContain('Contribution: 0.4000');
    expect(text).toContain('Alpha measures X');
  });

  it('shows total weight percentage', () => {
    const breakdown = makeValidBreakdown();
    const text = formatBreakdownText(breakdown);

    expect(text).toContain('Total Weight: 100.0%');
  });

  it('renders the visual bar using block characters', () => {
    const breakdown = makeValidBreakdown();
    const text = formatBreakdownText(breakdown);

    // Alpha has normalizedValue 0.8 → round(0.8 * 20) = 16 blocks
    const expectedBar = '█'.repeat(16) + '░'.repeat(4);
    expect(text).toContain(`[${expectedBar}]`);
  });

  it('renders an empty bar for normalizedValue of 0', () => {
    const variables = [createVariable('Zero', 0, 0, 1.0, 'nothing')];
    const breakdown = createBreakdown('ZeroBar', 0, 'f', variables);
    const text = formatBreakdownText(breakdown);

    const emptyBar = '░'.repeat(20);
    expect(text).toContain(`[${emptyBar}]`);
  });

  it('renders a full bar for normalizedValue of 1', () => {
    const variables = [createVariable('Full', 100, 1.0, 1.0, 'everything')];
    const breakdown = createBreakdown('FullBar', 1.0, 'f', variables);
    const text = formatBreakdownText(breakdown);

    const fullBar = '█'.repeat(20);
    expect(text).toContain(`[${fullBar}]`);
  });
});

// ============================================================
// Round-trip: create → validate → format → all consistent
// ============================================================

describe('round-trip: create → validate → format', () => {
  it('produces a valid breakdown that formats without error', () => {
    const variables = [
      createVariable('Recency', 3, 0.9, 0.4, 'How recent the event is'),
      createVariable('Severity', 7, 0.7, 0.35, 'Impact severity'),
      createVariable('Spread', 15, 0.5, 0.25, 'How widely it spread'),
    ];

    const finalScore = variables.reduce((sum, v) => sum + v.weightedContribution, 0);

    const breakdown = createBreakdown(
      'Narrative Impact Score',
      finalScore,
      'Σ(variable × weight)',
      variables,
      { minValue: 0, maxValue: 1, scoreUnit: '0-1' }
    );

    // Validate
    const validation = validateBreakdown(breakdown);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.warnings).toHaveLength(0);

    // Format
    const text = formatBreakdownText(breakdown);
    expect(text).toContain('Narrative Impact Score');
    expect(text).toContain(finalScore.toFixed(4));
    expect(text).toContain('Recency');
    expect(text).toContain('Severity');
    expect(text).toContain('Spread');
    expect(text).toContain('Total Weight: 100.0%');
  });

  it('correctly round-trips a single-variable breakdown', () => {
    const variable = createVariable('Solo', 42, 0.42, 1.0, 'Only variable');
    const breakdown = createBreakdown('Solo Metric', 0.42, 'x', [variable], {
      minValue: 0,
      maxValue: 1,
    });

    const validation = validateBreakdown(breakdown);
    expect(validation.valid).toBe(true);

    const text = formatBreakdownText(breakdown);
    expect(text).toContain('Solo Metric');
    expect(text).toContain('Solo');
    expect(text).toContain('Weight: 100.0%');
  });

  it('detects inconsistency in a tampered breakdown', () => {
    const variables = [
      createVariable('A', 10, 0.5, 0.5, 'a'),
      createVariable('B', 20, 0.8, 0.5, 'b'),
    ];

    const breakdown = createBreakdown('Tampered', 0.65, 'f', variables, {
      minValue: 0,
      maxValue: 1,
    });

    // Tamper with a weightedContribution
    (breakdown.variables[0] as { weightedContribution: number }).weightedContribution = 0.99;

    const validation = validateBreakdown(breakdown);
    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes('weightedContribution'))).toBe(true);
  });

  it('handles many variables with correct weight distribution', () => {
    const count = 10;
    const weight = 1 / count;
    const variables = Array.from({ length: count }, (_, index) =>
      createVariable(`Var${index}`, index * 10, index / count, weight, `Variable number ${index}`)
    );

    const finalScore = variables.reduce((sum, v) => sum + v.weightedContribution, 0);

    const breakdown = createBreakdown('Many Variables', finalScore, 'Σ(v × w)', variables, {
      minValue: 0,
      maxValue: 1,
    });

    const validation = validateBreakdown(breakdown);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);

    const text = formatBreakdownText(breakdown);
    expect(text).toContain('Many Variables');
    expect(text).toContain('Var0');
    expect(text).toContain('Var9');
    expect(text).toContain('Total Weight: 100.0%');
  });
});
