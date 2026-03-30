// ============================================================
// LOOM — Narrative-Social Bridge Types
//
// Type definitions for the narrative-social bridge, linking
// social media announcements to narrative events and computing
// social-enhanced impact scores.
// ============================================================

import type { AnnouncementTracking } from '../types.js';

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
