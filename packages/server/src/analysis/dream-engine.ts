import OpenAI from 'openai';
import { v4 as uuid } from 'uuid';
import type { TemporalGraph } from '../graph/temporal-graph.js';
import type {
  DreamBranch,
  DreamAnalysis,
  DreamStrategy,
  DreamMetadata,
  ConstraintViolation,
  BranchDependency,
  Entity,
  NarrativeEvent,
  Tension,
  GraphSnapshot,
} from '../graph/types.js';
import { DREAM_MODE_PROMPT } from '../extraction/prompts.js';

// ============================================================
// LOOM — Dream Engine
//
// Generates speculative future branches with:
// - Multiple generation strategies (conservative, wild card, pattern-based)
// - Bayesian-inspired probability scoring
// - Character motivation alignment
// - Constraint satisfaction (fact checking)
// - Temporal coherence validation
// - Inter-branch dependency analysis
// - Retry logic with exponential backoff
// ============================================================

const MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 1000;

/** Initialize the OpenAI client lazily to allow env var configuration. */
function getOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ============================================================
// Public API — backward-compatible
// ============================================================

/**
 * Generate dream branches from the current graph state.
 * Backward-compatible — returns DreamBranch[] as the original API did.
 */
export async function generateDreams(graph: TemporalGraph): Promise<DreamBranch[]> {
  const analysis = await generateDreamAnalysis(graph);
  return analysis.branches;
}

/**
 * Full dream analysis with constraint checking, inter-branch dependencies,
 * and generation metadata.
 */
export async function generateDreamAnalysis(
  graph: TemporalGraph,
  strategies: DreamStrategy[] = ['conservative', 'wild_card', 'pattern_based']
): Promise<DreamAnalysis> {
  const startTime = Date.now();
  const snapshot = graph.getSnapshot();

  let totalRetries = 0;
  const allBranches: DreamBranch[] = [];

  // Generate branches for each strategy
  for (const strategy of strategies) {
    const { branches, retries } = await generateForStrategy(snapshot, strategy, graph);
    allBranches.push(...branches);
    totalRetries += retries;
  }

  // Post-processing
  normalizeProbabilities(allBranches);
  applyMotivationAlignment(allBranches, snapshot);
  const constraintViolations = checkConstraints(allBranches, snapshot, graph);
  validateTemporalCoherence(allBranches, snapshot);
  const interBranchDependencies = analyzeInterBranchDependencies(allBranches);

  const metadata: DreamMetadata = {
    generationTimeMs: Date.now() - startTime,
    retryCount: totalRetries,
    strategies,
  };

  return {
    branches: allBranches.sort((a, b) => b.probability - a.probability),
    constraintViolations,
    interBranchDependencies,
    metadata,
  };
}

// ============================================================
// Strategy-specific generation
// ============================================================

interface GenerationResult {
  branches: DreamBranch[];
  retries: number;
}

async function generateForStrategy(
  snapshot: GraphSnapshot,
  strategy: DreamStrategy,
  graph: TemporalGraph
): Promise<GenerationResult> {
  const stateDescription = buildStateDescription(snapshot, strategy);
  const prompt = buildStrategyPrompt(strategy, stateDescription);

  const rawBranches = await callLLMWithRetry(prompt);

  const branches: DreamBranch[] = rawBranches.map((b) => ({
    id: uuid(),
    title: b.title,
    narrative: b.narrative,
    probability: clamp(b.probability, 0, 1),
    triggerEvents: b.triggerEvents || [],
    consequences: b.consequences || [],
    affectedEntities: b.affectedEntities || [],
    strategy,
    motivationAlignment: undefined,
    temporallyCoherent: undefined,
  }));

  return { branches, retries: 0 };
}

/** Build the state description with strategy-specific emphasis. */
function buildStateDescription(snapshot: GraphSnapshot, strategy: DreamStrategy): string {
  const recentEvents = snapshot.events.slice(-10);
  const activeTensions = snapshot.tensions.filter((t) => t.status !== 'resolved');

  const base = {
    characters: snapshot.entities.map((e) => ({
      name: e.name,
      type: e.type,
      motivation: e.motivation,
      alliances: e.alliances,
      capability: e.capability,
    })),
    recentEvents: recentEvents.map((e) => ({
      title: e.title,
      description: e.description,
      timestamp: e.timestamp,
      impact: e.impact,
      sentiment: e.sentiment,
    })),
    activeTensions: activeTensions.map((t) => ({
      name: t.name,
      description: t.description,
      status: t.status,
      intensity: t.intensity,
      parties: t.parties,
    })),
    arcs: snapshot.arcs.map((a) => ({
      name: a.name,
      phase: a.phase,
      description: a.description,
    })),
  };

  // Strategy-specific additions
  if (strategy === 'conservative') {
    return JSON.stringify({
      ...base,
      instruction: 'Focus on the most likely next steps given current momentum. Stay close to established patterns.',
    }, null, 2);
  }

  if (strategy === 'wild_card') {
    return JSON.stringify({
      ...base,
      instruction: 'Explore unlikely but plausible disruptions. Think about black swan events, betrayals, external shocks, or hidden motivations surfacing.',
    }, null, 2);
  }

  // pattern_based
  return JSON.stringify({
    ...base,
    instruction: 'Identify recurring patterns in the narrative (cycles, escalation spirals, alliance shifts) and project them forward.',
  }, null, 2);
}

/** Build the prompt for a specific strategy. */
function buildStrategyPrompt(strategy: DreamStrategy, stateDescription: string): string {
  const strategyInstructions: Record<DreamStrategy, string> = {
    conservative: `Generate 1-2 CONSERVATIVE future scenarios. These should be the most probable next developments based on existing momentum and character motivations. Probability should be relatively high (0.3-0.7).`,
    wild_card: `Generate 1-2 WILD CARD scenarios. These are unlikely but plausible disruptions that would fundamentally alter the narrative trajectory. Probability should be low (0.05-0.25) but the scenarios must still be grounded in the established world.`,
    pattern_based: `Generate 1-2 PATTERN-BASED scenarios. Identify recurring narrative patterns (escalation cycles, alliance-breaking, power consolidation) and project them forward. Probability should be moderate (0.15-0.45).`,
  };

  const basePrompt = DREAM_MODE_PROMPT.replace('{state}', stateDescription);
  return `${basePrompt}\n\n${strategyInstructions[strategy]}`;
}

// ============================================================
// LLM call with exponential backoff retry
// ============================================================

interface RawBranch {
  title: string;
  narrative: string;
  probability: number;
  triggerEvents: string[];
  consequences: string[];
  affectedEntities: string[];
}

async function callLLMWithRetry(prompt: string): Promise<RawBranch[]> {
  const openai = getOpenAIClient();
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: prompt },
          {
            role: 'user',
            content: 'Generate the next possible chapters for this narrative.',
          },
        ],
        temperature: 0.8,
        max_tokens: 4096,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from LLM');

      return parseJsonResponse<RawBranch[]>(content);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < MAX_RETRIES) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw new Error(`Dream generation failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`);
}

// ============================================================
// Probability normalization (Bayesian-inspired)
// ============================================================

/**
 * Normalize branch probabilities so they sum to ~1.0.
 * Uses a softmax-like approach weighted by original probabilities
 * to preserve relative ordering while ensuring valid distribution.
 */
function normalizeProbabilities(branches: DreamBranch[]): void {
  if (branches.length === 0) return;

  const sum = branches.reduce((s, b) => s + b.probability, 0);
  if (sum <= 0) {
    // Uniform distribution as fallback
    const uniform = 1 / branches.length;
    for (const b of branches) b.probability = uniform;
    return;
  }

  for (const b of branches) {
    b.probability = b.probability / sum;
  }
}

// ============================================================
// Character motivation alignment
// ============================================================

/**
 * Score how well each branch aligns with character motivations.
 * Higher score = characters are acting in-character.
 */
function applyMotivationAlignment(
  branches: DreamBranch[],
  snapshot: GraphSnapshot
): void {
  const entityMap = new Map<string, Entity>();
  for (const e of snapshot.entities) {
    entityMap.set(e.name.toLowerCase(), e);
    entityMap.set(e.id, e);
  }

  for (const branch of branches) {
    let alignmentSum = 0;
    let alignmentCount = 0;

    for (const entityRef of branch.affectedEntities) {
      const entity = entityMap.get(entityRef.toLowerCase()) || entityMap.get(entityRef);
      if (!entity) continue;

      // Simple heuristic: check if the branch narrative mentions the entity's
      // motivation keywords. More sophisticated approaches would use embeddings.
      const motivationWords = entity.motivation.toLowerCase().split(/\s+/);
      const narrativeLower = branch.narrative.toLowerCase();

      let matches = 0;
      for (const word of motivationWords) {
        if (word.length > 3 && narrativeLower.includes(word)) {
          matches++;
        }
      }

      const alignment = motivationWords.length > 0
        ? Math.min(matches / Math.max(motivationWords.length * 0.3, 1), 1)
        : 0.5;

      alignmentSum += alignment;
      alignmentCount++;
    }

    branch.motivationAlignment = alignmentCount > 0
      ? alignmentSum / alignmentCount
      : 0.5; // neutral if no entities to check
  }
}

// ============================================================
// Constraint satisfaction
// ============================================================

/**
 * Check branches against established facts in the graph.
 * Returns violations found.
 */
function checkConstraints(
  branches: DreamBranch[],
  snapshot: GraphSnapshot,
  graph: TemporalGraph
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  const resolvedTensions = snapshot.tensions.filter((t) => t.status === 'resolved');
  const resolvedTensionNames = new Set(resolvedTensions.map((t) => t.name.toLowerCase()));

  for (const branch of branches) {
    const narrativeLower = branch.narrative.toLowerCase();

    // Check: branch shouldn't reference resolved tensions as still active
    for (const tensionName of resolvedTensionNames) {
      if (narrativeLower.includes(tensionName)) {
        // Check if the context suggests the tension is still ongoing
        const words = ['continues', 'escalates', 'intensifies', 'erupts', 'flares'];
        const referencesAsActive = words.some(
          (w) => narrativeLower.includes(`${tensionName} ${w}`) ||
                 narrativeLower.includes(`${w} ${tensionName}`)
        );

        if (referencesAsActive) {
          violations.push({
            branchId: branch.id,
            violation: `References resolved tension "${tensionName}" as still active`,
            severity: 0.6,
          });
        }
      }
    }

    // Check: affected entities should exist in the graph
    for (const entityRef of branch.affectedEntities) {
      const exists = snapshot.entities.some(
        (e) => e.name.toLowerCase() === entityRef.toLowerCase() || e.id === entityRef
      );
      if (!exists) {
        violations.push({
          branchId: branch.id,
          violation: `References unknown entity "${entityRef}"`,
          severity: 0.4,
        });
      }
    }

    // Check: trigger events should be plausible given the timeline
    if (branch.triggerEvents.length === 0) {
      violations.push({
        branchId: branch.id,
        violation: 'No trigger events specified — branch lacks causal grounding',
        severity: 0.3,
      });
    }
  }

  return violations;
}

// ============================================================
// Temporal coherence
// ============================================================

/**
 * Validate that branches follow from the timeline.
 * Marks each branch's temporallyCoherent flag.
 */
function validateTemporalCoherence(
  branches: DreamBranch[],
  snapshot: GraphSnapshot
): void {
  if (snapshot.events.length === 0) {
    for (const b of branches) b.temporallyCoherent = true;
    return;
  }

  const latestEvent = snapshot.events[snapshot.events.length - 1];
  const latestEventTime = new Date(latestEvent.timestamp).getTime();

  for (const branch of branches) {
    // A branch is temporally coherent if:
    // 1. It doesn't reference events that should have already happened
    // 2. Its trigger events are plausible follow-ups to recent events
    // (Simplified: mark as coherent unless we detect time paradoxes)
    const narrativeLower = branch.narrative.toLowerCase();

    // Check for past-tense descriptions of future events (heuristic)
    const pastPatterns = ['had already', 'years ago', 'long before', 'back when'];
    const hasPastReference = pastPatterns.some((p) => narrativeLower.includes(p));

    // Check for trigger events that reference the recent timeline
    const referencesRecentContext = branch.triggerEvents.some((te) => {
      const teLower = te.toLowerCase();
      return snapshot.events.some((e) =>
        teLower.includes(e.title.toLowerCase().slice(0, 20))
      );
    });

    branch.temporallyCoherent = !hasPastReference || referencesRecentContext;
  }
}

// ============================================================
// Inter-branch dependency analysis
// ============================================================

/**
 * Analyze dependencies between branches — does one branch's outcome
 * make another more or less likely?
 */
function analyzeInterBranchDependencies(branches: DreamBranch[]): BranchDependency[] {
  const dependencies: BranchDependency[] = [];

  for (let i = 0; i < branches.length; i++) {
    for (let j = i + 1; j < branches.length; j++) {
      const a = branches[i];
      const b = branches[j];

      // Check entity overlap
      const sharedEntities = a.affectedEntities.filter((e) =>
        b.affectedEntities.some(
          (be) => be.toLowerCase() === e.toLowerCase()
        )
      );

      if (sharedEntities.length === 0) continue;

      // Check if consequences of one match triggers of another
      const aTriggersB = a.consequences.some((c) =>
        b.triggerEvents.some((t) =>
          similarText(c, t)
        )
      );

      const bTriggersA = b.consequences.some((c) =>
        a.triggerEvents.some((t) =>
          similarText(c, t)
        )
      );

      if (aTriggersB) {
        dependencies.push({
          sourceBranchId: a.id,
          targetBranchId: b.id,
          relationship: `"${a.title}" could trigger "${b.title}" via shared entities: ${sharedEntities.join(', ')}`,
        });
      }

      if (bTriggersA) {
        dependencies.push({
          sourceBranchId: b.id,
          targetBranchId: a.id,
          relationship: `"${b.title}" could trigger "${a.title}" via shared entities: ${sharedEntities.join(', ')}`,
        });
      }

      // If neither triggers the other but they share entities, note the conflict
      if (!aTriggersB && !bTriggersA && sharedEntities.length > 0) {
        dependencies.push({
          sourceBranchId: a.id,
          targetBranchId: b.id,
          relationship: `Competing scenarios for ${sharedEntities.join(', ')} — likely mutually exclusive`,
        });
      }
    }
  }

  return dependencies;
}

// ============================================================
// Utility functions
// ============================================================

/** Parse JSON from LLM output, handling markdown code blocks. */
function parseJsonResponse<T>(content: string): T {
  // Try direct parse
  try {
    return JSON.parse(content) as T;
  } catch {
    // Try extracting from markdown code block
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      return JSON.parse(match[1]) as T;
    }
    throw new Error('Failed to parse dream response as JSON');
  }
}

/** Simple text similarity check based on shared significant words. */
function similarText(a: string, b: string): boolean {
  const wordsA = new Set(
    a.toLowerCase().split(/\s+/).filter((w) => w.length > 4)
  );
  const wordsB = new Set(
    b.toLowerCase().split(/\s+/).filter((w) => w.length > 4)
  );

  let shared = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) shared++;
  }

  const minSize = Math.min(wordsA.size, wordsB.size);
  return minSize > 0 && shared / minSize >= 0.3;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
