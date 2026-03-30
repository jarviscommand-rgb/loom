// ============================================================
// LOOM — Impact Chain Builder
//
// Builds full impact chains tracing the path from announcement
// through social amplification, media pickup, sentiment shift,
// to downstream action.
// ============================================================

import type { AnnouncementTracking } from '../types.js';
import type { SentimentArticle } from '../../sentiment/types.js';
import type { ImpactChainStep, FullImpactChain } from './bridge-types.js';

/**
 * Build the ordered impact chain steps for an announcement.
 *
 * @param primary - The primary announcement to trace
 * @param relatedArticles - Sentiment articles related to the announcement
 * @returns Array of impact chain steps
 */
export function buildImpactSteps(
  primary: AnnouncementTracking,
  relatedArticles: SentimentArticle[]
): ImpactChainStep[] {
  const chain = primary.amplificationChain;
  const steps: ImpactChainStep[] = [];

  // Stage 1: Announcement
  steps.push({
    stage: 'announcement',
    timestamp: primary.announcedAt,
    metrics: { platforms: primary.platforms.length },
    description: `"${primary.title}" announced on ${primary.platforms.length} platforms.`,
  });

  // Stage 2: Social Amplification
  const ampTimestamp = offsetTimestamp(primary.announcedAt, chain.timeToPeakHours * 0.3);
  steps.push({
    stage: 'social-amplification',
    timestamp: ampTimestamp,
    metrics: {
      influencers: chain.influencers.length,
      reach: chain.totalReach,
      velocityPerHour: chain.velocityPerHour,
    },
    description:
      `${chain.influencers.length} influencers amplified with ` +
      `reach of ${chain.totalReach.toLocaleString()}.`,
  });

  // Stage 3: Media Pickup
  const mediaTimestamp = offsetTimestamp(primary.announcedAt, chain.timeToPeakHours * 0.6);
  steps.push({
    stage: 'media-pickup',
    timestamp: mediaTimestamp,
    metrics: {
      articleCount: relatedArticles.length,
      avgNIS:
        relatedArticles.length > 0
          ? relatedArticles.reduce((s, a) => s + a.nis.score, 0) / relatedArticles.length
          : 0,
    },
    description:
      relatedArticles.length > 0
        ? `${relatedArticles.length} media articles covered the event.`
        : 'No direct media articles found — impact measured via social signals.',
  });

  // Stage 4: Sentiment Shift
  const sentimentTimestamp = offsetTimestamp(primary.announcedAt, chain.timeToPeakHours * 0.8);
  const avgSentiment =
    primary.platformResponses.reduce((s, r) => s + r.sentimentScore, 0) /
    Math.max(primary.platformResponses.length, 1);
  steps.push({
    stage: 'sentiment-shift',
    timestamp: sentimentTimestamp,
    metrics: {
      sentimentScore: Math.round(avgSentiment * 1000) / 1000,
      impactScore: primary.impactScore.score,
    },
    description:
      `Sentiment shifted to ${avgSentiment.toFixed(2)} with ` +
      `social impact score of ${primary.impactScore.score}.`,
  });

  // Stage 5: Action/Outcome
  const actionTimestamp = offsetTimestamp(primary.announcedAt, chain.timeToPeakHours);
  steps.push({
    stage: 'action',
    timestamp: actionTimestamp,
    metrics: {
      engagementPattern: primary.engagementPattern.type === 'viral-loop' ? 1 : 0,
      botRate: chain.botAmplificationRate,
    },
    description: buildActionDescription(primary),
  });

  return steps;
}

/**
 * Assemble a full impact chain from steps.
 *
 * @param eventId - The event or announcement identifier
 * @param primary - The primary announcement
 * @param steps - Ordered impact chain steps
 * @returns Complete impact chain
 */
export function assembleImpactChain(
  eventId: string,
  primary: AnnouncementTracking,
  steps: ImpactChainStep[]
): FullImpactChain {
  const startTime = new Date(primary.announcedAt).getTime();
  const endTime = new Date(steps[steps.length - 1].timestamp).getTime();
  const totalDurationHours = (endTime - startTime) / 3600000;

  return {
    eventId,
    steps,
    totalDurationHours: Math.round(totalDurationHours * 10) / 10,
    overallMagnitude: Math.min(primary.impactScore.score / 100, 1),
    summary:
      `Impact chain spans ${totalDurationHours.toFixed(1)} hours from ` +
      `announcement to peak effect with magnitude ${(primary.impactScore.score / 100).toFixed(2)}.`,
  };
}

/** Offset a timestamp by a number of hours. */
function offsetTimestamp(base: string, hours: number): string {
  return new Date(new Date(base).getTime() + hours * 3600000).toISOString();
}

/** Build a human-readable action description from announcement data. */
function buildActionDescription(announcement: AnnouncementTracking): string {
  const pattern = announcement.engagementPattern.type;
  const impact = announcement.impactScore.score;

  if (pattern === 'viral-loop' && impact > 80) {
    return 'Viral spread triggered sustained public discourse and potential policy response.';
  }
  if (pattern === 'spike-decay') {
    return 'Initial spike of attention followed by rapid decay — short-lived impact.';
  }
  if (pattern === 'sustained') {
    return 'Sustained engagement indicates lasting narrative shift in public discourse.';
  }
  return 'Gradual build-up of attention with potential for long-term narrative influence.';
}
