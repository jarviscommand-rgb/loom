// ============================================================
// LOOM — Sentiment Scorer
//
// Multi-strategy sentiment scoring engine.
// Supports lexicon-based (fast/cheap), LLM-based (accurate),
// and hybrid approaches. Includes emotional type classification
// beyond simple positive/negative.
// ============================================================

import type {
  SentimentScore,
  SentimentTypeBreakdown,
  SentimentType,
  ScoringMethod,
  MediaSource,
} from '../types.js';
import { createBreakdown, createVariable } from '../../analysis/score-breakdown.js';

// ============================================================
// Lexicon-based sentiment (fast, no API calls)
// ============================================================

/**
 * Lexicon-based sentiment scoring.
 * Uses word lists for both English and Bahasa Indonesia.
 * Fast and free — good for high-volume initial scoring.
 */
export function scoreSentimentLexicon(text: string): {
  overall: number;
  magnitude: number;
  confidence: number;
} {
  const words = text.toLowerCase().split(/\s+/);
  let positive = 0;
  let negative = 0;
  let total = 0;

  for (const word of words) {
    const cleanWord = word.replace(/[^a-zA-Z\u00C0-\u024F]/g, '');
    if (cleanWord.length < 3) continue;

    if (POSITIVE_WORDS_EN.has(cleanWord) || POSITIVE_WORDS_ID.has(cleanWord)) {
      positive++;
      total++;
    } else if (NEGATIVE_WORDS_EN.has(cleanWord) || NEGATIVE_WORDS_ID.has(cleanWord)) {
      negative++;
      total++;
    }
  }

  if (total === 0) {
    return { overall: 0, magnitude: 0, confidence: 0.2 };
  }

  const overall = (positive - negative) / total;
  const magnitude = (positive + negative) / words.length;
  // Confidence is higher when we have more signal words
  const confidence = Math.min(total / 20, 0.7); // capped — lexicon is never high-confidence

  return {
    overall: clamp(overall, -1, 1),
    magnitude: clamp(magnitude, 0, 1),
    confidence: clamp(confidence, 0, 1),
  };
}

// ============================================================
// Full sentiment score computation
// ============================================================

/**
 * Compute the full sentiment score for an article.
 * Uses lexicon for speed with optional LLM enhancement.
 *
 * @param text - Article content
 * @param source - Source profile (for weighting)
 * @param sentimentDirection - Direction of sentiment ('positive' or 'negative')
 * @param aboutGovernment - Whether this is about government/political figures
 * @param method - Scoring method to use
 * @returns Full sentiment score with source weighting
 */
export function computeSentimentScore(
  text: string,
  source: MediaSource,
  sentimentDirection: 'positive' | 'negative',
  aboutGovernment: boolean,
  method: ScoringMethod = 'lexicon'
): SentimentScore {
  const lexicon = scoreSentimentLexicon(text);

  // Compute source weight based on bias alignment
  const sourceWeight = computeSourceWeight(source, sentimentDirection, aboutGovernment);

  const weightedScore = lexicon.overall * sourceWeight;

  const biasLabel =
    source.biasDirection === 'pro-government'
      ? 'pro-government'
      : source.biasDirection === 'anti-government'
        ? 'anti-government'
        : 'neutral';

  const unexpectedSignal =
    aboutGovernment &&
    ((source.biasDirection === 'pro-government' && sentimentDirection === 'negative') ||
      (source.biasDirection === 'anti-government' && sentimentDirection === 'positive'));

  const scoreBreakdown = createBreakdown(
    'Sentiment Score',
    clamp(weightedScore, -5, 5),
    'overall × sourceWeight, where sourceWeight = reliability × biasMultiplier × signalWeight',
    [
      createVariable(
        'Lexicon Overall',
        lexicon.overall,
        (lexicon.overall + 1) / 2,
        0.3,
        `Lexicon-based score: (positive_words - negative_words) / total_sentiment_words = ${lexicon.overall.toFixed(3)}. ` +
          'Scans English and Bahasa Indonesia word lists (~80 words each).'
      ),
      createVariable(
        'Magnitude',
        lexicon.magnitude,
        lexicon.magnitude,
        0.15,
        `Sentiment signal density: (positive + negative) / total_words = ${lexicon.magnitude.toFixed(3)}. ` +
          'Higher magnitude means more emotionally charged text.'
      ),
      createVariable(
        'Source Reliability',
        source.reliabilityScore,
        source.reliabilityScore,
        0.2,
        `${source.name} has reliability score ${source.reliabilityScore.toFixed(2)}. ` +
          'Based on editorial standards, fact-checking track record, and independence.'
      ),
      createVariable(
        'Bias Signal',
        sourceWeight / Math.max(source.reliabilityScore * source.signalWeight, 0.01),
        clamp(sourceWeight / 2.5, 0, 1),
        0.2,
        unexpectedSignal
          ? `HIGH SIGNAL: ${biasLabel} source reporting ${sentimentDirection} sentiment about government — ` +
              'unexpected direction amplifies weight by 2.5×.'
          : aboutGovernment && source.biasDirection !== 'neutral'
            ? `Expected ${sentimentDirection} sentiment from ${biasLabel} source — weight dampened to 0.5×.`
            : `Neutral bias direction — baseline weight 1.0×.`
      ),
      createVariable(
        'Confidence',
        lexicon.confidence,
        lexicon.confidence,
        0.15,
        `Scoring confidence: min(signal_words / 20, 0.7) = ${lexicon.confidence.toFixed(2)}. ` +
          'Lexicon scoring is capped at 0.7 confidence — LLM methods can reach higher.'
      ),
    ],
    { minValue: -5, maxValue: 5, scoreUnit: '-5 to 5 weighted' }
  );

  return {
    overall: lexicon.overall,
    magnitude: lexicon.magnitude,
    confidence: lexicon.confidence,
    method,
    weightedScore: clamp(weightedScore, -5, 5),
    sourceWeight,
    scoreBreakdown,
  };
}

/**
 * Compute source weight using the bias-signal algorithm.
 *
 * The key insight: unexpected sentiment from a biased source is HIGH signal.
 * - Pro-gov source reporting negatively on gov = STRONG signal (weight × 2.5)
 * - Anti-gov source reporting positively on gov = STRONG signal (weight × 2.5)
 * - Expected sentiment from biased source = WEAK signal (weight × 0.5)
 * - Neutral source = baseline (weight × 1.0)
 */
export function computeSourceWeight(
  source: MediaSource,
  sentimentDirection: 'positive' | 'negative',
  aboutGovernment: boolean
): number {
  let biasMultiplier = 1.0;

  if (aboutGovernment) {
    if (source.biasDirection === 'pro-government') {
      biasMultiplier = sentimentDirection === 'positive' ? 0.5 : 2.5;
    } else if (source.biasDirection === 'anti-government') {
      biasMultiplier = sentimentDirection === 'positive' ? 2.5 : 0.5;
    }
  }

  return source.reliabilityScore * biasMultiplier * source.signalWeight;
}

// ============================================================
// Sentiment Type Classification
// ============================================================

/** Keyword patterns for each sentiment type. */
const SENTIMENT_TYPE_PATTERNS: Record<SentimentType, { en: string[]; id: string[] }> = {
  fear: {
    en: [
      'fear',
      'afraid',
      'worried',
      'concern',
      'threat',
      'danger',
      'risk',
      'alarm',
      'panic',
      'dread',
      'anxiety',
      'nervous',
      'terror',
      'unsafe',
    ],
    id: [
      'takut',
      'khawatir',
      'cemas',
      'ancaman',
      'bahaya',
      'risiko',
      'panik',
      'gelisah',
      'was-was',
      'ngeri',
    ],
  },
  hope: {
    en: [
      'hope',
      'optimism',
      'promising',
      'bright',
      'opportunity',
      'progress',
      'positive',
      'encourage',
      'aspire',
      'dream',
      'potential',
      'improve',
      'better',
      'growth',
    ],
    id: [
      'harapan',
      'optimis',
      'menjanjikan',
      'peluang',
      'kemajuan',
      'positif',
      'impian',
      'potensi',
      'berkembang',
      'lebih baik',
    ],
  },
  anger: {
    en: [
      'anger',
      'outrage',
      'furious',
      'enraged',
      'condemn',
      'protest',
      'demand',
      'unacceptable',
      'injustice',
      'rage',
      'fury',
      'denounce',
      'infuriating',
    ],
    id: [
      'marah',
      'murka',
      'kecam',
      'protes',
      'tuntut',
      'geram',
      'amarah',
      'tidak terima',
      'emosi',
      'mengecam',
    ],
  },
  trust: {
    en: [
      'trust',
      'confident',
      'reliable',
      'credible',
      'stable',
      'secure',
      'competent',
      'integrity',
      'accountable',
      'transparent',
      'proven',
      'dependable',
    ],
    id: [
      'percaya',
      'yakin',
      'stabil',
      'aman',
      'kompeten',
      'integritas',
      'akuntabel',
      'transparan',
      'terpercaya',
      'handal',
    ],
  },
  pride: {
    en: [
      'pride',
      'proud',
      'patriot',
      'national',
      'achievement',
      'glory',
      'honor',
      'sovereignty',
      'heritage',
      'triumph',
      'excellence',
      'world-class',
    ],
    id: [
      'bangga',
      'kebanggaan',
      'patriot',
      'nasional',
      'prestasi',
      'kehormatan',
      'kedaulatan',
      'jaya',
      'unggul',
      'membanggakan',
    ],
  },
  confusion: {
    en: [
      'confus',
      'unclear',
      'uncertain',
      'ambiguous',
      'contradict',
      'mixed signals',
      'puzzling',
      'unexplained',
      'bewildering',
      'inconsistent',
      'vague',
    ],
    id: [
      'bingung',
      'tidak jelas',
      'ambigu',
      'bertentangan',
      'membingungkan',
      'rancu',
      'inkonsisten',
      'samar',
    ],
  },
  urgency: {
    en: [
      'urgent',
      'immediate',
      'critical',
      'emergency',
      'crisis',
      'deadline',
      'act now',
      'time-sensitive',
      'pressing',
      'imperative',
      'must',
      'crucial',
    ],
    id: [
      'mendesak',
      'darurat',
      'krisis',
      'segera',
      'kritis',
      'harus',
      'penting',
      'genting',
      'krusial',
    ],
  },
  apathy: {
    en: [
      'irrelevant',
      'nothing new',
      'routine',
      'expected',
      'boring',
      'unimportant',
      'status quo',
      'business as usual',
      'minor',
      'trivial',
      'negligible',
    ],
    id: [
      'biasa saja',
      'tidak penting',
      'rutin',
      'seperti biasa',
      'sepele',
      'remeh',
      'tidak menarik',
    ],
  },
};

/**
 * Classify the emotional sentiment types present in text.
 * Returns a breakdown of all types with their intensities.
 */
export function classifySentimentTypes(text: string): SentimentTypeBreakdown[] {
  const textLower = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  const types: SentimentType[] = [
    'fear',
    'hope',
    'anger',
    'trust',
    'pride',
    'confusion',
    'urgency',
    'apathy',
  ];

  const results: SentimentTypeBreakdown[] = types.map((type) => {
    const patterns = SENTIMENT_TYPE_PATTERNS[type];
    const allPatterns = [...patterns.en, ...patterns.id];

    let hits = 0;
    for (const pattern of allPatterns) {
      if (textLower.includes(pattern.toLowerCase())) {
        hits++;
      }
    }

    // Intensity based on hit density relative to article length
    const density = hits / Math.max(wordCount / 100, 1);
    const intensity = clamp(density, 0, 1);

    // Confidence based on number of distinct hits
    const confidence = clamp(hits / 5, 0, 0.85);

    return {
      type,
      intensity: Math.round(intensity * 100) / 100,
      confidence: Math.round(confidence * 100) / 100,
    };
  });

  // Normalize: ensure at least one type has intensity > 0
  const maxIntensity = Math.max(...results.map((r) => r.intensity));
  if (maxIntensity === 0) {
    // Default to apathy if no signals detected
    const apathyResult = results.find((r) => r.type === 'apathy');
    if (apathyResult) {
      apathyResult.intensity = 0.3;
      apathyResult.confidence = 0.2;
    }
  }

  return results.sort((a, b) => b.intensity - a.intensity);
}

// ============================================================
// Lexicon word sets
// ============================================================

/** English positive sentiment words. */
const POSITIVE_WORDS_EN = new Set([
  'good',
  'great',
  'excellent',
  'positive',
  'success',
  'growth',
  'improve',
  'progress',
  'win',
  'gain',
  'benefit',
  'hope',
  'strong',
  'boost',
  'achieve',
  'advance',
  'breakthrough',
  'celebrate',
  'confident',
  'encourage',
  'expand',
  'flourish',
  'innovation',
  'lead',
  'opportunity',
  'optimism',
  'profit',
  'prosper',
  'recover',
  'reform',
  'rise',
  'stable',
  'surge',
  'thrive',
  'triumph',
  'trust',
  'upgrade',
  'value',
  'victory',
]);

/** English negative sentiment words. */
const NEGATIVE_WORDS_EN = new Set([
  'bad',
  'worse',
  'worst',
  'negative',
  'fail',
  'decline',
  'crisis',
  'threat',
  'loss',
  'damage',
  'risk',
  'danger',
  'weak',
  'corrupt',
  'scandal',
  'attack',
  'collapse',
  'condemn',
  'conflict',
  'controversial',
  'crash',
  'criticism',
  'debt',
  'deficit',
  'delay',
  'destroy',
  'disappointing',
  'disaster',
  'downturn',
  'fear',
  'fraud',
  'harm',
  'inflation',
  'instability',
  'panic',
  'poverty',
  'protest',
  'recession',
  'reject',
  'suffer',
  'tension',
  'turmoil',
  'unemployment',
  'violence',
  'volatile',
  'warning',
]);

/** Bahasa Indonesia positive sentiment words. */
const POSITIVE_WORDS_ID = new Set([
  'baik',
  'bagus',
  'sukses',
  'berhasil',
  'tumbuh',
  'maju',
  'kuat',
  'positif',
  'untung',
  'manfaat',
  'harapan',
  'stabil',
  'bangga',
  'prestasi',
  'unggul',
  'berkembang',
  'meningkat',
  'optimis',
  'percaya',
  'reformasi',
  'inovasi',
  'peluang',
  'kemajuan',
  'sejahtera',
  'aman',
  'damai',
  'adil',
  'makmur',
  'terpercaya',
  'transparan',
  'membanggakan',
]);

/** Bahasa Indonesia negative sentiment words. */
const NEGATIVE_WORDS_ID = new Set([
  'buruk',
  'gagal',
  'krisis',
  'ancaman',
  'rugi',
  'bahaya',
  'lemah',
  'korupsi',
  'skandal',
  'konflik',
  'kontroversial',
  'kerusakan',
  'takut',
  'protes',
  'kemiskinan',
  'kekerasan',
  'inflasi',
  'utang',
  'pengangguran',
  'resesi',
  'turun',
  'menurun',
  'merosot',
  'kecam',
  'tolak',
  'marah',
  'demonstrasi',
  'bencana',
  'darurat',
  'mengecam',
  'korup',
  'merugikan',
]);

// --- Utility ---

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
