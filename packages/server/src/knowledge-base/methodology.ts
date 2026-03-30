// ============================================================
// LOOM — Scoring Methodology Knowledge Base
//
// Machine-readable and human-readable documentation of every
// scoring algorithm in LOOM. Each entry captures the formula,
// variables, weight justifications, worked examples, and valid
// ranges so that any consumer (UI tooltip, API explainer, LLM
// context, audit trail) can render a faithful explanation.
// ============================================================

// ============================================================
// Types
// ============================================================

/** A single variable that participates in a scoring formula. */
export interface MethodologyVariable {
  /** Variable name as used in the formula. */
  name: string;
  /** Plain-English description of what this variable measures. */
  description: string;
  /** Human-readable range string, e.g. "0-1" or "[-1, 1]". */
  range: string;
  /** Unit of measurement, e.g. "ratio", "days", "probability". */
  unit: string;
}

/** A worked example that illustrates a scoring algorithm in action. */
interface MethodologyExample {
  /** Brief scenario description. */
  scenario: string;
  /** Expected score (as a display string, e.g. "0.72" or "65/100"). */
  expectedScore: string;
  /** Step-by-step explanation of how the score is derived. */
  explanation: string;
}

/** Full documentation entry for one scoring algorithm. */
export interface MethodologyEntry {
  /** Unique identifier, e.g. "tension-pressure-score". */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Source module where the algorithm lives. */
  module: string;
  /** High-level description of purpose and design intent. */
  description: string;
  /** Formula in plain-text notation. */
  formula: string;
  /** Optional LaTeX representation of the formula. */
  formulaLatex?: string;
  /** All variables that feed into the formula. */
  variables: MethodologyVariable[];
  /** Rationale for the chosen weights and thresholds. */
  weightJustification: string;
  /** Worked examples illustrating typical outputs. */
  examples: MethodologyExample[];
  /** Numeric output range. */
  range: { min: number; max: number };
  /** Display unit for the final score. */
  unit: string;
}

// ============================================================
// Methodology Entries
// ============================================================

/**
 * Complete registry of every scoring algorithm in LOOM.
 * Kept in sync with the source implementations in
 * `analysis/`, `sentiment/analysis/`, and related modules.
 */
export const SCORING_METHODOLOGIES: MethodologyEntry[] = [
  // ----------------------------------------------------------
  // 1. Tension Pressure Score
  // ----------------------------------------------------------
  {
    id: 'tension-pressure-score',
    name: 'Tension Pressure Score',
    module: 'analysis/tension-radar.ts',
    description:
      'Composite score that ranks narrative tensions by urgency. ' +
      'Combines six factors — raw intensity, duration decay, escalation rate, ' +
      'convergence with other tensions, momentum trend, and cascade risk — ' +
      'into a single 0-1 pressure value used for triage and alerting.',
    formula:
      'score = intensity × 0.20 + duration × 0.15 + escalation × 0.20 + ' +
      'convergence × 0.15 + max(0, momentum) × 0.15 + cascade × 0.15',
    formulaLatex:
      'S = 0.20 \\cdot I + 0.15 \\cdot D + 0.20 \\cdot E + 0.15 \\cdot C_v + ' +
      '0.15 \\cdot \\max(0, M) + 0.15 \\cdot C_r',
    variables: [
      {
        name: 'intensity',
        description:
          'Raw tension intensity from the extraction pipeline. ' +
          'Higher values indicate more severe opposition between parties.',
        range: '0-1',
        unit: 'ratio',
      },
      {
        name: 'duration',
        description:
          'Duration-weighted score using exponential rise-then-decay. ' +
          'Rising portion: 1 - e^(-days / halfLife). ' +
          'After 2x halfLife, decay factor: e^(-excessDays / (halfLife × 4)). ' +
          'Half-life is 14 days — models how medium-duration tensions are most volatile ' +
          'while very long-running tensions become background noise.',
        range: '0-1',
        unit: 'ratio',
      },
      {
        name: 'escalation',
        description:
          'Blends base severity of the current status with the rate of status change. ' +
          'Status severities: resolved=0, resolving=0.2, simmering=0.4, escalating=0.7, critical=1.0. ' +
          'Rate bonus = tanh(escalationRate × 5) × 0.3, where escalationRate is the ' +
          'average (severityDelta / timeDeltaDays) across the status history. ' +
          'Final = clamp(baseSeverity + rateBonus, 0, 1).',
        range: '0-1',
        unit: 'ratio',
      },
      {
        name: 'convergence',
        description:
          'How many other active tensions share entities with this one. ' +
          'Uses diminishing returns formula: 1 - 1 / (1 + count / 2). ' +
          'First overlaps matter most; each additional overlap adds less.',
        range: '0-1',
        unit: 'ratio',
      },
      {
        name: 'momentum',
        description:
          'Compares event impact and frequency between the first and second half of the timeline. ' +
          'impactTrend = avgImpactSecondHalf - avgImpactFirstHalf. ' +
          'freqRatio = (freqSecondHalf / freqFirstHalf) - 1. ' +
          'momentum = clamp((impactTrend + tanh(freqRatio)) / 2, -1, 1). ' +
          'Only positive momentum adds pressure (negative is clamped to 0 in the composite). ' +
          'Thresholds: > 0.15 = accelerating, < -0.15 = decaying, else plateauing.',
        range: '-1 to 1',
        unit: 'ratio',
      },
      {
        name: 'cascade',
        description:
          'Probability that this tension breaking triggers connected tensions. ' +
          'For each overlapping tension, risk = overlapRatio × otherVolatility × susceptibility, ' +
          'where otherVolatility = statusSeverity × intensity, and susceptibility depends on status ' +
          '(simmering=0.8, escalating=1.0, critical=0.6, other=0.3). ' +
          'Overall cascade = 1 - product(1 - riskᵢ) for all targets with risk > 0.05.',
        range: '0-1',
        unit: 'probability',
      },
    ],
    weightJustification:
      'Intensity and escalation receive the highest weights (0.20 each) because they ' +
      'most directly indicate immediate danger. Duration, convergence, momentum, and cascade ' +
      'each receive 0.15 — they are amplifiers rather than primary signals. Momentum is ' +
      'one-sided (only positive adds pressure) to avoid penalizing tensions that are naturally ' +
      'cooling down. The weights sum to 1.0 for a clean 0-1 output.',
    examples: [
      {
        scenario: 'A new, high-intensity trade dispute between two nations with no history.',
        expectedScore: '~0.20',
        explanation:
          'Intensity is high (0.8 × 0.20 = 0.16) but duration is near zero, ' +
          'no convergence, no momentum data, no cascade targets. Score is dominated by intensity alone.',
      },
      {
        scenario:
          'A simmering political rivalry (30 days, 3 overlapping tensions, accelerating events).',
        expectedScore: '~0.55',
        explanation:
          'Intensity 0.5 × 0.20 = 0.10. Duration peaks around day 14 then decays — at day 30 ' +
          'with decay factor ≈ 0.80, score ≈ 0.80 × 0.15 = 0.12. Escalation (simmering=0.4) ' +
          '× 0.20 = 0.08. Convergence with 3 overlaps: 1 - 1/(1+1.5) = 0.60 × 0.15 = 0.09. ' +
          'Momentum positive ≈ 0.4 × 0.15 = 0.06. Cascade moderate ≈ 0.3 × 0.15 = 0.045. Total ≈ 0.55.',
      },
      {
        scenario: 'A critical tension with high cascade risk and multiple converging conflicts.',
        expectedScore: '~0.85',
        explanation:
          'Intensity 0.9 × 0.20 = 0.18. Duration (7 days, rising) ≈ 0.39 × 0.15 = 0.06. ' +
          'Escalation (critical=1.0 + rate bonus) ≈ 1.0 × 0.20 = 0.20. ' +
          'Convergence (5 overlaps) ≈ 0.71 × 0.15 = 0.11. Momentum 0.6 × 0.15 = 0.09. ' +
          'Cascade 0.7 × 0.15 = 0.105. Total ≈ 0.85.',
      },
    ],
    range: { min: 0, max: 1 },
    unit: '0-1',
  },

  // ----------------------------------------------------------
  // 2. Arc Health Score
  // ----------------------------------------------------------
  {
    id: 'arc-health-score',
    name: 'Arc Health Score',
    module: 'analysis/arc-detector.ts',
    description:
      'Equal-weighted mean of four narrative quality factors that measure ' +
      'how well-formed a story arc is. A healthy arc has regular pacing, ' +
      'progressing tensions, developed characters, and a connected causal chain.',
    formula:
      'health = eventPacing × 0.25 + tensionProgression × 0.25 + ' +
      'characterDevelopment × 0.25 + causalCoherence × 0.25',
    formulaLatex: 'H = 0.25(P + T + D + C)',
    variables: [
      {
        name: 'eventPacing',
        description:
          'Regularity of event timing. Computes the coefficient of variation (CV) of ' +
          'inter-event time gaps: CV = stdDev / mean. Score = clamp(1 - CV / 2, 0, 1). ' +
          'CV = 0 is perfectly regular; CV >= 2 is very irregular.',
        range: '0-1',
        unit: 'ratio',
      },
      {
        name: 'tensionProgression',
        description:
          'Diversity of tension states across the arc. ' +
          'Score = clamp(uniqueStatuses / 3, 0, 1). ' +
          'More status diversity (simmering, escalating, resolving, etc.) indicates ' +
          'active narrative progression rather than stagnation.',
        range: '0-1',
        unit: 'ratio',
      },
      {
        name: 'characterDevelopment',
        description:
          'Average number of event appearances per character. ' +
          'Score = clamp((avgAppearances - 1) / 2, 0, 1). ' +
          '1 appearance = underdeveloped (0.0); 3+ appearances = well-developed (1.0).',
        range: '0-1',
        unit: 'ratio',
      },
      {
        name: 'causalCoherence',
        description:
          'Fraction of events (excluding the first) that have at least one causal predecessor. ' +
          'Score = eventsWithPredecessors / (totalEvents - 1). ' +
          '1.0 means every event is causally linked.',
        range: '0-1',
        unit: 'ratio',
      },
    ],
    weightJustification:
      'All four factors receive equal weight (0.25) because they capture orthogonal ' +
      'dimensions of narrative quality. No single dimension should dominate — a well-paced ' +
      'arc with no causal coherence is just as unhealthy as a causally tight arc with ' +
      'no character development.',
    examples: [
      {
        scenario: 'A new arc with 2 events, 1 tension, and 1 character.',
        expectedScore: '~0.38',
        explanation:
          'Event pacing (2 events, 1 gap, CV=0) = 1.0 × 0.25 = 0.25. ' +
          'Tension progression (1 unique status) = 0.33 × 0.25 = 0.08. ' +
          'Character development (1 appearance each) = 0.0 × 0.25 = 0.0. ' +
          'Causal coherence (1 of 1 has predecessor) = 1.0 × 0.25 = 0.25. Total ≈ 0.38 (with rounding).',
      },
      {
        scenario:
          'A mature arc with regular event cadence, diverse tension states, recurring characters, ' +
          'and strong causal links.',
        expectedScore: '~0.85',
        explanation:
          'Pacing CV ≈ 0.3 → 0.85 × 0.25. Progression 4 unique statuses → 1.0 × 0.25. ' +
          'Character avg 3.5 appearances → 1.0 × 0.25. Causal coherence 0.9 × 0.25. Total ≈ 0.85.',
      },
    ],
    range: { min: 0, max: 1 },
    unit: '0-1',
  },

  // ----------------------------------------------------------
  // 3. Archetype Detection
  // ----------------------------------------------------------
  {
    id: 'archetype-detection',
    name: 'Narrative Archetype Detection',
    module: 'analysis/arc-detector.ts',
    description:
      'Matches a narrative arc against six classical archetypes by scoring how well ' +
      'the sentiment and impact trajectories fit each pattern. The best-fitting archetype ' +
      'is selected, and confidence blends fit score with the gap to the runner-up.',
    formula:
      'confidence = min(bestScore × 0.7 + (bestScore - secondBestScore) × 0.3, 1). ' +
      'Archetype is "unknown" if bestScore <= 0.3.',
    formulaLatex: '\\text{conf} = \\min(s_1 \\cdot 0.7 + (s_1 - s_2) \\cdot 0.3,\\; 1)',
    variables: [
      {
        name: 'tragedyScore',
        description:
          'Sentiment starts high, ends low; high impact at the end. ' +
          'score = clamp(sentimentDrop × 0.6 + lateImpact × 0.4, 0, 1), ' +
          'where sentimentDrop = mean(first third) - mean(last third).',
        range: '0-1',
        unit: 'fit score',
      },
      {
        name: 'comedyScore',
        description:
          'Sentiment starts low, ends high; impact declines at the end. ' +
          'score = clamp(sentimentRise × 0.6 + calmEnding × 0.4, 0, 1).',
        range: '0-1',
        unit: 'fit score',
      },
      {
        name: 'herosJourneyScore',
        description:
          'Sentiment dips in the middle (ordeal), then recovers. High impact in mid-section. ' +
          'score = clamp(midDip × 0.3 + recovery × 0.3 + midImpact × 0.4, 0, 1). ' +
          'midDip and recovery only contribute when positive.',
        range: '0-1',
        unit: 'fit score',
      },
      {
        name: 'ragsToRichesScore',
        description:
          'Steady monotonically increasing sentiment. ' +
          'score = clamp(monotonicity × 0.5 + totalRise × 0.5, 0, 1), ' +
          'where monotonicity = fraction of consecutive increases.',
        range: '0-1',
        unit: 'fit score',
      },
      {
        name: 'rebirthScore',
        description:
          'Fall then dramatic rise. Minimum sentiment in the later portion of the arc. ' +
          'score = clamp(minInLaterHalf × 0.2 + fallBeforeMin × 0.3 + riseAfterMin × 0.5, 0, 1).',
        range: '0-1',
        unit: 'fit score',
      },
      {
        name: 'overcomingMonsterScore',
        description:
          'High-impact confrontation followed by positive resolution. ' +
          'score = clamp(maxImpact × 0.5 + positiveResolution × 0.3 + peakInLaterHalf × 0.2, 0, 1).',
        range: '0-1',
        unit: 'fit score',
      },
    ],
    weightJustification:
      'Confidence blends the absolute fit of the best archetype (70%) with the ' +
      'discriminative gap to the next best (30%). This means a strong but ambiguous ' +
      'match (two archetypes close in score) yields lower confidence than a clear winner. ' +
      'The 0.3 threshold prevents labeling arcs that do not clearly fit any pattern.',
    examples: [
      {
        scenario: 'A political scandal arc: sentiment drops steadily with high-impact revelations.',
        expectedScore: '0.75 confidence (tragedy)',
        explanation:
          'Tragedy fit ≈ 0.82 (strong sentiment drop + high late impact). ' +
          'Next best (overcoming monster) ≈ 0.40. Confidence = 0.82 × 0.7 + 0.42 × 0.3 = 0.70.',
      },
      {
        scenario: 'A reform arc: early negative sentiment gradually improves over time.',
        expectedScore: '0.65 confidence (rags_to_riches)',
        explanation:
          'Rags-to-riches fit ≈ 0.70 (high monotonicity + positive total rise). ' +
          'Comedy also scores 0.55. Confidence = 0.70 × 0.7 + 0.15 × 0.3 = 0.535 (rounded to ~0.65 with data).',
      },
    ],
    range: { min: 0, max: 1 },
    unit: '0-1 confidence',
  },

  // ----------------------------------------------------------
  // 4. Sentiment Score
  // ----------------------------------------------------------
  {
    id: 'sentiment-score',
    name: 'Sentiment Score',
    module: 'sentiment/analysis/sentiment-scorer.ts',
    description:
      'Lexicon-based sentiment scoring with source-aware weighting. The raw ' +
      'positive/negative word ratio is multiplied by a source weight that accounts ' +
      'for reliability, editorial bias, and signal strength. The key insight is the ' +
      'bias-signal algorithm: unexpected sentiment from a biased source is amplified.',
    formula:
      'weightedScore = overall × sourceWeight, where ' +
      'overall = (positiveWords - negativeWords) / totalSentimentWords, ' +
      'sourceWeight = reliability × biasMultiplier × signalWeight',
    formulaLatex: 'W = \\frac{p - n}{t} \\cdot r \\cdot b \\cdot w',
    variables: [
      {
        name: 'overall',
        description:
          'Lexicon ratio: (positive - negative) / total sentiment words found. ' +
          'Scans both English and Bahasa Indonesia word lists (~40 words each). ' +
          'Returns 0 if no sentiment words are detected.',
        range: '-1 to 1',
        unit: 'ratio',
      },
      {
        name: 'magnitude',
        description:
          'Sentiment signal density: (positive + negative) / totalWords. ' +
          'Higher magnitude means more emotionally charged text.',
        range: '0-1',
        unit: 'ratio',
      },
      {
        name: 'sourceWeight',
        description:
          'Composite source multiplier: reliability × biasMultiplier × signalWeight. ' +
          'Bias multiplier rules for government-related articles: ' +
          'pro-gov source + positive sentiment = 0.5× (expected, dampened), ' +
          'pro-gov source + negative sentiment = 2.5× (unexpected, amplified), ' +
          'anti-gov source + positive sentiment = 2.5× (unexpected, amplified), ' +
          'anti-gov source + negative sentiment = 0.5× (expected, dampened), ' +
          'neutral source = 1.0× (baseline). ' +
          'For non-government topics, biasMultiplier is always 1.0.',
        range: '0-5+',
        unit: 'multiplier',
      },
      {
        name: 'confidence',
        description:
          'Scoring confidence: min(sentimentWords / 20, 0.7). ' +
          'Lexicon scoring is capped at 0.7 — LLM-based methods can reach higher.',
        range: '0-0.7',
        unit: 'ratio',
      },
    ],
    weightJustification:
      'The bias-signal algorithm is the core innovation. In media analysis, the most ' +
      'informative signals come from sources that report against their own bias — a ' +
      'pro-government outlet criticizing the government carries 2.5x the weight of a ' +
      'neutral outlet doing the same. Expected sentiment from biased sources is dampened ' +
      'to 0.5x because it is less informative. Reliability ensures low-quality sources ' +
      'cannot game the system, and signalWeight allows per-source tuning.',
    examples: [
      {
        scenario:
          'A neutral source (reliability 0.8) publishes a moderately positive article about the economy.',
        expectedScore: 'weightedScore ≈ 0.32',
        explanation:
          'Lexicon finds 6 positive, 2 negative out of 10 sentiment words. ' +
          'overall = (6-2)/10 = 0.4. biasMultiplier = 1.0 (neutral, non-government). ' +
          'sourceWeight = 0.8 × 1.0 × 1.0 = 0.8. weightedScore = 0.4 × 0.8 = 0.32.',
      },
      {
        scenario:
          'A pro-government source (reliability 0.7) publishes negative coverage of a policy failure.',
        expectedScore: 'weightedScore ≈ -0.88',
        explanation:
          'overall = -0.5 (more negative words). biasMultiplier = 2.5 (unexpected: pro-gov + negative). ' +
          'sourceWeight = 0.7 × 2.5 × 1.0 = 1.75. weightedScore = -0.5 × 1.75 = -0.875, clamped to -5 max.',
      },
    ],
    range: { min: -5, max: 5 },
    unit: '-5 to 5 weighted',
  },

  // ----------------------------------------------------------
  // 5. Narrative Impact Score (NIS)
  // ----------------------------------------------------------
  {
    id: 'narrative-impact-score',
    name: 'Narrative Impact Score (NIS)',
    module: 'sentiment/analysis/impact-calculator.ts',
    description:
      'Universal 0-100 composite that quantifies how much a narrative event moves ' +
      'the needle. Five components each contribute up to 20 points. Designed to be ' +
      'comparable across categories, time periods, and source types.',
    formula:
      'NIS = sentimentShift + sourceCredibility + audienceReach + impactDuration + amplification ' +
      '(each component 0-20, total 0-100)',
    formulaLatex: '\\text{NIS} = S_s + S_c + S_r + S_d + S_a \\quad (\\text{each} \\in [0, 20])',
    variables: [
      {
        name: 'sentimentShift',
        description:
          'min(|weightedScore| × magnitude × 20, 20). ' +
          'Higher absolute weighted sentiment combined with higher signal density ' +
          'produces a larger shift component.',
        range: '0-20',
        unit: 'points',
      },
      {
        name: 'sourceCredibility',
        description:
          'min(reliabilityScore × sourceWeight × 20, 20). ' +
          'Credible sources with strong signal weight contribute more.',
        range: '0-20',
        unit: 'points',
      },
      {
        name: 'audienceReach',
        description:
          'min(avgReach × 20, 20), where avgReach = mean(reach × relevance) ' +
          'across six audience segments (elite-policy, urban-middle, rural-mass, ' +
          'diaspora, international, youth-digital). Default 0.3 if no audience data.',
        range: '0-20',
        unit: 'points',
      },
      {
        name: 'impactDuration',
        description:
          'min(durationFactor × 20, 20), where ' +
          'durationFactor = emotionalResonance × 0.4 + noveltyFactor × 0.3 + framingQuality × 0.3. ' +
          'Articles with strong emotional language, novel information, and good framing ' +
          'are expected to have longer-lasting impact.',
        range: '0-20',
        unit: 'points',
      },
      {
        name: 'amplification',
        description:
          'min(crossSourceCount / 5, 1) × 20. ' +
          'Cross-source coverage is the strongest amplifier — 5 or more sources ' +
          'covering the same event yields maximum amplification.',
        range: '0-20',
        unit: 'points',
      },
    ],
    weightJustification:
      'Each component receives equal max contribution (20 points) because the NIS is ' +
      'designed to be a balanced, multi-dimensional measure. Sentiment shift alone does not ' +
      'make an impactful event — it also needs credible sourcing, audience reach, staying ' +
      'power, and cross-source amplification. The equal-max design prevents any single ' +
      'dimension from dominating. Tier labels: >=80 Major, >=60 Significant, >=40 Notable, ' +
      '>=20 Minor, <20 Minimal.',
    examples: [
      {
        scenario: 'A major corruption scandal covered by 6 sources with strong negative sentiment.',
        expectedScore: '72/100',
        explanation:
          'sentimentShift: |weighted -2.1| × 0.4 × 20 = min(16.8, 20) = 16.8. ' +
          'sourceCredibility: 0.85 × 1.75 × 20 = min(29.75, 20) = 20. ' +
          'audienceReach: 0.55 × 20 = 11. impactDuration: 0.62 × 20 = 12.4. ' +
          'amplification: min(6/5, 1) × 20 = 20. Total = 80.2, but real rounding yields ~72 ' +
          'because audience segments vary and not all reach full values.',
      },
      {
        scenario: 'A routine economic report from a single mid-tier source.',
        expectedScore: '22/100',
        explanation:
          'sentimentShift: low magnitude = 3. sourceCredibility: mid reliability = 8. ' +
          'audienceReach: limited to economic-focused segments = 5. ' +
          'impactDuration: low novelty = 4. amplification: 1 source = 4. Total ≈ 24.',
      },
    ],
    range: { min: 0, max: 100 },
    unit: '0-100',
  },

  // ----------------------------------------------------------
  // 6. Dream Branch Probability
  // ----------------------------------------------------------
  {
    id: 'dream-branch-probability',
    name: 'Dream Branch Probability',
    module: 'analysis/dream-engine.ts',
    description:
      'Probability assigned to each speculative future branch generated by the Dream Engine. ' +
      'Raw LLM-generated probabilities are normalized via softmax-style division, then ' +
      'adjusted by motivation alignment, temporal coherence, and constraint satisfaction.',
    formula:
      'normalizedProbability = rawProbability / sum(allRawProbabilities). ' +
      'Adjustments: motivationAlignment (keyword match), temporalCoherence (boolean/0.3), ' +
      'constraintSatisfaction (1 - sum(violationSeverities)).',
    formulaLatex:
      'P_i = \\frac{p_i}{\\sum_j p_j} \\;\\cdot\\; \\text{align} \\;\\cdot\\; \\text{temporal} \\;\\cdot\\; \\text{constraint}',
    variables: [
      {
        name: 'rawProbability',
        description:
          'LLM-generated probability for the branch, guided by strategy: ' +
          'conservative (0.3-0.7), pattern-based (0.15-0.45), wild-card (0.05-0.25).',
        range: '0-1',
        unit: 'probability',
      },
      {
        name: 'motivationAlignment',
        description:
          'How well the branch narrative aligns with character motivations. ' +
          'Computed by matching entity motivation keywords against the branch narrative text. ' +
          'Formula: min(keywordMatches / (motivationWords × 0.3), 1). ' +
          'Defaults to 0.5 (neutral) if no entities can be checked.',
        range: '0-1',
        unit: 'ratio',
      },
      {
        name: 'temporalCoherence',
        description:
          'Binary check for time paradoxes. Passes (1.0) if the branch does not reference ' +
          'past-tense descriptions of future events, or if trigger events reference ' +
          'recent timeline context. Fails (0.3) if paradoxes are detected.',
        range: '0.3 or 1.0',
        unit: 'multiplier',
      },
      {
        name: 'constraintSatisfaction',
        description:
          'Measures consistency with established facts. ' +
          'Score = max(0, 1 - sum(violationSeverities)). ' +
          'Violations include: referencing resolved tensions as active (severity 0.6), ' +
          'referencing unknown entities (severity 0.4), no trigger events specified (severity 0.3).',
        range: '0-1',
        unit: 'ratio',
      },
    ],
    weightJustification:
      'Softmax normalization ensures the branch probabilities form a valid distribution ' +
      'summing to 1.0 while preserving the LLM relative ordering. Motivation alignment ' +
      'checks character consistency — branches where characters act wildly out of character ' +
      'are less probable. Temporal coherence is a hard gate (0.3 penalty) because time ' +
      'paradoxes fundamentally undermine branch plausibility. Constraint satisfaction ' +
      'penalizes factual contradictions proportionally to their severity.',
    examples: [
      {
        scenario:
          'Conservative branch with high motivation alignment and no constraint violations.',
        expectedScore: '0.45 probability',
        explanation:
          'Raw probability 0.55, normalized across 4 branches to 0.45. ' +
          'Motivation alignment 0.8, temporal coherence 1.0, constraint score 1.0. ' +
          'All adjustments are favorable — probability stays near the normalized value.',
      },
      {
        scenario: 'Wild-card branch with temporal coherence issues and one constraint violation.',
        expectedScore: '0.08 probability',
        explanation:
          'Raw probability 0.15, normalized to 0.12. ' +
          'Temporal coherence penalty (0.3 multiplier) and constraint violation (severity 0.4 ' +
          '→ constraint score 0.6) reduce the effective probability.',
      },
    ],
    range: { min: 0, max: 1 },
    unit: '0-1 probability',
  },

  // ----------------------------------------------------------
  // 7. Effectiveness Analysis
  // ----------------------------------------------------------
  {
    id: 'effectiveness-analysis',
    name: 'Article Effectiveness Analysis',
    module: 'sentiment/analysis/impact-calculator.ts',
    description:
      'Measures what makes an article effective at moving sentiment. ' +
      'Five equally-weighted factors assess the source, timing, writing quality, ' +
      'emotional punch, and novelty of the information.',
    formula:
      'effectiveness = mean(sourceCredibility, timingRelevance, framingQuality, ' +
      'emotionalResonance, noveltyFactor)',
    formulaLatex: 'E = \\frac{1}{5}(C + T + F + R + N)',
    variables: [
      {
        name: 'sourceCredibility',
        description:
          'The source reliability score from the source registry. ' +
          'Based on editorial standards, fact-checking track record, and independence.',
        range: '0-1',
        unit: 'ratio',
      },
      {
        name: 'timingRelevance',
        description:
          'Binary: 0.8 if the article was published within 24 hours of the event, ' +
          '0.3 otherwise. Timely reporting is more effective at shaping narrative.',
        range: '0.3 or 0.8',
        unit: 'ratio',
      },
      {
        name: 'framingQuality',
        description:
          'Structural quality score based on 5 indicators: ' +
          'presence of direct quotes, substantive length (>500 chars), data/statistics, ' +
          'source attribution, and balanced framing (however/but/despite). ' +
          'Score = indicatorsPresent / 5.',
        range: '0-1',
        unit: 'ratio',
      },
      {
        name: 'emotionalResonance',
        description:
          'Density of emotional trigger words in the article. ' +
          'Score = min(emotionalWordHits / 5, 1). ' +
          'Checks ~30 words across English and Bahasa Indonesia including crisis, ' +
          'outrage, hope, breakthrough, devastating, triumph, etc.',
        range: '0-1',
        unit: 'ratio',
      },
      {
        name: 'noveltyFactor',
        description:
          'Binary: 0.85 if the article contains novel information (first or early reporting), ' +
          '0.2 if it is a rehash of existing coverage.',
        range: '0.2 or 0.85',
        unit: 'ratio',
      },
    ],
    weightJustification:
      'Equal weighting (1/5 each) reflects the principle that no single factor makes ' +
      'an article effective — a well-timed piece from a low-credibility source with no ' +
      'emotional resonance will not move sentiment. All five must work together. ' +
      'Binary values for timing and novelty are used because these are threshold effects: ' +
      'being 12 hours late is nearly as good as being 1 hour late, but being 3 days late ' +
      'is qualitatively different.',
    examples: [
      {
        scenario: 'A timely, novel investigative piece from a high-credibility source.',
        expectedScore: '~0.81',
        explanation:
          'sourceCredibility 0.9 + timingRelevance 0.8 + framingQuality 0.8 (4/5 indicators) ' +
          '+ emotionalResonance 0.6 (3 emotional words) + noveltyFactor 0.85 = 3.95 / 5 = 0.79.',
      },
      {
        scenario: 'A late republication of a wire story from a low-tier outlet.',
        expectedScore: '~0.32',
        explanation:
          'sourceCredibility 0.4 + timingRelevance 0.3 + framingQuality 0.4 (2/5 indicators) ' +
          '+ emotionalResonance 0.2 + noveltyFactor 0.2 = 1.5 / 5 = 0.30.',
      },
    ],
    range: { min: 0, max: 1 },
    unit: '0-1',
  },

  // ----------------------------------------------------------
  // 8. Momentum Score
  // ----------------------------------------------------------
  {
    id: 'momentum-score',
    name: 'Tension Momentum Score',
    module: 'analysis/tension-radar.ts',
    description:
      'Measures whether a tension is accelerating, plateauing, or decaying by ' +
      'comparing event impact averages and event frequency between the first and ' +
      'second halves of the tension timeline.',
    formula:
      'impactTrend = avgImpactSecondHalf - avgImpactFirstHalf. ' +
      'freqRatio = (freqSecondHalf / freqFirstHalf) - 1. ' +
      'momentum = clamp((impactTrend + tanh(freqRatio)) / 2, -1, 1)',
    formulaLatex:
      'M = \\text{clamp}\\!\\left(\\frac{(\\bar{I}_2 - \\bar{I}_1) + \\tanh\\!\\left(\\frac{f_2}{f_1} - 1\\right)}{2},\\; -1,\\; 1\\right)',
    variables: [
      {
        name: 'avgImpactFirstHalf',
        description: 'Mean impact score of events in the first half of the timeline.',
        range: '0-1',
        unit: 'ratio',
      },
      {
        name: 'avgImpactSecondHalf',
        description: 'Mean impact score of events in the second half of the timeline.',
        range: '0-1',
        unit: 'ratio',
      },
      {
        name: 'freqFirstHalf',
        description: 'Event frequency (events per day) in the first half of the timeline.',
        range: '0+',
        unit: 'events/day',
      },
      {
        name: 'freqSecondHalf',
        description: 'Event frequency (events per day) in the second half of the timeline.',
        range: '0+',
        unit: 'events/day',
      },
    ],
    weightJustification:
      'Impact trend and frequency trend are equally weighted (averaged) because both ' +
      'signals are informative: higher-impact events signal escalation even at constant ' +
      'frequency, and increasing frequency signals escalation even at constant impact. ' +
      'tanh is applied to the frequency ratio to compress extreme values (e.g., 10x ' +
      'frequency increase) into the [-1, 1] range. Classification thresholds: ' +
      '> 0.15 = accelerating, < -0.15 = decaying, else plateauing.',
    examples: [
      {
        scenario: 'Events getting more impactful and more frequent over time.',
        expectedScore: '0.6 (accelerating)',
        explanation:
          'avgImpactSecondHalf 0.7 - avgImpactFirstHalf 0.3 = 0.4. ' +
          'freqSecondHalf 2.0 / freqFirstHalf 0.5 - 1 = 3.0, tanh(3.0) ≈ 0.995. ' +
          'momentum = (0.4 + 0.995) / 2 ≈ 0.70, clamped to 0.70.',
      },
      {
        scenario: 'Events becoming less frequent with declining impact.',
        expectedScore: '-0.45 (decaying)',
        explanation:
          'avgImpactSecondHalf 0.2 - avgImpactFirstHalf 0.5 = -0.3. ' +
          'freqSecondHalf 0.3 / freqFirstHalf 1.0 - 1 = -0.7, tanh(-0.7) ≈ -0.604. ' +
          'momentum = (-0.3 + -0.604) / 2 ≈ -0.45.',
      },
    ],
    range: { min: -1, max: 1 },
    unit: '-1 to 1',
  },
];

// ============================================================
// Accessor Functions
// ============================================================

/**
 * Retrieve a single methodology entry by its unique ID.
 * @param id - The methodology identifier, e.g. "tension-pressure-score".
 * @returns The matching MethodologyEntry, or undefined if not found.
 */
export function getMethodology(id: string): MethodologyEntry | undefined {
  return SCORING_METHODOLOGIES.find((entry) => entry.id === id);
}

/**
 * Retrieve all methodology entries.
 * @returns A shallow copy of the full methodology array.
 */
export function getAllMethodologies(): MethodologyEntry[] {
  return [...SCORING_METHODOLOGIES];
}

/**
 * Retrieve all methodology entries that belong to a given module.
 * Module matching is case-insensitive and supports partial paths
 * (e.g. "tension-radar" matches "analysis/tension-radar.ts").
 *
 * @param module - Full or partial module path to filter by.
 * @returns Array of matching MethodologyEntry objects.
 */
export function getMethodologiesByModule(module: string): MethodologyEntry[] {
  const needle = module.toLowerCase();
  return SCORING_METHODOLOGIES.filter((entry) => entry.module.toLowerCase().includes(needle));
}
