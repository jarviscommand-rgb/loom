// ============================================================
// LOOM — Audience Deep Analyzer
//
// Advanced audience analysis: growth prediction, shift detection,
// persona journey mapping, and similar persona discovery.
// ============================================================

import type { AudienceSegment, AudiencePersona, SocialPlatform } from '../types.js';
import type { AudienceType } from '../../sentiment/types.js';
import { matchPersonaToNarrative } from './audience-analyzer.js';

// ============================================================
// Audience Growth Prediction
// ============================================================

/**
 * Predict audience growth for a segment over a given timeframe.
 *
 * @param segment - The audience segment to predict for
 * @param timeframeDays - Number of days to predict ahead
 * @returns Growth prediction with estimated new size
 */
export function predictAudienceGrowth(
  segment: AudienceSegment,
  timeframeDays: number
): {
  currentSize: number;
  predictedSize: number;
  growthRate: number;
  confidence: number;
  summary: string;
} {
  // Growth rate based on audience type — digital audiences grow faster
  const baseGrowthRates: Record<AudienceType, number> = {
    'youth-digital': 0.08,
    'urban-middle': 0.04,
    'rural-mass': 0.01,
    'elite-policy': 0.02,
    diaspora: 0.03,
    international: 0.025,
  };

  const dailyGrowthRate = (baseGrowthRates[segment.audienceType] ?? 0.03) / 365;
  const engagementMultiplier = 1 + segment.engagementRate;
  const adjustedRate = dailyGrowthRate * engagementMultiplier;

  const predictedSize = Math.round(
    segment.estimatedSize * Math.pow(1 + adjustedRate, timeframeDays)
  );

  const annualizedRate = Math.pow(1 + adjustedRate, 365) - 1;
  const confidence = Math.max(0.3, 0.8 - timeframeDays * 0.002);

  return {
    currentSize: segment.estimatedSize,
    predictedSize,
    growthRate: Math.round(annualizedRate * 10000) / 100,
    confidence: Math.round(confidence * 100) / 100,
    summary:
      `${segment.name}: predicted to grow from ${segment.estimatedSize.toLocaleString()} ` +
      `to ${predictedSize.toLocaleString()} over ${timeframeDays} days ` +
      `(${(annualizedRate * 100).toFixed(1)}% annualized).`,
  };
}

// ============================================================
// Audience Shift Detection
// ============================================================

/**
 * Detect when audience demographics are shifting for an entity.
 * Compares segment engagement rates to baseline to identify changes.
 *
 * @param segments - Current audience segments for the entity
 * @param baselineSegments - Baseline segments to compare against
 * @returns Shift detection results
 */
export function detectAudienceShift(
  segments: AudienceSegment[],
  baselineSegments: AudienceSegment[]
): {
  shifting: boolean;
  shiftMagnitude: number;
  growingSegments: string[];
  shrinkingSegments: string[];
  summary: string;
} {
  if (segments.length === 0 || baselineSegments.length === 0) {
    return {
      shifting: false,
      shiftMagnitude: 0,
      growingSegments: [],
      shrinkingSegments: [],
      summary: 'Insufficient data to detect audience shift.',
    };
  }

  const baselineMap = new Map(baselineSegments.map((s) => [s.id, s]));
  const growingSegments: string[] = [];
  const shrinkingSegments: string[] = [];
  let totalShift = 0;

  for (const segment of segments) {
    const baseline = baselineMap.get(segment.id);
    if (!baseline) continue;

    const shareDiff = segment.shareOfAudience - baseline.shareOfAudience;
    totalShift += Math.abs(shareDiff);

    if (shareDiff > 0.05) {
      growingSegments.push(segment.name);
    } else if (shareDiff < -0.05) {
      shrinkingSegments.push(segment.name);
    }
  }

  const shiftMagnitude = Math.min(totalShift, 1);
  const shifting = shiftMagnitude > 0.1;

  return {
    shifting,
    shiftMagnitude: Math.round(shiftMagnitude * 100) / 100,
    growingSegments,
    shrinkingSegments,
    summary: shifting
      ? `Audience shift detected (magnitude: ${(shiftMagnitude * 100).toFixed(0)}%). ` +
        `Growing: ${growingSegments.join(', ') || 'none'}. ` +
        `Shrinking: ${shrinkingSegments.join(', ') || 'none'}.`
      : 'No significant audience shift detected.',
  };
}

// ============================================================
// Persona Journey Mapping
// ============================================================

/** A single step in a persona's engagement journey. */
export interface PersonaJourneyStep {
  /** Stage label. */
  stage: string;
  /** Engagement level at this stage (0-1). */
  engagementLevel: number;
  /** Primary platform at this stage. */
  platform: SocialPlatform;
  /** Key topics at this stage. */
  topics: string[];
}

/**
 * Map how a persona's engagement evolves over time.
 *
 * @param persona - The audience persona
 * @param tags - Tags from recent announcements
 * @returns Persona engagement journey stages
 */
export function mapPersonaJourney(
  persona: AudiencePersona,
  tags: string[]
): {
  personaId: string;
  personaName: string;
  journey: PersonaJourneyStep[];
  summary: string;
} {
  const relevance = matchPersonaToNarrative(persona, tags, persona.platforms);

  // Build a journey based on persona characteristics
  const journey: PersonaJourneyStep[] = [
    {
      stage: 'awareness',
      engagementLevel: Math.min(relevance * 0.4, 0.4),
      platform: persona.platforms[0],
      topics: tags.slice(0, 2),
    },
    {
      stage: 'interest',
      engagementLevel: Math.min(relevance * 0.6, 0.6),
      platform: persona.platforms[0],
      topics: persona.interests
        .filter((i) => tags.some((t) => t.toLowerCase().includes(i.toLowerCase())))
        .slice(0, 3),
    },
    {
      stage: 'engagement',
      engagementLevel: Math.min(relevance * 0.8, 0.8),
      platform: persona.platforms.length > 1 ? persona.platforms[1] : persona.platforms[0],
      topics: persona.keyConcerns.slice(0, 2),
    },
    {
      stage: 'amplification',
      engagementLevel: relevance,
      platform: persona.platforms[0],
      topics: [...tags.slice(0, 1), ...persona.keyConcerns.slice(0, 1)],
    },
  ];

  return {
    personaId: persona.id,
    personaName: persona.name,
    journey,
    summary:
      `${persona.name} journey: awareness → amplification. ` +
      `Peak engagement: ${(relevance * 100).toFixed(0)}% on ${persona.platforms[0]}.`,
  };
}

// ============================================================
// Similar Persona Detection
// ============================================================

/**
 * Find personas with similar behavior and interests.
 *
 * @param targetPersona - The persona to find similarities for
 * @param allPersonas - Pool of personas to search
 * @returns Ranked list of similar personas
 */
export function findSimilarPersonas(
  targetPersona: AudiencePersona,
  allPersonas: AudiencePersona[]
): Array<{
  personaId: string;
  personaName: string;
  similarity: number;
  sharedInterests: string[];
  sharedPlatforms: SocialPlatform[];
}> {
  return allPersonas
    .filter((p) => p.id !== targetPersona.id)
    .map((persona) => {
      // Platform overlap
      const sharedPlatforms = persona.platforms.filter((p) => targetPersona.platforms.includes(p));
      const platformScore =
        sharedPlatforms.length /
        Math.max(new Set([...persona.platforms, ...targetPersona.platforms]).size, 1);

      // Interest overlap
      const sharedInterests = persona.interests.filter((i) =>
        targetPersona.interests.some((ti) => ti.toLowerCase() === i.toLowerCase())
      );
      const interestScore =
        sharedInterests.length /
        Math.max(new Set([...persona.interests, ...targetPersona.interests]).size, 1);

      // Political leaning match
      const leaningScore = persona.politicalLeaning === targetPersona.politicalLeaning ? 1 : 0;

      // Concern overlap
      const sharedConcerns = persona.keyConcerns.filter((c) =>
        targetPersona.keyConcerns.some((tc) => tc.toLowerCase() === c.toLowerCase())
      );
      const concernScore =
        sharedConcerns.length /
        Math.max(new Set([...persona.keyConcerns, ...targetPersona.keyConcerns]).size, 1);

      const similarity =
        platformScore * 0.25 + interestScore * 0.3 + leaningScore * 0.2 + concernScore * 0.25;

      return {
        personaId: persona.id,
        personaName: persona.name,
        similarity: Math.round(similarity * 100) / 100,
        sharedInterests,
        sharedPlatforms,
      };
    })
    .sort((a, b) => b.similarity - a.similarity);
}
