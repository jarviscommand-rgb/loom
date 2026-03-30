// ============================================================
// LOOM — Social Media Intelligence Engine
//
// Central orchestrator for social media tracking, audience
// analysis, engagement patterns, and amplification chains.
// ============================================================

import { v4 as uuid } from 'uuid';
import type {
  AnnouncementTracking,
  AudienceSegment,
  AudiencePersona,
  InfluencerProfile,
  EngagementPattern,
  CrossPlatformAnalysis,
  EngagementQuality,
  AmplificationChain,
  AudienceOverlap,
  SocialImpactScore,
  SocialDashboard,
  SocialPlatform,
  PersonaReaction,
  PlatformResponse,
} from './types.js';
import {
  DEMO_ANNOUNCEMENTS,
  DEMO_PERSONAS,
  DEMO_INFLUENCERS,
  DEMO_SEGMENTS,
} from './demo/social-demo.js';
import { buildEngagementPattern } from './analysis/engagement-analyzer.js';
import {
  segmentAudience,
  detectAudienceOverlap,
  predictReaction,
} from './analysis/audience-analyzer.js';
import { buildAmplificationChain } from './analysis/amplification-tracker.js';

// ============================================================
// Social Media Engine
// ============================================================

/**
 * Central social media intelligence engine.
 * Manages announcements, audiences, influencers, and analytics.
 */
export class SocialMediaEngine {
  private announcements: Map<string, AnnouncementTracking> = new Map();
  private personas: Map<string, AudiencePersona> = new Map();
  private influencers: Map<string, InfluencerProfile> = new Map();
  private segments: Map<string, AudienceSegment> = new Map();

  // --- Announcement Tracking ---

  /**
   * Track a new announcement and its social media response.
   *
   * @param entityId - Entity making the announcement
   * @param entityName - Entity display name
   * @param title - Announcement title
   * @param description - Announcement description
   * @param platforms - Platforms to track
   * @param tags - Tags/categories
   * @returns The created announcement tracking record
   */
  trackAnnouncement(
    entityId: string,
    entityName: string,
    title: string,
    description: string,
    platforms: SocialPlatform[],
    tags: string[] = []
  ): AnnouncementTracking {
    const id = `ann-${uuid()}`;
    const now = new Date().toISOString();

    // Generate initial platform responses
    const platformResponses = platforms.map((platform) =>
      this.generateInitialPlatformResponse(platform)
    );

    // Build engagement pattern from platform data
    const allMetrics = platformResponses.map((pr) => pr.totalEngagement);
    const engagementPattern = buildEngagementPattern(allMetrics);

    // Calculate impact score
    const impactScore = this.calculateImpactScore(platformResponses, engagementPattern);

    // Build amplification chain
    const sourceNode = {
      nodeId: entityId,
      name: entityName,
      nodeType: 'source' as const,
      platform: platforms[0],
      audienceSize: 1000,
      amplifiedAt: now,
      engagement: 0,
    };
    const relevantInfluencers = this.findRelevantInfluencers(platforms);
    const amplificationChain = buildAmplificationChain(sourceNode, relevantInfluencers, allMetrics);

    const announcement: AnnouncementTracking = {
      id,
      entityId,
      entityName,
      title,
      description,
      announcedAt: now,
      platforms,
      platformResponses,
      engagementPattern,
      impactScore,
      amplificationChain,
      tags,
    };

    this.announcements.set(id, announcement);
    return announcement;
  }

  /**
   * Get engagement pattern for a specific announcement.
   *
   * @param announcementId - Announcement identifier
   * @returns Engagement pattern or undefined
   */
  getEngagementPattern(announcementId: string): EngagementPattern | undefined {
    return this.announcements.get(announcementId)?.engagementPattern;
  }

  /**
   * Get audience segmentation for an entity.
   *
   * @param entityId - Entity identifier
   * @returns Audience segments weighted by this entity's engagement
   */
  getAudienceSegmentation(entityId: string): AudienceSegment[] {
    const entityAnnouncements = Array.from(this.announcements.values()).filter(
      (a) => a.entityId === entityId
    );

    if (entityAnnouncements.length === 0) {
      return Array.from(this.segments.values());
    }

    const allMetrics = entityAnnouncements.flatMap((a) =>
      a.platformResponses.map((pr) => pr.totalEngagement)
    );

    return segmentAudience(allMetrics, Array.from(this.segments.values()));
  }

  /**
   * Identify key influencers for an entity or narrative.
   *
   * @param entityId - Entity identifier
   * @returns Influencer profiles sorted by amplification score
   */
  identifyInfluencers(entityId: string): InfluencerProfile[] {
    const entityAnnouncements = Array.from(this.announcements.values()).filter(
      (a) => a.entityId === entityId
    );

    if (entityAnnouncements.length === 0) {
      return Array.from(this.influencers.values()).sort(
        (a, b) => b.amplificationScore - a.amplificationScore
      );
    }

    // Find influencers on platforms where this entity is active
    const activePlatforms = new Set(entityAnnouncements.flatMap((a) => a.platforms));

    return Array.from(this.influencers.values())
      .filter((inf) => activePlatforms.has(inf.platform))
      .sort((a, b) => b.amplificationScore - a.amplificationScore);
  }

  /**
   * Analyze the same event across different platforms.
   *
   * @param eventId - Announcement/event identifier
   * @returns Cross-platform analysis or undefined
   */
  analyzeCrossPlatform(eventId: string): CrossPlatformAnalysis | undefined {
    const announcement = this.announcements.get(eventId);
    if (!announcement) return undefined;

    const { platformResponses } = announcement;

    // Find dominant platform by total engagement
    const ranked = platformResponses
      .map((pr) => ({
        platform: pr.platform,
        totalEngagement:
          pr.totalEngagement.likes + pr.totalEngagement.shares + pr.totalEngagement.comments,
      }))
      .sort((a, b) => b.totalEngagement - a.totalEngagement);

    const dominantPlatform = ranked.length > 0 ? ranked[0].platform : 'twitter';

    // Calculate sentiment divergence
    const sentiments = platformResponses.map((pr) => pr.sentimentScore);
    const sentimentDivergence = this.calculateDivergence(sentiments);

    // Identify framing differences
    const framingDifferences = this.identifyFramingDifferences(platformResponses);

    return {
      eventId,
      eventDescription: announcement.title,
      platformBreakdowns: platformResponses,
      dominantPlatform,
      sentimentDivergence,
      engagementRanking: ranked,
      framingDifferences,
      summary: this.buildCrossPlatformSummary(
        announcement.title,
        dominantPlatform,
        sentimentDivergence,
        ranked
      ),
    };
  }

  /**
   * Score the quality of engagement for an announcement.
   *
   * @param announcementId - Announcement identifier
   * @returns Engagement quality or undefined
   */
  scoreEngagementQuality(announcementId: string): EngagementQuality | undefined {
    const announcement = this.announcements.get(announcementId);
    if (!announcement) return undefined;

    // Aggregate quality across platforms
    const qualities = announcement.platformResponses.map((pr) => pr.quality);
    if (qualities.length === 0) return undefined;

    const avgBot = qualities.reduce((s, q) => s + q.botScore, 0) / qualities.length;
    const avgReal = qualities.reduce((s, q) => s + q.realScore, 0) / qualities.length;
    const avgPassiveActive =
      qualities.reduce((s, q) => s + q.passiveToActiveRatio, 0) / qualities.length;
    const avgSupportAdversal =
      qualities.reduce((s, q) => s + q.supportiveToAdversarialRatio, 0) / qualities.length;
    const avgQuality = qualities.reduce((s, q) => s + q.qualityScore, 0) / qualities.length;

    return {
      botScore: avgBot,
      realScore: avgReal,
      passiveToActiveRatio: avgPassiveActive,
      supportiveToAdversarialRatio: avgSupportAdversal,
      qualityScore: avgQuality,
      stanceBreakdown: {
        supportive: avgSupportAdversal > 1 ? 0.55 : 0.3,
        adversarial: avgSupportAdversal > 1 ? 0.25 : 0.5,
        neutral: 0.2,
      },
    };
  }

  /**
   * Build the amplification chain for an announcement.
   *
   * @param announcementId - Announcement identifier
   * @returns Amplification chain or undefined
   */
  buildAmplificationChain(announcementId: string): AmplificationChain | undefined {
    const announcement = this.announcements.get(announcementId);
    if (!announcement) return undefined;

    return announcement.amplificationChain;
  }

  /**
   * Analyze audience overlap between two entities.
   *
   * @param entityId1 - First entity identifier
   * @param entityId2 - Second entity identifier
   * @returns Audience overlap analysis
   */
  getAudienceOverlap(entityId1: string, entityId2: string): AudienceOverlap {
    const segments1 = this.getAudienceSegmentation(entityId1);
    const segments2 = this.getAudienceSegmentation(entityId2);

    const name1 = this.getEntityName(entityId1);
    const name2 = this.getEntityName(entityId2);

    return detectAudienceOverlap(segments1, segments2, entityId1, entityId2, name1, name2);
  }

  /**
   * Build or return all audience personas.
   *
   * @returns All audience personas
   */
  buildAudiencePersonas(): AudiencePersona[] {
    return Array.from(this.personas.values());
  }

  /**
   * Get a single persona by ID.
   *
   * @param personaId - Persona identifier
   * @returns Persona or undefined
   */
  getPersonaById(personaId: string): AudiencePersona | undefined {
    return this.personas.get(personaId);
  }

  /**
   * Predict how a persona would react to a hypothetical announcement.
   *
   * @param personaId - Persona identifier
   * @param announcement - Description of the hypothetical announcement
   * @param tags - Tags/topics
   * @param platforms - Platforms
   * @returns Predicted reaction or undefined
   */
  predictPersonaReaction(
    personaId: string,
    announcement: string,
    tags: string[] = [],
    platforms: SocialPlatform[] = ['twitter', 'instagram', 'tiktok']
  ): PersonaReaction | undefined {
    const persona = this.personas.get(personaId);
    if (!persona) return undefined;

    return predictReaction(persona, announcement, tags, platforms);
  }

  // --- Data Access ---

  /**
   * Get all tracked announcements.
   *
   * @returns All announcements
   */
  getAnnouncements(): AnnouncementTracking[] {
    return Array.from(this.announcements.values());
  }

  /**
   * Get a single announcement by ID.
   *
   * @param id - Announcement identifier
   * @returns Announcement or undefined
   */
  getAnnouncementById(id: string): AnnouncementTracking | undefined {
    return this.announcements.get(id);
  }

  /**
   * Get all influencer profiles.
   *
   * @returns All influencers sorted by amplification score
   */
  getInfluencers(): InfluencerProfile[] {
    return Array.from(this.influencers.values()).sort(
      (a, b) => b.amplificationScore - a.amplificationScore
    );
  }

  /**
   * Get aggregated social intelligence dashboard.
   *
   * @returns Dashboard data
   */
  getDashboard(): SocialDashboard {
    const announcements = Array.from(this.announcements.values());
    const influencers = Array.from(this.influencers.values());

    const avgImpact =
      announcements.length > 0
        ? announcements.reduce((sum, a) => sum + a.impactScore.score, 0) / announcements.length
        : 0;

    // Platform distribution
    const platformCounts: Record<SocialPlatform, number> = {
      twitter: 0,
      instagram: 0,
      tiktok: 0,
      facebook: 0,
      reddit: 0,
      youtube: 0,
    };
    for (const ann of announcements) {
      for (const pr of ann.platformResponses) {
        const total =
          pr.totalEngagement.likes + pr.totalEngagement.shares + pr.totalEngagement.comments;
        platformCounts[pr.platform] += total;
      }
    }

    const mostActivePlatform =
      (Object.entries(platformCounts) as Array<[SocialPlatform, number]>).sort(
        (a, b) => b[1] - a[1]
      )[0]?.[0] ?? 'twitter';

    return {
      totalAnnouncements: announcements.length,
      totalInfluencers: influencers.length,
      totalPersonas: this.personas.size,
      averageImpactScore: Math.round(avgImpact),
      mostActivePlatform,
      topAnnouncements: announcements
        .sort((a, b) => b.impactScore.score - a.impactScore.score)
        .slice(0, 5)
        .map((a) => ({ id: a.id, title: a.title, impactScore: a.impactScore.score })),
      topInfluencers: influencers
        .sort((a, b) => b.amplificationScore - a.amplificationScore)
        .slice(0, 5)
        .map((inf) => ({ id: inf.id, name: inf.name, amplificationScore: inf.amplificationScore })),
      platformDistribution: platformCounts,
      trendDirection: this.detectTrendDirection(announcements),
    };
  }

  // --- Demo Data ---

  /**
   * Load demo data for Indonesian political context.
   *
   * @returns Number of announcements loaded
   */
  loadDemoData(): number {
    // Load personas
    for (const persona of DEMO_PERSONAS) {
      this.personas.set(persona.id, persona);
    }

    // Load influencers
    for (const influencer of DEMO_INFLUENCERS) {
      this.influencers.set(influencer.id, influencer);
    }

    // Load segments
    for (const segment of DEMO_SEGMENTS) {
      this.segments.set(segment.id, segment);
    }

    // Load announcements
    for (const announcement of DEMO_ANNOUNCEMENTS) {
      this.announcements.set(announcement.id, announcement);
    }

    return DEMO_ANNOUNCEMENTS.length;
  }

  /**
   * Clear all data.
   */
  clear(): void {
    this.announcements.clear();
    this.personas.clear();
    this.influencers.clear();
    this.segments.clear();
  }

  // --- Private Helpers ---

  /** Generate initial platform response with baseline metrics. */
  private generateInitialPlatformResponse(platform: SocialPlatform): PlatformResponse {
    const baseLikes = Math.floor(Math.random() * 5000) + 500;
    const baseShares = Math.floor(baseLikes * 0.3);
    const baseComments = Math.floor(baseLikes * 0.15);
    const baseViews = baseLikes * 20;

    return {
      platform,
      totalEngagement: {
        platform,
        likes: baseLikes,
        shares: baseShares,
        comments: baseComments,
        views: baseViews,
        reachEstimate: baseViews * 0.6,
        timestamp: new Date().toISOString(),
      },
      sentimentScore: Math.random() * 2 - 1,
      topHashtags: [],
      talkingPoints: [],
      quality: {
        botScore: 0.1,
        realScore: 0.9,
        passiveToActiveRatio: 3,
        supportiveToAdversarialRatio: 1.2,
        qualityScore: 75,
        stanceBreakdown: { supportive: 0.5, adversarial: 0.3, neutral: 0.2 },
      },
    };
  }

  /** Calculate social impact score from platform responses and pattern. */
  private calculateImpactScore(
    responses: PlatformResponse[],
    pattern: EngagementPattern
  ): SocialImpactScore {
    const totalReach = responses.reduce((sum, pr) => sum + pr.totalEngagement.reachEstimate, 0);
    const totalEngagement = responses.reduce(
      (sum, pr) =>
        sum + pr.totalEngagement.likes + pr.totalEngagement.shares + pr.totalEngagement.comments,
      0
    );

    const reachScore = Math.min(Math.log10(Math.max(totalReach, 1)) * 15, 100);
    const engagementScore = Math.min(Math.log10(Math.max(totalEngagement, 1)) * 20, 100);
    const sentimentIntensity =
      responses.reduce((sum, pr) => sum + Math.abs(pr.sentimentScore), 0) /
      Math.max(responses.length, 1);
    const sentimentScore = sentimentIntensity * 100;
    const amplificationScore =
      pattern.viralCoefficient > 1
        ? 80 + pattern.viralCoefficient * 5
        : pattern.viralCoefficient * 80;
    const crossPlatformScore = Math.min(responses.length * 20, 100);

    const score = Math.round(
      reachScore * 0.25 +
        engagementScore * 0.25 +
        sentimentScore * 0.2 +
        amplificationScore * 0.15 +
        crossPlatformScore * 0.15
    );

    return {
      score: Math.min(score, 100),
      reachScore: Math.round(reachScore),
      engagementScore: Math.round(engagementScore),
      sentimentScore: Math.round(sentimentScore),
      amplificationScore: Math.round(Math.min(amplificationScore, 100)),
      crossPlatformScore: Math.round(crossPlatformScore),
      summary:
        score > 70
          ? 'High social impact with strong cross-platform engagement'
          : score > 40
            ? 'Moderate social impact with focused engagement'
            : 'Low social impact with limited reach',
    };
  }

  /** Find influencers active on given platforms. */
  private findRelevantInfluencers(platforms: SocialPlatform[]): InfluencerProfile[] {
    return Array.from(this.influencers.values())
      .filter((inf) => platforms.includes(inf.platform))
      .slice(0, 5);
  }

  /** Calculate divergence across a set of values. */
  private calculateDivergence(values: number[]): number {
    if (values.length < 2) return 0;
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
    return Math.min(Math.sqrt(variance), 1);
  }

  /** Identify key framing differences between platform responses. */
  private identifyFramingDifferences(responses: PlatformResponse[]): string[] {
    const differences: string[] = [];

    // Check sentiment divergence
    const sentiments = responses.map((pr) => ({ platform: pr.platform, score: pr.sentimentScore }));
    const positive = sentiments.filter((s) => s.score > 0.2);
    const negative = sentiments.filter((s) => s.score < -0.2);

    if (positive.length > 0 && negative.length > 0) {
      differences.push(
        `Positive reception on ${positive.map((s) => s.platform).join(', ')} ` +
          `vs negative on ${negative.map((s) => s.platform).join(', ')}`
      );
    }

    // Check engagement quality differences
    const highQuality = responses.filter((pr) => pr.quality.qualityScore > 70);
    const lowQuality = responses.filter((pr) => pr.quality.qualityScore < 50);
    if (highQuality.length > 0 && lowQuality.length > 0) {
      differences.push(
        `Higher quality engagement on ${highQuality.map((pr) => pr.platform).join(', ')}`
      );
    }

    if (differences.length === 0) {
      differences.push('Relatively consistent framing across platforms');
    }

    return differences;
  }

  /** Build cross-platform summary text. */
  private buildCrossPlatformSummary(
    title: string,
    dominantPlatform: SocialPlatform,
    divergence: number,
    ranking: Array<{ platform: SocialPlatform; totalEngagement: number }>
  ): string {
    const divergenceLabel =
      divergence > 0.5 ? 'highly divergent' : divergence > 0.2 ? 'moderately varied' : 'consistent';
    const topPlatforms = ranking
      .slice(0, 3)
      .map((r) => r.platform)
      .join(', ');

    return (
      `"${title}" saw ${divergenceLabel} sentiment across platforms. ` +
      `${dominantPlatform} dominated engagement. Top platforms: ${topPlatforms}.`
    );
  }

  /** Get entity name from announcements or return ID. */
  private getEntityName(entityId: string): string {
    for (const ann of this.announcements.values()) {
      if (ann.entityId === entityId) return ann.entityName;
    }
    return entityId;
  }

  /** Detect overall trend direction from recent announcements. */
  private detectTrendDirection(
    announcements: AnnouncementTracking[]
  ): 'rising' | 'falling' | 'stable' {
    if (announcements.length < 2) return 'stable';

    const sorted = [...announcements].sort(
      (a, b) => new Date(a.announcedAt).getTime() - new Date(b.announcedAt).getTime()
    );

    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

    const avgFirst = firstHalf.reduce((s, a) => s + a.impactScore.score, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((s, a) => s + a.impactScore.score, 0) / secondHalf.length;

    if (avgSecond > avgFirst * 1.1) return 'rising';
    if (avgSecond < avgFirst * 0.9) return 'falling';
    return 'stable';
  }
}
