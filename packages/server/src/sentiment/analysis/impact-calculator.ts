// ============================================================
// LOOM — Impact Calculator
//
// Computes the Narrative Impact Score (NIS) and related
// impact metrics. The NIS is a universal composite score (0-100)
// that combines sentiment shift, source credibility, audience
// reach, duration, and amplification into one comparable number.
// ============================================================

import type {
  NarrativeImpactScore,
  SentimentArticle,
  SentimentEvent,
  EffectivenessAnalysis,
  AudienceImpact,
  AudienceType,
  DownstreamEffectAnalysis,
  DownstreamEffect,
  MediaSource,
} from '../types.js';
import { createBreakdown, createVariable } from '../../analysis/score-breakdown.js';

// ============================================================
// Narrative Impact Score (NIS)
// ============================================================

/** Weights for each NIS component (each max 20, total max 100). */
const NIS_WEIGHTS = {
  sentimentShift: 20,
  sourceCredibility: 20,
  audienceReach: 20,
  impactDuration: 20,
  amplification: 20,
} as const;

/**
 * Compute the Narrative Impact Score for a single article.
 *
 * @param article - The analyzed article
 * @param source - The source profile
 * @param crossSourceCount - Number of other sources covering the same event
 * @param historicalPercentile - Optional pre-computed percentile
 * @returns NIS with component breakdown
 */
export function computeArticleNIS(
  article: Pick<SentimentArticle, 'sentiment' | 'audienceImpact' | 'effectiveness'>,
  source: MediaSource,
  crossSourceCount: number = 1,
  historicalPercentile?: number
): NarrativeImpactScore {
  // Component 1: Sentiment Shift (0-20)
  // Higher magnitude = higher score
  const sentimentShift = Math.min(
    Math.abs(article.sentiment.weightedScore) *
      article.sentiment.magnitude *
      NIS_WEIGHTS.sentimentShift,
    NIS_WEIGHTS.sentimentShift
  );

  // Component 2: Source Credibility (0-20)
  // Based on reliability and signal weight
  const sourceCredibility = Math.min(
    source.reliabilityScore * article.sentiment.sourceWeight * NIS_WEIGHTS.sourceCredibility,
    NIS_WEIGHTS.sourceCredibility
  );

  // Component 3: Audience Reach (0-20)
  // Average of audience impact scores
  const avgReach =
    article.audienceImpact.length > 0
      ? article.audienceImpact.reduce((sum, a) => sum + a.reach * a.relevance, 0) /
        article.audienceImpact.length
      : 0.3; // default low reach
  const audienceReach = Math.min(avgReach * NIS_WEIGHTS.audienceReach, NIS_WEIGHTS.audienceReach);

  // Component 4: Impact Duration (0-20)
  // Based on effectiveness analysis — higher emotional resonance = longer impact
  const durationFactor =
    article.effectiveness.emotionalResonance * 0.4 +
    article.effectiveness.noveltyFactor * 0.3 +
    article.effectiveness.framingQuality * 0.3;
  const impactDuration = Math.min(
    durationFactor * NIS_WEIGHTS.impactDuration,
    NIS_WEIGHTS.impactDuration
  );

  // Component 5: Amplification (0-20)
  // How many sources are covering this? Cross-source amplification is key.
  const ampFactor = Math.min(crossSourceCount / 5, 1); // 5+ sources = max
  const amplification = Math.min(ampFactor * NIS_WEIGHTS.amplification, NIS_WEIGHTS.amplification);

  const score = sentimentShift + sourceCredibility + audienceReach + impactDuration + amplification;

  const scoreBreakdown = createBreakdown(
    'Narrative Impact Score (NIS)',
    Math.round(score * 10) / 10,
    'NIS = sentimentShift + sourceCredibility + audienceReach + impactDuration + amplification (each 0-20, total 0-100)',
    [
      createVariable(
        'Sentiment Shift',
        Math.abs(article.sentiment.weightedScore) * article.sentiment.magnitude,
        sentimentShift / NIS_WEIGHTS.sentimentShift,
        0.2,
        `min(|weightedScore| × magnitude × 20, 20) = ${sentimentShift.toFixed(1)}. ` +
          `Raw inputs: weightedScore=${article.sentiment.weightedScore.toFixed(2)}, ` +
          `magnitude=${article.sentiment.magnitude.toFixed(2)}.`
      ),
      createVariable(
        'Source Credibility',
        source.reliabilityScore * article.sentiment.sourceWeight,
        sourceCredibility / NIS_WEIGHTS.sourceCredibility,
        0.2,
        `min(reliabilityScore × sourceWeight × 20, 20) = ${sourceCredibility.toFixed(1)}. ` +
          `${source.name}: reliability=${source.reliabilityScore}, sourceWeight=${article.sentiment.sourceWeight.toFixed(2)}.`
      ),
      createVariable(
        'Audience Reach',
        avgReach,
        audienceReach / NIS_WEIGHTS.audienceReach,
        0.2,
        `min(avgReach × 20, 20) = ${audienceReach.toFixed(1)}. ` +
          `Average of (reach × relevance) across ${article.audienceImpact.length} audience segments.`
      ),
      createVariable(
        'Impact Duration',
        durationFactor,
        impactDuration / NIS_WEIGHTS.impactDuration,
        0.2,
        `min(durationFactor × 20, 20) = ${impactDuration.toFixed(1)}. ` +
          `durationFactor = emotionalResonance×0.4 + novelty×0.3 + framing×0.3 = ${durationFactor.toFixed(3)}.`
      ),
      createVariable(
        'Amplification',
        crossSourceCount,
        amplification / NIS_WEIGHTS.amplification,
        0.2,
        `min(crossSourceCount/5, 1) × 20 = ${amplification.toFixed(1)}. ` +
          `${crossSourceCount} source(s) covering this event (5+ = maximum amplification).`
      ),
    ],
    { minValue: 0, maxValue: 100, scoreUnit: '0-100' }
  );

  return {
    score: Math.round(score * 10) / 10,
    components: {
      sentimentShift: Math.round(sentimentShift * 10) / 10,
      sourceCredibility: Math.round(sourceCredibility * 10) / 10,
      audienceReach: Math.round(audienceReach * 10) / 10,
      impactDuration: Math.round(impactDuration * 10) / 10,
      amplification: Math.round(amplification * 10) / 10,
    },
    percentile: historicalPercentile ?? 0,
    summary: generateNISSummary(score, sentimentShift, sourceCredibility, amplification),
    scoreBreakdown,
  };
}

/**
 * Compute the aggregate NIS for a sentiment event (collection of articles).
 */
export function computeEventNIS(
  event: Pick<
    SentimentEvent,
    'sentimentDelta' | 'impactMagnitude' | 'impactDuration' | 'sourceBreakdown' | 'articleIds'
  >,
  avgSourceReliability: number
): NarrativeImpactScore {
  const sentimentShift = Math.min(
    event.impactMagnitude * NIS_WEIGHTS.sentimentShift * 2,
    NIS_WEIGHTS.sentimentShift
  );

  const sourceCredibility = Math.min(
    avgSourceReliability * NIS_WEIGHTS.sourceCredibility,
    NIS_WEIGHTS.sourceCredibility
  );

  const audienceReach = Math.min(
    (event.articleIds.length / 20) * NIS_WEIGHTS.audienceReach,
    NIS_WEIGHTS.audienceReach
  );

  const impactDurationScore = Math.min(
    (event.impactDuration / 14) * NIS_WEIGHTS.impactDuration,
    NIS_WEIGHTS.impactDuration
  );

  const uniqueSources = event.sourceBreakdown.length;
  const amplification = Math.min(
    (uniqueSources / 5) * NIS_WEIGHTS.amplification,
    NIS_WEIGHTS.amplification
  );

  const score =
    sentimentShift + sourceCredibility + audienceReach + impactDurationScore + amplification;

  return {
    score: Math.round(score * 10) / 10,
    components: {
      sentimentShift: Math.round(sentimentShift * 10) / 10,
      sourceCredibility: Math.round(sourceCredibility * 10) / 10,
      audienceReach: Math.round(audienceReach * 10) / 10,
      impactDuration: Math.round(impactDurationScore * 10) / 10,
      amplification: Math.round(amplification * 10) / 10,
    },
    percentile: 0,
    summary: generateNISSummary(score, sentimentShift, sourceCredibility, amplification),
  };
}

/** Generate human-readable NIS summary. */
function generateNISSummary(
  score: number,
  sentimentComponent: number,
  credibilityComponent: number,
  amplificationComponent: number
): string {
  const tier =
    score >= 80
      ? 'Major narrative event'
      : score >= 60
        ? 'Significant narrative shift'
        : score >= 40
          ? 'Notable narrative development'
          : score >= 20
            ? 'Minor narrative event'
            : 'Minimal narrative impact';

  const drivers: string[] = [];
  if (sentimentComponent >= 15) drivers.push('strong sentiment shift');
  if (credibilityComponent >= 15) drivers.push('high-credibility sourcing');
  if (amplificationComponent >= 15) drivers.push('broad cross-source coverage');

  const driverStr = drivers.length > 0 ? ` Driven by ${drivers.join(' and ')}.` : '';

  return `${tier} (NIS ${Math.round(score)}).${driverStr}`;
}

// ============================================================
// Effectiveness Analysis
// ============================================================

/**
 * Analyze what makes an article effective at moving sentiment.
 * Uses a combination of structural and content features.
 */
export function analyzeEffectiveness(
  articleContent: string,
  source: MediaSource,
  isTimely: boolean,
  isNovel: boolean
): EffectivenessAnalysis {
  const sourceCredibility = source.reliabilityScore;
  const timingRelevance = isTimely ? 0.8 : 0.3;
  const noveltyFactor = isNovel ? 0.85 : 0.2;

  // Framing quality heuristics
  const framingIndicators = [
    articleContent.includes('"') || articleContent.includes('\u201C'), // direct quotes
    articleContent.length > 500, // substantive length
    /\d+%|\d+\.\d+/.test(articleContent), // data/statistics
    /according to|sources say|officials/i.test(articleContent), // attribution
    /however|but|despite|although/i.test(articleContent), // balanced framing
  ];
  const framingQuality = framingIndicators.filter(Boolean).length / framingIndicators.length;

  // Emotional resonance heuristics
  const emotionalWords = [
    'crisis',
    'outrage',
    'hope',
    'breakthrough',
    'devastating',
    'triumph',
    'fear',
    'urgent',
    'historic',
    'unprecedented',
    'shock',
    'proud',
    'angry',
    'celebrate',
    'threaten',
    'inspire',
    'demand',
    'reject',
    // Bahasa Indonesia emotional words
    'krisis',
    'marah',
    'harapan',
    'bangga',
    'takut',
    'mendesak',
    'bersejarah',
    'mengejutkan',
    'menolak',
    'menuntut',
  ];
  const contentLower = articleContent.toLowerCase();
  const emotionalHits = emotionalWords.filter((w) => contentLower.includes(w)).length;
  const emotionalResonance = Math.min(emotionalHits / 5, 1);

  const topFactors: string[] = [];
  if (sourceCredibility >= 0.8) topFactors.push('high source credibility');
  if (timingRelevance >= 0.7) topFactors.push('well-timed release');
  if (framingQuality >= 0.6) topFactors.push('effective narrative framing');
  if (emotionalResonance >= 0.6) topFactors.push('strong emotional language');
  if (noveltyFactor >= 0.7) topFactors.push('novel information');

  const explanation =
    topFactors.length > 0
      ? `Key effectiveness drivers: ${topFactors.join(', ')}.`
      : 'Limited effectiveness indicators detected.';

  const overallEffectiveness =
    (sourceCredibility + timingRelevance + framingQuality + emotionalResonance + noveltyFactor) / 5;

  const effectivenessBreakdown = createBreakdown(
    'Article Effectiveness',
    overallEffectiveness,
    'mean(sourceCredibility, timingRelevance, framingQuality, emotionalResonance, noveltyFactor)',
    [
      createVariable(
        'Source Credibility',
        sourceCredibility,
        sourceCredibility,
        0.2,
        `${source.name} reliability score: ${sourceCredibility.toFixed(2)}.`
      ),
      createVariable(
        'Timing Relevance',
        timingRelevance,
        timingRelevance,
        0.2,
        isTimely
          ? 'Well-timed release — published close to the event (0.8).'
          : 'Not timely — published well after the event (0.3).'
      ),
      createVariable(
        'Framing Quality',
        framingQuality,
        framingQuality,
        0.2,
        `Structural quality: ${framingIndicators.filter(Boolean).length}/5 indicators present ` +
          '(quotes, substantive length, statistics, attribution, balanced framing).'
      ),
      createVariable(
        'Emotional Resonance',
        emotionalResonance,
        emotionalResonance,
        0.2,
        `${emotionalHits} of ${emotionalWords.length} emotional trigger words found. ` +
          'Score = min(hits / 5, 1). Includes crisis, outrage, hope, breakthrough, etc.'
      ),
      createVariable(
        'Novelty Factor',
        noveltyFactor,
        noveltyFactor,
        0.2,
        isNovel
          ? 'Novel information — first or early reporting on this topic (0.85).'
          : 'Not novel — rehash of existing coverage (0.2).'
      ),
    ],
    { minValue: 0, maxValue: 1, scoreUnit: '0-1' }
  );

  return {
    sourceCredibility,
    timingRelevance,
    framingQuality,
    emotionalResonance,
    noveltyFactor,
    explanation,
    scoreBreakdown: effectivenessBreakdown,
  };
}

// ============================================================
// Audience Impact Analysis
// ============================================================

/** Standard audience segments for Indonesia. */
const AUDIENCE_SEGMENTS: AudienceType[] = [
  'elite-policy',
  'urban-middle',
  'rural-mass',
  'diaspora',
  'international',
  'youth-digital',
];

/**
 * Estimate audience impact breakdown for an article.
 */
export function estimateAudienceImpact(
  source: MediaSource,
  category: string,
  sentimentMagnitude: number
): AudienceImpact[] {
  return AUDIENCE_SEGMENTS.map((segment) => {
    // Base reach: does the source target this audience?
    const isTargetAudience = source.audienceTypes.includes(segment);
    const baseReach = isTargetAudience ? 0.7 : 0.15;

    // Category relevance per audience
    const relevance = getCategoryRelevance(category, segment);

    // Impact scales with sentiment magnitude and relevance
    const impact = sentimentMagnitude * relevance * (isTargetAudience ? 1.2 : 0.5);

    return {
      segment,
      reach: clamp(baseReach, 0, 1),
      relevance: clamp(relevance, 0, 1),
      impact: clamp(impact, 0, 1),
    };
  });
}

/** Get how relevant a category is to an audience segment. */
function getCategoryRelevance(category: string, audience: AudienceType): number {
  const relevanceMap: Record<string, Partial<Record<AudienceType, number>>> = {
    political: {
      'elite-policy': 0.95,
      'urban-middle': 0.6,
      'rural-mass': 0.4,
      international: 0.7,
      diaspora: 0.5,
      'youth-digital': 0.45,
    },
    economic: {
      'elite-policy': 0.9,
      'urban-middle': 0.85,
      'rural-mass': 0.3,
      international: 0.8,
      diaspora: 0.6,
      'youth-digital': 0.5,
    },
    regulatory: {
      'elite-policy': 0.95,
      'urban-middle': 0.5,
      'rural-mass': 0.2,
      international: 0.75,
      diaspora: 0.3,
      'youth-digital': 0.3,
    },
    social: {
      'elite-policy': 0.4,
      'urban-middle': 0.8,
      'rural-mass': 0.8,
      international: 0.3,
      diaspora: 0.7,
      'youth-digital': 0.85,
    },
    technology: {
      'elite-policy': 0.5,
      'urban-middle': 0.7,
      'rural-mass': 0.2,
      international: 0.6,
      diaspora: 0.5,
      'youth-digital': 0.9,
    },
    corruption: {
      'elite-policy': 0.9,
      'urban-middle': 0.85,
      'rural-mass': 0.7,
      international: 0.8,
      diaspora: 0.6,
      'youth-digital': 0.8,
    },
  };

  return relevanceMap[category]?.[audience] ?? 0.4;
}

// ============================================================
// Downstream Effects Analysis
// ============================================================

/** All possible downstream effects. */
const DOWNSTREAM_EFFECTS: DownstreamEffect[] = [
  'policy-support',
  'consumer-confidence',
  'investor-sentiment',
  'political-pressure',
  'social-amplification',
  'counter-narrative',
];

/**
 * Predict downstream behavioral effects of an article/event.
 */
export function predictDownstreamEffects(
  category: string,
  sentimentOverall: number,
  sentimentMagnitude: number,
  sourceReliability: number
): DownstreamEffectAnalysis[] {
  return DOWNSTREAM_EFFECTS.map((effect) => {
    const base = getEffectProbability(effect, category, sentimentMagnitude);
    // Reliability amplifies probability — unreliable sources are less likely to cause real effects
    const probability = clamp(base * (0.5 + sourceReliability * 0.5), 0, 1);
    const magnitude = clamp(
      sentimentMagnitude * getEffectMagnitudeMultiplier(effect, category),
      0,
      1
    );
    const direction: 'positive' | 'negative' = sentimentOverall >= 0 ? 'positive' : 'negative';

    return {
      effect,
      probability: Math.round(probability * 100) / 100,
      magnitude: Math.round(magnitude * 100) / 100,
      direction,
      description: generateEffectDescription(effect, direction, magnitude),
    };
  });
}

/** Base probability of a downstream effect given category and magnitude. */
function getEffectProbability(
  effect: DownstreamEffect,
  category: string,
  magnitude: number
): number {
  const baseProbs: Record<DownstreamEffect, Record<string, number>> = {
    'policy-support': {
      political: 0.8,
      regulatory: 0.7,
      economic: 0.5,
      social: 0.4,
      default: 0.3,
    },
    'consumer-confidence': {
      economic: 0.8,
      regulatory: 0.6,
      technology: 0.5,
      corruption: 0.5,
      default: 0.2,
    },
    'investor-sentiment': {
      economic: 0.85,
      regulatory: 0.75,
      political: 0.6,
      corruption: 0.7,
      default: 0.2,
    },
    'political-pressure': {
      political: 0.8,
      corruption: 0.85,
      social: 0.6,
      regulatory: 0.5,
      default: 0.3,
    },
    'social-amplification': {
      social: 0.8,
      corruption: 0.75,
      political: 0.6,
      default: 0.4,
    },
    'counter-narrative': {
      political: 0.6,
      corruption: 0.7,
      social: 0.5,
      default: 0.3,
    },
  };

  const prob = baseProbs[effect][category] ?? baseProbs[effect].default ?? 0.3;
  return prob * (0.5 + magnitude * 0.5); // magnitude amplifies probability
}

/** Magnitude multiplier per effect-category pair. */
function getEffectMagnitudeMultiplier(effect: DownstreamEffect, category: string): number {
  // Some effects are naturally stronger for certain categories
  if (effect === 'investor-sentiment' && category === 'economic') return 1.3;
  if (effect === 'political-pressure' && category === 'corruption') return 1.4;
  if (effect === 'social-amplification' && category === 'social') return 1.2;
  return 1.0;
}

/** Generate human-readable effect description. */
function generateEffectDescription(
  effect: DownstreamEffect,
  direction: 'positive' | 'negative',
  magnitude: number
): string {
  const intensity = magnitude >= 0.7 ? 'strongly' : magnitude >= 0.4 ? 'moderately' : 'mildly';
  const descriptions: Record<DownstreamEffect, string> = {
    'policy-support': `${direction === 'positive' ? 'Increases' : 'Decreases'} public support for related policies (${intensity})`,
    'consumer-confidence': `${intensity.charAt(0).toUpperCase() + intensity.slice(1)} ${direction === 'positive' ? 'boosts' : 'dampens'} consumer confidence`,
    'investor-sentiment': `${direction === 'positive' ? 'Positive' : 'Negative'} signal for investors (${intensity})`,
    'political-pressure': `Creates ${intensity} political pressure on decision-makers`,
    'social-amplification': `Likely to be ${intensity} amplified on social media`,
    'counter-narrative': `${intensity.charAt(0).toUpperCase() + intensity.slice(1)} likely to spawn counter-narratives`,
  };
  return descriptions[effect];
}

// --- Utility ---

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
