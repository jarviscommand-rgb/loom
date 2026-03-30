import type { TemporalGraph } from '../graph/temporal-graph.js';
import type {
  PressurePoint,
  Tension,
  TensionAnalysis,
  TensionScoringComponents,
  MomentumDirection,
  TensionStatus,
} from '../graph/types.js';
import { createBreakdown, createVariable, type ScoreBreakdown } from './score-breakdown.js';

// ============================================================
// LOOM — Tension Radar
//
// Analyzes narrative tensions with duration-weighted scoring,
// escalation tracking, convergence detection, momentum analysis,
// cascade risk scoring, and historical comparison.
// ============================================================

/** Status severity used for escalation and momentum calculations. */
const STATUS_SEVERITY: Record<TensionStatus, number> = {
  resolved: 0,
  resolving: 0.2,
  simmering: 0.4,
  escalating: 0.7,
  critical: 1.0,
};

/** Half-life in days for the exponential duration decay function. */
const DURATION_HALF_LIFE_DAYS = 14;

/** Weight vector for the composite score. */
const SCORE_WEIGHTS = {
  intensity: 0.2,
  duration: 0.15,
  escalation: 0.2,
  convergence: 0.15,
  momentum: 0.15,
  cascade: 0.15,
} as const;

// ============================================================
// Public API — backward-compatible
// ============================================================

/**
 * Scan all active tensions and return ranked pressure points.
 * This is the backward-compatible entry point used by the API routes.
 */
export function scanTensions(graph: TemporalGraph): PressurePoint[] {
  const analyses = analyzeTensions(graph);
  return analyses.map(toPressurePoint);
}

/**
 * Full tension analysis with all scoring components.
 * Returns detailed TensionAnalysis objects sorted by overall score.
 */
export function analyzeTensions(graph: TemporalGraph): TensionAnalysis[] {
  const activeTensions = graph.getActiveTensions();
  if (activeTensions.length === 0) return [];

  // Pre-compute shared context
  const ctx = buildAnalysisContext(graph, activeTensions);

  const analyses = activeTensions.map((tension) => analyzeSingleTension(tension, ctx, graph));

  return analyses.sort((a, b) => b.overallScore - a.overallScore);
}

// ============================================================
// Context used across all tension analyses
// ============================================================

interface AnalysisContext {
  /** All active tensions. */
  activeTensions: Tension[];
  /** Tension ID → Tension for fast lookup. */
  tensionById: Map<string, Tension>;
  /** Entity ID → set of tension IDs involving that entity. */
  entityTensionMap: Map<string, Set<string>>;
  /** Tension ID → set of entity IDs on both sides. */
  tensionEntityMap: Map<string, Set<string>>;
  /** Tension ID → number of shared-entity overlaps with other tensions. */
  convergenceCounts: Map<string, number>;
  /** Current reference time for decay calculations. */
  referenceTime: number;
}

/** Build shared context that multiple tension analyses can reference. */
function buildAnalysisContext(graph: TemporalGraph, activeTensions: Tension[]): AnalysisContext {
  const referenceTime = Date.now();

  // Build tension ID → Tension index
  const tensionById = new Map<string, Tension>();
  for (const t of activeTensions) {
    tensionById.set(t.id, t);
  }

  // Build entity→tension mapping
  const entityTensionMap = new Map<string, Set<string>>();
  const tensionEntityMap = new Map<string, Set<string>>();

  for (const t of activeTensions) {
    const entitySet = new Set(t.parties as string[]);
    tensionEntityMap.set(t.id, entitySet);

    // Also include entities from related events
    for (const eventId of t.relatedEvents) {
      const event = graph.getEvent(eventId);
      if (event) {
        for (const pid of event.participants) {
          entitySet.add(pid);
        }
      }
    }

    for (const eid of entitySet) {
      let set = entityTensionMap.get(eid);
      if (!set) {
        set = new Set();
        entityTensionMap.set(eid, set);
      }
      set.add(t.id);
    }
  }

  // Compute convergence counts (how many other tensions share entities)
  const convergenceCounts = new Map<string, number>();
  for (const t of activeTensions) {
    const entities = tensionEntityMap.get(t.id)!;
    const overlapping = new Set<string>();
    for (const eid of entities) {
      const otherTensions = entityTensionMap.get(eid);
      if (otherTensions) {
        for (const otherId of otherTensions) {
          if (otherId !== t.id) overlapping.add(otherId);
        }
      }
    }
    convergenceCounts.set(t.id, overlapping.size);
  }

  return {
    activeTensions,
    tensionById,
    entityTensionMap,
    tensionEntityMap,
    convergenceCounts,
    referenceTime,
  };
}

// ============================================================
// Single tension analysis
// ============================================================

function analyzeSingleTension(
  tension: Tension,
  ctx: AnalysisContext,
  graph: TemporalGraph
): TensionAnalysis {
  // Compute expensive values once and reuse
  const { cascadeRisk, cascadeTargets } = computeCascadeRisk(tension, ctx);
  const momentumScore = computeMomentumScore(tension, graph);
  const momentum: MomentumDirection =
    momentumScore > 0.15 ? 'accelerating' : momentumScore < -0.15 ? 'decaying' : 'plateauing';

  const components: TensionScoringComponents = {
    durationScore: computeDurationScore(tension),
    escalationScore: computeEscalationScore(tension),
    convergenceScore: computeConvergenceScore(tension, ctx),
    intensityScore: tension.intensity,
    momentumScore,
    cascadeScore: cascadeRisk,
  };
  const overallScore = computeCompositeScore(components);
  const scoreBreakdown = buildScoreBreakdown(tension, components, overallScore, ctx);

  return {
    tensionId: tension.id,
    tensionName: tension.name,
    overallScore,
    components,
    momentum,
    cascadeRisk,
    cascadeTargets,
    narrative: generateNarrative(tension, overallScore, momentum, cascadeRisk, graph),
    scoreBreakdown,
  };
}

/**
 * Build a full ScoreBreakdown for a tension's composite pressure score.
 * Each variable shows the raw input, normalized score, weight, and
 * a plain-English explanation of the math.
 */
function buildScoreBreakdown(
  tension: Tension,
  components: TensionScoringComponents,
  overallScore: number,
  ctx: AnalysisContext
): ScoreBreakdown {
  const convergenceCount = ctx.convergenceCounts.get(tension.id) || 0;
  const momentumClamped = Math.max(0, components.momentumScore);

  return createBreakdown(
    'Tension Pressure Score',
    overallScore,
    'Σ(intensity×0.2 + duration×0.15 + escalation×0.2 + convergence×0.15 + momentum×0.15 + cascade×0.15)',
    [
      createVariable(
        'Intensity',
        tension.intensity,
        components.intensityScore,
        SCORE_WEIGHTS.intensity,
        `Raw tension intensity from extraction (${tension.intensity.toFixed(2)} on 0-1 scale). ` +
          'Higher values indicate more severe opposition between the parties.'
      ),
      createVariable(
        'Duration Decay',
        tension.duration,
        components.durationScore,
        SCORE_WEIGHTS.duration,
        `Tension has been active for ${tension.duration} days. Uses exponential rise-then-decay ` +
          `with half-life of ${DURATION_HALF_LIFE_DAYS} days — peaks around day ${DURATION_HALF_LIFE_DAYS}, ` +
          'then decays as long-running tensions become "background noise".'
      ),
      createVariable(
        'Escalation',
        STATUS_SEVERITY[tension.status],
        components.escalationScore,
        SCORE_WEIGHTS.escalation,
        `Current status "${tension.status}" (severity ${STATUS_SEVERITY[tension.status].toFixed(1)}). ` +
          'Blends base severity with rate of status change over time — rapid escalation amplifies ' +
          'the score via tanh(rate × 5) × 0.3 bonus.'
      ),
      createVariable(
        'Convergence',
        convergenceCount,
        components.convergenceScore,
        SCORE_WEIGHTS.convergence,
        `${convergenceCount} other tension(s) share entities with this one. ` +
          'Score uses diminishing returns: 1 - 1/(1 + count/2). ' +
          'More convergence = more pressure amplification from interconnected conflicts.'
      ),
      createVariable(
        'Momentum',
        components.momentumScore,
        momentumClamped,
        SCORE_WEIGHTS.momentum,
        `Momentum score ${components.momentumScore.toFixed(3)} (only positive values add pressure). ` +
          'Computed by comparing event impact and frequency between first and second half of ' +
          'the tension timeline. >0.15 = accelerating, <-0.15 = decaying.'
      ),
      createVariable(
        'Cascade Risk',
        components.cascadeScore,
        components.cascadeScore,
        SCORE_WEIGHTS.cascade,
        `Probability (${(components.cascadeScore * 100).toFixed(1)}%) that this tension breaking ` +
          'triggers connected tensions. Uses P(at least one) = 1 - Π(1 - pᵢ) for independent events, ' +
          'where each pᵢ depends on entity overlap, volatility, and susceptibility.'
      ),
    ],
    { minValue: 0, maxValue: 1, scoreUnit: '0-1' }
  );
}

// ============================================================
// Scoring components
// ============================================================

function _computeScoringComponents(
  tension: Tension,
  ctx: AnalysisContext,
  graph: TemporalGraph
): TensionScoringComponents {
  return {
    durationScore: computeDurationScore(tension),
    escalationScore: computeEscalationScore(tension),
    convergenceScore: computeConvergenceScore(tension, ctx),
    intensityScore: tension.intensity,
    momentumScore: computeMomentumScore(tension, graph),
    cascadeScore: computeCascadeRisk(tension, ctx).cascadeRisk,
  };
}

/**
 * Duration-weighted score using exponential decay.
 * Peaks around the half-life point, then decays — modeling how
 * long-running tensions can become "background noise" while
 * medium-duration tensions are most volatile.
 */
function computeDurationScore(tension: Tension): number {
  const days = tension.duration;
  if (days <= 0) return 0;

  // Exponential rise-then-decay centered on the half-life
  // score = 1 - e^(-days/halfLife) for the rising portion
  // After 2x half-life, apply gentle decay
  const risingScore = 1 - Math.exp(-days / DURATION_HALF_LIFE_DAYS);

  if (days <= DURATION_HALF_LIFE_DAYS * 2) {
    return risingScore;
  }

  // Decay factor for very long-running tensions
  const excessDays = days - DURATION_HALF_LIFE_DAYS * 2;
  const decayFactor = Math.exp(-excessDays / (DURATION_HALF_LIFE_DAYS * 4));
  return risingScore * decayFactor;
}

/**
 * Escalation score based on current status and status history.
 * Detects acceleration (rapid status changes) vs deceleration.
 */
function computeEscalationScore(tension: Tension): number {
  const baseSeverity = STATUS_SEVERITY[tension.status];
  const history = tension.statusHistory;

  if (!history || history.length < 2) {
    return baseSeverity;
  }

  // Compute rate of escalation from status history
  let escalationRate = 0;
  for (let i = 1; i < history.length; i++) {
    const prevSeverity = STATUS_SEVERITY[history[i - 1].status];
    const currSeverity = STATUS_SEVERITY[history[i].status];
    const timeDeltaMs =
      new Date(history[i].timestamp).getTime() - new Date(history[i - 1].timestamp).getTime();
    const timeDeltaDays = Math.max(timeDeltaMs / (1000 * 60 * 60 * 24), 0.1);

    // Positive = escalating, negative = de-escalating
    escalationRate += (currSeverity - prevSeverity) / timeDeltaDays;
  }

  escalationRate /= history.length - 1;

  // Blend base severity with escalation rate
  // Rapid escalation amplifies, rapid de-escalation dampens
  const rateBonus = Math.tanh(escalationRate * 5) * 0.3; // [-0.3, 0.3]
  return clamp(baseSeverity + rateBonus, 0, 1);
}

/**
 * Convergence score: how many other tensions share entities with this one.
 * More convergence = more pressure amplification.
 */
function computeConvergenceScore(tension: Tension, ctx: AnalysisContext): number {
  const count = ctx.convergenceCounts.get(tension.id) || 0;
  if (count === 0) return 0;

  // Diminishing returns: first overlaps matter most
  // score = 1 - 1/(1 + count/2)
  return 1 - 1 / (1 + count / 2);
}

/**
 * Momentum score: is the tension accelerating, plateauing, or decaying?
 * Based on event frequency and impact trends over time.
 */
function computeMomentumScore(tension: Tension, graph: TemporalGraph): number {
  const events = tension.relatedEvents
    .map((id) => graph.getEvent(id))
    .filter((e): e is NonNullable<typeof e> => e !== undefined)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (events.length < 2) return 0;

  // Split events into two halves and compare
  const mid = Math.floor(events.length / 2);
  const firstHalf = events.slice(0, mid);
  const secondHalf = events.slice(mid);

  // Compare average impact
  const avgImpactFirst = mean(firstHalf.map((e) => e.impact));
  const avgImpactSecond = mean(secondHalf.map((e) => e.impact));

  // Compare event frequency (events per day)
  const freqFirst = computeFrequency(firstHalf);
  const freqSecond = computeFrequency(secondHalf);

  // Combine impact trend and frequency trend
  const impactTrend = avgImpactSecond - avgImpactFirst; // [-1, 1]
  const freqRatio = freqFirst > 0 ? freqSecond / freqFirst - 1 : 0; // > 0 means accelerating

  return clamp((impactTrend + Math.tanh(freqRatio)) / 2, -1, 1);
}

// ============================================================
// Momentum detection
// ============================================================

/** Classify momentum direction from the momentum score. */
function _detectMomentum(tension: Tension, graph: TemporalGraph): MomentumDirection {
  const score = computeMomentumScore(tension, graph);
  if (score > 0.15) return 'accelerating';
  if (score < -0.15) return 'decaying';
  return 'plateauing';
}

// ============================================================
// Cascade risk
// ============================================================

/**
 * Estimate cascade risk: probability that this tension breaking
 * triggers other tensions.
 *
 * Based on:
 * - Entity overlap with other tensions
 * - Causal chain connectivity of related events
 * - Intensity of connected tensions
 */
function computeCascadeRisk(
  tension: Tension,
  ctx: AnalysisContext
): { cascadeRisk: number; cascadeTargets: string[] } {
  const myEntities = ctx.tensionEntityMap.get(tension.id) || new Set<string>();
  const targets: Array<{ tensionId: string; risk: number }> = [];

  // Use entityTensionMap to find only overlapping tensions (avoids O(T^2))
  const overlapCounts = new Map<string, number>();
  for (const eid of myEntities) {
    const tensionsOnEntity = ctx.entityTensionMap.get(eid);
    if (!tensionsOnEntity) continue;
    for (const otherId of tensionsOnEntity) {
      if (otherId === tension.id) continue;
      overlapCounts.set(otherId, (overlapCounts.get(otherId) || 0) + 1);
    }
  }

  for (const [otherId, sharedCount] of overlapCounts) {
    const other = ctx.tensionById.get(otherId);
    if (!other) continue;

    // Risk based on overlap ratio and the other tension's volatility
    const overlapRatio = sharedCount / Math.max(myEntities.size, 1);
    const otherVolatility = STATUS_SEVERITY[other.status] * other.intensity;

    // Tensions that are already escalating are more susceptible to cascade
    const susceptibility =
      other.status === 'simmering'
        ? 0.8
        : other.status === 'escalating'
          ? 1.0
          : other.status === 'critical'
            ? 0.6 // already critical, less marginal effect
            : 0.3;

    const risk = overlapRatio * otherVolatility * susceptibility;
    if (risk > 0.05) {
      targets.push({ tensionId: other.id, risk });
    }
  }

  targets.sort((a, b) => b.risk - a.risk);

  // Overall cascade risk = probability that at least one cascade occurs
  // P(at least one) = 1 - product(1 - p_i) for independent events
  const cascadeRisk =
    targets.length > 0 ? 1 - targets.reduce((acc, t) => acc * (1 - t.risk), 1) : 0;

  return {
    cascadeRisk: clamp(cascadeRisk, 0, 1),
    cascadeTargets: targets.map((t) => t.tensionId),
  };
}

// ============================================================
// Composite scoring
// ============================================================

function computeCompositeScore(components: TensionScoringComponents): number {
  const raw =
    components.intensityScore * SCORE_WEIGHTS.intensity +
    components.durationScore * SCORE_WEIGHTS.duration +
    components.escalationScore * SCORE_WEIGHTS.escalation +
    components.convergenceScore * SCORE_WEIGHTS.convergence +
    Math.max(0, components.momentumScore) * SCORE_WEIGHTS.momentum + // only positive momentum adds pressure
    components.cascadeScore * SCORE_WEIGHTS.cascade;

  return clamp(raw, 0, 1);
}

// ============================================================
// Narrative generation
// ============================================================

function generateNarrative(
  tension: Tension,
  score: number,
  momentum: MomentumDirection,
  cascadeRisk: number,
  graph: TemporalGraph
): string {
  const urgency =
    score > 0.8 ? 'CRITICAL' : score > 0.6 ? 'HIGH' : score > 0.4 ? 'ELEVATED' : 'DEVELOPING';

  const entity1 = graph.getEntity(tension.parties[0]);
  const entity2 = graph.getEntity(tension.parties[1]);
  const name1 = entity1?.name || tension.parties[0];
  const name2 = entity2?.name || tension.parties[1];

  const momentumText =
    momentum === 'accelerating'
      ? 'and accelerating'
      : momentum === 'decaying'
        ? 'but losing momentum'
        : 'and holding steady';

  const cascadeText =
    cascadeRisk > 0.5
      ? ` High cascade risk (${(cascadeRisk * 100).toFixed(0)}%) — resolution or eruption here could trigger connected tensions.`
      : cascadeRisk > 0.2
        ? ` Moderate cascade risk (${(cascadeRisk * 100).toFixed(0)}%).`
        : '';

  return (
    `[${urgency}] The tension between ${name1} and ${name2} — "${tension.name}" — ` +
    `has been ${tension.status} for ${tension.duration} days ${momentumText}. ` +
    `${tension.description}${cascadeText}`
  );
}

// ============================================================
// Backward-compatible conversion
// ============================================================

/** Convert a full TensionAnalysis to the simpler PressurePoint format. */
function toPressurePoint(analysis: TensionAnalysis): PressurePoint {
  return {
    tensionId: analysis.tensionId,
    tensionName: analysis.tensionName,
    score: analysis.overallScore,
    factors: {
      duration: analysis.components.durationScore,
      escalation: analysis.components.escalationScore,
      convergence: analysis.components.convergenceScore,
    },
    narrative: analysis.narrative,
  };
}

// ============================================================
// Utility functions
// ============================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** Compute event frequency as events per day. */
function computeFrequency(events: Array<{ timestamp: string }>): number {
  if (events.length < 2) return 0;
  const first = new Date(events[0].timestamp).getTime();
  const last = new Date(events[events.length - 1].timestamp).getTime();
  const spanDays = (last - first) / (1000 * 60 * 60 * 24);
  return spanDays > 0 ? events.length / spanDays : 0;
}
