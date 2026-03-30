import { describe, it, expect } from 'vitest';
import {
  buildAmplificationChain,
  identifyKeyAmplifiers,
  calculateAmplificationVelocity,
  detectBotAmplification,
} from './amplification-tracker.js';
import type { ShareEvent, Platform } from '../types.js';

// ============================================================
// LOOM — Amplification Tracker Tests
//
// Tests for building amplification chains, identifying key
// amplifiers, measuring velocity, and detecting bot patterns.
// ============================================================

/** Helper to create a share event. */
function makeShareEvent(overrides: Partial<ShareEvent> = {}): ShareEvent {
  return {
    id: `share-${Math.random().toString(36).slice(2, 8)}`,
    originalPostId: 'post-001',
    sharedBy: 'user_alpha',
    platform: 'twitter' as Platform,
    timestamp: '2026-03-01T10:00:00Z',
    reach: 5000,
    engagement: { likes: 200, shares: 50, comments: 30 },
    parentShareId: undefined,
    ...overrides,
  };
}

/** Helper to create a chain of share events (tree-like amplification). */
function makeShareChain(): ShareEvent[] {
  const origin = makeShareEvent({
    id: 'share-origin',
    originalPostId: 'post-001',
    sharedBy: 'original_author',
    timestamp: '2026-03-01T10:00:00Z',
    reach: 50000,
    engagement: { likes: 5000, shares: 1200, comments: 800 },
  });

  const tier1A = makeShareEvent({
    id: 'share-t1a',
    originalPostId: 'post-001',
    sharedBy: 'influencer_a',
    timestamp: '2026-03-01T10:30:00Z',
    reach: 25000,
    engagement: { likes: 3000, shares: 600, comments: 400 },
    parentShareId: 'share-origin',
  });

  const tier1B = makeShareEvent({
    id: 'share-t1b',
    originalPostId: 'post-001',
    sharedBy: 'influencer_b',
    timestamp: '2026-03-01T11:00:00Z',
    reach: 15000,
    engagement: { likes: 1500, shares: 300, comments: 200 },
    parentShareId: 'share-origin',
  });

  const tier2A = makeShareEvent({
    id: 'share-t2a',
    originalPostId: 'post-001',
    sharedBy: 'follower_1',
    timestamp: '2026-03-01T12:00:00Z',
    reach: 2000,
    engagement: { likes: 100, shares: 20, comments: 10 },
    parentShareId: 'share-t1a',
  });

  const tier2B = makeShareEvent({
    id: 'share-t2b',
    originalPostId: 'post-001',
    sharedBy: 'follower_2',
    timestamp: '2026-03-01T12:30:00Z',
    reach: 1000,
    engagement: { likes: 50, shares: 5, comments: 3 },
    parentShareId: 'share-t1a',
  });

  const tier3 = makeShareEvent({
    id: 'share-t3',
    originalPostId: 'post-001',
    sharedBy: 'micro_user',
    timestamp: '2026-03-01T14:00:00Z',
    reach: 200,
    engagement: { likes: 10, shares: 1, comments: 0 },
    parentShareId: 'share-t2a',
  });

  return [origin, tier1A, tier1B, tier2A, tier2B, tier3];
}

/** Helper to create bot-like share events. */
function makeBotShareEvents(): ShareEvent[] {
  const events: ShareEvent[] = [];
  const baseTime = new Date('2026-03-01T10:00:00Z');

  for (let i = 0; i < 50; i++) {
    events.push(
      makeShareEvent({
        id: `bot-share-${i}`,
        originalPostId: 'post-bot',
        sharedBy: `bot_account_${i}`,
        timestamp: new Date(baseTime.getTime() + i * 5000).toISOString(), // Every 5 seconds
        reach: 10 + Math.floor(Math.random() * 20),
        engagement: { likes: 0, shares: 0, comments: 0 },
        parentShareId: i > 0 ? `bot-share-0` : undefined,
      })
    );
  }
  return events;
}

describe('AmplificationTracker', () => {
  // -------------------------------------------------------------------------
  // buildAmplificationChain
  // -------------------------------------------------------------------------
  describe('buildAmplificationChain', () => {
    it('should construct proper chain from share events', () => {
      const events = makeShareChain();
      const chain = buildAmplificationChain(events);

      expect(chain).toBeDefined();
      expect(chain.originId).toBe('share-origin');
      expect(Array.isArray(chain.nodes)).toBe(true);
      expect(chain.nodes.length).toBe(6);
      expect(typeof chain.totalReach).toBe('number');
      expect(chain.totalReach).toBeGreaterThan(0);
      expect(typeof chain.maxDepth).toBe('number');
      expect(chain.maxDepth).toBeGreaterThanOrEqual(3);
    });

    it('should assign correct depth levels', () => {
      const events = makeShareChain();
      const chain = buildAmplificationChain(events);

      const originNode = chain.nodes.find((n) => n.id === 'share-origin');
      const tier1Node = chain.nodes.find((n) => n.id === 'share-t1a');
      const tier2Node = chain.nodes.find((n) => n.id === 'share-t2a');
      const tier3Node = chain.nodes.find((n) => n.id === 'share-t3');

      expect(originNode?.depth).toBe(0);
      expect(tier1Node?.depth).toBe(1);
      expect(tier2Node?.depth).toBe(2);
      expect(tier3Node?.depth).toBe(3);
    });

    it('should calculate total reach across all nodes', () => {
      const events = makeShareChain();
      const chain = buildAmplificationChain(events);

      const expectedMinReach = events.reduce((sum, e) => sum + e.reach, 0);
      // Total reach should be at least the sum of individual reaches
      expect(chain.totalReach).toBeGreaterThanOrEqual(expectedMinReach * 0.8);
    });

    it('should handle single node chain', () => {
      const singleEvent = [makeShareEvent({ id: 'solo', reach: 1000 })];
      const chain = buildAmplificationChain(singleEvent);

      expect(chain.nodes.length).toBe(1);
      expect(chain.maxDepth).toBe(0);
      expect(chain.totalReach).toBe(1000);
    });

    it('should handle empty events', () => {
      const chain = buildAmplificationChain([]);

      expect(chain.nodes).toEqual([]);
      expect(chain.totalReach).toBe(0);
      expect(chain.maxDepth).toBe(0);
    });

    it('should handle circular references gracefully', () => {
      const events: ShareEvent[] = [
        makeShareEvent({
          id: 'circular-a',
          sharedBy: 'user_a',
          parentShareId: 'circular-b',
          reach: 100,
        }),
        makeShareEvent({
          id: 'circular-b',
          sharedBy: 'user_b',
          parentShareId: 'circular-a',
          reach: 100,
        }),
      ];

      // Should not infinite loop — should handle gracefully
      const chain = buildAmplificationChain(events);
      expect(chain.nodes.length).toBeLessThanOrEqual(2);
    });

    it('should preserve temporal ordering', () => {
      const events = makeShareChain();
      const chain = buildAmplificationChain(events);

      for (let i = 1; i < chain.nodes.length; i++) {
        if (chain.nodes[i].depth > chain.nodes[i - 1].depth) {
          expect(new Date(chain.nodes[i].timestamp).getTime()).toBeGreaterThanOrEqual(
            new Date(chain.nodes[i - 1].timestamp).getTime()
          );
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // identifyKeyAmplifiers
  // -------------------------------------------------------------------------
  describe('identifyKeyAmplifiers', () => {
    it('should find high-impact nodes in chain', () => {
      const events = makeShareChain();
      const amplifiers = identifyKeyAmplifiers(events);

      expect(Array.isArray(amplifiers)).toBe(true);
      expect(amplifiers.length).toBeGreaterThan(0);

      for (const amp of amplifiers) {
        expect(amp.handle).toBeDefined();
        expect(typeof amp.amplificationScore).toBe('number');
        expect(amp.amplificationScore).toBeGreaterThanOrEqual(0);
        expect(typeof amp.reach).toBe('number');
        expect(typeof amp.childCount).toBe('number');
      }
    });

    it('should rank amplifiers by impact', () => {
      const events = makeShareChain();
      const amplifiers = identifyKeyAmplifiers(events);

      for (let i = 1; i < amplifiers.length; i++) {
        expect(amplifiers[i - 1].amplificationScore).toBeGreaterThanOrEqual(
          amplifiers[i].amplificationScore
        );
      }
    });

    it('should identify the original poster as top amplifier', () => {
      const events = makeShareChain();
      const amplifiers = identifyKeyAmplifiers(events);

      // Origin or largest-reach influencer should be at top
      const topHandle = amplifiers[0].handle;
      expect(['original_author', 'influencer_a']).toContain(topHandle);
    });

    it('should return empty for no events', () => {
      const amplifiers = identifyKeyAmplifiers([]);
      expect(amplifiers).toEqual([]);
    });

    it('should respect limit parameter', () => {
      const events = makeShareChain();
      const amplifiers = identifyKeyAmplifiers(events, { limit: 2 });

      expect(amplifiers.length).toBeLessThanOrEqual(2);
    });
  });

  // -------------------------------------------------------------------------
  // calculateAmplificationVelocity
  // -------------------------------------------------------------------------
  describe('calculateAmplificationVelocity', () => {
    it('should calculate velocity for share events over time', () => {
      const events = makeShareChain();
      const velocity = calculateAmplificationVelocity(events);

      expect(velocity).toBeDefined();
      expect(typeof velocity.sharesPerHour).toBe('number');
      expect(velocity.sharesPerHour).toBeGreaterThan(0);
      expect(typeof velocity.peakVelocity).toBe('number');
      expect(velocity.peakVelocity).toBeGreaterThanOrEqual(velocity.sharesPerHour);
      expect(velocity.peakTime).toBeDefined();
      expect(typeof velocity.accelerating).toBe('boolean');
    });

    it('should detect high velocity for rapid sharing', () => {
      const baseTime = new Date('2026-03-01T10:00:00Z');
      const rapidEvents = Array.from({ length: 100 }, (_, i) =>
        makeShareEvent({
          id: `rapid-${i}`,
          sharedBy: `user_${i}`,
          timestamp: new Date(baseTime.getTime() + i * 60_000).toISOString(), // Every minute
          reach: 1000,
        })
      );

      const velocity = calculateAmplificationVelocity(rapidEvents);
      expect(velocity.sharesPerHour).toBeGreaterThan(50);
    });

    it('should detect low velocity for slow sharing', () => {
      const baseTime = new Date('2026-03-01T10:00:00Z');
      const slowEvents = Array.from({ length: 5 }, (_, i) =>
        makeShareEvent({
          id: `slow-${i}`,
          sharedBy: `user_${i}`,
          timestamp: new Date(baseTime.getTime() + i * 86400_000).toISOString(), // Every day
          reach: 100,
        })
      );

      const velocity = calculateAmplificationVelocity(slowEvents);
      expect(velocity.sharesPerHour).toBeLessThan(1);
    });

    it('should handle empty events', () => {
      const velocity = calculateAmplificationVelocity([]);

      expect(velocity.sharesPerHour).toBe(0);
      expect(velocity.peakVelocity).toBe(0);
    });

    it('should handle single event', () => {
      const velocity = calculateAmplificationVelocity([makeShareEvent()]);

      expect(velocity.sharesPerHour).toBeGreaterThanOrEqual(0);
    });
  });

  // -------------------------------------------------------------------------
  // detectBotAmplification
  // -------------------------------------------------------------------------
  describe('detectBotAmplification', () => {
    it('should detect bot patterns in artificial sharing', () => {
      const botEvents = makeBotShareEvents();
      const detection = detectBotAmplification(botEvents);

      expect(detection).toBeDefined();
      expect(typeof detection.botProbability).toBe('number');
      expect(detection.botProbability).toBeGreaterThanOrEqual(0);
      expect(detection.botProbability).toBeLessThanOrEqual(1);
      expect(detection.botProbability).toBeGreaterThan(0.5);
      expect(Array.isArray(detection.indicators)).toBe(true);
      expect(detection.indicators.length).toBeGreaterThan(0);
    });

    it('should differentiate genuine organic sharing', () => {
      const organicEvents = makeShareChain();
      const detection = detectBotAmplification(organicEvents);

      expect(detection.botProbability).toBeLessThan(0.5);
    });

    it('should flag uniform timing as suspicious', () => {
      const botEvents = makeBotShareEvents();
      const detection = detectBotAmplification(botEvents);

      const hasTimingIndicator = detection.indicators.some(
        (ind) => ind.type === 'uniform-timing' || ind.type === 'rapid-succession'
      );
      expect(hasTimingIndicator).toBe(true);
    });

    it('should flag zero engagement as suspicious', () => {
      const botEvents = makeBotShareEvents();
      const detection = detectBotAmplification(botEvents);

      const hasEngagementIndicator = detection.indicators.some(
        (ind) => ind.type === 'zero-engagement' || ind.type === 'low-engagement'
      );
      expect(hasEngagementIndicator).toBe(true);
    });

    it('should return low probability for empty events', () => {
      const detection = detectBotAmplification([]);

      expect(detection.botProbability).toBe(0);
      expect(detection.indicators).toEqual([]);
    });

    it('should include confidence in detection', () => {
      const events = makeBotShareEvents();
      const detection = detectBotAmplification(events);

      expect(typeof detection.confidence).toBe('number');
      expect(detection.confidence).toBeGreaterThanOrEqual(0);
      expect(detection.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle mixed bot and organic events', () => {
      const organic = makeShareChain();
      const bots = makeBotShareEvents().slice(0, 10);
      const mixed = [...organic, ...bots];

      const detection = detectBotAmplification(mixed);

      // Should be somewhere in the middle
      expect(detection.botProbability).toBeGreaterThan(0.1);
      expect(detection.botProbability).toBeLessThan(0.9);
    });
  });
});
