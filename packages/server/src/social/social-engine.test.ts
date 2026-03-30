import { describe, it, expect, beforeEach } from 'vitest';
import { SocialMediaEngine } from './social-engine.js';
import type { Platform } from './types.js';

// ============================================================
// LOOM — Social Media Engine Tests
//
// Tests for the SocialMediaEngine which tracks announcements,
// analyzes engagement, segments audiences, identifies influencers,
// and builds amplification chains across platforms.
// ============================================================

/** Helper to create a valid announcement input. */
function makeAnnouncementInput(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Product Launch Announcement',
    content: 'We are excited to announce our new AI platform for SMEs.',
    platform: 'twitter' as Platform,
    author: 'official_account',
    publishedAt: '2026-03-01T10:00:00Z',
    url: 'https://twitter.com/official_account/status/123',
    metrics: {
      likes: 1500,
      shares: 320,
      comments: 85,
      views: 45000,
    },
    ...overrides,
  };
}

/** Helper to create multiple announcements across platforms. */
function seedMultiPlatformData(engine: SocialMediaEngine) {
  const platforms: Platform[] = ['twitter', 'facebook', 'instagram', 'linkedin', 'tiktok'];
  const announcements = platforms.map((platform, i) =>
    makeAnnouncementInput({
      title: `Announcement on ${platform}`,
      platform,
      author: `author_${platform}`,
      publishedAt: `2026-03-0${i + 1}T10:00:00Z`,
      url: `https://${platform}.com/post/${i}`,
      metrics: {
        likes: 1000 * (i + 1),
        shares: 200 * (i + 1),
        comments: 50 * (i + 1),
        views: 30000 * (i + 1),
      },
    })
  );
  return announcements.map((a) => engine.trackAnnouncement(a));
}

describe('SocialMediaEngine', () => {
  let engine: SocialMediaEngine;

  beforeEach(() => {
    engine = new SocialMediaEngine();
  });

  // -------------------------------------------------------------------------
  // trackAnnouncement
  // -------------------------------------------------------------------------
  describe('trackAnnouncement', () => {
    it('should create an announcement with proper fields', () => {
      const input = makeAnnouncementInput();
      const announcement = engine.trackAnnouncement(input);

      expect(announcement.id).toBeDefined();
      expect(typeof announcement.id).toBe('string');
      expect(announcement.title).toBe(input.title);
      expect(announcement.content).toBe(input.content);
      expect(announcement.platform).toBe('twitter');
      expect(announcement.author).toBe('official_account');
      expect(announcement.publishedAt).toBe(input.publishedAt);
      expect(announcement.url).toBe(input.url);
      expect(announcement.metrics).toBeDefined();
      expect(announcement.metrics.likes).toBe(1500);
      expect(announcement.metrics.shares).toBe(320);
      expect(announcement.trackedAt).toBeDefined();
    });

    it('should generate unique IDs for each announcement', () => {
      const a1 = engine.trackAnnouncement(makeAnnouncementInput());
      const a2 = engine.trackAnnouncement(makeAnnouncementInput({ title: 'Different' }));

      expect(a1.id).not.toBe(a2.id);
    });

    it('should track multiple announcements', () => {
      engine.trackAnnouncement(makeAnnouncementInput());
      engine.trackAnnouncement(makeAnnouncementInput({ title: 'Second' }));
      engine.trackAnnouncement(makeAnnouncementInput({ title: 'Third' }));

      const dashboard = engine.getDashboard();
      expect(dashboard.totalAnnouncements).toBe(3);
    });

    it('should handle announcement with zero metrics', () => {
      const announcement = engine.trackAnnouncement(
        makeAnnouncementInput({
          metrics: { likes: 0, shares: 0, comments: 0, views: 0 },
        })
      );

      expect(announcement.metrics.likes).toBe(0);
      expect(announcement.metrics.shares).toBe(0);
    });

    it('should handle announcement with very large metrics', () => {
      const announcement = engine.trackAnnouncement(
        makeAnnouncementInput({
          metrics: {
            likes: 10_000_000,
            shares: 5_000_000,
            comments: 2_000_000,
            views: 100_000_000,
          },
        })
      );

      expect(announcement.metrics.likes).toBe(10_000_000);
    });
  });

  // -------------------------------------------------------------------------
  // getEngagementPattern
  // -------------------------------------------------------------------------
  describe('getEngagementPattern', () => {
    it('should return valid engagement curves', () => {
      const tracked = engine.trackAnnouncement(makeAnnouncementInput());
      const pattern = engine.getEngagementPattern(tracked.id);

      expect(pattern).toBeDefined();
      expect(pattern.announcementId).toBe(tracked.id);
      expect(pattern.patternType).toBeDefined();
      expect(['viral', 'steady', 'spike-decay', 'slow-burn', 'flat']).toContain(
        pattern.patternType
      );
      expect(Array.isArray(pattern.curve)).toBe(true);
      expect(pattern.peakTime).toBeDefined();
      expect(typeof pattern.totalEngagement).toBe('number');
    });

    it('should return different patterns for different engagement shapes', () => {
      const viral = engine.trackAnnouncement(
        makeAnnouncementInput({
          metrics: { likes: 100_000, shares: 50_000, comments: 20_000, views: 5_000_000 },
        })
      );
      const flat = engine.trackAnnouncement(
        makeAnnouncementInput({
          title: 'Boring update',
          metrics: { likes: 10, shares: 1, comments: 0, views: 200 },
        })
      );

      const viralPattern = engine.getEngagementPattern(viral.id);
      const flatPattern = engine.getEngagementPattern(flat.id);

      expect(viralPattern.totalEngagement).toBeGreaterThan(flatPattern.totalEngagement);
    });

    it('should throw or return null for invalid announcement ID', () => {
      expect(() => engine.getEngagementPattern('non-existent-id')).toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // getAudienceSegmentation
  // -------------------------------------------------------------------------
  describe('getAudienceSegmentation', () => {
    it('should return proper segments', () => {
      seedMultiPlatformData(engine);
      const segments = engine.getAudienceSegmentation();

      expect(Array.isArray(segments)).toBe(true);
      expect(segments.length).toBeGreaterThan(0);

      for (const segment of segments) {
        expect(segment.name).toBeDefined();
        expect(typeof segment.name).toBe('string');
        expect(typeof segment.size).toBe('number');
        expect(segment.size).toBeGreaterThanOrEqual(0);
        expect(Array.isArray(segment.platforms)).toBe(true);
        expect(segment.engagementRate).toBeDefined();
        expect(typeof segment.engagementRate).toBe('number');
        expect(segment.engagementRate).toBeGreaterThanOrEqual(0);
        expect(segment.engagementRate).toBeLessThanOrEqual(1);
      }
    });

    it('should return empty segments when no data', () => {
      const segments = engine.getAudienceSegmentation();
      expect(segments).toEqual([]);
    });

    it('should segment by platform when multi-platform data exists', () => {
      seedMultiPlatformData(engine);
      const segments = engine.getAudienceSegmentation();

      const platformNames = segments.flatMap((s) => s.platforms);
      expect(platformNames.length).toBeGreaterThan(1);
    });
  });

  // -------------------------------------------------------------------------
  // identifyInfluencers
  // -------------------------------------------------------------------------
  describe('identifyInfluencers', () => {
    it('should return ranked influencer list', () => {
      seedMultiPlatformData(engine);
      const influencers = engine.identifyInfluencers();

      expect(Array.isArray(influencers)).toBe(true);
      expect(influencers.length).toBeGreaterThan(0);

      for (const inf of influencers) {
        expect(inf.handle).toBeDefined();
        expect(inf.platform).toBeDefined();
        expect(typeof inf.influenceScore).toBe('number');
        expect(inf.influenceScore).toBeGreaterThanOrEqual(0);
        expect(inf.influenceScore).toBeLessThanOrEqual(100);
        expect(typeof inf.reach).toBe('number');
      }

      // Should be sorted by influence score descending
      for (let i = 1; i < influencers.length; i++) {
        expect(influencers[i - 1].influenceScore).toBeGreaterThanOrEqual(
          influencers[i].influenceScore
        );
      }
    });

    it('should return empty list when no data', () => {
      const influencers = engine.identifyInfluencers();
      expect(influencers).toEqual([]);
    });

    it('should respect limit parameter', () => {
      seedMultiPlatformData(engine);
      const influencers = engine.identifyInfluencers({ limit: 2 });

      expect(influencers.length).toBeLessThanOrEqual(2);
    });
  });

  // -------------------------------------------------------------------------
  // analyzeCrossPlatform
  // -------------------------------------------------------------------------
  describe('analyzeCrossPlatform', () => {
    it('should compare across platforms correctly', () => {
      seedMultiPlatformData(engine);
      const comparison = engine.analyzeCrossPlatform();

      expect(comparison).toBeDefined();
      expect(Array.isArray(comparison.platforms)).toBe(true);
      expect(comparison.platforms.length).toBeGreaterThan(1);

      for (const platform of comparison.platforms) {
        expect(platform.name).toBeDefined();
        expect(typeof platform.totalEngagement).toBe('number');
        expect(typeof platform.announcementCount).toBe('number');
        expect(typeof platform.avgEngagementRate).toBe('number');
      }
    });

    it('should handle single platform data', () => {
      engine.trackAnnouncement(makeAnnouncementInput());
      const comparison = engine.analyzeCrossPlatform();

      expect(comparison.platforms.length).toBe(1);
      expect(comparison.platforms[0].name).toBe('twitter');
    });

    it('should return empty comparison when no data', () => {
      const comparison = engine.analyzeCrossPlatform();
      expect(comparison.platforms).toEqual([]);
    });

    it('should include best performing platform', () => {
      seedMultiPlatformData(engine);
      const comparison = engine.analyzeCrossPlatform();

      expect(comparison.bestPerforming).toBeDefined();
      expect(typeof comparison.bestPerforming).toBe('string');
    });
  });

  // -------------------------------------------------------------------------
  // scoreEngagementQuality
  // -------------------------------------------------------------------------
  describe('scoreEngagementQuality', () => {
    it('should differentiate bot vs real engagement', () => {
      const realPost = engine.trackAnnouncement(
        makeAnnouncementInput({
          metrics: { likes: 500, shares: 100, comments: 80, views: 10000 },
        })
      );
      const botPost = engine.trackAnnouncement(
        makeAnnouncementInput({
          title: 'Bot-heavy post',
          metrics: { likes: 50000, shares: 2, comments: 0, views: 50001 },
        })
      );

      const realScore = engine.scoreEngagementQuality(realPost.id);
      const botScore = engine.scoreEngagementQuality(botPost.id);

      expect(realScore.authenticityScore).toBeDefined();
      expect(botScore.authenticityScore).toBeDefined();
      expect(typeof realScore.authenticityScore).toBe('number');
      expect(realScore.authenticityScore).toBeGreaterThanOrEqual(0);
      expect(realScore.authenticityScore).toBeLessThanOrEqual(1);

      // Real engagement should score higher on authenticity
      expect(realScore.authenticityScore).toBeGreaterThan(botScore.authenticityScore);
    });

    it('should include quality breakdown', () => {
      const tracked = engine.trackAnnouncement(makeAnnouncementInput());
      const score = engine.scoreEngagementQuality(tracked.id);

      expect(score.commentToLikeRatio).toBeDefined();
      expect(score.shareToViewRatio).toBeDefined();
      expect(typeof score.overallQuality).toBe('number');
    });

    it('should throw for invalid announcement ID', () => {
      expect(() => engine.scoreEngagementQuality('invalid-id')).toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // buildAmplificationChain
  // -------------------------------------------------------------------------
  describe('buildAmplificationChain', () => {
    it('should build proper chains', () => {
      const tracked = engine.trackAnnouncement(makeAnnouncementInput());
      const chain = engine.buildAmplificationChain(tracked.id);

      expect(chain).toBeDefined();
      expect(chain.originId).toBe(tracked.id);
      expect(Array.isArray(chain.nodes)).toBe(true);
      expect(chain.nodes.length).toBeGreaterThanOrEqual(1);
      expect(typeof chain.totalReach).toBe('number');
      expect(chain.totalReach).toBeGreaterThanOrEqual(0);
    });

    it('should include depth information', () => {
      seedMultiPlatformData(engine);
      const dashboard = engine.getDashboard();
      if (dashboard.totalAnnouncements > 0) {
        const firstId = dashboard.recentAnnouncements[0].id;
        const chain = engine.buildAmplificationChain(firstId);

        for (const node of chain.nodes) {
          expect(typeof node.depth).toBe('number');
          expect(node.depth).toBeGreaterThanOrEqual(0);
          expect(node.handle).toBeDefined();
          expect(typeof node.reach).toBe('number');
        }
      }
    });

    it('should throw for invalid announcement ID', () => {
      expect(() => engine.buildAmplificationChain('non-existent')).toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // getAudienceOverlap
  // -------------------------------------------------------------------------
  describe('getAudienceOverlap', () => {
    it('should calculate overlap correctly between platforms', () => {
      seedMultiPlatformData(engine);
      const overlap = engine.getAudienceOverlap('twitter', 'facebook');

      expect(overlap).toBeDefined();
      expect(overlap.platformA).toBe('twitter');
      expect(overlap.platformB).toBe('facebook');
      expect(typeof overlap.overlapPercentage).toBe('number');
      expect(overlap.overlapPercentage).toBeGreaterThanOrEqual(0);
      expect(overlap.overlapPercentage).toBeLessThanOrEqual(100);
      expect(typeof overlap.uniqueToA).toBe('number');
      expect(typeof overlap.uniqueToB).toBe('number');
      expect(typeof overlap.sharedAudience).toBe('number');
    });

    it('should return zero overlap for same platform', () => {
      seedMultiPlatformData(engine);
      const overlap = engine.getAudienceOverlap('twitter', 'twitter');

      expect(overlap.overlapPercentage).toBe(100);
    });

    it('should handle platforms with no data', () => {
      const overlap = engine.getAudienceOverlap('twitter', 'facebook');

      expect(overlap.overlapPercentage).toBe(0);
      expect(overlap.sharedAudience).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // buildAudiencePersonas
  // -------------------------------------------------------------------------
  describe('buildAudiencePersonas', () => {
    it('should generate valid personas', () => {
      seedMultiPlatformData(engine);
      const personas = engine.buildAudiencePersonas();

      expect(Array.isArray(personas)).toBe(true);
      expect(personas.length).toBeGreaterThan(0);

      for (const persona of personas) {
        expect(persona.name).toBeDefined();
        expect(typeof persona.name).toBe('string');
        expect(persona.description).toBeDefined();
        expect(Array.isArray(persona.interests)).toBe(true);
        expect(persona.interests.length).toBeGreaterThan(0);
        expect(typeof persona.engagementPreference).toBe('string');
        expect(Array.isArray(persona.preferredPlatforms)).toBe(true);
        expect(typeof persona.estimatedSize).toBe('number');
        expect(persona.estimatedSize).toBeGreaterThan(0);
      }
    });

    it('should return empty personas when no data', () => {
      const personas = engine.buildAudiencePersonas();
      expect(personas).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // predictPersonaReaction
  // -------------------------------------------------------------------------
  describe('predictPersonaReaction', () => {
    it('should return reasonable predictions', () => {
      seedMultiPlatformData(engine);
      const personas = engine.buildAudiencePersonas();

      if (personas.length > 0) {
        const reaction = engine.predictPersonaReaction(personas[0].name, {
          title: 'New feature announcement',
          content: 'We just launched AI-powered analytics for small businesses.',
          platform: 'twitter',
        });

        expect(reaction).toBeDefined();
        expect(reaction.personaName).toBe(personas[0].name);
        expect(typeof reaction.likelyEngagement).toBe('string');
        expect(['high', 'medium', 'low']).toContain(reaction.likelyEngagement);
        expect(typeof reaction.sentimentPrediction).toBe('number');
        expect(reaction.sentimentPrediction).toBeGreaterThanOrEqual(-1);
        expect(reaction.sentimentPrediction).toBeLessThanOrEqual(1);
        expect(reaction.reasoning).toBeDefined();
      }
    });

    it('should throw for unknown persona', () => {
      expect(() =>
        engine.predictPersonaReaction('NonExistentPersona', {
          title: 'Test',
          content: 'Test content',
          platform: 'twitter',
        })
      ).toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // getDashboard
  // -------------------------------------------------------------------------
  describe('getDashboard', () => {
    it('should return complete dashboard data', () => {
      seedMultiPlatformData(engine);
      const dashboard = engine.getDashboard();

      expect(dashboard).toBeDefined();
      expect(typeof dashboard.totalAnnouncements).toBe('number');
      expect(dashboard.totalAnnouncements).toBeGreaterThan(0);
      expect(typeof dashboard.totalEngagement).toBe('number');
      expect(dashboard.totalEngagement).toBeGreaterThan(0);
      expect(Array.isArray(dashboard.platformBreakdown)).toBe(true);
      expect(dashboard.platformBreakdown.length).toBeGreaterThan(0);
      expect(Array.isArray(dashboard.recentAnnouncements)).toBe(true);
      expect(Array.isArray(dashboard.topInfluencers)).toBe(true);
    });

    it('should return empty dashboard when no data', () => {
      const dashboard = engine.getDashboard();

      expect(dashboard.totalAnnouncements).toBe(0);
      expect(dashboard.totalEngagement).toBe(0);
      expect(dashboard.platformBreakdown).toEqual([]);
      expect(dashboard.recentAnnouncements).toEqual([]);
    });

    it('should include time range', () => {
      seedMultiPlatformData(engine);
      const dashboard = engine.getDashboard();

      expect(dashboard.timeRange).toBeDefined();
      expect(dashboard.timeRange.from).toBeDefined();
      expect(dashboard.timeRange.to).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // loadDemoData
  // -------------------------------------------------------------------------
  describe('loadDemoData', () => {
    it('should load demo data', () => {
      const count = engine.loadDemoData();

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(5);

      const dashboard = engine.getDashboard();
      expect(dashboard.totalAnnouncements).toBe(count);
    });

    it('should load data across multiple platforms', () => {
      engine.loadDemoData();
      const comparison = engine.analyzeCrossPlatform();

      expect(comparison.platforms.length).toBeGreaterThan(1);
    });
  });

  // -------------------------------------------------------------------------
  // clear
  // -------------------------------------------------------------------------
  describe('clear', () => {
    it('should empty all data', () => {
      seedMultiPlatformData(engine);
      expect(engine.getDashboard().totalAnnouncements).toBeGreaterThan(0);

      engine.clear();

      const dashboard = engine.getDashboard();
      expect(dashboard.totalAnnouncements).toBe(0);
      expect(dashboard.totalEngagement).toBe(0);
      expect(dashboard.platformBreakdown).toEqual([]);
      expect(dashboard.recentAnnouncements).toEqual([]);
    });

    it('should allow adding new data after clear', () => {
      seedMultiPlatformData(engine);
      engine.clear();

      engine.trackAnnouncement(makeAnnouncementInput());
      expect(engine.getDashboard().totalAnnouncements).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------------
  describe('edge cases', () => {
    it('should handle announcement with missing optional fields', () => {
      const announcement = engine.trackAnnouncement({
        title: 'Minimal post',
        content: 'Just some content.',
        platform: 'twitter' as Platform,
        author: 'user',
        metrics: { likes: 0, shares: 0, comments: 0, views: 0 },
      });

      expect(announcement.id).toBeDefined();
      expect(announcement.title).toBe('Minimal post');
    });

    it('should handle rapid sequential announcements', () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const a = engine.trackAnnouncement(makeAnnouncementInput({ title: `Rapid post ${i}` }));
        ids.add(a.id);
      }

      expect(ids.size).toBe(100);
      expect(engine.getDashboard().totalAnnouncements).toBe(100);
    });

    it('should handle special characters in content', () => {
      const announcement = engine.trackAnnouncement(
        makeAnnouncementInput({
          title: 'Post with émojis 🚀 & <special> "chars"',
          content: 'Content with\nnewlines\tand\ttabs & "quotes" <html>',
        })
      );

      expect(announcement.title).toContain('émojis');
      expect(announcement.content).toContain('newlines');
    });
  });
});
