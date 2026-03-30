// ============================================================
// LOOM — Narrative-Social Bridge
//
// Integrates social media intelligence with the narrative
// engine, linking announcements to events and computing
// social-enhanced Narrative Impact Scores.
// ============================================================

import type { SocialMediaEngine } from '../social-engine.js';
import type { SentimentEngine } from '../../sentiment/sentiment-engine.js';
import type { TemporalGraph } from '../../graph/temporal-graph.js';
import type { AnnouncementTracking } from '../types.js';
import type { SentimentArticle } from '../../sentiment/types.js';
import type {
  AnnouncementEventLink,
  EventSocialImpact,
  EngagementSentimentCorrelation,
  FullImpactChain,
  SocialNIS,
} from './bridge-types.js';
import { buildImpactSteps, assembleImpactChain } from './impact-chain-builder.js';

export type {
  AnnouncementEventLink,
  EventSocialImpact,
  EngagementSentimentCorrelation,
  ImpactChainStep,
  FullImpactChain,
  SocialNIS,
} from './bridge-types.js';

// ============================================================
// Narrative Bridge
// ============================================================

/**
 * Bridge between social media intelligence and the narrative engine.
 * Links announcements to events and computes combined impact metrics.
 */
export class NarrativeBridge {
  private links: Map<string, AnnouncementEventLink> = new Map();
  private readonly socialEngine: SocialMediaEngine;
  private readonly sentimentEngine: SentimentEngine;
  private readonly graph: TemporalGraph;

  constructor(
    socialEngine: SocialMediaEngine,
    sentimentEngine: SentimentEngine,
    graph: TemporalGraph
  ) {
    this.socialEngine = socialEngine;
    this.sentimentEngine = sentimentEngine;
    this.graph = graph;
  }

  /**
   * Link a social announcement to a narrative event.
   *
   * @param announcementId - The social announcement identifier
   * @param narrativeEventId - The narrative event identifier
   * @returns The created link, or null if either entity is not found
   */
  linkAnnouncementToEvent(
    announcementId: string,
    narrativeEventId: string
  ): AnnouncementEventLink | null {
    const announcement = this.socialEngine.getAnnouncementById(announcementId);
    if (!announcement) return null;

    const event = this.graph.getEvent(narrativeEventId);
    if (!event) return null;

    const link: AnnouncementEventLink = {
      announcementId,
      narrativeEventId,
      linkedAt: new Date().toISOString(),
    };

    this.links.set(`${announcementId}:${narrativeEventId}`, link);
    return link;
  }

  /**
   * Get social media impact for a narrative event.
   *
   * @param narrativeEventId - The narrative event identifier
   * @returns Social impact assessment, or null if event has no linked announcements
   */
  getEventSocialImpact(narrativeEventId: string): EventSocialImpact | null {
    const linked = this.getLinkedAnnouncements(narrativeEventId);
    if (linked.length === 0) return null;

    const totalReach = linked.reduce((sum, a) => sum + a.amplificationChain.totalReach, 0);
    const avgImpact = linked.reduce((sum, a) => sum + a.impactScore.score, 0) / linked.length;

    const platformEng = new Map<string, number>();
    for (const ann of linked) {
      for (const resp of ann.platformResponses) {
        const total =
          resp.totalEngagement.likes + resp.totalEngagement.shares + resp.totalEngagement.comments;
        platformEng.set(resp.platform, (platformEng.get(resp.platform) ?? 0) + total);
      }
    }

    let dominantPlatform = 'twitter';
    let maxEng = 0;
    for (const [p, e] of platformEng) {
      if (e > maxEng) {
        maxEng = e;
        dominantPlatform = p;
      }
    }

    const socialSentiment =
      linked.reduce((sum, ann) => {
        const avg =
          ann.platformResponses.reduce((s, r) => s + r.sentimentScore, 0) /
          Math.max(ann.platformResponses.length, 1);
        return sum + avg;
      }, 0) / linked.length;

    return {
      narrativeEventId,
      announcements: linked,
      totalReach,
      averageImpactScore: Math.round(avgImpact * 10) / 10,
      dominantPlatform,
      socialSentiment: Math.round(socialSentiment * 1000) / 1000,
      summary: `Event has ${linked.length} linked announcement(s) with total reach of ${totalReach.toLocaleString()} and average impact score of ${avgImpact.toFixed(1)}.`,
    };
  }

  /**
   * Correlate social engagement with sentiment data for an entity.
   *
   * @param entityId - The entity identifier
   * @returns Correlation analysis, or null if insufficient data
   */
  correlateEngagementWithSentiment(entityId: string): EngagementSentimentCorrelation | null {
    const announcements = this.socialEngine
      .getAnnouncements()
      .filter((a) => a.entityId === entityId);
    if (announcements.length === 0) return null;

    const entityArticles = this.sentimentEngine
      .getArticles()
      .filter((a) => a.entities.some((e) => e.name.toLowerCase().includes(entityId.toLowerCase())));

    const engScores = announcements.map((a) => a.impactScore.score);
    const sentScores =
      entityArticles.length > 0
        ? entityArticles.map((a) => a.sentiment.weightedScore)
        : announcements.map((a) => {
            const avg =
              a.platformResponses.reduce((s, r) => s + r.sentimentScore, 0) /
              Math.max(a.platformResponses.length, 1);
            return avg;
          });

    const corr = computePearsonCorrelation(engScores, sentScores);
    const alignment: EngagementSentimentCorrelation['engagementSentimentAlignment'] =
      corr > 0.3 ? 'aligned' : corr < -0.3 ? 'divergent' : 'neutral';

    return {
      entityId,
      announcementCount: announcements.length,
      articleCount: entityArticles.length,
      correlationCoefficient: Math.round(corr * 1000) / 1000,
      engagementSentimentAlignment: alignment,
      summary: `Entity has ${announcements.length} announcements and ${entityArticles.length} articles. Engagement-sentiment correlation is ${corr.toFixed(3)} (${alignment}).`,
    };
  }

  /**
   * Build full impact chain: announcement → amplification → media → sentiment → action.
   *
   * @param eventId - The narrative event or announcement identifier
   * @returns Full impact chain, or null if no data found
   */
  buildFullImpactChain(eventId: string): FullImpactChain | null {
    const linked = this.getLinkedAnnouncements(eventId);
    const direct = this.socialEngine.getAnnouncementById(eventId);
    const announcements = linked.length > 0 ? linked : direct ? [direct] : [];
    if (announcements.length === 0) return null;

    const primary = announcements[0];
    const relatedArticles = this.findRelatedArticles(primary);
    const steps = buildImpactSteps(primary, relatedArticles);
    return assembleImpactChain(eventId, primary, steps);
  }

  /**
   * Calculate a social-enhanced Narrative Impact Score for an announcement.
   *
   * @param announcementId - The announcement identifier
   * @returns Social NIS, or null if announcement not found
   */
  calculateSocialNIS(announcementId: string): SocialNIS | null {
    const ann = this.socialEngine.getAnnouncementById(announcementId);
    if (!ann) return null;

    const baseNIS = Math.min(ann.impactScore.score * 0.6, 60);
    const chain = ann.amplificationChain;
    const reachScore = Math.min(chain.totalReach / 10000000, 1);
    const velocityScore = Math.min(chain.velocityPerHour / 500000, 1);
    const socialAmplification = Math.round((reachScore * 0.6 + velocityScore * 0.4) * 20 * 10) / 10;

    const avgQuality =
      ann.platformResponses.reduce((s, r) => s + r.quality.qualityScore, 0) /
      Math.max(ann.platformResponses.length, 1);
    const engagementQuality = Math.round((avgQuality / 100) * 10 * 10) / 10;

    const crossPlatformSpread = Math.round(Math.min(ann.platforms.length / 5, 1) * 10 * 10) / 10;
    const compositeScore = Math.round(
      Math.min(baseNIS + socialAmplification + engagementQuality + crossPlatformSpread, 100)
    );

    return {
      announcementId,
      baseNIS: Math.round(baseNIS * 10) / 10,
      socialAmplification,
      engagementQuality,
      crossPlatformSpread,
      compositeScore,
      summary: `Social NIS: ${compositeScore}/100 — base ${baseNIS.toFixed(1)}, amplification +${socialAmplification}, quality +${engagementQuality}, spread +${crossPlatformSpread}.`,
    };
  }

  /** Get all links. */
  getLinks(): AnnouncementEventLink[] {
    return Array.from(this.links.values());
  }

  /** Clear all links. */
  clear(): void {
    this.links.clear();
  }

  // --- Private helpers ---

  /** Get all announcements linked to a narrative event. */
  private getLinkedAnnouncements(narrativeEventId: string): AnnouncementTracking[] {
    const linkedIds: string[] = [];
    for (const [, link] of this.links) {
      if (link.narrativeEventId === narrativeEventId) {
        linkedIds.push(link.announcementId);
      }
    }
    return linkedIds
      .map((id) => this.socialEngine.getAnnouncementById(id))
      .filter((a): a is AnnouncementTracking => a !== undefined);
  }

  /** Find sentiment articles related to an announcement. */
  private findRelatedArticles(announcement: AnnouncementTracking): SentimentArticle[] {
    const articles = this.sentimentEngine.getArticles();
    const titleWords = announcement.title
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);
    const tags = announcement.tags.map((t) => t.toLowerCase());
    return articles.filter((article) => {
      const text = (article.title + ' ' + article.topics.join(' ')).toLowerCase();
      return (
        tags.some((tag) => text.includes(tag)) ||
        titleWords.filter((w) => text.includes(w)).length >= 2
      );
    });
  }
}

// ============================================================
// Internal helpers
// ============================================================

/** Compute Pearson correlation coefficient between two arrays. */
function computePearsonCorrelation(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;

  const xSlice = xs.slice(0, n);
  const ySlice = ys.slice(0, n);
  const xMean = xSlice.reduce((a, b) => a + b, 0) / n;
  const yMean = ySlice.reduce((a, b) => a + b, 0) / n;

  let num = 0,
    xDsq = 0,
    yDsq = 0;
  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - xMean;
    const dy = ySlice[i] - yMean;
    num += dx * dy;
    xDsq += dx * dx;
    yDsq += dy * dy;
  }

  const denom = Math.sqrt(xDsq * yDsq);
  return denom === 0 ? 0 : num / denom;
}
