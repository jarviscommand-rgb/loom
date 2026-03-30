// ============================================================
// LOOM — Social Media Intelligence Types
//
// Core type definitions for tracking social media response to
// announcements, audience segmentation, engagement analysis,
// amplification chains, and cross-platform comparison.
// ============================================================

import type { PoliticalLeaning, AudienceType } from '../sentiment/types.js';

// --- Enums & Primitives ---

/** Supported social media platforms. */
export type SocialPlatform = 'twitter' | 'instagram' | 'tiktok' | 'facebook' | 'reddit' | 'youtube';

/** Classification of engagement pattern shape. */
export type EngagementPatternType = 'spike-decay' | 'sustained' | 'viral-loop' | 'slow-burn';

/** Quality classification of engagement interactions. */
export type InteractionQuality = 'bot' | 'real' | 'suspicious';

/** Stance of audience engagement toward a narrative. */
export type EngagementStance = 'supportive' | 'adversarial' | 'neutral';

/** Level of influence for an audience segment or influencer. */
export type InfluenceLevel = 'micro' | 'mid-tier' | 'macro' | 'mega';

// --- Engagement Metrics ---

/** Per-platform engagement metrics for a specific time window. */
export interface EngagementMetrics {
  /** Platform these metrics are from. */
  platform: SocialPlatform;
  /** Number of likes/reactions. */
  likes: number;
  /** Number of shares/retweets/reposts. */
  shares: number;
  /** Number of comments/replies. */
  comments: number;
  /** Number of views/impressions. */
  views: number;
  /** Estimated unique reach. */
  reachEstimate: number;
  /** Timestamp for this metrics snapshot. */
  timestamp: string;
}

/** Quality analysis of engagement interactions. */
export interface EngagementQuality {
  /** Estimated percentage of bot-driven engagement (0-1). */
  botScore: number;
  /** Estimated percentage of real human engagement (0-1). */
  realScore: number;
  /** Ratio of passive (likes/views) to active (comments/shares) engagement. */
  passiveToActiveRatio: number;
  /** Ratio of supportive to adversarial engagement. */
  supportiveToAdversarialRatio: number;
  /** Overall quality score (0-100). */
  qualityScore: number;
  /** Breakdown by stance. */
  stanceBreakdown: Record<EngagementStance, number>;
}

// --- Engagement Patterns ---

/** Engagement pattern classification with fitted parameters. */
export interface EngagementPattern {
  /** Classified pattern type. */
  type: EngagementPatternType;
  /** Confidence in the classification (0-1). */
  confidence: number;
  /** Peak engagement value. */
  peakValue: number;
  /** Timestamp of peak engagement. */
  peakTimestamp: string;
  /** Exponential decay rate (for spike-decay patterns). */
  decayRate: number;
  /** Half-life in hours (for spike-decay patterns). */
  halfLifeHours: number;
  /** Viral coefficient (for viral-loop patterns, >1 means viral). */
  viralCoefficient: number;
  /** Time series of engagement snapshots. */
  timeSeries: EngagementMetrics[];
}

// --- Platform Response ---

/** Per-platform breakdown for a tracked announcement. */
export interface PlatformResponse {
  /** Platform identifier. */
  platform: SocialPlatform;
  /** Aggregated engagement metrics. */
  totalEngagement: EngagementMetrics;
  /** Dominant sentiment on this platform (-1 to 1). */
  sentimentScore: number;
  /** Top hashtags used in discussion. */
  topHashtags: string[];
  /** Key talking points. */
  talkingPoints: string[];
  /** Engagement quality assessment. */
  quality: EngagementQuality;
}

// --- Announcement Tracking ---

/** Tracked entity announcement with social media response data. */
export interface AnnouncementTracking {
  /** Unique identifier. */
  id: string;
  /** Entity that made the announcement. */
  entityId: string;
  /** Entity display name. */
  entityName: string;
  /** Announcement title/headline. */
  title: string;
  /** Announcement description/content. */
  description: string;
  /** When the announcement was made. */
  announcedAt: string;
  /** Platforms where response is being tracked. */
  platforms: SocialPlatform[];
  /** Per-platform response breakdown. */
  platformResponses: PlatformResponse[];
  /** Overall engagement pattern. */
  engagementPattern: EngagementPattern;
  /** Social impact score. */
  impactScore: SocialImpactScore;
  /** Amplification chain for this announcement. */
  amplificationChain: AmplificationChain;
  /** Tags/categories for the announcement. */
  tags: string[];
}

// --- Audience Types ---

/** Demographic audience segment. */
export interface AudienceSegment {
  /** Unique identifier. */
  id: string;
  /** Segment label. */
  name: string;
  /** Segment description. */
  description: string;
  /** Estimated size of this segment. */
  estimatedSize: number;
  /** Percentage of total audience (0-1). */
  shareOfAudience: number;
  /** Dominant political leaning. */
  politicalLeaning: PoliticalLeaning;
  /** Primary geographic region. */
  geography: string;
  /** Audience type classification. */
  audienceType: AudienceType;
  /** Influence level of this segment. */
  influenceLevel: InfluenceLevel;
  /** Primary platforms used by this segment. */
  primaryPlatforms: SocialPlatform[];
  /** Average engagement rate from this segment (0-1). */
  engagementRate: number;
}

/** Detailed audience persona profile. */
export interface AudiencePersona {
  /** Unique identifier. */
  id: string;
  /** Persona name (e.g., "Urban Jakarta Millennial"). */
  name: string;
  /** Detailed persona description. */
  description: string;
  /** Age range. */
  ageRange: string;
  /** Gender distribution description. */
  genderDistribution: string;
  /** Income level description. */
  incomeLevel: string;
  /** Education level. */
  educationLevel: string;
  /** Primary social platforms. */
  platforms: SocialPlatform[];
  /** Topics of interest. */
  interests: string[];
  /** Influencers this persona follows. */
  followedInfluencers: string[];
  /** Political leaning. */
  politicalLeaning: PoliticalLeaning;
  /** Geographic location. */
  geography: string;
  /** Media consumption habits. */
  mediaConsumption: string;
  /** Key concerns and values. */
  keyConcerns: string[];
}

/** Predicted or actual reaction of a persona to a narrative. */
export interface PersonaReaction {
  /** Persona identifier. */
  personaId: string;
  /** Persona name. */
  personaName: string;
  /** Sentiment reaction (-1 to 1). */
  sentimentScore: number;
  /** Likelihood to engage (0-1). */
  engagementLikelihood: number;
  /** Likelihood to share/amplify (0-1). */
  amplificationLikelihood: number;
  /** Predicted dominant emotional reaction. */
  dominantEmotion: string;
  /** Key talking points this persona would focus on. */
  likelyTalkingPoints: string[];
  /** Predicted platform for engagement. */
  preferredPlatform: SocialPlatform;
  /** Overall reaction summary. */
  summary: string;
}

// --- Influencer Types ---

/** Profile of a social media influencer/amplifier. */
export interface InfluencerProfile {
  /** Unique identifier. */
  id: string;
  /** Display name. */
  name: string;
  /** Primary platform. */
  platform: SocialPlatform;
  /** Follower count. */
  followerCount: number;
  /** Average engagement rate (0-1). */
  engagementRate: number;
  /** Political leaning. */
  politicalLeaning: PoliticalLeaning;
  /** Audience type they reach. */
  audienceType: AudienceType;
  /** Amplification power score (0-100). */
  amplificationScore: number;
  /** Content categories they cover. */
  contentCategories: string[];
  /** Whether they are verified on their platform. */
  verified: boolean;
  /** Geographic focus. */
  geography: string;
}

// --- Cross-Platform Analysis ---

/** Analysis of the same event across multiple platforms. */
export interface CrossPlatformAnalysis {
  /** Event identifier. */
  eventId: string;
  /** Event description. */
  eventDescription: string;
  /** Per-platform responses. */
  platformBreakdowns: PlatformResponse[];
  /** Platform with highest engagement. */
  dominantPlatform: SocialPlatform;
  /** Sentiment variance across platforms (0-1, higher = more divergent). */
  sentimentDivergence: number;
  /** Platforms ranked by engagement. */
  engagementRanking: Array<{ platform: SocialPlatform; totalEngagement: number }>;
  /** Key differences in framing across platforms. */
  framingDifferences: string[];
  /** Summary of cross-platform comparison. */
  summary: string;
}

// --- Amplification Chain ---

/** Single node in an amplification chain. */
export interface AmplificationNode {
  /** Node identifier (influencer or segment ID). */
  nodeId: string;
  /** Display name. */
  name: string;
  /** Node type. */
  nodeType: 'source' | 'influencer' | 'mass-audience';
  /** Platform of this node. */
  platform: SocialPlatform;
  /** Follower/audience count at this node. */
  audienceSize: number;
  /** Timestamp when this node amplified the message. */
  amplifiedAt: string;
  /** Engagement generated at this node. */
  engagement: number;
}

/** How a message spreads from source through influencers to mass audience. */
export interface AmplificationChain {
  /** Source node (origin of message). */
  source: AmplificationNode;
  /** Influencer amplifiers. */
  influencers: AmplificationNode[];
  /** Mass audience nodes. */
  massAudience: AmplificationNode[];
  /** Total reach across the chain. */
  totalReach: number;
  /** Velocity: reach per hour. */
  velocityPerHour: number;
  /** Time from source to peak (hours). */
  timeToPeakHours: number;
  /** Bot amplification percentage (0-1). */
  botAmplificationRate: number;
}

// --- Scoring ---

/** Composite social impact score (0-100). */
export interface SocialImpactScore {
  /** Overall composite score (0-100). */
  score: number;
  /** Reach component (0-100). */
  reachScore: number;
  /** Engagement depth component (0-100). */
  engagementScore: number;
  /** Sentiment intensity component (0-100). */
  sentimentScore: number;
  /** Amplification speed component (0-100). */
  amplificationScore: number;
  /** Cross-platform spread component (0-100). */
  crossPlatformScore: number;
  /** Human-readable summary. */
  summary: string;
}

// --- Audience Overlap ---

/** Overlap analysis between two entities' audiences. */
export interface AudienceOverlap {
  /** First entity identifier. */
  entityId1: string;
  /** Second entity identifier. */
  entityId2: string;
  /** First entity name. */
  entityName1: string;
  /** Second entity name. */
  entityName2: string;
  /** Overlap coefficient (0-1, Jaccard similarity). */
  overlapCoefficient: number;
  /** Shared audience segments. */
  sharedSegments: AudienceSegment[];
  /** Segments unique to entity 1. */
  uniqueToEntity1: AudienceSegment[];
  /** Segments unique to entity 2. */
  uniqueToEntity2: AudienceSegment[];
  /** Competitive tension score (0-100). */
  competitiveTension: number;
  /** Summary of the overlap analysis. */
  summary: string;
}

// --- Dashboard ---

/** Aggregated social intelligence dashboard data. */
export interface SocialDashboard {
  /** Total tracked announcements. */
  totalAnnouncements: number;
  /** Total tracked influencers. */
  totalInfluencers: number;
  /** Total audience personas. */
  totalPersonas: number;
  /** Average social impact score across all announcements. */
  averageImpactScore: number;
  /** Most active platform. */
  mostActivePlatform: SocialPlatform;
  /** Top announcements by impact. */
  topAnnouncements: Array<{ id: string; title: string; impactScore: number }>;
  /** Top influencers by amplification. */
  topInfluencers: Array<{ id: string; name: string; amplificationScore: number }>;
  /** Platform engagement distribution. */
  platformDistribution: Record<SocialPlatform, number>;
  /** Recent engagement trend direction. */
  trendDirection: 'rising' | 'falling' | 'stable';
}
