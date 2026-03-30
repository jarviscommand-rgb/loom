import type { TemporalGraph } from '../graph/temporal-graph.js';
import type {
  NarrativeArc,
  NarrativeEvent,
  Tension,
  ArcPhase,
  ArcAnalysis,
  ArcHealthFactors,
  SubplotInfo,
  NarrativeArchetype,
} from '../graph/types.js';

// ============================================================
// LOOM — Arc Detector
//
// Detects narrative arc phases from temporal event analysis,
// matches common narrative archetypes, scores arc health,
// finds subplots, and predicts climax timing.
// ============================================================

/** Phase transition thresholds for impact/sentiment trajectories. */
const PHASE_THRESHOLDS = {
  /** Minimum impact ratio (recent / early) to leave setup. */
  risingActionEntry: 1.3,
  /** Impact level at which climax is detected. */
  climaxImpactThreshold: 0.7,
  /** Sentiment reversal magnitude to detect falling action. */
  fallingActionSentimentDrop: 0.3,
  /** Tension resolution ratio to detect resolution. */
  resolutionThreshold: 0.6,
} as const;

// ============================================================
// Public API — backward-compatible
// ============================================================

/**
 * Detect and return all arcs from the graph.
 * Backward-compatible — returns NarrativeArc[] as the original API did.
 */
export function detectArcs(graph: TemporalGraph): NarrativeArc[] {
  return graph.getAllArcs();
}

/**
 * Full arc analysis with phase detection, health scoring,
 * archetype matching, subplot detection, and climax prediction.
 */
export function analyzeArcs(graph: TemporalGraph): ArcAnalysis[] {
  const arcs = graph.getAllArcs();
  return arcs.map((arc) => analyzeArc(arc, graph));
}

// ============================================================
// Single arc analysis
// ============================================================

function analyzeArc(arc: NarrativeArc, graph: TemporalGraph): ArcAnalysis {
  const events = resolveEvents(arc.events, graph);
  const tensions = resolveTensions(arc.tensions, graph);

  const sentimentTrajectory = events.map((e) => e.sentiment);
  const impactTrajectory = events.map((e) => e.impact);

  const detectedPhase = detectPhase(events, tensions);
  const phaseProgress = computePhaseProgress(detectedPhase, events, tensions);
  const archetype = detectArchetype(sentimentTrajectory, impactTrajectory);
  const healthFactors = computeHealthFactors(arc, events, tensions, graph);
  const healthScore = aggregateHealth(healthFactors);
  const subplots = detectSubplots(events, graph);
  const { predictedClimaxDate, climaxConfidence } = predictClimax(
    arc,
    events,
    tensions,
    detectedPhase
  );

  return {
    arcId: arc.id,
    arcName: arc.name,
    archetype: archetype.type,
    archetypeConfidence: archetype.confidence,
    detectedPhase,
    phaseProgress,
    healthScore,
    healthFactors,
    subplots,
    predictedClimaxDate,
    climaxConfidence,
    sentimentTrajectory,
    impactTrajectory,
  };
}

// ============================================================
// Phase detection
// ============================================================

/**
 * Detect the current phase of a narrative arc by analyzing
 * event impact scores, sentiment trajectories, and tension states.
 */
function detectPhase(events: NarrativeEvent[], tensions: Tension[]): ArcPhase {
  if (events.length === 0) return 'setup';

  const n = events.length;
  const resolvedRatio =
    tensions.length > 0
      ? tensions.filter((t) => t.status === 'resolved').length / tensions.length
      : 0;

  // Resolution: most tensions resolved
  if (resolvedRatio >= PHASE_THRESHOLDS.resolutionThreshold && n >= 3) {
    return 'resolution';
  }

  // Split events into thirds
  const third = Math.max(1, Math.floor(n / 3));
  const earlyEvents = events.slice(0, third);
  const midEvents = events.slice(third, third * 2);
  const lateEvents = events.slice(third * 2);

  const earlyImpact = mean(earlyEvents.map((e) => e.impact));
  const midImpact = mean(midEvents.map((e) => e.impact));
  const lateImpact = mean(lateEvents.map((e) => e.impact));

  const earlySentiment = mean(earlyEvents.map((e) => e.sentiment));
  const lateSentiment = mean(lateEvents.map((e) => e.sentiment));

  // Climax: highest impact in the later portion
  const maxImpact = Math.max(...events.map((e) => e.impact));
  const maxImpactIdx = events.findIndex((e) => e.impact === maxImpact);
  const maxInLateHalf = maxImpactIdx >= n / 2;

  if (
    maxImpact >= PHASE_THRESHOLDS.climaxImpactThreshold &&
    maxInLateHalf &&
    midImpact > earlyImpact
  ) {
    // If the peak is very recent, we're at climax
    if (maxImpactIdx >= n - Math.max(2, Math.ceil(n * 0.2))) {
      return 'climax';
    }
    // If the peak was earlier and things are winding down
    if (lateImpact < midImpact) {
      return 'falling_action';
    }
  }

  // Falling action: sentiment dropping significantly after a peak
  if (
    lateSentiment < earlySentiment - PHASE_THRESHOLDS.fallingActionSentimentDrop &&
    lateImpact < midImpact
  ) {
    return 'falling_action';
  }

  // Rising action: impact is increasing
  if (
    midImpact > earlyImpact * PHASE_THRESHOLDS.risingActionEntry ||
    lateImpact > midImpact * PHASE_THRESHOLDS.risingActionEntry
  ) {
    return 'rising_action';
  }

  // Default: setup
  return 'setup';
}

/**
 * Compute how far through the current phase we are (0-1).
 */
function computePhaseProgress(
  phase: ArcPhase,
  events: NarrativeEvent[],
  tensions: Tension[]
): number {
  if (events.length < 2) return 0;

  switch (phase) {
    case 'setup': {
      // Progress based on how many entities and causal links are established
      const linkedRatio =
        events.filter((e) => e.causalPredecessors.length > 0).length / events.length;
      return Math.min(linkedRatio * 2, 1);
    }
    case 'rising_action': {
      // Progress based on impact trajectory slope
      const impacts = events.map((e) => e.impact);
      const maxImpact = Math.max(...impacts);
      const currentImpact = impacts[impacts.length - 1];
      return currentImpact / Math.max(maxImpact, 0.1);
    }
    case 'climax': {
      // How close we are to peak tension
      const criticalCount = tensions.filter((t) => t.status === 'critical').length;
      return tensions.length > 0 ? criticalCount / tensions.length : 0.5;
    }
    case 'falling_action': {
      // How many tensions are resolving
      const resolvingCount = tensions.filter(
        (t) => t.status === 'resolving' || t.status === 'resolved'
      ).length;
      return tensions.length > 0 ? resolvingCount / tensions.length : 0.5;
    }
    case 'resolution': {
      const resolvedCount = tensions.filter((t) => t.status === 'resolved').length;
      return tensions.length > 0 ? resolvedCount / tensions.length : 1;
    }
  }
}

// ============================================================
// Archetype detection
// ============================================================

interface ArchetypeMatch {
  type: NarrativeArchetype;
  confidence: number;
}

/**
 * Match the arc's trajectory against common narrative archetypes
 * using sentiment and impact curve shapes.
 */
function detectArchetype(sentiment: number[], impact: number[]): ArchetypeMatch {
  if (sentiment.length < 3) {
    return { type: 'unknown', confidence: 0 };
  }

  const scores: Array<{ type: NarrativeArchetype; score: number }> = [
    { type: 'tragedy', score: scoreTragedyFit(sentiment, impact) },
    { type: 'comedy', score: scoreComedyFit(sentiment, impact) },
    { type: 'heros_journey', score: scoreHerosJourneyFit(sentiment, impact) },
    { type: 'rags_to_riches', score: scoreRagsToRichesFit(sentiment) },
    { type: 'rebirth', score: scoreRebirthFit(sentiment) },
    { type: 'overcoming_monster', score: scoreOvercomingMonsterFit(sentiment, impact) },
  ];

  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];

  // Confidence is the gap between best and second-best
  const gap = scores.length > 1 ? best.score - scores[1].score : best.score;
  const confidence = Math.min(best.score * 0.7 + gap * 0.3, 1);

  return {
    type: best.score > 0.3 ? best.type : 'unknown',
    confidence: best.score > 0.3 ? confidence : 0,
  };
}

/** Tragedy: sentiment starts high, ends low; high impact at end. */
function scoreTragedyFit(sentiment: number[], impact: number[]): number {
  const firstThird = mean(sentiment.slice(0, Math.ceil(sentiment.length / 3)));
  const lastThird = mean(sentiment.slice(-Math.ceil(sentiment.length / 3)));
  const lateImpact = mean(impact.slice(-Math.ceil(impact.length / 3)));

  const sentimentDrop = firstThird - lastThird; // positive = tragedy
  const highImpactEnding = lateImpact;

  return clamp(sentimentDrop * 0.6 + highImpactEnding * 0.4, 0, 1);
}

/** Comedy: sentiment starts low/mixed, ends high; tensions resolve. */
function scoreComedyFit(sentiment: number[], impact: number[]): number {
  const firstThird = mean(sentiment.slice(0, Math.ceil(sentiment.length / 3)));
  const lastThird = mean(sentiment.slice(-Math.ceil(sentiment.length / 3)));
  const impactDecline =
    mean(impact.slice(0, Math.ceil(impact.length / 2))) -
    mean(impact.slice(-Math.ceil(impact.length / 3)));

  const sentimentRise = lastThird - firstThird; // positive = comedy
  const calmEnding = Math.max(0, impactDecline); // impact decreases

  return clamp(sentimentRise * 0.6 + calmEnding * 0.4, 0, 1);
}

/** Hero's journey: dip in the middle (ordeal), recovery at end. */
function scoreHerosJourneyFit(sentiment: number[], impact: number[]): number {
  const n = sentiment.length;
  const third = Math.ceil(n / 3);

  const firstSentiment = mean(sentiment.slice(0, third));
  const midSentiment = mean(sentiment.slice(third, third * 2));
  const lastSentiment = mean(sentiment.slice(third * 2));

  const midDip = firstSentiment - midSentiment; // positive = dip
  const recovery = lastSentiment - midSentiment; // positive = recovery
  const midImpact = mean(impact.slice(third, third * 2)); // high impact in middle

  return clamp(
    (midDip > 0 ? midDip * 0.3 : 0) + (recovery > 0 ? recovery * 0.3 : 0) + midImpact * 0.4,
    0,
    1
  );
}

/** Rags to riches: steady sentiment rise. */
function scoreRagsToRichesFit(sentiment: number[]): number {
  // Check for monotonically increasing trend
  let increases = 0;
  for (let i = 1; i < sentiment.length; i++) {
    if (sentiment[i] >= sentiment[i - 1]) increases++;
  }
  const monotonicity = increases / (sentiment.length - 1);
  const totalRise = sentiment[sentiment.length - 1] - sentiment[0];
  return clamp(monotonicity * 0.5 + (totalRise > 0 ? totalRise * 0.5 : 0), 0, 1);
}

/** Rebirth: fall then dramatic rise. */
function scoreRebirthFit(sentiment: number[]): number {
  const minIdx = sentiment.indexOf(Math.min(...sentiment));
  const minInLaterHalf = minIdx >= sentiment.length / 3;
  const riseAfterMin =
    minIdx < sentiment.length - 1 ? sentiment[sentiment.length - 1] - sentiment[minIdx] : 0;
  const fallBeforeMin = minIdx > 0 ? sentiment[0] - sentiment[minIdx] : 0;

  return clamp(
    (minInLaterHalf ? 0.2 : 0) +
      (fallBeforeMin > 0 ? fallBeforeMin * 0.3 : 0) +
      (riseAfterMin > 0 ? riseAfterMin * 0.5 : 0),
    0,
    1
  );
}

/** Overcoming monster: high-impact confrontation, positive resolution. */
function scoreOvercomingMonsterFit(sentiment: number[], impact: number[]): number {
  const maxImpact = Math.max(...impact);
  const maxIdx = impact.indexOf(maxImpact);
  const afterPeak = sentiment.slice(maxIdx + 1);
  const posResolution = afterPeak.length > 0 ? mean(afterPeak) > 0 : false;

  return clamp(
    maxImpact * 0.5 + (posResolution ? 0.3 : 0) + (maxIdx > impact.length / 3 ? 0.2 : 0),
    0,
    1
  );
}

// ============================================================
// Arc health scoring
// ============================================================

function computeHealthFactors(
  arc: NarrativeArc,
  events: NarrativeEvent[],
  tensions: Tension[],
  graph: TemporalGraph
): ArcHealthFactors {
  return {
    eventPacing: computeEventPacing(events),
    tensionProgression: computeTensionProgression(tensions),
    characterDevelopment: computeCharacterDevelopment(arc, events, graph),
    causalCoherence: computeCausalCoherence(events),
  };
}

/** Score event pacing regularity (0-1, 1 = perfectly regular). */
function computeEventPacing(events: NarrativeEvent[]): number {
  if (events.length < 2) return 0.5;

  const gaps: number[] = [];
  for (let i = 1; i < events.length; i++) {
    const gap =
      new Date(events[i].timestamp).getTime() - new Date(events[i - 1].timestamp).getTime();
    gaps.push(gap);
  }

  const avgGap = mean(gaps);
  if (avgGap === 0) return 1;

  // Coefficient of variation (lower = more regular)
  const stdDev = Math.sqrt(mean(gaps.map((g) => (g - avgGap) ** 2)));
  const cv = stdDev / avgGap;

  // cv = 0 → perfect, cv ≥ 2 → very irregular
  return clamp(1 - cv / 2, 0, 1);
}

/** Score tension progression appropriateness (0-1). */
function computeTensionProgression(tensions: Tension[]): number {
  if (tensions.length === 0) return 0.5;

  // Good progression: mix of states, not all stuck
  const statusCounts: Record<string, number> = {};
  for (const t of tensions) {
    statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
  }
  const uniqueStatuses = Object.keys(statusCounts).length;

  // Diversity of states indicates active progression
  return clamp(uniqueStatuses / 3, 0, 1);
}

/** Score character development: are characters appearing in multiple events? */
function computeCharacterDevelopment(
  arc: NarrativeArc,
  events: NarrativeEvent[],
  _graph: TemporalGraph
): number {
  if (arc.characters.length === 0 || events.length === 0) return 0.5;

  let totalAppearances = 0;
  for (const charId of arc.characters) {
    const charEvents = events.filter((e) => e.participants.includes(charId));
    totalAppearances += charEvents.length;
  }

  const avgAppearances = totalAppearances / arc.characters.length;
  // 1 appearance = underdeveloped, 3+ = well developed
  return clamp((avgAppearances - 1) / 2, 0, 1);
}

/** Score causal coherence: how connected is the causal chain? */
function computeCausalCoherence(events: NarrativeEvent[]): number {
  if (events.length < 2) return 1;

  const withPredecessors = events.filter((e) => e.causalPredecessors.length > 0);
  return withPredecessors.length / (events.length - 1); // first event has no predecessors
}

/** Aggregate health factors into a single score. */
function aggregateHealth(factors: ArcHealthFactors): number {
  return (
    factors.eventPacing * 0.25 +
    factors.tensionProgression * 0.25 +
    factors.characterDevelopment * 0.25 +
    factors.causalCoherence * 0.25
  );
}

// ============================================================
// Subplot detection
// ============================================================

/**
 * Detect subplots by finding clusters of co-participating entities
 * that form their own mini-arc within the larger arc.
 */
function detectSubplots(events: NarrativeEvent[], _graph: TemporalGraph): SubplotInfo[] {
  if (events.length < 3) return [];

  // Build entity co-occurrence matrix
  const coOccurrence = new Map<string, Map<string, number>>();
  const allParticipants = new Set<string>();

  for (const event of events) {
    for (const p of event.participants) allParticipants.add(p);
    for (let i = 0; i < event.participants.length; i++) {
      for (let j = i + 1; j < event.participants.length; j++) {
        const a = event.participants[i];
        const b = event.participants[j];
        increment(coOccurrence, a, b);
        increment(coOccurrence, b, a);
      }
    }
  }

  // Find entity clusters using greedy clustering
  const visited = new Set<string>();
  const clusters: Array<Set<string>> = [];

  for (const entity of allParticipants) {
    if (visited.has(entity)) continue;

    const cluster = new Set<string>();
    const queue = [entity];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      cluster.add(current);

      const neighbors = coOccurrence.get(current);
      if (!neighbors) continue;

      for (const [neighbor, count] of neighbors) {
        // Only cluster entities that co-occur at least twice
        if (count >= 2 && !visited.has(neighbor)) {
          queue.push(neighbor);
        }
      }
    }

    if (cluster.size >= 2) {
      clusters.push(cluster);
    }
  }

  // Filter to clusters that don't span the entire participant set
  // (otherwise it's the main arc, not a subplot)
  const subplotClusters = clusters.filter((c) => c.size < allParticipants.size * 0.8);

  return subplotClusters.map((cluster) => {
    const clusterEvents = events.filter((e) => e.participants.some((p) => cluster.has(p)));
    const phase = detectPhase(clusterEvents, []);
    const strength = clusterEvents.length / events.length;

    return {
      characters: Array.from(cluster),
      events: clusterEvents.map((e) => e.id),
      phase,
      strength: clamp(strength, 0, 1),
    };
  });
}

// ============================================================
// Climax prediction
// ============================================================

/**
 * Predict when a climax will occur based on tension convergence,
 * escalation rates, and event frequency acceleration.
 */
function predictClimax(
  arc: NarrativeArc,
  events: NarrativeEvent[],
  tensions: Tension[],
  currentPhase: ArcPhase
): { predictedClimaxDate: string | null; climaxConfidence: number } {
  // No prediction needed if already past climax
  if (
    currentPhase === 'climax' ||
    currentPhase === 'falling_action' ||
    currentPhase === 'resolution'
  ) {
    return { predictedClimaxDate: null, climaxConfidence: 0 };
  }

  if (events.length < 3) {
    return { predictedClimaxDate: null, climaxConfidence: 0 };
  }

  // Estimate based on escalation trend
  const escalatingTensions = tensions.filter(
    (t) => t.status === 'escalating' || t.status === 'critical'
  );
  const escalationRatio = tensions.length > 0 ? escalatingTensions.length / tensions.length : 0;

  // Compute event acceleration
  const recentEvents = events.slice(-Math.ceil(events.length / 2));
  const earlyEvents = events.slice(0, Math.ceil(events.length / 2));

  const recentFreq = computeEventFrequency(recentEvents);
  const earlyFreq = computeEventFrequency(earlyEvents);
  const acceleration = earlyFreq > 0 ? recentFreq / earlyFreq : 1;

  // Estimate days until climax based on current momentum
  const lastEventTime = new Date(events[events.length - 1].timestamp).getTime();
  const avgGapMs = computeAverageGap(recentEvents);

  // Higher escalation and acceleration = sooner climax
  const urgencyFactor = clamp(escalationRatio + (acceleration - 1) * 0.5, 0.1, 2);
  const estimatedEventsUntilClimax = Math.max(2, Math.round(5 / urgencyFactor));
  const estimatedMs = avgGapMs * estimatedEventsUntilClimax;

  const predictedDate = new Date(lastEventTime + estimatedMs);

  // Confidence based on data quality
  const confidence = clamp(
    0.2 + escalationRatio * 0.3 + Math.min(events.length / 10, 0.3) + (acceleration > 1 ? 0.2 : 0),
    0,
    1
  );

  return {
    predictedClimaxDate: predictedDate.toISOString(),
    climaxConfidence: confidence,
  };
}

// ============================================================
// Utility functions
// ============================================================

function resolveEvents(eventIds: string[], graph: TemporalGraph): NarrativeEvent[] {
  return eventIds
    .map((id) => graph.getEvent(id))
    .filter((e): e is NarrativeEvent => e !== undefined)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

function resolveTensions(tensionIds: string[], graph: TemporalGraph): Tension[] {
  return tensionIds.map((id) => graph.getTension(id)).filter((t): t is Tension => t !== undefined);
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function increment(map: Map<string, Map<string, number>>, a: string, b: string): void {
  let inner = map.get(a);
  if (!inner) {
    inner = new Map();
    map.set(a, inner);
  }
  inner.set(b, (inner.get(b) || 0) + 1);
}

function computeEventFrequency(events: NarrativeEvent[]): number {
  if (events.length < 2) return 0;
  const first = new Date(events[0].timestamp).getTime();
  const last = new Date(events[events.length - 1].timestamp).getTime();
  const spanDays = (last - first) / (1000 * 60 * 60 * 24);
  return spanDays > 0 ? events.length / spanDays : 0;
}

function computeAverageGap(events: NarrativeEvent[]): number {
  if (events.length < 2) return 1000 * 60 * 60 * 24; // default: 1 day
  const first = new Date(events[0].timestamp).getTime();
  const last = new Date(events[events.length - 1].timestamp).getTime();
  return (last - first) / (events.length - 1);
}
