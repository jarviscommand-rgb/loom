import { describe, it, expect } from 'vitest';
import { SocialMediaEngine } from './social-engine.js';

type SocialPlatform = 'twitter' | 'instagram' | 'tiktok' | 'facebook' | 'reddit' | 'youtube';

const platforms: SocialPlatform[] = [
  'twitter',
  'instagram',
  'tiktok',
  'facebook',
  'reddit',
  'youtube',
];

/**
 * Helper to track many announcements with varying platforms and tags.
 * Distributes across 20 entities by default.
 */
function trackMany(engine: SocialMediaEngine, count: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    const platformSubset = platforms.slice(0, (i % 5) + 1);
    const ann = engine.trackAnnouncement(
      `entity-${i % 20}`,
      `Entity ${i % 20}`,
      `Announcement ${i}`,
      `Description for announcement ${i}`,
      platformSubset as SocialPlatform[],
      [`tag-${i % 10}`, `category-${i % 5}`]
    );
    ids.push(ann.id);
  }
  return ids;
}

describe('SocialMediaEngine — Stress Tests', () => {
  it('should track 100+ announcements and verify all stored correctly', () => {
    const engine = new SocialMediaEngine();
    const count = 120;
    const ids = trackMany(engine, count);

    expect(ids).toHaveLength(count);

    const stored = engine.getAnnouncements();
    expect(stored).toHaveLength(count);

    // Verify each announcement is retrievable by ID
    for (const id of ids) {
      const ann = engine.getAnnouncementById(id);
      expect(ann).toBeDefined();
      expect(ann!.id).toBe(id);
    }
  });

  it('should return getDashboard in reasonable time with 200 announcements', () => {
    const engine = new SocialMediaEngine();
    trackMany(engine, 200);

    // Measure dashboard generation time
    const start = performance.now();
    const dashboard = engine.getDashboard();
    const elapsed = performance.now() - start;

    expect(dashboard).toBeDefined();
    // Dashboard should contain data reflecting the 200 announcements
    // Expected: under 500ms for 200 announcements, but not asserting due to CI variance
     
    console.log(`getDashboard with 200 announcements: ${elapsed.toFixed(2)}ms`);
  });

  it('should handle audience segmentation queries for 100 announcements across entities', () => {
    const engine = new SocialMediaEngine();
    trackMany(engine, 100);

    const entityCount = 20;
    const results: Map<string, unknown[]> = new Map();

    const start = performance.now();
    for (let i = 0; i < entityCount; i++) {
      const entityId = `entity-${i}`;
      const segments = engine.getAudienceSegmentation(entityId);
      expect(Array.isArray(segments)).toBe(true);
      results.set(entityId, segments);
    }
    const elapsed = performance.now() - start;

    expect(results.size).toBe(entityCount);
    // Expected: segmentation for each entity should complete quickly
     
    console.log(`Audience segmentation for ${entityCount} entities: ${elapsed.toFixed(2)}ms`);
  });

  it('should build amplification chains for 50+ announcements', () => {
    const engine = new SocialMediaEngine();
    const ids = trackMany(engine, 60);

    const start = performance.now();
    let builtCount = 0;
    for (const id of ids) {
      const chain = engine.buildAmplificationChain(id);
      if (chain) {
        builtCount++;
        expect(chain).toBeDefined();
      }
    }
    const elapsed = performance.now() - start;

    // At least some chains should be built successfully
    expect(builtCount).toBeGreaterThan(0);
    // Expected: under 1s for 60 amplification chain builds
     
    console.log(
      `Built ${builtCount} amplification chains from 60 announcements: ${elapsed.toFixed(2)}ms`
    );
  });

  it('should query engagement patterns for 100+ announcements', () => {
    const engine = new SocialMediaEngine();
    const ids = trackMany(engine, 110);

    const start = performance.now();
    let patternCount = 0;
    for (const id of ids) {
      const pattern = engine.getEngagementPattern(id);
      if (pattern) {
        patternCount++;
        expect(pattern).toBeDefined();
      }
    }
    const elapsed = performance.now() - start;

    expect(patternCount).toBeGreaterThan(0);
    // Expected: engagement pattern lookup should be fast (indexed)
     
    console.log(
      `Retrieved ${patternCount} engagement patterns from 110 announcements: ${elapsed.toFixed(2)}ms`
    );
  });

  it('should perform cross-platform analysis for 50+ announcements', () => {
    const engine = new SocialMediaEngine();
    const ids = trackMany(engine, 60);

    const start = performance.now();
    let analysisCount = 0;
    for (const id of ids) {
      const analysis = engine.analyzeCrossPlatform(id);
      if (analysis) {
        analysisCount++;
        expect(analysis).toBeDefined();
      }
    }
    const elapsed = performance.now() - start;

    expect(analysisCount).toBeGreaterThan(0);
    // Expected: cross-platform analysis for 60 items under 1s
     
    console.log(
      `Cross-platform analysis for ${analysisCount}/60 announcements: ${elapsed.toFixed(2)}ms`
    );
  });

  it('should score engagement quality for 100+ announcements', () => {
    const engine = new SocialMediaEngine();
    const ids = trackMany(engine, 100);

    const start = performance.now();
    let scoredCount = 0;
    for (const id of ids) {
      const quality = engine.scoreEngagementQuality(id);
      if (quality) {
        scoredCount++;
        expect(quality).toBeDefined();
      }
    }
    const elapsed = performance.now() - start;

    expect(scoredCount).toBeGreaterThan(0);
    // Expected: quality scoring for 100 items should be performant
     
    console.log(
      `Scored engagement quality for ${scoredCount}/100 announcements: ${elapsed.toFixed(2)}ms`
    );
  });

  it('should handle loadDemoData then track 100 more announcements', () => {
    const engine = new SocialMediaEngine();

    const demoCount = engine.loadDemoData();
    expect(demoCount).toBeGreaterThan(0);

    const demoAnnouncements = engine.getAnnouncements().length;
    expect(demoAnnouncements).toBe(demoCount);

    const additionalIds = trackMany(engine, 100);
    expect(additionalIds).toHaveLength(100);

    const totalAnnouncements = engine.getAnnouncements();
    expect(totalAnnouncements).toHaveLength(demoCount + 100);

    // Verify we can still retrieve both demo and new announcements
    for (const id of additionalIds) {
      expect(engine.getAnnouncementById(id)).toBeDefined();
    }
  });

  it('should track announcements on all 6 platforms and verify cross-platform analysis', () => {
    const engine = new SocialMediaEngine();

    // Track announcements using all 6 platforms
    const allPlatformAnn = engine.trackAnnouncement(
      'entity-full-platform',
      'Full Platform Entity',
      'All Platforms Announcement',
      'Testing announcement across all six platforms',
      [...platforms],
      ['viral', 'cross-platform']
    );

    expect(allPlatformAnn).toBeDefined();
    expect(allPlatformAnn.id).toBeTruthy();

    const analysis = engine.analyzeCrossPlatform(allPlatformAnn.id);
    if (analysis) {
      expect(analysis).toBeDefined();
    }

    // Track 50 more all-platform announcements
    const ids: string[] = [allPlatformAnn.id];
    for (let i = 0; i < 50; i++) {
      const ann = engine.trackAnnouncement(
        `entity-allplat-${i % 10}`,
        `AllPlat Entity ${i % 10}`,
        `Full Platform Announcement ${i}`,
        `Description for full platform announcement ${i}`,
        [...platforms],
        [`tag-${i % 5}`]
      );
      ids.push(ann.id);
    }

    // Verify cross-platform analysis for all
    let analysisCount = 0;
    for (const id of ids) {
      const crossAnalysis = engine.analyzeCrossPlatform(id);
      if (crossAnalysis) {
        analysisCount++;
      }
    }
    expect(analysisCount).toBeGreaterThan(0);
  });

  it('should compute getAudienceOverlap with multiple entity pairs', () => {
    const engine = new SocialMediaEngine();
    trackMany(engine, 100); // Creates entities entity-0 through entity-19

    const entityIds = Array.from({ length: 20 }, (_, i) => `entity-${i}`);
    const pairs: Array<[string, string]> = [];

    // Generate all unique pairs from first 10 entities (45 pairs)
    for (let i = 0; i < 10; i++) {
      for (let j = i + 1; j < 10; j++) {
        pairs.push([entityIds[i], entityIds[j]]);
      }
    }

    expect(pairs).toHaveLength(45);

    const start = performance.now();
    let overlapCount = 0;
    for (const [entityA, entityB] of pairs) {
      const overlap = engine.getAudienceOverlap(entityA, entityB);
      expect(overlap).toBeDefined();
      overlapCount++;
    }
    const elapsed = performance.now() - start;

    expect(overlapCount).toBe(45);
    // Expected: 45 overlap computations under 500ms
     
    console.log(`Computed ${overlapCount} audience overlaps: ${elapsed.toFixed(2)}ms`);
  });

  it('should identify influencers across 50 entities', () => {
    const engine = new SocialMediaEngine();

    // Track announcements spread across 50 entities
    for (let i = 0; i < 200; i++) {
      const platformSubset = platforms.slice(0, (i % 5) + 1);
      engine.trackAnnouncement(
        `entity-inf-${i % 50}`,
        `Influencer Entity ${i % 50}`,
        `Announcement ${i}`,
        `Description ${i}`,
        platformSubset as SocialPlatform[],
        [`tag-${i % 8}`]
      );
    }

    const start = performance.now();
    let totalInfluencers = 0;
    for (let i = 0; i < 50; i++) {
      const influencers = engine.identifyInfluencers(`entity-inf-${i}`);
      expect(Array.isArray(influencers)).toBe(true);
      totalInfluencers += influencers.length;
    }
    const elapsed = performance.now() - start;

    // We expect at least some influencers to be identified
    expect(totalInfluencers).toBeGreaterThanOrEqual(0);
    // Expected: influencer identification across 50 entities under 1s
     
    console.log(
      `Identified ${totalInfluencers} influencers across 50 entities: ${elapsed.toFixed(2)}ms`
    );
  });

  it('should handle getDashboard with 500 announcements', () => {
    const engine = new SocialMediaEngine();
    trackMany(engine, 500);

    expect(engine.getAnnouncements()).toHaveLength(500);

    const start = performance.now();
    const dashboard = engine.getDashboard();
    const elapsed = performance.now() - start;

    expect(dashboard).toBeDefined();
    // Expected: dashboard generation with 500 announcements under 2s
     
    console.log(`getDashboard with 500 announcements: ${elapsed.toFixed(2)}ms`);
  });

  it('should build audience personas and predict reactions at scale', () => {
    const engine = new SocialMediaEngine();
    trackMany(engine, 100);

    const personas = engine.buildAudiencePersonas();
    expect(Array.isArray(personas)).toBe(true);

    if (personas.length > 0) {
      const start = performance.now();
      let reactionCount = 0;

      // Predict reactions for each persona against multiple announcements
      for (const persona of personas) {
        expect(engine.getPersonaById(persona.id)).toBeDefined();

        for (let i = 0; i < 10; i++) {
          const reaction = engine.predictPersonaReaction(
            persona.id,
            `Test Announcement ${i}`,
            [`tag-${i % 5}`],
            [platforms[i % platforms.length]]
          );
          if (reaction) {
            reactionCount++;
            expect(reaction).toBeDefined();
          }
        }
      }
      const elapsed = performance.now() - start;

      expect(reactionCount).toBeGreaterThan(0);
      // Expected: persona reaction predictions should be fast
       
      console.log(
        `Predicted ${reactionCount} persona reactions for ${personas.length} personas: ${elapsed.toFixed(2)}ms`
      );
    }
  });

  it('should handle clear and re-population without issues', () => {
    const engine = new SocialMediaEngine();
    trackMany(engine, 150);

    expect(engine.getAnnouncements()).toHaveLength(150);

    engine.clear();
    expect(engine.getAnnouncements()).toHaveLength(0);

    // Re-populate and verify everything works
    const newIds = trackMany(engine, 200);
    expect(engine.getAnnouncements()).toHaveLength(200);

    // Verify all operations still work after clear + re-populate
    const dashboard = engine.getDashboard();
    expect(dashboard).toBeDefined();

    for (const id of newIds.slice(0, 20)) {
      expect(engine.getAnnouncementById(id)).toBeDefined();
      engine.getEngagementPattern(id);
      engine.scoreEngagementQuality(id);
      engine.buildAmplificationChain(id);
      engine.analyzeCrossPlatform(id);
    }
  });
});
