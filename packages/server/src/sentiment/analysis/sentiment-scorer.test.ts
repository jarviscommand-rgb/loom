import { describe, it, expect } from 'vitest';
import {
  scoreSentimentLexicon,
  computeSentimentScore,
  computeSourceWeight,
  classifySentimentTypes,
} from './sentiment-scorer';
import type { MediaSource } from '../types';

/** Helper to build a minimal MediaSource for tests */
function makeSource(overrides: Partial<MediaSource> = {}): MediaSource {
  return {
    id: 'test-source',
    name: 'Test Source',
    country: 'ID',
    languages: ['id', 'en'],
    url: 'https://test.example.com',
    feedUrls: [],
    politicalLeaning: 'centrist',
    ownership: { owner: 'Test Owner', notes: 'test' },
    editorialGoal: 'Neutral coverage',
    reliabilityScore: 0.8,
    audienceTypes: ['urban-middle'],
    biasDirection: 'neutral',
    signalWeight: 1.0,
    active: true,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// scoreSentimentLexicon
// ---------------------------------------------------------------------------
describe('scoreSentimentLexicon', () => {
  it('scores strongly positive English text', () => {
    const result = scoreSentimentLexicon(
      'great success excellent growth progress achievement breakthrough victory'
    );
    expect(result.overall).toBeGreaterThan(0);
    expect(result.magnitude).toBeGreaterThan(0);
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(0.7);
  });

  it('scores strongly negative English text', () => {
    const result = scoreSentimentLexicon(
      'crisis threat collapse scandal disaster violence conflict tension panic'
    );
    expect(result.overall).toBeLessThan(0);
    expect(result.magnitude).toBeGreaterThan(0);
  });

  it('scores neutral text with no signal words', () => {
    const result = scoreSentimentLexicon(
      'The meeting was held yesterday at the office building downtown'
    );
    expect(result.overall).toBe(0);
    expect(result.magnitude).toBe(0);
    expect(result.confidence).toBe(0.2); // low confidence when no signals found
  });

  it('scores mixed text (positive + negative)', () => {
    const result = scoreSentimentLexicon(
      'great success but also a dangerous crisis and serious threat'
    );
    // Should have non-zero magnitude but overall near zero
    expect(result.magnitude).toBeGreaterThan(0);
    expect(Math.abs(result.overall)).toBeLessThan(1);
  });

  it('scores Bahasa Indonesia positive text', () => {
    const result = scoreSentimentLexicon(
      'sukses berhasil bagus berkembang optimis sejahtera makmur'
    );
    expect(result.overall).toBeGreaterThan(0);
    expect(result.magnitude).toBeGreaterThan(0);
  });

  it('scores Bahasa Indonesia negative text', () => {
    const result = scoreSentimentLexicon('krisis ancaman korupsi skandal gagal bencana kekerasan');
    expect(result.overall).toBeLessThan(0);
    expect(result.magnitude).toBeGreaterThan(0);
  });

  it('handles empty text', () => {
    const result = scoreSentimentLexicon('');
    expect(result.overall).toBe(0);
    expect(result.magnitude).toBe(0);
    expect(result.confidence).toBe(0.2); // fallback confidence for no data
  });

  it('clamps overall to [-1, 1]', () => {
    const result = scoreSentimentLexicon(
      'good great excellent success growth improve progress win gain benefit hope strong boost achieve advance breakthrough'
    );
    expect(result.overall).toBeLessThanOrEqual(1);
    expect(result.overall).toBeGreaterThanOrEqual(-1);
  });

  it('caps confidence at 0.7', () => {
    const result = scoreSentimentLexicon(
      'good great excellent success growth improve progress win gain benefit hope strong boost achieve advance breakthrough celebrate confident encourage expand flourish innovation lead opportunity'
    );
    expect(result.confidence).toBeLessThanOrEqual(0.7);
  });

  it('ignores words shorter than 3 characters', () => {
    // 'go', 'be' etc. should not match
    const result = scoreSentimentLexicon('go be do an it');
    expect(result.overall).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// computeSentimentScore
// ---------------------------------------------------------------------------
describe('computeSentimentScore', () => {
  it('returns a full SentimentScore object', () => {
    const source = makeSource();
    const result = computeSentimentScore('great success and progress', source, 'positive', false);
    expect(result).toHaveProperty('overall');
    expect(result).toHaveProperty('magnitude');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('method');
    expect(result).toHaveProperty('weightedScore');
    expect(result).toHaveProperty('sourceWeight');
    expect(result.method).toBe('lexicon');
  });

  it('applies source weight to produce weightedScore', () => {
    const source = makeSource({ reliabilityScore: 0.9, signalWeight: 1.0 });
    const result = computeSentimentScore('great success', source, 'positive', false);
    expect(result.sourceWeight).toBeGreaterThan(0);
    // weightedScore = overall * sourceWeight
    expect(result.weightedScore).toBeCloseTo(result.overall * result.sourceWeight, 1);
  });

  it('clamps weightedScore to [-5, 5]', () => {
    const source = makeSource({
      reliabilityScore: 1.0,
      signalWeight: 1.0,
      biasDirection: 'anti-government',
    });
    const result = computeSentimentScore(
      'excellent great success breakthrough victory triumph prosper thrive flourish',
      source,
      'positive',
      true
    );
    expect(result.weightedScore).toBeLessThanOrEqual(5);
    expect(result.weightedScore).toBeGreaterThanOrEqual(-5);
  });

  it('defaults method to lexicon', () => {
    const result = computeSentimentScore('test text here', makeSource(), 'positive', false);
    expect(result.method).toBe('lexicon');
  });
});

// ---------------------------------------------------------------------------
// computeSourceWeight
// ---------------------------------------------------------------------------
describe('computeSourceWeight', () => {
  it('gives high weight to pro-gov source reporting negative about gov', () => {
    const source = makeSource({
      biasDirection: 'pro-government',
      reliabilityScore: 0.8,
      signalWeight: 1.0,
    });
    const weight = computeSourceWeight(source, 'negative', true);
    // Expected: 0.8 * 2.5 * 1.0 = 2.0
    expect(weight).toBeCloseTo(2.0, 1);
  });

  it('gives low weight to pro-gov source reporting positive about gov', () => {
    const source = makeSource({
      biasDirection: 'pro-government',
      reliabilityScore: 0.8,
      signalWeight: 1.0,
    });
    const weight = computeSourceWeight(source, 'positive', true);
    // Expected: 0.8 * 0.5 * 1.0 = 0.4
    expect(weight).toBeCloseTo(0.4, 1);
  });

  it('gives high weight to anti-gov source reporting positive about gov', () => {
    const source = makeSource({
      biasDirection: 'anti-government',
      reliabilityScore: 0.9,
      signalWeight: 1.0,
    });
    const weight = computeSourceWeight(source, 'positive', true);
    // Expected: 0.9 * 2.5 * 1.0 = 2.25
    expect(weight).toBeCloseTo(2.25, 1);
  });

  it('gives low weight to anti-gov source reporting negative about gov', () => {
    const source = makeSource({
      biasDirection: 'anti-government',
      reliabilityScore: 0.9,
      signalWeight: 1.0,
    });
    const weight = computeSourceWeight(source, 'negative', true);
    // Expected: 0.9 * 0.5 * 1.0 = 0.45
    expect(weight).toBeCloseTo(0.45, 1);
  });

  it('gives neutral multiplier for neutral source about gov', () => {
    const source = makeSource({
      biasDirection: 'neutral',
      reliabilityScore: 0.85,
      signalWeight: 1.0,
    });
    const weight = computeSourceWeight(source, 'positive', true);
    // Expected: 0.85 * 1.0 * 1.0 = 0.85
    expect(weight).toBeCloseTo(0.85, 1);
  });

  it('gives neutral multiplier when not about government', () => {
    const source = makeSource({
      biasDirection: 'pro-government',
      reliabilityScore: 0.7,
      signalWeight: 0.8,
    });
    const weight = computeSourceWeight(source, 'negative', false);
    // Not about gov → multiplier 1.0 → 0.7 * 1.0 * 0.8 = 0.56
    expect(weight).toBeCloseTo(0.56, 1);
  });

  it('factors in signalWeight', () => {
    const source = makeSource({
      biasDirection: 'neutral',
      reliabilityScore: 0.8,
      signalWeight: 0.5,
    });
    const weight = computeSourceWeight(source, 'positive', false);
    // 0.8 * 1.0 * 0.5 = 0.4
    expect(weight).toBeCloseTo(0.4, 1);
  });
});

// ---------------------------------------------------------------------------
// classifySentimentTypes
// ---------------------------------------------------------------------------
describe('classifySentimentTypes', () => {
  it('detects fear from fearful English text', () => {
    const result = classifySentimentTypes(
      'There is great fear and anxiety about the dangerous threat to safety'
    );
    const fear = result.find((r) => r.type === 'fear');
    expect(fear).toBeDefined();
    expect(fear!.intensity).toBeGreaterThan(0);
  });

  it('detects hope from hopeful text', () => {
    const result = classifySentimentTypes(
      'There is tremendous hope and optimism about the promising future and bright opportunity'
    );
    const hope = result.find((r) => r.type === 'hope');
    expect(hope).toBeDefined();
    expect(hope!.intensity).toBeGreaterThan(0);
  });

  it('detects anger from angry text', () => {
    const result = classifySentimentTypes(
      'People are furious and enraged by the outrage and condemn the injustice'
    );
    const anger = result.find((r) => r.type === 'anger');
    expect(anger).toBeDefined();
    expect(anger!.intensity).toBeGreaterThan(0);
  });

  it('detects Bahasa Indonesia sentiment types', () => {
    const result = classifySentimentTypes(
      'Masyarakat sangat takut dan khawatir akan ancaman bahaya ini'
    );
    const fear = result.find((r) => r.type === 'fear');
    expect(fear).toBeDefined();
    expect(fear!.intensity).toBeGreaterThan(0);
  });

  it('returns sorted by intensity descending', () => {
    const result = classifySentimentTypes(
      'fear danger threat alarm panic worried concerned hope optimism'
    );
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].intensity).toBeGreaterThanOrEqual(result[i].intensity);
    }
  });

  it('detects mixed emotions', () => {
    const result = classifySentimentTypes(
      'There is fear and danger but also hope and promising signs, making people confused and uncertain'
    );
    const detected = result.filter((r) => r.intensity > 0);
    expect(detected.length).toBeGreaterThanOrEqual(2);
  });

  it('defaults to apathy when no sentiment signals found', () => {
    const result = classifySentimentTypes(
      'The meeting was held at the office building yesterday afternoon'
    );
    const apathy = result.find((r) => r.type === 'apathy');
    expect(apathy).toBeDefined();
    expect(apathy!.intensity).toBeCloseTo(0.3, 1);
    expect(apathy!.confidence).toBeCloseTo(0.2, 1);
  });

  it('caps confidence at 0.85', () => {
    const result = classifySentimentTypes(
      'fear afraid worried concern threat danger risk alarm panic dread anxiety nervous terror unsafe'
    );
    for (const entry of result) {
      expect(entry.confidence).toBeLessThanOrEqual(0.85);
    }
  });

  it('returns all 8 sentiment types', () => {
    const result = classifySentimentTypes('some text with fear and hope');
    expect(result.length).toBe(8);
    const types = result.map((r) => r.type);
    expect(types).toContain('fear');
    expect(types).toContain('hope');
    expect(types).toContain('anger');
    expect(types).toContain('trust');
    expect(types).toContain('pride');
    expect(types).toContain('confusion');
    expect(types).toContain('urgency');
    expect(types).toContain('apathy');
  });
});
