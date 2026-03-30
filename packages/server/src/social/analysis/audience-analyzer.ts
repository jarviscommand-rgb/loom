// ============================================================
// LOOM — Audience Analyzer
//
// Audience segmentation, overlap detection, persona building,
// and persona-narrative matching.
// ============================================================

import type {
  AudienceSegment,
  AudiencePersona,
  AudienceOverlap,
  EngagementMetrics,
  SocialPlatform,
  PersonaReaction,
} from '../types.js';
import type { PoliticalLeaning, AudienceType } from '../../sentiment/types.js';

// ============================================================
// Audience Segmentation
// ============================================================

/**
 * Segment audience based on engagement data patterns.
 * Clusters engagement into demographic segments based on platform
 * and engagement characteristics.
 *
 * @param engagementData - Engagement metrics to analyze
 * @param existingSegments - Known segments to match against
 * @returns Audience segments with estimated sizes
 */
export function segmentAudience(
  engagementData: EngagementMetrics[],
  existingSegments: AudienceSegment[]
): AudienceSegment[] {
  if (existingSegments.length === 0 || engagementData.length === 0) {
    return existingSegments;
  }

  // Calculate total engagement per platform
  const platformTotals = new Map<SocialPlatform, number>();
  for (const data of engagementData) {
    const total = data.likes + data.shares + data.comments;
    const current = platformTotals.get(data.platform) ?? 0;
    platformTotals.set(data.platform, current + total);
  }

  const grandTotal = Array.from(platformTotals.values()).reduce((a, b) => a + b, 0);

  // Weight segments by platform overlap with engagement data
  return existingSegments.map((segment) => {
    const platformOverlap = segment.primaryPlatforms.reduce((score, platform) => {
      const platformEngagement = platformTotals.get(platform) ?? 0;
      return score + (grandTotal > 0 ? platformEngagement / grandTotal : 0);
    }, 0);

    return {
      ...segment,
      shareOfAudience: Math.min(segment.shareOfAudience * (0.5 + platformOverlap), 1),
      engagementRate: segment.engagementRate * (0.8 + platformOverlap * 0.4),
    };
  });
}

// ============================================================
// Audience Overlap Detection
// ============================================================

/**
 * Detect the overlap between two audiences based on their segment profiles.
 * Uses Jaccard similarity coefficient on segment membership.
 *
 * @param segments1 - Segments for first entity
 * @param segments2 - Segments for second entity
 * @param entityId1 - First entity identifier
 * @param entityId2 - Second entity identifier
 * @param entityName1 - First entity display name
 * @param entityName2 - Second entity display name
 * @returns Audience overlap analysis
 */
export function detectAudienceOverlap(
  segments1: AudienceSegment[],
  segments2: AudienceSegment[],
  entityId1: string,
  entityId2: string,
  entityName1: string,
  entityName2: string
): AudienceOverlap {
  const ids1 = new Set(segments1.map((s) => s.id));
  const ids2 = new Set(segments2.map((s) => s.id));

  const shared = segments1.filter((s) => ids2.has(s.id));
  const unique1 = segments1.filter((s) => !ids2.has(s.id));
  const unique2 = segments2.filter((s) => !ids1.has(s.id));

  const unionSize = new Set([...ids1, ...ids2]).size;
  const overlapCoefficient = unionSize > 0 ? shared.length / unionSize : 0;

  // Competitive tension increases with overlap and segment importance
  const sharedAudienceShare = shared.reduce((sum, s) => sum + s.shareOfAudience, 0);
  const competitiveTension = Math.round(
    Math.min(overlapCoefficient * sharedAudienceShare * 200, 100)
  );

  const overlapPct = Math.round(overlapCoefficient * 100);
  const summary =
    overlapCoefficient > 0.6
      ? `High audience overlap (${overlapPct}%) between ${entityName1} and ${entityName2}. ` +
        `They compete for ${shared.length} shared segments, creating significant competitive tension.`
      : overlapCoefficient > 0.3
        ? `Moderate audience overlap (${overlapPct}%) between ${entityName1} and ${entityName2}. ` +
          `${shared.length} shared segments suggest partial audience competition.`
        : `Low audience overlap (${overlapPct}%) between ${entityName1} and ${entityName2}. ` +
          `Largely distinct audiences with minimal competitive pressure.`;

  return {
    entityId1,
    entityId2,
    entityName1,
    entityName2,
    overlapCoefficient,
    sharedSegments: shared,
    uniqueToEntity1: unique1,
    uniqueToEntity2: unique2,
    competitiveTension,
    summary,
  };
}

// ============================================================
// Persona Building
// ============================================================

/**
 * Build a detailed audience persona from a segment profile.
 *
 * @param segment - The audience segment to build a persona from
 * @returns A detailed audience persona
 */
export function buildPersonaFromSegment(segment: AudienceSegment): AudiencePersona {
  const platformNames: Record<SocialPlatform, string> = {
    twitter: 'Twitter/X',
    instagram: 'Instagram',
    tiktok: 'TikTok',
    facebook: 'Facebook',
    reddit: 'Reddit',
    youtube: 'YouTube',
  };

  const ageRanges: Record<AudienceType, string> = {
    'youth-digital': '16-25',
    'urban-middle': '25-45',
    'rural-mass': '35-65',
    'elite-policy': '35-60',
    diaspora: '28-50',
    international: '30-55',
  };

  const platformList = segment.primaryPlatforms.map((p) => platformNames[p]).join(', ');

  return {
    id: `persona-from-${segment.id}`,
    name: segment.name,
    description:
      `${segment.description}. Active on ${platformList} with ` +
      `an engagement rate of ${(segment.engagementRate * 100).toFixed(1)}%.`,
    ageRange: ageRanges[segment.audienceType] ?? '25-50',
    genderDistribution: '50% male, 50% female',
    incomeLevel: inferIncomeLevel(segment.audienceType),
    educationLevel: inferEducationLevel(segment.audienceType),
    platforms: segment.primaryPlatforms,
    interests: inferInterests(segment.politicalLeaning, segment.audienceType),
    followedInfluencers: [],
    politicalLeaning: segment.politicalLeaning,
    geography: segment.geography,
    mediaConsumption: `Primarily ${platformList}`,
    keyConcerns: inferConcerns(segment.politicalLeaning, segment.audienceType),
  };
}

// ============================================================
// Persona-Narrative Matching
// ============================================================

/**
 * Score how well a persona matches with a narrative/announcement.
 * Returns a compatibility score based on platform overlap, political
 * alignment, and interest relevance.
 *
 * @param persona - The audience persona
 * @param tags - Tags/topics of the narrative
 * @param platforms - Platforms where the narrative is active
 * @returns Compatibility score (0-1)
 */
export function matchPersonaToNarrative(
  persona: AudiencePersona,
  tags: string[],
  platforms: SocialPlatform[]
): number {
  // Platform overlap score
  const platformOverlap = persona.platforms.filter((p) => platforms.includes(p)).length;
  const platformScore = platforms.length > 0 ? platformOverlap / platforms.length : 0;

  // Interest/topic relevance
  const interestMatch = persona.interests.filter((interest) =>
    tags.some(
      (tag) =>
        tag.toLowerCase().includes(interest.toLowerCase()) ||
        interest.toLowerCase().includes(tag.toLowerCase())
    )
  ).length;
  const interestScore = persona.interests.length > 0 ? Math.min(interestMatch / 3, 1) : 0;

  // Concern relevance
  const concernMatch = persona.keyConcerns.filter((concern) =>
    tags.some((tag) => concern.toLowerCase().includes(tag.toLowerCase()))
  ).length;
  const concernScore = persona.keyConcerns.length > 0 ? Math.min(concernMatch / 2, 1) : 0;

  // Weighted composite
  return Math.min(platformScore * 0.4 + interestScore * 0.35 + concernScore * 0.25, 1);
}

/**
 * Predict a persona's reaction to a hypothetical announcement.
 *
 * @param persona - The audience persona
 * @param announcement - Description of the announcement
 * @param tags - Tags/topics of the announcement
 * @param platforms - Platforms where the announcement will appear
 * @returns Predicted persona reaction
 */
export function predictReaction(
  persona: AudiencePersona,
  announcement: string,
  tags: string[],
  platforms: SocialPlatform[]
): PersonaReaction {
  const relevance = matchPersonaToNarrative(persona, tags, platforms);
  const announcementLower = announcement.toLowerCase();

  // Determine sentiment based on political alignment and content
  let sentimentScore = 0;
  const positiveSignals = ['growth', 'investment', 'reform', 'success', 'improvement', 'progress'];
  const negativeSignals = [
    'crisis',
    'corruption',
    'tax',
    'restriction',
    'decline',
    'fire',
    'disaster',
  ];

  for (const signal of positiveSignals) {
    if (announcementLower.includes(signal)) sentimentScore += 0.15;
  }
  for (const signal of negativeSignals) {
    if (announcementLower.includes(signal)) sentimentScore -= 0.15;
  }

  // Adjust by political leaning
  if (persona.politicalLeaning === 'pro-government') {
    sentimentScore += 0.2;
  } else if (persona.politicalLeaning === 'opposition') {
    sentimentScore -= 0.2;
  }

  sentimentScore = Math.max(-1, Math.min(1, sentimentScore));

  const engagementLikelihood = relevance * 0.7 + Math.abs(sentimentScore) * 0.3;
  const amplificationLikelihood = engagementLikelihood * (sentimentScore > 0 ? 0.8 : 0.5);

  const emotion =
    sentimentScore > 0.3
      ? 'enthusiasm'
      : sentimentScore > 0
        ? 'cautious optimism'
        : sentimentScore > -0.3
          ? 'skepticism'
          : 'frustration';

  const talkingPoints = persona.keyConcerns
    .filter((concern) => tags.some((tag) => concern.toLowerCase().includes(tag.toLowerCase())))
    .slice(0, 3);

  if (talkingPoints.length === 0) {
    talkingPoints.push(`Impact on ${persona.geography} community`);
  }

  return {
    personaId: persona.id,
    personaName: persona.name,
    sentimentScore,
    engagementLikelihood: Math.min(engagementLikelihood, 1),
    amplificationLikelihood: Math.min(amplificationLikelihood, 1),
    dominantEmotion: emotion,
    likelyTalkingPoints: talkingPoints,
    preferredPlatform: persona.platforms[0],
    summary:
      `${persona.name} is likely to react with ${emotion} ` +
      `(sentiment: ${sentimentScore.toFixed(2)}). Engagement likelihood: ` +
      `${(engagementLikelihood * 100).toFixed(0)}%. Expected to engage primarily on ${persona.platforms[0]}.`,
  };
}

// ============================================================
// Internal helpers
// ============================================================

/** Infer income level from audience type. */
function inferIncomeLevel(audienceType: AudienceType): string {
  const levels: Record<AudienceType, string> = {
    'elite-policy': 'High income',
    'urban-middle': 'Middle class',
    'rural-mass': 'Lower-middle class',
    diaspora: 'Upper-middle class',
    international: 'Varies',
    'youth-digital': 'Student / entry-level',
  };
  return levels[audienceType] ?? 'Middle class';
}

/** Infer education level from audience type. */
function inferEducationLevel(audienceType: AudienceType): string {
  const levels: Record<AudienceType, string> = {
    'elite-policy': 'Advanced degree',
    'urban-middle': 'University graduate',
    'rural-mass': 'High school',
    diaspora: 'University graduate or higher',
    international: 'University graduate',
    'youth-digital': 'Current student',
  };
  return levels[audienceType] ?? 'University graduate';
}

/** Infer interests from political leaning and audience type. */
function inferInterests(leaning: PoliticalLeaning, audienceType: AudienceType): string[] {
  const baseInterests: Record<AudienceType, string[]> = {
    'elite-policy': ['economics', 'policy', 'investment', 'regulation'],
    'urban-middle': ['technology', 'lifestyle', 'politics', 'career'],
    'rural-mass': ['agriculture', 'religion', 'local-politics', 'family'],
    diaspora: ['global-economics', 'Indonesian-politics', 'technology'],
    international: ['geopolitics', 'trade', 'human-rights'],
    'youth-digital': ['social-media', 'entertainment', 'education', 'social-justice'],
  };

  const leaningInterests: Record<string, string[]> = {
    'pro-government': ['governance', 'development'],
    opposition: ['reform', 'accountability'],
    independent: ['transparency', 'analysis'],
    progressive: ['environment', 'digital-rights'],
    'islamic-conservative': ['religious-values', 'tradition'],
    'military-aligned': ['defense', 'sovereignty'],
    centrist: ['stability', 'pragmatism'],
  };

  return [...(baseInterests[audienceType] ?? []), ...(leaningInterests[leaning] ?? [])];
}

/** Infer key concerns from political leaning and audience type. */
function inferConcerns(leaning: PoliticalLeaning, audienceType: AudienceType): string[] {
  const baseConcerns: Record<AudienceType, string[]> = {
    'elite-policy': ['regulatory stability', 'investment climate', 'fiscal policy'],
    'urban-middle': ['cost of living', 'job market', 'infrastructure'],
    'rural-mass': ['subsidies', 'agricultural prices', 'land rights'],
    diaspora: ['democratic governance', 'dual citizenship', 'investment opportunities'],
    international: ['trade relations', 'regional stability', 'market access'],
    'youth-digital': ['education', 'job prospects', 'digital freedom'],
  };

  const leaningConcerns: Record<string, string[]> = {
    'pro-government': ['program delivery', 'national development'],
    opposition: ['government accountability', 'democratic freedoms'],
    independent: ['transparency', 'media freedom'],
    progressive: ['environment', 'social justice', 'digital rights'],
    'islamic-conservative': ['religious values', 'moral governance'],
    'military-aligned': ['national sovereignty', 'defense capability'],
    centrist: ['economic stability', 'pragmatic governance'],
  };

  return [...(baseConcerns[audienceType] ?? []), ...(leaningConcerns[leaning] ?? [])];
}
