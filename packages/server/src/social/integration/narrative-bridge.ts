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

// ============================================================
// Types
// ============================================================

/** Link between a social announcement and a narrative event. */
export interface AnnouncementEventLink {
  /** Announcement identifier. */
  announcementId: string;
  /** Narrative event identifier. */
  narrativeEventId: string;
  /** When the link was created. */
  linkedAt: string;
}

/** Social media impact assessment for a narrative event. */
export interface EventSocialImpact {
  /** Narrative event identifier. */
  narrativeEventId: string;
  /** Linked announcements. */
  announcements: AnnouncementTracking[];
  /** Total reach across all announcements. */
  totalReach: number;
  /** Average social impact score. */
  averageImpactScore: number;
  /** Dominant platform by engagement. */
  dominantPlatform: string;
  /** Combined sentiment from social data (-1 to 1). */
  socialSentiment: number;
  /** Summary of social impact. */
  summary: string;
}

/** Correlation between engagement metrics and sentiment. */
export interface EngagementSentimentCorrelation {
  /** Entity identifier. */
  entityId: string;
  /** Number of announcements analyzed. */
  announcementCount: number;
  /** Number of sentiment articles analyzed. */
  articleCount: number;
  /** Pearson correlation coefficient (-1 to 1). */
  correlationCoefficient: number;
  /** Whether high engagement aligns with positive sentiment. */
  engagementSentimentAlignment: 'aligned' | 'divergent' | 'neutral';
  /** Summary of the correlation. */
  summary: string;
}

/** Single step in a full impact chain. */
export interface ImpactChainStep {
  /** Stage name. */
  stage: string;
  /** Timestamp of this stage. */
  timestamp: string;
  /** Metrics at this stage. */
  metrics: Record<string, number>;
  /** Description of what happened. */
  description: string;
}

/** Full impact chain from announcement to action. */
export interface FullImpactChain {
  /** Event identifier. */
  eventId: string;
  /** Ordered chain of impact stages. */
  steps: ImpactChainStep[];
  /** Total duration in hours. */
  totalDurationHours: number;
  /** Overall impact magnitude (0-1). */
  overallMagnitude: number;
  /** Summary narrative. */
  summary: string;
}

/** Social-enhanced Narrative Impact Score. */
export interface SocialNIS {
  /** Announcement identifier. */
  announcementId: string;
  /** Base NIS components (0-20 each). */
  baseNIS: number;
  /** Social amplification bonus (0-20). */
  socialAmplification: number;
  /** Engagement quality bonus (0-10). */
  engagementQuality: number;
  /** Cross-platform spread bonus (0-10). */
  crossPlatformSpread: number;
  /** Final composite score (0-100). */
  compositeScore: number;
  /** Summary explanation. */
  summary: string;
}

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
    const linkedAnnouncements = this.getLinkedAnnouncements(narrativeEventId);
    if (linkedAnnouncements.length === 0) return null;

    const totalReach = linkedAnnouncements.reduce(
      (sum, ann) => sum + ann.amplificationChain.totalReach,
      0
    );

    const averageImpactScore =
      linkedAnnouncements.reduce((sum, ann) => sum + ann.impactScore.score, 0) /
      linkedAnnouncements.length;

    const platformEngagement = new Map<string, number>();
    for (const ann of linkedAnnouncements) {
      for (const resp of ann.platformResponses) {
        const eng = resp.totalEngagement;
        const total = eng.likes + eng.shares + eng.comments;
        const current = platformEngagement.get(resp.platform) ?? 0;
        platformEngagement.set(resp.platform, current + total);
      }
    }

    let dominantPlatform = 'twitter';
    let maxEngagement = 0;
    for (const [platform, engagement] of platformEngagement) {
      if (engagement > maxEngagement) {
        maxEngagement = engagement;
        dominantPlatform = platform;
      }
    }

    const socialSentiment =
      linkedAnnouncements.reduce((sum, ann) => {
        const avgSent =
          ann.platformResponses.reduce((s, r) => s + r.sentimentScore, 0) /
          Math.max(ann.platformResponses.length, 1);
        return sum + avgSent;
      }, 0) / linkedAnnouncements.length;

    return {
      narrativeEventId,
      announcements: linkedAnnouncements,
      totalReach,
      averageImpactScore: Math.round(averageImpactScore * 10) / 10,
      dominantPlatform,
      socialSentiment: Math.round(socialSentiment * 1000) / 1000,
      summary:
        `Event has ${linkedAnnouncements.length} linked announcement(s) ` +
        `with total reach of ${totalReach.toLocaleString()} and average ` +
        `impact score of ${averageImpactScore.toFixed(1)}.`,
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

    const articles = this.sentimentEngine.getArticles();
    const entityArticles = articles.filter((a) =>
      a.entities.some((e) => e.name.toLowerCase().includes(entityId.toLowerCase()))
    );

    const engagementScores = announcements.map((a) => a.impactScore.score);
    const sentimentScores =
      entityArticles.length > 0
        ? entityArticles.map((a) => a.sentiment.weightedScore)
        : announcements.map((a) => {
            const avgSent =
              a.platformResponses.reduce((s, r) => s + r.sentimentScore, 0) /
              Math.max(a.platformResponses.length, 1);
            return avgSent;
          });

    const correlation = computePearsonCorrelation(engagementScores, sentimentScores);

    const alignment: EngagementSentimentCorrelation['engagementSentimentAlignment'] =
      correlation > 0.3 ? 'aligned' : correlation < -0.3 ? 'divergent' : 'neutral';

    return {
      entityId,
      announcementCount: announcements.length,
      articleCount: entityArticles.length,
      correlationCoefficient: Math.round(correlation * 1000) / 1000,
      engagementSentimentAlignment: alignment,
      summary:
        `Entity has ${announcements.length} announcements and ${entityArticles.length} articles. ` +
        `Engagement-sentiment correlation is ${correlation.toFixed(3)} (${alignment}).`,
    };
  }

  /**
   * Build full impact chain: announcement → amplification → media → sentiment → action.
   *
   * @param eventId - The narrative event or announcement identifier
   * @returns Full impact chain, or null if no data found
   */
  buildFullImpactChain(eventId: string): FullImpactChain | null {
    const linkedAnnouncements = this.getLinkedAnnouncements(eventId);
    const directAnnouncement = this.socialEngine.getAnnouncementById(eventId);

    const announcements =
      linkedAnnouncements.length > 0
        ? linkedAnnouncements
        : directAnnouncement
          ? [directAnnouncement]
          : [];

    if (announcements.length === 0) return null;

    const primary = announcements[0];
    const steps: ImpactChainStep[] = [];

    // Stage 1: Announcement
    steps.push({
      stage: 'announcement',
      timestamp: primary.announcedAt,
      metrics: {
        platforms: primary.platforms.length,
      },
      description: `"${primary.title}" announced on ${primary.platforms.length} platforms.`,
    });

    // Stage 2: Social Amplification
    const chain = primary.amplificationChain;
    const ampTimestamp = new Date(
      new Date(primary.announcedAt).getTime() + chain.timeToPeakHours * 3600000 * 0.3
    ).toISOString();
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
    const mediaTimestamp = new Date(
      new Date(primary.announcedAt).getTime() + chain.timeToPeakHours * 3600000 * 0.6
    ).toISOString();
    const relatedArticles = this.findRelatedArticles(primary);
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
    const sentimentTimestamp = new Date(
      new Date(primary.announcedAt).getTime() + chain.timeToPeakHours * 3600000 * 0.8
    ).toISOString();
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
    const actionTimestamp = new Date(
      new Date(primary.announcedAt).getTime() + chain.timeToPeakHours * 3600000
    ).toISOString();
    steps.push({
      stage: 'action',
      timestamp: actionTimestamp,
      metrics: {
        engagementPattern: primary.engagementPattern.type === 'viral-loop' ? 1 : 0,
        botRate: chain.botAmplificationRate,
      },
      description: buildActionDescription(primary),
    });

    const startTime = new Date(primary.announcedAt).getTime();
    const endTime = new Date(actionTimestamp).getTime();
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

  /**
   * Calculate a social-enhanced Narrative Impact Score for an announcement.
   *
   * @param announcementId - The announcement identifier
   * @returns Social NIS, or null if announcement not found
   */
  calculateSocialNIS(announcementId: string): SocialNIS | null {
    const announcement = this.socialEngine.getAnnouncementById(announcementId);
    if (!announcement) return null;

    // Base NIS from social impact score (scaled 0-60)
    const baseNIS = Math.min(announcement.impactScore.score * 0.6, 60);

    // Social amplification bonus (0-20)
    const chain = announcement.amplificationChain;
    const reachScore = Math.min(chain.totalReach / 10000000, 1);
    const velocityScore = Math.min(chain.velocityPerHour / 500000, 1);
    const socialAmplification = Math.round((reachScore * 0.6 + velocityScore * 0.4) * 20 * 10) / 10;

    // Engagement quality bonus (0-10)
    const avgQuality =
      announcement.platformResponses.reduce((s, r) => s + r.quality.qualityScore, 0) /
      Math.max(announcement.platformResponses.length, 1);
    const engagementQuality = Math.round((avgQuality / 100) * 10 * 10) / 10;

    // Cross-platform spread bonus (0-10)
    const platformCount = announcement.platforms.length;
    const crossPlatformSpread = Math.round(Math.min(platformCount / 5, 1) * 10 * 10) / 10;

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
      summary:
        `Social NIS: ${compositeScore}/100 — base ${baseNIS.toFixed(1)}, ` +
        `amplification +${socialAmplification}, quality +${engagementQuality}, ` +
        `spread +${crossPlatformSpread}.`,
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
      const articleText = (article.title + ' ' + article.topics.join(' ')).toLowerCase();
      const tagMatch = tags.some((tag) => articleText.includes(tag));
      const titleMatch = titleWords.filter((w) => articleText.includes(w)).length >= 2;
      return tagMatch || titleMatch;
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

  let numerator = 0;
  let xDenomSq = 0;
  let yDenomSq = 0;

  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - xMean;
    const dy = ySlice[i] - yMean;
    numerator += dx * dy;
    xDenomSq += dx * dx;
    yDenomSq += dy * dy;
  }

  const denominator = Math.sqrt(xDenomSq * yDenomSq);
  if (denominator === 0) return 0;

  return numerator / denominator;
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
