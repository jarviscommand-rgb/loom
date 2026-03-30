import { describe, it, expect } from 'vitest';
import { classifyCategory, classifyAllCategories } from './category-classifier';

// ---------------------------------------------------------------------------
// classifyCategory
// ---------------------------------------------------------------------------
describe('classifyCategory', () => {
  it('classifies political content', () => {
    const result = classifyCategory(
      'President announces new cabinet reshuffle',
      'The president held a press conference to announce a major cabinet reshuffle, including new ministers for defense and education. Political parties in the coalition expressed support.'
    );
    expect(result.category).toBe('political');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThanOrEqual(0.95);
  });

  it('classifies economic content', () => {
    const result = classifyCategory(
      'GDP growth exceeds expectations as trade surplus widens',
      'Indonesia GDP grew 5.2% driven by strong exports. The stock market rallied and Bank Indonesia maintained interest rates. Investment inflows increased by 12%.'
    );
    expect(result.category).toBe('economic');
  });

  it('classifies social content', () => {
    const result = classifyCategory(
      'Education reform sparks community debate',
      'The new education policy has sparked debate across communities. Health workers and labor unions have weighed in on the welfare implications of the changes.'
    );
    expect(result.category).toBe('social');
  });

  it('classifies corruption content', () => {
    const result = classifyCategory(
      'KPK arrests officials on bribery charges',
      'The anti-corruption commission KPK has arrested several officials on charges of bribery and money laundering. The corruption scandal has rocked the government.'
    );
    expect(result.category).toBe('corruption');
  });

  it('classifies technology content', () => {
    const result = classifyCategory(
      'New AI startup becomes unicorn',
      'The fintech startup leveraging AI and blockchain technology has reached unicorn status. The digital platform serves millions through e-commerce innovation.'
    );
    expect(result.category).toBe('technology');
  });

  it('classifies Bahasa Indonesia political text', () => {
    const result = classifyCategory(
      'Presiden umumkan kabinet baru',
      'Presiden mengumumkan susunan kabinet baru di istana. Partai koalisi pemerintah menyatakan dukungan penuh terhadap kebijakan ini. DPR akan membahas.'
    );
    expect(result.category).toBe('political');
  });

  it('classifies Bahasa Indonesia economic text', () => {
    const result = classifyCategory(
      'Pertumbuhan ekonomi meningkat',
      'PDB Indonesia tumbuh didorong oleh investasi dan perdagangan. Bank Indonesia menjaga stabilitas rupiah. Pasar saham IHSG menguat.'
    );
    expect(result.category).toBe('economic');
  });

  it('returns political as default for ambiguous text', () => {
    const result = classifyCategory(
      'General note on recent matters',
      'No significant items were noted by the observers on duty.'
    );
    expect(result.category).toBe('political'); // fallback when no keywords match
  });

  it('handles empty content', () => {
    const result = classifyCategory('', '');
    expect(result.category).toBe('political'); // fallback
    expect(result).toHaveProperty('confidence');
  });

  it('caps confidence at 0.95', () => {
    const result = classifyCategory(
      'Election election election president parliament',
      'election president parliament coalition party minister cabinet policy government governor mayor political pemilu presiden parlemen koalisi partai menteri kabinet kebijakan pemerintah gubernur walikota politik DPR MPR pilkada'
    );
    expect(result.confidence).toBeLessThanOrEqual(0.95);
  });

  it('gives title keywords extra weight', () => {
    // Title says political, body says economic
    const result = classifyCategory(
      'President announces coalition agreement',
      'The economy GDP inflation trade investment market stock bank currency.'
    );
    // Political keywords in title are weighted 2x, should dominate
    expect(result.category).toBe('political');
  });
});

// ---------------------------------------------------------------------------
// classifyAllCategories
// ---------------------------------------------------------------------------
describe('classifyAllCategories', () => {
  it('returns multiple categories for mixed content', () => {
    const result = classifyAllCategories(
      'President discusses economic policy and corruption crackdown',
      'The president outlined new economic policies to boost GDP growth and investment while launching an anti-corruption campaign with KPK involvement.'
    );
    expect(result.length).toBeGreaterThanOrEqual(2);
    const categories = result.map((r) => r.category);
    expect(categories).toContain('political');
    expect(categories).toContain('economic');
  });

  it('returns categories sorted by score descending', () => {
    const result = classifyAllCategories(
      'Government economic policy',
      'The president announced new economic policy regarding GDP growth, trade and investment, alongside political coalition discussions.'
    );
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].score).toBeGreaterThanOrEqual(result[i].score);
    }
  });

  it('only returns categories with score > 0', () => {
    const result = classifyAllCategories(
      'Election results',
      'The election results show the president winning with coalition support.'
    );
    for (const entry of result) {
      expect(entry.score).toBeGreaterThan(0);
    }
  });

  it('returns raw hit counts, not normalized', () => {
    const result = classifyAllCategories(
      'Economy GDP trade investment',
      'Economy GDP trade investment market stock bank currency'
    );
    const econ = result.find((r) => r.category === 'economic');
    expect(econ).toBeDefined();
    expect(econ!.score).toBeGreaterThan(1); // raw counts, not 0-1
  });
});
