// ============================================================
// LOOM — Amplification Tracker
//
// Tracks how messages spread from source through influencers
// to mass audience. Detects bot amplification patterns.
// ============================================================

import type {
  AmplificationChain,
  AmplificationNode,
  InfluencerProfile,
  EngagementMetrics,
  SocialPlatform,
} from '../types.js';

// ============================================================
// Chain Building
// ============================================================

/**
 * Build an amplification chain showing how a message spread
 * from its source through influencers to mass audience.
 *
 * @param source - The originating node
 * @param influencers - Influencer profiles that amplified the message
 * @param engagementData - Engagement metrics over time
 * @returns Complete amplification chain
 */
export function buildAmplificationChain(
  source: AmplificationNode,
  influencers: InfluencerProfile[],
  engagementData: EngagementMetrics[]
): AmplificationChain {
  // Convert influencers to chain nodes with estimated timing
  const baseTime = new Date(source.amplifiedAt).getTime();

  const influencerNodes: AmplificationNode[] = influencers
    .sort((a, b) => b.amplificationScore - a.amplificationScore)
    .map((inf, idx) => ({
      nodeId: inf.id,
      name: inf.name,
      nodeType: 'influencer' as const,
      platform: inf.platform,
      audienceSize: inf.followerCount,
      amplifiedAt: new Date(baseTime + (idx + 1) * 3600000 * (0.5 + Math.random())).toISOString(),
      engagement: Math.round(inf.followerCount * inf.engagementRate),
    }));

  // Build mass audience nodes from engagement data
  const massNodes = buildMassAudienceNodes(engagementData, baseTime);

  // Calculate total reach
  const influencerReach = influencerNodes.reduce((sum, n) => sum + n.audienceSize, 0);
  const massReach = massNodes.reduce((sum, n) => sum + n.audienceSize, 0);
  const totalReach = source.audienceSize + influencerReach + massReach;

  // Calculate velocity
  const timeSpanHours = calculateTimeSpanHours(source.amplifiedAt, influencerNodes, massNodes);
  const velocityPerHour = timeSpanHours > 0 ? Math.round(totalReach / timeSpanHours) : totalReach;

  // Estimate time to peak
  const timeToPeakHours = estimateTimeToPeak(engagementData);

  // Detect bot amplification
  const botRate = detectBotAmplification({
    source,
    influencers: influencerNodes,
    massAudience: massNodes,
    totalReach,
    velocityPerHour,
    timeToPeakHours,
    botAmplificationRate: 0,
  });

  return {
    source,
    influencers: influencerNodes,
    massAudience: massNodes,
    totalReach,
    velocityPerHour,
    timeToPeakHours,
    botAmplificationRate: botRate,
  };
}

// ============================================================
// Key Amplifier Identification
// ============================================================

/**
 * Identify the most critical amplifiers in a chain.
 * Ranks nodes by their contribution to total reach.
 *
 * @param amplificationChain - The amplification chain to analyze
 * @returns Top amplifier nodes sorted by impact
 */
export function identifyKeyAmplifiers(amplificationChain: AmplificationChain): AmplificationNode[] {
  const allNodes = [
    amplificationChain.source,
    ...amplificationChain.influencers,
    ...amplificationChain.massAudience,
  ];

  // Score by audience size * engagement ratio
  return allNodes
    .map((node) => ({
      ...node,
      _score: node.audienceSize * (node.engagement / Math.max(node.audienceSize, 1)),
    }))
    .sort((a, b) => b._score - a._score)
    .map(({ _score: _, ...node }) => node)
    .slice(0, 10);
}

// ============================================================
// Amplification Velocity
// ============================================================

/**
 * Calculate how fast a message spreads through the chain.
 *
 * @param amplificationChain - The amplification chain to analyze
 * @returns Velocity metrics
 */
export function calculateAmplificationVelocity(amplificationChain: AmplificationChain): {
  reachPerHour: number;
  peakVelocity: number;
  accelerationPhase: string;
} {
  const { totalReach, timeToPeakHours, velocityPerHour } = amplificationChain;

  // Estimate peak velocity (typically 3-5x average during peak)
  const peakVelocity = Math.round(velocityPerHour * 3.5);

  // Classify acceleration phase
  let accelerationPhase: string;
  if (timeToPeakHours < 4) {
    accelerationPhase = 'explosive';
  } else if (timeToPeakHours < 12) {
    accelerationPhase = 'rapid';
  } else if (timeToPeakHours < 24) {
    accelerationPhase = 'moderate';
  } else {
    accelerationPhase = 'gradual';
  }

  return {
    reachPerHour: Math.round(totalReach / Math.max(timeToPeakHours, 1)),
    peakVelocity,
    accelerationPhase,
  };
}

// ============================================================
// Bot Detection
// ============================================================

/**
 * Detect bot amplification patterns in an amplification chain.
 * Uses heuristics based on timing patterns, engagement ratios,
 * and velocity anomalies.
 *
 * @param amplificationChain - The chain to analyze
 * @returns Estimated bot amplification rate (0-1)
 */
export function detectBotAmplification(amplificationChain: AmplificationChain): number {
  let botScore = 0;
  const { influencers, velocityPerHour, totalReach } = amplificationChain;

  // Heuristic 1: Suspiciously uniform timing between amplifiers
  if (influencers.length >= 3) {
    const timestamps = influencers
      .map((n) => new Date(n.amplifiedAt).getTime())
      .sort((a, b) => a - b);

    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance =
        intervals.reduce((sum, v) => sum + (v - avgInterval) ** 2, 0) / intervals.length;
      const cv = avgInterval > 0 ? Math.sqrt(variance) / avgInterval : 0;

      // Very uniform intervals suggest coordination/automation
      if (cv < 0.2) botScore += 0.3;
      else if (cv < 0.4) botScore += 0.15;
    }
  }

  // Heuristic 2: Extremely high velocity relative to reach
  const normalizedVelocity = totalReach > 0 ? velocityPerHour / totalReach : 0;
  if (normalizedVelocity > 0.5) botScore += 0.25;
  else if (normalizedVelocity > 0.3) botScore += 0.1;

  // Heuristic 3: Low engagement-to-audience ratio across influencers
  if (influencers.length > 0) {
    const avgEngagementRate =
      influencers.reduce((sum, n) => sum + n.engagement / Math.max(n.audienceSize, 1), 0) /
      influencers.length;

    if (avgEngagementRate < 0.001) botScore += 0.2;
    else if (avgEngagementRate < 0.005) botScore += 0.1;
  }

  // Heuristic 4: Too many amplifiers too quickly
  if (influencers.length > 5) {
    const firstTime = new Date(influencers[0].amplifiedAt).getTime();
    const lastTime = new Date(influencers[influencers.length - 1].amplifiedAt).getTime();
    const hoursSpan = (lastTime - firstTime) / 3600000;

    if (hoursSpan > 0 && influencers.length / hoursSpan > 10) {
      botScore += 0.15;
    }
  }

  return Math.min(botScore, 1);
}

// ============================================================
// Internal helpers
// ============================================================

/** Build mass audience nodes from engagement metrics. */
function buildMassAudienceNodes(
  engagementData: EngagementMetrics[],
  baseTimeMs: number
): AmplificationNode[] {
  // Group by platform
  const platformMap = new Map<SocialPlatform, EngagementMetrics[]>();
  for (const data of engagementData) {
    const existing = platformMap.get(data.platform) ?? [];
    existing.push(data);
    platformMap.set(data.platform, existing);
  }

  const nodes: AmplificationNode[] = [];
  for (const [platform, platformData] of platformMap) {
    const totalViews = platformData.reduce((sum, d) => sum + d.views, 0);
    const totalEngagement = platformData.reduce(
      (sum, d) => sum + d.likes + d.shares + d.comments,
      0
    );

    nodes.push({
      nodeId: `mass-${platform}`,
      name: `${platform} mass audience`,
      nodeType: 'mass-audience',
      platform,
      audienceSize: totalViews,
      amplifiedAt: new Date(baseTimeMs + 6 * 3600000).toISOString(),
      engagement: totalEngagement,
    });
  }

  return nodes;
}

/** Calculate time span in hours across all chain nodes. */
function calculateTimeSpanHours(
  sourceTime: string,
  influencers: AmplificationNode[],
  massAudience: AmplificationNode[]
): number {
  const allTimes = [
    new Date(sourceTime).getTime(),
    ...influencers.map((n) => new Date(n.amplifiedAt).getTime()),
    ...massAudience.map((n) => new Date(n.amplifiedAt).getTime()),
  ];

  const minTime = Math.min(...allTimes);
  const maxTime = Math.max(...allTimes);

  return Math.max((maxTime - minTime) / 3600000, 1);
}

/** Estimate time to peak engagement in hours. */
function estimateTimeToPeak(engagementData: EngagementMetrics[]): number {
  if (engagementData.length < 2) return 6;

  const totals = engagementData.map((d) => ({
    total: d.likes + d.shares + d.comments + d.views,
    time: d.timestamp,
  }));

  const peakEntry = totals.reduce((max, entry) => (entry.total > max.total ? entry : max));

  const firstTime = new Date(totals[0].time).getTime();
  const peakTime = new Date(peakEntry.time).getTime();

  return Math.max((peakTime - firstTime) / 3600000, 1);
}
