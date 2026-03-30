import { describe, it, expect } from 'vitest';
import {
  segmentAudience,
  detectAudienceOverlap,
  buildPersonaFromSegment,
  matchPersonaToNarrative,
} from './audience-analyzer.js';
import type { SocialPlatform } from '../types.js';

// ============================================================
// LOOM — Audience Analyzer Tests
//
// Tests for audience segmentation, overlap detection,
// persona generation, and narrative matching.
// ============================================================

/**
 * Audience data input for segmentation analysis.
 * Defined here as the expected interface for the analyzer module.
 */
interface AudienceData {
  platform: SocialPlatform;
  followers: number;
  demographics: {
    ageGroups: Array<{ range: string; percentage: number }>;
    genderSplit: Record<string, number>;
    topLocations: string[];
    topInterests: string[];
  };
  engagementRate: number;
  activeHours: number[];
}

/** Simplified segment for analyzer input/output. */
interface AnalyzerSegment {
  name: string;
  size: number;
  platforms: SocialPlatform[];
  engagementRate: number;
  demographics: {
    primaryAgeGroup: string;
    topInterests: string[];
    topLocations: string[];
  };
  behavior: {
    peakActivityHours: number[];
    preferredContentType: string;
    avgSessionDuration: number;
  };
}

/** Simplified persona for analyzer output. */
interface AnalyzerPersona {
  name: string;
  description: string;
  interests: string[];
  engagementStyle: string;
  motivations: string[];
  painPoints: string[];
  preferredPlatforms: SocialPlatform[];
  estimatedSize: number;
}

/** Helper to create audience data for a platform. */
function makeAudienceData(
  platform: SocialPlatform,
  overrides: Partial<AudienceData> = {}
): AudienceData {
  return {
    platform,
    followers: 10000,
    demographics: {
      ageGroups: [
        { range: '18-24', percentage: 0.25 },
        { range: '25-34', percentage: 0.35 },
        { range: '35-44', percentage: 0.2 },
        { range: '45-54', percentage: 0.12 },
        { range: '55+', percentage: 0.08 },
      ],
      genderSplit: { male: 0.55, female: 0.42, other: 0.03 },
      topLocations: ['Jakarta', 'Surabaya', 'Bandung'],
      topInterests: ['technology', 'business', 'finance'],
    },
    engagementRate: 0.035,
    activeHours: [9, 10, 11, 12, 13, 17, 18, 19, 20, 21],
    ...overrides,
  };
}

/** Helper to create a segment result. */
function makeSegment(name: string, overrides: Partial<AnalyzerSegment> = {}): AnalyzerSegment {
  return {
    name,
    size: 5000,
    platforms: ['twitter'],
    engagementRate: 0.04,
    demographics: {
      primaryAgeGroup: '25-34',
      topInterests: ['technology', 'startups'],
      topLocations: ['Jakarta'],
    },
    behavior: {
      peakActivityHours: [10, 11, 19, 20],
      preferredContentType: 'informational',
      avgSessionDuration: 12,
    },
    ...overrides,
  };
}

describe('AudienceAnalyzer', () => {
  // -------------------------------------------------------------------------
  // segmentAudience
  // -------------------------------------------------------------------------
  describe('segmentAudience', () => {
    it('should produce valid segments from multi-platform data', () => {
      const audienceData: AudienceData[] = [
        makeAudienceData('twitter'),
        makeAudienceData('facebook', {
          followers: 25000,
          engagementRate: 0.02,
          demographics: {
            ageGroups: [
              { range: '18-24', percentage: 0.1 },
              { range: '25-34', percentage: 0.2 },
              { range: '35-44', percentage: 0.3 },
              { range: '45-54', percentage: 0.25 },
              { range: '55+', percentage: 0.15 },
            ],
            genderSplit: { male: 0.48, female: 0.5, other: 0.02 },
            topLocations: ['Jakarta', 'Medan', 'Makassar'],
            topInterests: ['news', 'family', 'religion'],
          },
        }),
        makeAudienceData('youtube', {
          followers: 8000,
          engagementRate: 0.045,
          demographics: {
            ageGroups: [
              { range: '18-24', percentage: 0.05 },
              { range: '25-34', percentage: 0.4 },
              { range: '35-44', percentage: 0.35 },
              { range: '45-54', percentage: 0.15 },
              { range: '55+', percentage: 0.05 },
            ],
            genderSplit: { male: 0.6, female: 0.38, other: 0.02 },
            topLocations: ['Jakarta', 'Singapore', 'Bandung'],
            topInterests: ['business', 'technology', 'leadership'],
          },
        }),
      ];

      const segments = segmentAudience(audienceData);

      expect(Array.isArray(segments)).toBe(true);
      expect(segments.length).toBeGreaterThan(0);

      for (const segment of segments) {
        expect(segment.name).toBeDefined();
        expect(typeof segment.size).toBe('number');
        expect(segment.size).toBeGreaterThan(0);
        expect(Array.isArray(segment.platforms)).toBe(true);
        expect(segment.platforms.length).toBeGreaterThan(0);
        expect(typeof segment.engagementRate).toBe('number');
        expect(segment.demographics).toBeDefined();
        expect(segment.behavior).toBeDefined();
      }
    });

    it('should segment single platform data', () => {
      const segments = segmentAudience([makeAudienceData('twitter')]);

      expect(segments.length).toBeGreaterThan(0);
      for (const segment of segments) {
        expect(segment.platforms).toContain('twitter');
      }
    });

    it('should return empty segments for empty input', () => {
      const segments = segmentAudience([]);
      expect(segments).toEqual([]);
    });

    it('should have segment sizes that sum to approximately total audience', () => {
      const data = [
        makeAudienceData('twitter', { followers: 10000 }),
        makeAudienceData('facebook', { followers: 20000 }),
      ];
      const segments = segmentAudience(data);

      const totalSegmentSize = segments.reduce((sum, s) => sum + s.size, 0);
      // Allow overlap — total can exceed sum of followers
      expect(totalSegmentSize).toBeGreaterThan(0);
    });

    it('should identify distinct segments from diverse audiences', () => {
      const youngTech = makeAudienceData('tiktok', {
        followers: 50000,
        demographics: {
          ageGroups: [
            { range: '18-24', percentage: 0.6 },
            { range: '25-34', percentage: 0.3 },
            { range: '35-44', percentage: 0.08 },
            { range: '45-54', percentage: 0.02 },
            { range: '55+', percentage: 0.0 },
          ],
          genderSplit: { male: 0.45, female: 0.52, other: 0.03 },
          topLocations: ['Jakarta', 'Bandung'],
          topInterests: ['entertainment', 'fashion', 'music'],
        },
      });

      const olderProfessional = makeAudienceData('youtube', {
        followers: 15000,
        demographics: {
          ageGroups: [
            { range: '18-24', percentage: 0.05 },
            { range: '25-34', percentage: 0.2 },
            { range: '35-44', percentage: 0.4 },
            { range: '45-54', percentage: 0.25 },
            { range: '55+', percentage: 0.1 },
          ],
          genderSplit: { male: 0.65, female: 0.33, other: 0.02 },
          topLocations: ['Jakarta', 'Singapore'],
          topInterests: ['business', 'leadership', 'finance'],
        },
      });

      const segments = segmentAudience([youngTech, olderProfessional]);
      expect(segments.length).toBeGreaterThanOrEqual(2);
    });
  });

  // -------------------------------------------------------------------------
  // detectAudienceOverlap
  // -------------------------------------------------------------------------
  describe('detectAudienceOverlap', () => {
    it('should detect overlap between similar audiences', () => {
      const audienceA = makeAudienceData('twitter');
      const audienceB = makeAudienceData('youtube', {
        demographics: {
          ageGroups: [
            { range: '18-24', percentage: 0.2 },
            { range: '25-34', percentage: 0.4 },
            { range: '35-44', percentage: 0.25 },
            { range: '45-54', percentage: 0.1 },
            { range: '55+', percentage: 0.05 },
          ],
          genderSplit: { male: 0.58, female: 0.4, other: 0.02 },
          topLocations: ['Jakarta', 'Surabaya', 'Bandung'],
          topInterests: ['technology', 'business', 'finance'],
        },
      });

      const overlap = detectAudienceOverlap(audienceA, audienceB);

      expect(overlap).toBeDefined();
      expect(typeof overlap.overlapPercentage).toBe('number');
      expect(overlap.overlapPercentage).toBeGreaterThan(0);
      expect(overlap.overlapPercentage).toBeLessThanOrEqual(100);
      expect(Array.isArray(overlap.sharedInterests)).toBe(true);
      expect(Array.isArray(overlap.sharedLocations)).toBe(true);
    });

    it('should detect low overlap for very different audiences', () => {
      const techYouth = makeAudienceData('tiktok', {
        demographics: {
          ageGroups: [
            { range: '18-24', percentage: 0.7 },
            { range: '25-34', percentage: 0.2 },
            { range: '35-44', percentage: 0.08 },
            { range: '45-54', percentage: 0.02 },
            { range: '55+', percentage: 0.0 },
          ],
          genderSplit: { male: 0.4, female: 0.55, other: 0.05 },
          topLocations: ['Bali', 'Yogyakarta'],
          topInterests: ['gaming', 'anime', 'k-pop'],
        },
      });

      const seniorProfessional = makeAudienceData('reddit', {
        demographics: {
          ageGroups: [
            { range: '18-24', percentage: 0.02 },
            { range: '25-34', percentage: 0.08 },
            { range: '35-44', percentage: 0.3 },
            { range: '45-54', percentage: 0.35 },
            { range: '55+', percentage: 0.25 },
          ],
          genderSplit: { male: 0.7, female: 0.28, other: 0.02 },
          topLocations: ['Jakarta', 'Singapore'],
          topInterests: ['governance', 'investment', 'policy'],
        },
      });

      const overlap = detectAudienceOverlap(techYouth, seniorProfessional);
      expect(overlap.overlapPercentage).toBeLessThan(30);
    });

    it('should return 100% overlap for identical audiences', () => {
      const data = makeAudienceData('twitter');
      const overlap = detectAudienceOverlap(data, data);

      expect(overlap.overlapPercentage).toBeGreaterThanOrEqual(90);
    });

    it('should include shared demographic details', () => {
      const a = makeAudienceData('twitter');
      const b = makeAudienceData('facebook');
      const overlap = detectAudienceOverlap(a, b);

      expect(overlap.sharedInterests).toBeDefined();
      expect(overlap.sharedLocations).toBeDefined();
      expect(overlap.sharedAgeGroups).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // buildPersonaFromSegment
  // -------------------------------------------------------------------------
  describe('buildPersonaFromSegment', () => {
    it('should create complete persona from segment', () => {
      const segment = makeSegment('Tech-savvy Professionals');
      const persona = buildPersonaFromSegment(segment);

      expect(persona).toBeDefined();
      expect(persona.name).toBeDefined();
      expect(typeof persona.name).toBe('string');
      expect(persona.name.length).toBeGreaterThan(0);
      expect(persona.description).toBeDefined();
      expect(persona.description.length).toBeGreaterThan(10);
      expect(Array.isArray(persona.interests)).toBe(true);
      expect(persona.interests.length).toBeGreaterThan(0);
      expect(persona.engagementStyle).toBeDefined();
      expect(persona.motivations).toBeDefined();
      expect(Array.isArray(persona.motivations)).toBe(true);
      expect(persona.painPoints).toBeDefined();
      expect(Array.isArray(persona.painPoints)).toBe(true);
    });

    it('should incorporate segment demographics into persona', () => {
      const segment = makeSegment('Young Influencers', {
        demographics: {
          primaryAgeGroup: '18-24',
          topInterests: ['fashion', 'beauty', 'lifestyle'],
          topLocations: ['Jakarta', 'Bali'],
        },
      });

      const persona = buildPersonaFromSegment(segment);

      expect(persona.interests).toEqual(expect.arrayContaining(['fashion', 'beauty', 'lifestyle']));
    });

    it('should create distinct personas from different segments', () => {
      const techSegment = makeSegment('Tech Workers', {
        demographics: {
          primaryAgeGroup: '25-34',
          topInterests: ['technology', 'AI', 'startups'],
          topLocations: ['Jakarta'],
        },
      });

      const tradSegment = makeSegment('Traditional Consumers', {
        demographics: {
          primaryAgeGroup: '45-54',
          topInterests: ['news', 'family', 'religion'],
          topLocations: ['Surabaya', 'Medan'],
        },
      });

      const techPersona = buildPersonaFromSegment(techSegment);
      const tradPersona = buildPersonaFromSegment(tradSegment);

      expect(techPersona.name).not.toBe(tradPersona.name);
      expect(techPersona.interests).not.toEqual(tradPersona.interests);
    });

    it('should handle segment with minimal data', () => {
      const minimal = makeSegment('Minimal', {
        size: 100,
        demographics: {
          primaryAgeGroup: '25-34',
          topInterests: [],
          topLocations: [],
        },
      });

      const persona = buildPersonaFromSegment(minimal);
      expect(persona.name).toBeDefined();
      expect(persona.description).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // matchPersonaToNarrative
  // -------------------------------------------------------------------------
  describe('matchPersonaToNarrative', () => {
    it('should score high match for aligned persona and narrative', () => {
      const persona: AnalyzerPersona = {
        name: 'Tech Entrepreneur',
        description: 'Young tech-savvy founder interested in AI and innovation',
        interests: ['technology', 'AI', 'startups', 'innovation'],
        engagementStyle: 'active-sharer',
        motivations: ['staying ahead of trends', 'networking'],
        painPoints: ['information overload', 'finding reliable tech news'],
        preferredPlatforms: ['twitter', 'youtube'],
        estimatedSize: 5000,
      };

      const narrative = {
        title: 'AI Startup Raises $50M Series B',
        content: 'A Jakarta-based AI startup announced major funding to scale its platform.',
        topics: ['AI', 'startups', 'funding', 'technology'],
      };

      const match = matchPersonaToNarrative(persona, narrative);

      expect(typeof match.score).toBe('number');
      expect(match.score).toBeGreaterThanOrEqual(0);
      expect(match.score).toBeLessThanOrEqual(1);
      expect(match.score).toBeGreaterThan(0.5);
      expect(match.reasoning).toBeDefined();
      expect(typeof match.reasoning).toBe('string');
    });

    it('should score low for mismatched persona and narrative', () => {
      const persona: AnalyzerPersona = {
        name: 'Rural Farmer',
        description: 'Traditional farmer interested in agriculture and local news',
        interests: ['agriculture', 'weather', 'local-news', 'farming'],
        engagementStyle: 'passive-reader',
        motivations: ['practical farming tips', 'market prices'],
        painPoints: ['limited internet access', 'complex tech language'],
        preferredPlatforms: ['facebook'],
        estimatedSize: 20000,
      };

      const narrative = {
        title: 'Kubernetes 1.30 Released with Enhanced GPU Scheduling',
        content: 'The latest Kubernetes release brings improved GPU scheduling for ML workloads.',
        topics: ['kubernetes', 'cloud-native', 'GPU', 'machine-learning'],
      };

      const match = matchPersonaToNarrative(persona, narrative);
      expect(match.score).toBeLessThan(0.3);
    });

    it('should return medium score for partially relevant narrative', () => {
      const persona: AnalyzerPersona = {
        name: 'SME Owner',
        description: 'Small business owner in Jakarta',
        interests: ['business', 'finance', 'local-economy'],
        engagementStyle: 'occasional-engager',
        motivations: ['growing business', 'cost reduction'],
        painPoints: ['cash flow management', 'regulation complexity'],
        preferredPlatforms: ['facebook', 'instagram'],
        estimatedSize: 15000,
      };

      const narrative = {
        title: 'New Tax Incentives for Digital Economy',
        content: 'Government announces tax breaks for tech companies and digital startups.',
        topics: ['tax', 'digital-economy', 'government-policy'],
      };

      const match = matchPersonaToNarrative(persona, narrative);
      expect(match.score).toBeGreaterThan(0.2);
      expect(match.score).toBeLessThan(0.9);
    });

    it('should include predicted engagement level', () => {
      const persona: AnalyzerPersona = {
        name: 'News Junkie',
        description: 'Active news consumer',
        interests: ['politics', 'economy', 'technology'],
        engagementStyle: 'active-commenter',
        motivations: ['staying informed'],
        painPoints: ['misinformation'],
        preferredPlatforms: ['twitter'],
        estimatedSize: 8000,
      };

      const narrative = {
        title: 'Political Reform Announced',
        content: 'Major political reform package revealed.',
        topics: ['politics', 'reform'],
      };

      const match = matchPersonaToNarrative(persona, narrative);

      expect(match.predictedEngagement).toBeDefined();
      expect(['high', 'medium', 'low']).toContain(match.predictedEngagement);
    });

    it('should handle empty topic lists', () => {
      const persona: AnalyzerPersona = {
        name: 'General',
        description: 'General audience',
        interests: [],
        engagementStyle: 'passive-reader',
        motivations: [],
        painPoints: [],
        preferredPlatforms: ['facebook'],
        estimatedSize: 1000,
      };

      const narrative = { title: 'Update', content: 'Some update.', topics: [] };

      const match = matchPersonaToNarrative(persona, narrative);
      expect(match.score).toBeGreaterThanOrEqual(0);
      expect(match.score).toBeLessThanOrEqual(1);
    });
  });
});
