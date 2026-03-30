import { describe, it, expect, beforeEach } from 'vitest';
import { NarrativeBridge } from './narrative-bridge.js';
import { SocialMediaEngine } from '../social-engine.js';
import { SentimentEngine } from '../../sentiment/sentiment-engine.js';
import { TemporalGraph } from '../../graph/temporal-graph.js';

describe('NarrativeBridge', () => {
  let bridge: NarrativeBridge;
  let socialEngine: SocialMediaEngine;
  let sentimentEngine: SentimentEngine;
  let graph: TemporalGraph;

  beforeEach(() => {
    socialEngine = new SocialMediaEngine();
    sentimentEngine = new SentimentEngine();
    graph = new TemporalGraph();
    bridge = new NarrativeBridge(socialEngine, sentimentEngine, graph);
  });

  // --- Linking ---

  describe('linkAnnouncementToEvent', () => {
    it('should link an announcement to a narrative event', () => {
      socialEngine.loadDemoData();
      const event = graph.addEvent({
        title: 'Cabinet Reshuffle',
        description: 'Major cabinet changes announced',
        timestamp: '2025-03-15T10:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.8,
        sentiment: 0.3,
      });

      const link = bridge.linkAnnouncementToEvent('ann-cabinet-reshuffle', event.id);

      expect(link).not.toBeNull();
      expect(link!.announcementId).toBe('ann-cabinet-reshuffle');
      expect(link!.narrativeEventId).toBe(event.id);
      expect(link!.linkedAt).toBeDefined();
    });

    it('should return null for missing announcement', () => {
      const event = graph.addEvent({
        title: 'Test Event',
        description: 'Test',
        timestamp: '2025-03-15T10:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.5,
        sentiment: 0,
      });

      const link = bridge.linkAnnouncementToEvent('non-existent', event.id);
      expect(link).toBeNull();
    });

    it('should return null for missing narrative event', () => {
      socialEngine.loadDemoData();
      const link = bridge.linkAnnouncementToEvent('ann-cabinet-reshuffle', 'non-existent');
      expect(link).toBeNull();
    });
  });

  // --- Social Impact ---

  describe('getEventSocialImpact', () => {
    it('should return social impact for a linked event', () => {
      socialEngine.loadDemoData();
      const event = graph.addEvent({
        title: 'Cabinet Reshuffle Event',
        description: 'Major cabinet changes',
        timestamp: '2025-03-15T10:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.8,
        sentiment: 0.3,
      });

      bridge.linkAnnouncementToEvent('ann-cabinet-reshuffle', event.id);
      const impact = bridge.getEventSocialImpact(event.id);

      expect(impact).not.toBeNull();
      expect(impact!.narrativeEventId).toBe(event.id);
      expect(impact!.announcements).toHaveLength(1);
      expect(impact!.totalReach).toBeGreaterThan(0);
      expect(impact!.averageImpactScore).toBeGreaterThan(0);
      expect(impact!.dominantPlatform).toBeDefined();
      expect(impact!.summary).toContain('1 linked announcement');
    });

    it('should aggregate multiple announcements', () => {
      socialEngine.loadDemoData();
      const event = graph.addEvent({
        title: 'Policy Event',
        description: 'Policy changes',
        timestamp: '2025-03-15T10:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.7,
        sentiment: 0.1,
      });

      bridge.linkAnnouncementToEvent('ann-cabinet-reshuffle', event.id);
      bridge.linkAnnouncementToEvent('ann-free-meals', event.id);
      const impact = bridge.getEventSocialImpact(event.id);

      expect(impact).not.toBeNull();
      expect(impact!.announcements).toHaveLength(2);
      expect(impact!.summary).toContain('2 linked announcement');
    });

    it('should return null for event with no linked announcements', () => {
      const event = graph.addEvent({
        title: 'Unlinked Event',
        description: 'No social data',
        timestamp: '2025-03-15T10:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.5,
        sentiment: 0,
      });

      const impact = bridge.getEventSocialImpact(event.id);
      expect(impact).toBeNull();
    });
  });

  // --- Engagement-Sentiment Correlation ---

  describe('correlateEngagementWithSentiment', () => {
    it('should compute correlation for entity with announcements', () => {
      socialEngine.loadDemoData();
      const correlation = bridge.correlateEngagementWithSentiment('entity-prabowo');

      expect(correlation).not.toBeNull();
      expect(correlation!.entityId).toBe('entity-prabowo');
      expect(correlation!.announcementCount).toBeGreaterThan(0);
      expect(correlation!.correlationCoefficient).toBeGreaterThanOrEqual(-1);
      expect(correlation!.correlationCoefficient).toBeLessThanOrEqual(1);
      expect(['aligned', 'divergent', 'neutral']).toContain(
        correlation!.engagementSentimentAlignment
      );
    });

    it('should return null for entity with no announcements', () => {
      const correlation = bridge.correlateEngagementWithSentiment('non-existent');
      expect(correlation).toBeNull();
    });
  });

  // --- Full Impact Chain ---

  describe('buildFullImpactChain', () => {
    it('should build impact chain for linked event', () => {
      socialEngine.loadDemoData();
      const event = graph.addEvent({
        title: 'South China Sea Incident',
        description: 'Military tensions',
        timestamp: '2025-04-05T00:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.9,
        sentiment: -0.5,
      });

      bridge.linkAnnouncementToEvent('ann-scs-incident', event.id);
      const chain = bridge.buildFullImpactChain(event.id);

      expect(chain).not.toBeNull();
      expect(chain!.steps).toHaveLength(5);
      expect(chain!.steps[0].stage).toBe('announcement');
      expect(chain!.steps[1].stage).toBe('social-amplification');
      expect(chain!.steps[2].stage).toBe('media-pickup');
      expect(chain!.steps[3].stage).toBe('sentiment-shift');
      expect(chain!.steps[4].stage).toBe('action');
      expect(chain!.totalDurationHours).toBeGreaterThan(0);
      expect(chain!.overallMagnitude).toBeGreaterThan(0);
      expect(chain!.overallMagnitude).toBeLessThanOrEqual(1);
    });

    it('should build chain directly from announcement ID', () => {
      socialEngine.loadDemoData();
      const chain = bridge.buildFullImpactChain('ann-cabinet-reshuffle');

      expect(chain).not.toBeNull();
      expect(chain!.steps).toHaveLength(5);
      expect(chain!.eventId).toBe('ann-cabinet-reshuffle');
    });

    it('should return null for non-existent event', () => {
      const chain = bridge.buildFullImpactChain('non-existent');
      expect(chain).toBeNull();
    });
  });

  // --- Social NIS ---

  describe('calculateSocialNIS', () => {
    it('should calculate social-enhanced NIS', () => {
      socialEngine.loadDemoData();
      const nis = bridge.calculateSocialNIS('ann-scs-incident');

      expect(nis).not.toBeNull();
      expect(nis!.announcementId).toBe('ann-scs-incident');
      expect(nis!.baseNIS).toBeGreaterThan(0);
      expect(nis!.socialAmplification).toBeGreaterThanOrEqual(0);
      expect(nis!.engagementQuality).toBeGreaterThanOrEqual(0);
      expect(nis!.crossPlatformSpread).toBeGreaterThanOrEqual(0);
      expect(nis!.compositeScore).toBeGreaterThan(0);
      expect(nis!.compositeScore).toBeLessThanOrEqual(100);
      expect(nis!.summary).toContain('Social NIS');
    });

    it('should return null for non-existent announcement', () => {
      const nis = bridge.calculateSocialNIS('non-existent');
      expect(nis).toBeNull();
    });

    it('should give higher scores to multi-platform announcements', () => {
      socialEngine.loadDemoData();
      // ann-scs-incident has 4 platforms, ann-digital-tax has 2
      const multiPlatform = bridge.calculateSocialNIS('ann-scs-incident');
      const fewPlatform = bridge.calculateSocialNIS('ann-digital-tax');

      expect(multiPlatform).not.toBeNull();
      expect(fewPlatform).not.toBeNull();
      expect(multiPlatform!.crossPlatformSpread).toBeGreaterThan(fewPlatform!.crossPlatformSpread);
    });
  });

  // --- Edge Cases ---

  describe('edge cases', () => {
    it('should handle empty engines gracefully', () => {
      const impact = bridge.getEventSocialImpact('any-id');
      expect(impact).toBeNull();

      const chain = bridge.buildFullImpactChain('any-id');
      expect(chain).toBeNull();

      const nis = bridge.calculateSocialNIS('any-id');
      expect(nis).toBeNull();

      const correlation = bridge.correlateEngagementWithSentiment('any-id');
      expect(correlation).toBeNull();
    });

    it('should return links list', () => {
      expect(bridge.getLinks()).toEqual([]);

      socialEngine.loadDemoData();
      const event = graph.addEvent({
        title: 'Test',
        description: 'Test',
        timestamp: '2025-03-15T10:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.5,
        sentiment: 0,
      });

      bridge.linkAnnouncementToEvent('ann-cabinet-reshuffle', event.id);
      expect(bridge.getLinks()).toHaveLength(1);
    });

    it('should clear links', () => {
      socialEngine.loadDemoData();
      const event = graph.addEvent({
        title: 'Test',
        description: 'Test',
        timestamp: '2025-03-15T10:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.5,
        sentiment: 0,
      });

      bridge.linkAnnouncementToEvent('ann-cabinet-reshuffle', event.id);
      expect(bridge.getLinks()).toHaveLength(1);

      bridge.clear();
      expect(bridge.getLinks()).toHaveLength(0);
    });
  });
});
