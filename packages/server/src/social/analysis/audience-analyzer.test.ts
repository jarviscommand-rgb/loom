import { describe, it, expect } from 'vitest';
import {
  segmentAudience,
  detectAudienceOverlap,
  buildPersonaFromSegment,
  matchPersonaToNarrative,
  predictReaction,
} from './audience-analyzer.js';
import type {
  AudienceSegment,
  AudiencePersona,
  EngagementMetrics,
  SocialPlatform,
} from '../types.js';

// ============================================================
// LOOM — Audience Analyzer Tests
// ============================================================

/** Helper to create an audience segment. */
function makeSegment(name: string, overrides: Partial<AudienceSegment> = {}): AudienceSegment {
  return {
    id: `seg-${name.toLowerCase().replace(/\s/g, '-')}`,
    name,
    description: `${name} segment`,
    estimatedSize: 10000,
    shareOfAudience: 0.2,
    politicalLeaning: 'independent',
    geography: 'Jakarta',
    audienceType: 'urban-middle',
    influenceLevel: 'mid-tier',
    primaryPlatforms: ['twitter', 'instagram'],
    engagementRate: 0.04,
    ...overrides,
  };
}

/** Helper to create engagement metrics. */
function makeMetrics(platform: SocialPlatform, total: number): EngagementMetrics {
  return {
    platform,
    likes: Math.floor(total * 0.6),
    shares: Math.floor(total * 0.2),
    comments: Math.floor(total * 0.1),
    views: total * 10,
    reachEstimate: total * 6,
    timestamp: '2026-03-01T10:00:00Z',
  };
}

/** Helper to create an audience persona. */
function makePersona(overrides: Partial<AudiencePersona> = {}): AudiencePersona {
  return {
    id: 'persona-test',
    name: 'Test Persona',
    description: 'A test persona',
    ageRange: '25-35',
    genderDistribution: '50% male, 50% female',
    incomeLevel: 'Middle class',
    educationLevel: 'University graduate',
    platforms: ['twitter', 'instagram'],
    interests: ['technology', 'politics', 'business'],
    followedInfluencers: [],
    politicalLeaning: 'independent',
    geography: 'Jakarta',
    mediaConsumption: 'Digital-first',
    keyConcerns: ['cost of living', 'job market', 'infrastructure'],
    ...overrides,
  };
}

describe('AudienceAnalyzer', () => {
  describe('segmentAudience', () => {
    it('should return weighted segments based on engagement data', () => {
      const segments = [
        makeSegment('Urban Digital', { primaryPlatforms: ['twitter', 'instagram'] }),
        makeSegment('Rural Traditional', { primaryPlatforms: ['facebook'] }),
      ];
      const engagement = [makeMetrics('twitter', 5000), makeMetrics('instagram', 3000)];

      const result = segmentAudience(engagement, segments);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].name).toBe('Urban Digital');
    });

    it('should return existing segments when no engagement data', () => {
      const segments = [makeSegment('Test')];
      const result = segmentAudience([], segments);

      expect(result).toEqual(segments);
    });

    it('should return empty when no segments exist', () => {
      const result = segmentAudience([makeMetrics('twitter', 1000)], []);
      expect(result).toEqual([]);
    });
  });

  describe('detectAudienceOverlap', () => {
    it('should detect overlap between similar audiences', () => {
      const sharedSeg = makeSegment('Shared', { id: 'seg-shared' });
      const segments1 = [sharedSeg, makeSegment('Unique A', { id: 'seg-a' })];
      const segments2 = [sharedSeg, makeSegment('Unique B', { id: 'seg-b' })];

      const overlap = detectAudienceOverlap(
        segments1,
        segments2,
        'entity-1',
        'entity-2',
        'Entity One',
        'Entity Two'
      );

      expect(overlap).toBeDefined();
      expect(typeof overlap.overlapCoefficient).toBe('number');
      expect(overlap.overlapCoefficient).toBeGreaterThan(0);
      expect(overlap.overlapCoefficient).toBeLessThanOrEqual(1);
      expect(overlap.sharedSegments.length).toBe(1);
      expect(overlap.uniqueToEntity1.length).toBe(1);
      expect(overlap.uniqueToEntity2.length).toBe(1);
    });

    it('should return full overlap for identical audiences', () => {
      const segments = [makeSegment('A', { id: 'seg-a' })];
      const overlap = detectAudienceOverlap(segments, segments, 'e1', 'e2', 'E1', 'E2');

      expect(overlap.overlapCoefficient).toBe(1);
      expect(overlap.uniqueToEntity1).toEqual([]);
      expect(overlap.uniqueToEntity2).toEqual([]);
    });

    it('should return zero overlap for disjoint audiences', () => {
      const seg1 = [makeSegment('A', { id: 'seg-a' })];
      const seg2 = [makeSegment('B', { id: 'seg-b' })];

      const overlap = detectAudienceOverlap(seg1, seg2, 'e1', 'e2', 'E1', 'E2');

      expect(overlap.overlapCoefficient).toBe(0);
      expect(overlap.sharedSegments).toEqual([]);
    });

    it('should include a summary', () => {
      const seg1 = [makeSegment('A', { id: 'seg-a' })];
      const seg2 = [makeSegment('A', { id: 'seg-a' })];

      const overlap = detectAudienceOverlap(seg1, seg2, 'e1', 'e2', 'Entity 1', 'Entity 2');

      expect(typeof overlap.summary).toBe('string');
      expect(overlap.summary.length).toBeGreaterThan(0);
    });
  });

  describe('buildPersonaFromSegment', () => {
    it('should create complete persona from segment', () => {
      const segment = makeSegment('Tech Professionals');
      const persona = buildPersonaFromSegment(segment);

      expect(persona).toBeDefined();
      expect(persona.name).toBe('Tech Professionals');
      expect(typeof persona.description).toBe('string');
      expect(persona.description.length).toBeGreaterThan(10);
      expect(Array.isArray(persona.interests)).toBe(true);
      expect(persona.interests.length).toBeGreaterThan(0);
      expect(Array.isArray(persona.platforms)).toBe(true);
      expect(persona.politicalLeaning).toBe('independent');
    });

    it('should incorporate segment geography', () => {
      const segment = makeSegment('Jakarta Youth', { geography: 'Jakarta' });
      const persona = buildPersonaFromSegment(segment);

      expect(persona.geography).toBe('Jakarta');
    });

    it('should create distinct personas from different segments', () => {
      const techSeg = makeSegment('Tech', {
        audienceType: 'elite-policy',
        politicalLeaning: 'centrist',
      });
      const ruralSeg = makeSegment('Rural', {
        audienceType: 'rural-mass',
        politicalLeaning: 'islamic-conservative',
      });

      const techPersona = buildPersonaFromSegment(techSeg);
      const ruralPersona = buildPersonaFromSegment(ruralSeg);

      expect(techPersona.interests).not.toEqual(ruralPersona.interests);
      expect(techPersona.incomeLevel).not.toBe(ruralPersona.incomeLevel);
    });
  });

  describe('matchPersonaToNarrative', () => {
    it('should score high for aligned persona and narrative', () => {
      const persona = makePersona({
        interests: ['technology', 'startups', 'AI'],
        platforms: ['twitter', 'instagram'],
        keyConcerns: ['investment climate', 'digital rights'],
      });

      const score = matchPersonaToNarrative(
        persona,
        ['technology', 'AI', 'startups'],
        ['twitter', 'instagram']
      );

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
      expect(score).toBeGreaterThan(0.3);
    });

    it('should score low for mismatched persona', () => {
      const persona = makePersona({
        interests: ['agriculture', 'religion'],
        platforms: ['facebook'],
        keyConcerns: ['land rights', 'subsidies'],
      });

      const score = matchPersonaToNarrative(persona, ['kubernetes', 'cloud-native'], ['reddit']);

      expect(score).toBeLessThan(0.3);
    });

    it('should handle empty tags', () => {
      const persona = makePersona();
      const score = matchPersonaToNarrative(persona, [], ['twitter']);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('predictReaction', () => {
    it('should return a complete persona reaction', () => {
      const persona = makePersona();
      const reaction = predictReaction(
        persona,
        'New technology investment program announced',
        ['technology', 'investment'],
        ['twitter']
      );

      expect(reaction).toBeDefined();
      expect(reaction.personaId).toBe('persona-test');
      expect(reaction.personaName).toBe('Test Persona');
      expect(typeof reaction.sentimentScore).toBe('number');
      expect(reaction.sentimentScore).toBeGreaterThanOrEqual(-1);
      expect(reaction.sentimentScore).toBeLessThanOrEqual(1);
      expect(typeof reaction.engagementLikelihood).toBe('number');
      expect(typeof reaction.amplificationLikelihood).toBe('number');
      expect(typeof reaction.dominantEmotion).toBe('string');
      expect(Array.isArray(reaction.likelyTalkingPoints)).toBe(true);
      expect(typeof reaction.summary).toBe('string');
    });

    it('should predict positive sentiment for growth announcements', () => {
      const persona = makePersona({ politicalLeaning: 'pro-government' });
      const reaction = predictReaction(
        persona,
        'Economic growth reaches record levels',
        ['economics', 'growth'],
        ['twitter']
      );

      expect(reaction.sentimentScore).toBeGreaterThan(0);
    });

    it('should predict negative sentiment for crisis announcements', () => {
      const persona = makePersona({ politicalLeaning: 'opposition' });
      const reaction = predictReaction(
        persona,
        'Major corruption crisis uncovered in government',
        ['corruption', 'crisis'],
        ['twitter']
      );

      expect(reaction.sentimentScore).toBeLessThan(0);
    });
  });
});
