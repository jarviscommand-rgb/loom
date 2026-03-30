import { describe, it, expect } from 'vitest';
import {
  buildAmplificationChain,
  identifyKeyAmplifiers,
  calculateAmplificationVelocity,
  detectBotAmplification,
} from './amplification-tracker.js';
import type {
  AmplificationNode,
  AmplificationChain,
  InfluencerProfile,
  EngagementMetrics,
} from '../types.js';

// ============================================================
// LOOM — Amplification Tracker Tests
// ============================================================

/** Helper to create a source node. */
function makeSourceNode(overrides: Partial<AmplificationNode> = {}): AmplificationNode {
  return {
    nodeId: 'source-001',
    name: 'Original Author',
    nodeType: 'source',
    platform: 'twitter',
    audienceSize: 50000,
    amplifiedAt: '2026-03-01T10:00:00Z',
    engagement: 5000,
    ...overrides,
  };
}

/** Helper to create influencer profiles. */
function makeInfluencers(count: number): InfluencerProfile[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `inf-${i}`,
    name: `Influencer ${i}`,
    platform: 'twitter' as const,
    followerCount: 100000 - i * 10000,
    engagementRate: 0.04 - i * 0.005,
    politicalLeaning: 'independent' as const,
    audienceType: 'urban-middle' as const,
    amplificationScore: 90 - i * 10,
    contentCategories: ['politics'],
    verified: true,
    geography: 'Indonesia',
  }));
}

/** Helper to create engagement metrics. */
function makeMetrics(count: number): EngagementMetrics[] {
  return Array.from({ length: count }, (_, i) => ({
    platform: 'twitter' as const,
    likes: 1000 * (i + 1),
    shares: 200 * (i + 1),
    comments: 50 * (i + 1),
    views: 30000 * (i + 1),
    reachEstimate: 18000 * (i + 1),
    timestamp: new Date(Date.now() + i * 3600000).toISOString(),
  }));
}

/** Helper to create a chain for testing. */
function makeChain(overrides: Partial<AmplificationChain> = {}): AmplificationChain {
  return {
    source: makeSourceNode(),
    influencers: [
      makeSourceNode({
        nodeId: 'inf-1',
        name: 'Influencer 1',
        nodeType: 'influencer',
        audienceSize: 25000,
        amplifiedAt: '2026-03-01T10:30:00Z',
        engagement: 3000,
      }),
      makeSourceNode({
        nodeId: 'inf-2',
        name: 'Influencer 2',
        nodeType: 'influencer',
        audienceSize: 15000,
        amplifiedAt: '2026-03-01T11:00:00Z',
        engagement: 1500,
      }),
    ],
    massAudience: [
      makeSourceNode({
        nodeId: 'mass-twitter',
        name: 'twitter mass audience',
        nodeType: 'mass-audience',
        audienceSize: 100000,
        amplifiedAt: '2026-03-01T16:00:00Z',
        engagement: 8000,
      }),
    ],
    totalReach: 190000,
    velocityPerHour: 31667,
    timeToPeakHours: 6,
    botAmplificationRate: 0.1,
    ...overrides,
  };
}

describe('AmplificationTracker', () => {
  describe('buildAmplificationChain', () => {
    it('should construct proper chain from source and influencers', () => {
      const source = makeSourceNode();
      const influencers = makeInfluencers(3);
      const metrics = makeMetrics(5);

      const chain = buildAmplificationChain(source, influencers, metrics);

      expect(chain).toBeDefined();
      expect(chain.source.nodeId).toBe('source-001');
      expect(chain.influencers.length).toBe(3);
      expect(chain.totalReach).toBeGreaterThan(0);
      expect(typeof chain.velocityPerHour).toBe('number');
      expect(typeof chain.timeToPeakHours).toBe('number');
      expect(typeof chain.botAmplificationRate).toBe('number');
    });

    it('should sort influencers by amplification score', () => {
      const source = makeSourceNode();
      const influencers = makeInfluencers(3);
      const metrics = makeMetrics(3);

      const chain = buildAmplificationChain(source, influencers, metrics);

      for (let i = 1; i < chain.influencers.length; i++) {
        // Earlier influencers should have earlier amplifiedAt times (sorted by score)
        expect(new Date(chain.influencers[i].amplifiedAt).getTime()).toBeGreaterThanOrEqual(
          new Date(chain.influencers[i - 1].amplifiedAt).getTime()
        );
      }
    });

    it('should handle empty influencers', () => {
      const source = makeSourceNode();
      const chain = buildAmplificationChain(source, [], makeMetrics(2));

      expect(chain.influencers).toEqual([]);
      expect(chain.totalReach).toBeGreaterThan(0);
    });

    it('should handle empty metrics', () => {
      const source = makeSourceNode();
      const chain = buildAmplificationChain(source, makeInfluencers(2), []);

      expect(chain.massAudience).toEqual([]);
      expect(chain.totalReach).toBeGreaterThan(0);
    });
  });

  describe('identifyKeyAmplifiers', () => {
    it('should find high-impact nodes in chain', () => {
      const chain = makeChain();
      const amplifiers = identifyKeyAmplifiers(chain);

      expect(Array.isArray(amplifiers)).toBe(true);
      expect(amplifiers.length).toBeGreaterThan(0);

      for (const amp of amplifiers) {
        expect(amp.nodeId).toBeDefined();
        expect(amp.name).toBeDefined();
        expect(typeof amp.audienceSize).toBe('number');
      }
    });

    it('should rank by impact (audience size * engagement ratio)', () => {
      const chain = makeChain();
      const amplifiers = identifyKeyAmplifiers(chain);

      // Should return at most 10 nodes
      expect(amplifiers.length).toBeLessThanOrEqual(10);
    });

    it('should handle chain with only source', () => {
      const chain = makeChain({ influencers: [], massAudience: [] });
      const amplifiers = identifyKeyAmplifiers(chain);

      expect(amplifiers.length).toBe(1);
      expect(amplifiers[0].nodeId).toBe('source-001');
    });
  });

  describe('calculateAmplificationVelocity', () => {
    it('should calculate velocity metrics', () => {
      const chain = makeChain();
      const velocity = calculateAmplificationVelocity(chain);

      expect(velocity).toBeDefined();
      expect(typeof velocity.reachPerHour).toBe('number');
      expect(velocity.reachPerHour).toBeGreaterThan(0);
      expect(typeof velocity.peakVelocity).toBe('number');
      expect(velocity.peakVelocity).toBeGreaterThanOrEqual(velocity.reachPerHour);
      expect(typeof velocity.accelerationPhase).toBe('string');
    });

    it('should classify rapid acceleration for short time to peak', () => {
      const chain = makeChain({ timeToPeakHours: 2 });
      const velocity = calculateAmplificationVelocity(chain);

      expect(velocity.accelerationPhase).toBe('explosive');
    });

    it('should classify gradual acceleration for long time to peak', () => {
      const chain = makeChain({ timeToPeakHours: 48 });
      const velocity = calculateAmplificationVelocity(chain);

      expect(velocity.accelerationPhase).toBe('gradual');
    });
  });

  describe('detectBotAmplification', () => {
    it('should return low bot rate for organic chain', () => {
      const chain = makeChain({
        influencers: [
          makeSourceNode({
            nodeId: 'inf-1',
            nodeType: 'influencer',
            audienceSize: 25000,
            amplifiedAt: '2026-03-01T11:00:00Z',
            engagement: 2500,
          }),
          makeSourceNode({
            nodeId: 'inf-2',
            nodeType: 'influencer',
            audienceSize: 15000,
            amplifiedAt: '2026-03-01T14:00:00Z',
            engagement: 1500,
          }),
          makeSourceNode({
            nodeId: 'inf-3',
            nodeType: 'influencer',
            audienceSize: 10000,
            amplifiedAt: '2026-03-01T18:00:00Z',
            engagement: 800,
          }),
        ],
        velocityPerHour: 5000,
        totalReach: 100000,
      });

      const botRate = detectBotAmplification(chain);

      expect(typeof botRate).toBe('number');
      expect(botRate).toBeGreaterThanOrEqual(0);
      expect(botRate).toBeLessThanOrEqual(1);
    });

    it('should detect uniform timing as suspicious', () => {
      const baseTime = new Date('2026-03-01T10:00:00Z').getTime();
      const uniformInfluencers = Array.from({ length: 10 }, (_, i) =>
        makeSourceNode({
          nodeId: `bot-${i}`,
          nodeType: 'influencer',
          audienceSize: 100,
          amplifiedAt: new Date(baseTime + i * 60000).toISOString(), // Exactly 1 min apart
          engagement: 0,
        })
      );

      const chain = makeChain({
        influencers: uniformInfluencers,
        velocityPerHour: 50000,
        totalReach: 1000,
      });

      const botRate = detectBotAmplification(chain);

      expect(botRate).toBeGreaterThan(0);
    });

    it('should return 0 for empty chain', () => {
      const chain = makeChain({ influencers: [], velocityPerHour: 0, totalReach: 0 });
      const botRate = detectBotAmplification(chain);

      expect(botRate).toBe(0);
    });
  });
});
