// ============================================================
// LOOM — Core Type Definitions
// ============================================================

import type { ScoreBreakdown } from '../analysis/score-breakdown.js';

// --- Primitive enums ---

export type EntityType = 'person' | 'company' | 'institution' | 'group' | 'concept';
export type ArcPhase = 'setup' | 'rising_action' | 'climax' | 'falling_action' | 'resolution';
export type TensionStatus = 'simmering' | 'escalating' | 'critical' | 'resolving' | 'resolved';

/** Strategy used to generate dream branches. */
export type DreamStrategy = 'conservative' | 'wild_card' | 'pattern_based';

/** Momentum direction of a tension over time. */
export type MomentumDirection = 'accelerating' | 'plateauing' | 'decaying';

/** Common narrative structure archetypes. */
export type NarrativeArchetype =
  | 'tragedy'
  | 'comedy'
  | 'heros_journey'
  | 'rags_to_riches'
  | 'rebirth'
  | 'quest'
  | 'overcoming_monster'
  | 'unknown';

// --- Core graph primitives ---

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  motivation: string;
  capability: string;
  alliances: string[];
  description: string;
  firstSeen: string; // ISO date
  lastSeen: string;
  /** Extraction confidence score (0-1). */
  confidence?: number;
}

export interface NarrativeEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string; // ISO date
  participants: string[]; // entity IDs
  causalPredecessors: string[]; // event IDs
  impact: number; // 0-1
  sentiment: number; // -1 to 1
  /** Extraction confidence score (0-1). */
  confidence?: number;
}

export interface Tension {
  id: string;
  name: string;
  description: string;
  parties: [string, string]; // entity IDs on opposing sides
  status: TensionStatus;
  intensity: number; // 0-1
  duration: number; // days
  relatedEvents: string[]; // event IDs
  validFrom: string;
  validTo?: string;
  /** Extraction confidence score (0-1). */
  confidence?: number;
  /** History of status changes for escalation tracking. */
  statusHistory?: Array<{ status: TensionStatus; timestamp: string }>;
}

export interface NarrativeArc {
  id: string;
  name: string;
  description: string;
  phase: ArcPhase;
  characters: string[]; // entity IDs
  events: string[]; // event IDs
  tensions: string[]; // tension IDs
  startDate: string;
  endDate?: string;
  /** Extraction confidence score (0-1). */
  confidence?: number;
}

export interface DreamBranch {
  id: string;
  title: string;
  narrative: string;
  probability: number; // 0-1
  triggerEvents: string[];
  consequences: string[];
  affectedEntities: string[];
  /** Strategy that generated this branch. */
  strategy?: DreamStrategy;
  /** How well this branch satisfies character motivations (0-1). */
  motivationAlignment?: number;
  /** Whether this branch passes temporal coherence checks. */
  temporallyCoherent?: boolean;
  /** Full variable-level score breakdown for probability. */
  probabilityBreakdown?: ScoreBreakdown;
}

// --- Analysis output types ---

export interface PressurePoint {
  tensionId: string;
  tensionName: string;
  score: number;
  factors: {
    duration: number;
    escalation: number;
    convergence: number;
  };
  narrative: string;
}

/** Extended tension analysis with momentum, cascade, and history. */
export interface TensionAnalysis {
  tensionId: string;
  tensionName: string;
  /** Overall composite pressure score (0-1). */
  overallScore: number;
  /** Scoring component breakdown. */
  components: TensionScoringComponents;
  /** Is the tension accelerating, plateauing, or decaying? */
  momentum: MomentumDirection;
  /** Estimated probability (0-1) that this tension breaking triggers others. */
  cascadeRisk: number;
  /** IDs of tensions that could be triggered in cascade. */
  cascadeTargets: string[];
  /** Human-readable narrative summary. */
  narrative: string;
  /** Full variable-level score breakdown for transparency. */
  scoreBreakdown?: ScoreBreakdown;
}

/** Individual scoring components for a tension. */
export interface TensionScoringComponents {
  /** Duration-weighted score with exponential decay. */
  durationScore: number;
  /** Rate of status change over time. */
  escalationScore: number;
  /** How many tensions converge on same entities. */
  convergenceScore: number;
  /** Raw intensity from the tension. */
  intensityScore: number;
  /** Momentum multiplier (-1 to 1, negative = decaying). */
  momentumScore: number;
  /** Cascade risk contribution. */
  cascadeScore: number;
}

/** Full arc analysis with phase detection, health, and archetype. */
export interface ArcAnalysis {
  arcId: string;
  arcName: string;
  /** Detected narrative archetype. */
  archetype: NarrativeArchetype;
  /** Confidence in archetype detection (0-1). */
  archetypeConfidence: number;
  /** Detected phase based on event analysis. */
  detectedPhase: ArcPhase;
  /** Phase progression score (0-1, how far through current phase). */
  phaseProgress: number;
  /** Is the arc progressing naturally or stalling? (0-1, 1 = healthy). */
  healthScore: number;
  /** Factors contributing to health assessment. */
  healthFactors: ArcHealthFactors;
  /** Detected sub-arcs within this arc. */
  subplots: SubplotInfo[];
  /** Predicted climax timing (ISO date string), if applicable. */
  predictedClimaxDate: string | null;
  /** Confidence in climax prediction (0-1). */
  climaxConfidence: number;
  /** Sentiment trajectory over the arc's events. */
  sentimentTrajectory: number[];
  /** Impact trajectory over the arc's events. */
  impactTrajectory: number[];
  /** Full variable-level score breakdown for health score. */
  healthBreakdown?: ScoreBreakdown;
  /** Full variable-level score breakdown for archetype matching. */
  archetypeBreakdown?: ScoreBreakdown;
}

export interface ArcHealthFactors {
  /** Regular event pacing (0-1). */
  eventPacing: number;
  /** Tension is building appropriately (0-1). */
  tensionProgression: number;
  /** Characters are evolving (0-1). */
  characterDevelopment: number;
  /** Causal chains are connected (0-1). */
  causalCoherence: number;
}

export interface SubplotInfo {
  /** Subset of entity IDs forming this subplot. */
  characters: string[];
  /** Subset of event IDs in this subplot. */
  events: string[];
  /** Detected phase of the subplot. */
  phase: ArcPhase;
  /** Strength of the subplot signal (0-1). */
  strength: number;
}

/** Full dream analysis with multiple strategies. */
export interface DreamAnalysis {
  /** Generated branches across all strategies. */
  branches: DreamBranch[];
  /** Constraint violations found during generation. */
  constraintViolations: ConstraintViolation[];
  /** Cross-branch dependency analysis. */
  interBranchDependencies: BranchDependency[];
  /** Generation metadata. */
  metadata: DreamMetadata;
}

export interface ConstraintViolation {
  branchId: string;
  /** What fact or rule was violated. */
  violation: string;
  /** How severe is this violation (0-1). */
  severity: number;
}

export interface BranchDependency {
  /** Branch that triggers. */
  sourceBranchId: string;
  /** Branch that is affected. */
  targetBranchId: string;
  /** Nature of the dependency. */
  relationship: string;
}

export interface DreamMetadata {
  /** Total generation time in ms. */
  generationTimeMs: number;
  /** How many LLM retries were needed. */
  retryCount: number;
  /** Strategies used. */
  strategies: DreamStrategy[];
}

// --- Graph statistics ---

export interface GraphStatistics {
  /** Total node counts. */
  entityCount: number;
  eventCount: number;
  tensionCount: number;
  arcCount: number;
  /** Graph density: ratio of actual edges to possible edges. */
  density: number;
  /** Average clustering coefficient. */
  clusteringCoefficient: number;
  /** Top entities by betweenness centrality. */
  centralEntities: Array<{ entityId: string; centrality: number }>;
  /** Temporal span of the graph. */
  timeSpan: { earliest: string; latest: string } | null;
}

export interface GraphSnapshot {
  entities: Entity[];
  events: NarrativeEvent[];
  tensions: Tension[];
  arcs: NarrativeArc[];
  timestamp: string;
}
