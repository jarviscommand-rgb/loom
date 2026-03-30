import { describe, it, expect, beforeEach } from 'vitest';
import { SocialMediaEngine } from './social-engine.js';

// ============================================================
// LOOM — Social Media Engine Tests
// ============================================================

describe('SocialMediaEngine', () => {
  let engine: SocialMediaEngine;

  beforeEach(() => {
    engine = new SocialMediaEngine();
  });

  describe('trackAnnouncement', () => {
    it('should create an announcement with proper fields', () => {
      const announcement = engine.trackAnnouncement(
        'entity-test',
        'Test Entity',
        'Test Announcement',
        'Description here',
        ['twitter', 'instagram'],
        ['politics']
      );

      expect(announcement.id).toBeDefined();
      expect(typeof announcement.id).toBe('string');
      expect(announcement.title).toBe('Test Announcement');
      expect(announcement.entityId).toBe('entity-test');
      expect(announcement.entityName).toBe('Test Entity');
      expect(announcement.platforms).toEqual(['twitter', 'instagram']);
      expect(announcement.platformResponses.length).toBe(2);
      expect(announcement.engagementPattern).toBeDefined();
      expect(announcement.impactScore).toBeDefined();
      expect(announcement.amplificationChain).toBeDefined();
    });

    it('should generate unique IDs', () => {
      const a1 = engine.trackAnnouncement('e1', 'E1', 'First', 'Desc', ['twitter']);
      const a2 = engine.trackAnnouncement('e2', 'E2', 'Second', 'Desc', ['twitter']);

      expect(a1.id).not.toBe(a2.id);
    });

    it('should track multiple announcements', () => {
      engine.trackAnnouncement('e1', 'E1', 'First', 'Desc', ['twitter']);
      engine.trackAnnouncement('e2', 'E2', 'Second', 'Desc', ['instagram']);
      engine.trackAnnouncement('e3', 'E3', 'Third', 'Desc', ['tiktok']);

      expect(engine.getAnnouncements().length).toBe(3);
    });
  });

  describe('getEngagementPattern', () => {
    it('should return engagement pattern for valid announcement', () => {
      const tracked = engine.trackAnnouncement('e1', 'E1', 'Test', 'Desc', ['twitter']);
      const pattern = engine.getEngagementPattern(tracked.id);

      expect(pattern).toBeDefined();
      expect(pattern!.type).toBeDefined();
      expect(typeof pattern!.confidence).toBe('number');
    });

    it('should return undefined for invalid ID', () => {
      const pattern = engine.getEngagementPattern('non-existent');
      expect(pattern).toBeUndefined();
    });
  });

  describe('getAudienceSegmentation', () => {
    it('should return segments after loading demo data', () => {
      engine.loadDemoData();
      const segments = engine.getAudienceSegmentation('entity-prabowo');

      expect(Array.isArray(segments)).toBe(true);
      expect(segments.length).toBeGreaterThan(0);

      for (const segment of segments) {
        expect(segment.name).toBeDefined();
        expect(typeof segment.estimatedSize).toBe('number');
        expect(typeof segment.engagementRate).toBe('number');
      }
    });

    it('should return all segments for unknown entity', () => {
      engine.loadDemoData();
      const segments = engine.getAudienceSegmentation('unknown-entity');

      expect(segments.length).toBeGreaterThan(0);
    });
  });

  describe('identifyInfluencers', () => {
    it('should return ranked influencers after loading demo data', () => {
      engine.loadDemoData();
      const influencers = engine.identifyInfluencers('entity-prabowo');

      expect(Array.isArray(influencers)).toBe(true);
      expect(influencers.length).toBeGreaterThan(0);

      // Should be sorted by amplification score descending
      for (let i = 1; i < influencers.length; i++) {
        expect(influencers[i - 1].amplificationScore).toBeGreaterThanOrEqual(
          influencers[i].amplificationScore
        );
      }
    });

    it('should return all influencers for unknown entity', () => {
      engine.loadDemoData();
      const influencers = engine.identifyInfluencers('unknown-entity');

      expect(influencers.length).toBeGreaterThan(0);
    });
  });

  describe('analyzeCrossPlatform', () => {
    it('should return cross-platform analysis for valid event', () => {
      engine.loadDemoData();
      const announcements = engine.getAnnouncements();
      const analysis = engine.analyzeCrossPlatform(announcements[0].id);

      expect(analysis).toBeDefined();
      expect(analysis!.eventId).toBe(announcements[0].id);
      expect(analysis!.dominantPlatform).toBeDefined();
      expect(typeof analysis!.sentimentDivergence).toBe('number');
      expect(Array.isArray(analysis!.engagementRanking)).toBe(true);
      expect(typeof analysis!.summary).toBe('string');
    });

    it('should return undefined for invalid ID', () => {
      const analysis = engine.analyzeCrossPlatform('non-existent');
      expect(analysis).toBeUndefined();
    });
  });

  describe('scoreEngagementQuality', () => {
    it('should return quality score for valid announcement', () => {
      engine.loadDemoData();
      const announcements = engine.getAnnouncements();
      const quality = engine.scoreEngagementQuality(announcements[0].id);

      expect(quality).toBeDefined();
      expect(typeof quality!.botScore).toBe('number');
      expect(typeof quality!.realScore).toBe('number');
      expect(typeof quality!.qualityScore).toBe('number');
      expect(quality!.stanceBreakdown).toBeDefined();
    });

    it('should return undefined for invalid ID', () => {
      const quality = engine.scoreEngagementQuality('non-existent');
      expect(quality).toBeUndefined();
    });
  });

  describe('buildAmplificationChain', () => {
    it('should return chain for valid announcement', () => {
      engine.loadDemoData();
      const announcements = engine.getAnnouncements();
      const chain = engine.buildAmplificationChain(announcements[0].id);

      expect(chain).toBeDefined();
      expect(chain!.source).toBeDefined();
      expect(typeof chain!.totalReach).toBe('number');
      expect(typeof chain!.velocityPerHour).toBe('number');
    });

    it('should return undefined for invalid ID', () => {
      const chain = engine.buildAmplificationChain('non-existent');
      expect(chain).toBeUndefined();
    });
  });

  describe('getAudienceOverlap', () => {
    it('should calculate overlap between entities', () => {
      engine.loadDemoData();
      const overlap = engine.getAudienceOverlap('entity-prabowo', 'entity-ikn');

      expect(overlap).toBeDefined();
      expect(overlap.entityId1).toBe('entity-prabowo');
      expect(overlap.entityId2).toBe('entity-ikn');
      expect(typeof overlap.overlapCoefficient).toBe('number');
      expect(overlap.overlapCoefficient).toBeGreaterThanOrEqual(0);
      expect(overlap.overlapCoefficient).toBeLessThanOrEqual(1);
      expect(typeof overlap.summary).toBe('string');
    });
  });

  describe('buildAudiencePersonas', () => {
    it('should return personas after loading demo data', () => {
      engine.loadDemoData();
      const personas = engine.buildAudiencePersonas();

      expect(Array.isArray(personas)).toBe(true);
      expect(personas.length).toBeGreaterThanOrEqual(5);

      for (const persona of personas) {
        expect(persona.name).toBeDefined();
        expect(persona.description).toBeDefined();
        expect(Array.isArray(persona.interests)).toBe(true);
        expect(Array.isArray(persona.platforms)).toBe(true);
      }
    });

    it('should return empty when no data loaded', () => {
      const personas = engine.buildAudiencePersonas();
      expect(personas).toEqual([]);
    });
  });

  describe('predictPersonaReaction', () => {
    it('should return prediction for valid persona', () => {
      engine.loadDemoData();
      const personas = engine.buildAudiencePersonas();

      const reaction = engine.predictPersonaReaction(
        personas[0].id,
        'Government announces new economic growth program',
        ['economics', 'growth'],
        ['twitter']
      );

      expect(reaction).toBeDefined();
      expect(reaction!.personaName).toBe(personas[0].name);
      expect(typeof reaction!.sentimentScore).toBe('number');
      expect(typeof reaction!.engagementLikelihood).toBe('number');
      expect(typeof reaction!.summary).toBe('string');
    });

    it('should return undefined for unknown persona', () => {
      engine.loadDemoData();
      const reaction = engine.predictPersonaReaction('non-existent', 'Test', [], []);

      expect(reaction).toBeUndefined();
    });
  });

  describe('getDashboard', () => {
    it('should return complete dashboard after loading data', () => {
      engine.loadDemoData();
      const dashboard = engine.getDashboard();

      expect(typeof dashboard.totalAnnouncements).toBe('number');
      expect(dashboard.totalAnnouncements).toBeGreaterThan(0);
      expect(typeof dashboard.totalInfluencers).toBe('number');
      expect(dashboard.totalInfluencers).toBeGreaterThan(0);
      expect(typeof dashboard.totalPersonas).toBe('number');
      expect(typeof dashboard.averageImpactScore).toBe('number');
      expect(dashboard.mostActivePlatform).toBeDefined();
      expect(Array.isArray(dashboard.topAnnouncements)).toBe(true);
      expect(Array.isArray(dashboard.topInfluencers)).toBe(true);
    });

    it('should return empty dashboard when no data', () => {
      const dashboard = engine.getDashboard();

      expect(dashboard.totalAnnouncements).toBe(0);
      expect(dashboard.totalInfluencers).toBe(0);
      expect(dashboard.totalPersonas).toBe(0);
    });
  });

  describe('loadDemoData', () => {
    it('should load demo data successfully', () => {
      const count = engine.loadDemoData();

      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(5);
      expect(engine.getAnnouncements().length).toBe(count);
      expect(engine.getInfluencers().length).toBeGreaterThan(0);
      expect(engine.buildAudiencePersonas().length).toBeGreaterThan(0);
    });
  });

  describe('clear', () => {
    it('should empty all data', () => {
      engine.loadDemoData();
      expect(engine.getAnnouncements().length).toBeGreaterThan(0);

      engine.clear();

      expect(engine.getAnnouncements().length).toBe(0);
      expect(engine.getInfluencers().length).toBe(0);
      expect(engine.buildAudiencePersonas().length).toBe(0);
    });

    it('should allow adding new data after clear', () => {
      engine.loadDemoData();
      engine.clear();

      engine.trackAnnouncement('e1', 'E1', 'New', 'Desc', ['twitter']);
      expect(engine.getAnnouncements().length).toBe(1);
    });
  });
});
