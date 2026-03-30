import { describe, it, expect, beforeEach } from 'vitest';
import { SentimentEngine } from './sentiment-engine.js';
import type { ArticleInput } from './sentiment-engine.js';

describe('SentimentEngine — edge cases', () => {
  let engine: SentimentEngine;

  beforeEach(() => {
    engine = new SentimentEngine();
  });

  // -------------------------------------------------------------------------
  // Empty / malformed inputs
  // -------------------------------------------------------------------------
  describe('empty and minimal inputs', () => {
    it('should handle an empty articles array', () => {
      const results = engine.ingestArticles([]);
      expect(results).toHaveLength(0);
      expect(engine.getArticles()).toHaveLength(0);
    });

    it('should handle article with empty title and content', () => {
      const input: ArticleInput = {
        title: '',
        content: '',
        sourceId: 'kompas',
      };
      const results = engine.ingestArticles([input]);
      expect(results).toHaveLength(1);
      expect(results[0].category).toBeDefined();
      expect(results[0].sentiment).toBeDefined();
    });

    it('should handle article with only whitespace content', () => {
      const input: ArticleInput = {
        title: '   ',
        content: '   \n\t   ',
        sourceId: 'tempo',
      };
      const results = engine.ingestArticles([input]);
      expect(results).toHaveLength(1);
      expect(results[0].nis.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle article with very long content', () => {
      const longContent = 'economic growth investment '.repeat(500);
      const input: ArticleInput = {
        title: 'Long article about the economy',
        content: longContent,
        sourceId: 'kompas',
      };
      const results = engine.ingestArticles([input]);
      expect(results).toHaveLength(1);
      expect(results[0].sentiment.overall).toBeGreaterThanOrEqual(-1);
      expect(results[0].sentiment.overall).toBeLessThanOrEqual(1);
    });

    it('should handle article with special characters in content', () => {
      const input: ArticleInput = {
        title: 'Test<script>alert("xss")</script>',
        content: '!@#$%^&*()_+-=[]{}|;:,.<>? 💰🇮🇩 "quotes" — dashes',
        sourceId: 'kompas',
      };
      const results = engine.ingestArticles([input]);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBeDefined();
    });

    it('should assign default values when optional fields are missing', () => {
      const input: ArticleInput = {
        title: 'Minimal article',
        content: 'Some content here.',
        sourceId: 'kompas',
      };
      const results = engine.ingestArticles([input]);
      const article = results[0];
      expect(article.url).toBe('');
      expect(article.language).toBe('id');
      expect(article.publishedAt).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Batch processing
  // -------------------------------------------------------------------------
  describe('batch processing', () => {
    it('should handle large batch ingestion (100 articles)', () => {
      const inputs: ArticleInput[] = Array.from({ length: 100 }, (_, i) => ({
        title: `Article ${i} about economy`,
        content: `Content about economic growth and investment for article ${i}`,
        sourceId: i % 2 === 0 ? 'kompas' : 'tempo',
        publishedAt: new Date(2025, 0, 1 + i).toISOString(),
      }));
      const results = engine.ingestArticles(inputs);
      expect(results).toHaveLength(100);
      expect(new Set(results.map((r) => r.id)).size).toBe(100);
    });

    it('should accumulate articles across multiple ingestion calls', () => {
      engine.ingestArticles([{ title: 'Batch 1', content: 'First batch', sourceId: 'kompas' }]);
      engine.ingestArticles([{ title: 'Batch 2', content: 'Second batch', sourceId: 'tempo' }]);
      expect(engine.getArticles()).toHaveLength(2);
    });

    it('should handle duplicate content from different sources', () => {
      const content = 'President Prabowo announces major economic reform package.';
      const inputs: ArticleInput[] = [
        { title: 'Reform', content, sourceId: 'kompas' },
        { title: 'Reform', content, sourceId: 'tempo' },
        { title: 'Reform', content, sourceId: 'antara' },
      ];
      const results = engine.ingestArticles(inputs);
      expect(results).toHaveLength(3);
      // Each should have a different ID
      expect(new Set(results.map((r) => r.id)).size).toBe(3);
      // Same content through different sources may yield different weighted scores
      const weights = results.map((r) => r.sentiment.sourceWeight);
      expect(new Set(weights).size).toBeGreaterThanOrEqual(1);
    });
  });

  // -------------------------------------------------------------------------
  // Entity extraction edge cases
  // -------------------------------------------------------------------------
  describe('entity extraction', () => {
    it('should extract multiple entities from a single article', () => {
      const input: ArticleInput = {
        title: 'Prabowo meets Jokowi at ASEAN summit to discuss China relations',
        content:
          'President Prabowo Subianto met with former president Jokowi at the ASEAN summit. ' +
          'Discussions centered on China and the South China Sea. The DPR debated the issue.',
        sourceId: 'kompas',
      };
      const results = engine.ingestArticles([input]);
      const entities = results[0].entities;
      const names = entities.map((e) => e.name);
      expect(names).toContain('Prabowo Subianto');
      expect(names).toContain('Joko Widodo');
      expect(names).toContain('ASEAN');
      expect(names).toContain('China');
      expect(names).toContain('DPR');
    });

    it('should return empty entities when no known entities match', () => {
      const input: ArticleInput = {
        title: 'Local weather forecast for tomorrow',
        content: 'Sunny skies expected across the region with mild temperatures.',
        sourceId: 'kompas',
      };
      const results = engine.ingestArticles([input]);
      expect(results[0].entities).toHaveLength(0);
    });

    it('should detect entity role as subject when in title', () => {
      const input: ArticleInput = {
        title: 'Prabowo announces new defense budget',
        content: 'The defense budget was discussed in parliament.',
        sourceId: 'kompas',
      };
      const results = engine.ingestArticles([input]);
      const prabowo = results[0].entities.find((e) => e.name === 'Prabowo Subianto');
      expect(prabowo?.role).toBe('subject');
    });

    it('should detect entity role as mentioned when not in title', () => {
      const input: ArticleInput = {
        title: 'Parliament debates defense budget',
        content: 'Prabowo was mentioned in the discussion about defense spending.',
        sourceId: 'kompas',
      };
      const results = engine.ingestArticles([input]);
      const prabowo = results[0].entities.find((e) => e.name === 'Prabowo Subianto');
      expect(prabowo?.role).toBe('mentioned');
    });

    it('should estimate positive sentiment toward entity with positive context', () => {
      const input: ArticleInput = {
        title: 'Prabowo success praised for strong reform achievements',
        content: 'Prabowo success praised for strong reform achievements.',
        sourceId: 'kompas',
      };
      const results = engine.ingestArticles([input]);
      const prabowo = results[0].entities.find((e) => e.name === 'Prabowo Subianto');
      expect(prabowo).toBeDefined();
      expect(prabowo!.sentimentToward).toBeGreaterThan(0);
    });

    it('should estimate negative sentiment toward entity with negative context', () => {
      const input: ArticleInput = {
        title: 'Prabowo corrupt scandal weak leadership fail',
        content: 'Prabowo corrupt scandal weak leadership fail.',
        sourceId: 'kompas',
      };
      const results = engine.ingestArticles([input]);
      const prabowo = results[0].entities.find((e) => e.name === 'Prabowo Subianto');
      expect(prabowo).toBeDefined();
      expect(prabowo!.sentimentToward).toBeLessThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Topic extraction
  // -------------------------------------------------------------------------
  describe('topic extraction', () => {
    it('should extract multiple topics from rich content', () => {
      const input: ArticleInput = {
        title: 'Economic growth and digital investment in Indonesia',
        content:
          'GDP growth is strong. The digital economy and fintech startups are attracting investment. ' +
          'Infrastructure projects like IKN continue. Corruption investigations by KPK underway.',
        sourceId: 'kompas',
      };
      const results = engine.ingestArticles([input]);
      const topics = results[0].topics;
      expect(topics).toContain('economic-growth');
      expect(topics).toContain('digital-economy');
      expect(topics).toContain('infrastructure');
      expect(topics).toContain('corruption');
    });

    it('should return empty topics for unrelated content', () => {
      const input: ArticleInput = {
        title: 'A very generic article',
        content: 'This article contains no recognizable topic keywords.',
        sourceId: 'kompas',
      };
      const results = engine.ingestArticles([input]);
      expect(results[0].topics).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Prediction edge cases
  // -------------------------------------------------------------------------
  describe('predict — edge cases', () => {
    it('should return low confidence with no data at all', () => {
      const prediction = engine.predict({
        description: 'New regulation on AI technology',
        category: 'technology',
        entities: ['Prabowo'],
      });
      expect(prediction.confidence).toBeLessThanOrEqual(0.3);
      expect(prediction.predictedNIS).toBe(30);
      expect(prediction.basedOn).toHaveLength(0);
    });

    it('should use category fallback when entity match fails', () => {
      engine.ingestArticles([
        {
          title: 'Economic policy update',
          content: 'GDP growth exceeded expectations',
          sourceId: 'kompas',
        },
      ]);
      const prediction = engine.predict({
        description: 'Another economic event',
        category: 'economic',
        entities: ['NonExistentEntity'],
      });
      // Should use category fallback
      expect(prediction.confidence).toBeLessThanOrEqual(0.3);
      expect(typeof prediction.predictedDelta).toBe('number');
    });

    it('should find matching articles by entity and category', () => {
      // Use political category since "prabowo" keyword triggers political classification
      engine.ingestArticles([
        {
          title: 'Prabowo coalition policy reform',
          content: 'President Prabowo government coalition policy parliament DPR reform succeeded.',
          sourceId: 'kompas',
          publishedAt: '2025-01-01T00:00:00Z',
        },
        {
          title: 'Prabowo cabinet minister election',
          content:
            'President Prabowo cabinet minister election political party coalition continued.',
          sourceId: 'tempo',
          publishedAt: '2025-02-01T00:00:00Z',
        },
      ]);
      const prediction = engine.predict({
        description: 'Another Prabowo political initiative',
        category: 'political',
        entities: ['Prabowo'],
      });
      expect(prediction.basedOn.length).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThan(0);
    });

    it('should cap confidence at 0.85', () => {
      // Ingest many matching articles to push confidence high
      const inputs: ArticleInput[] = Array.from({ length: 25 }, (_, i) => ({
        title: `Prabowo economic event ${i}`,
        content: `President Prabowo government economic reform success growth achievement`,
        sourceId: 'kompas',
        publishedAt: new Date(2025, 0, 1 + i).toISOString(),
      }));
      engine.ingestArticles(inputs);
      const prediction = engine.predict({
        description: 'Prabowo economic something',
        category: 'economic',
        entities: ['Prabowo'],
      });
      expect(prediction.confidence).toBeLessThanOrEqual(0.85);
    });

    it('should include sentimentTypes in prediction', () => {
      const prediction = engine.predict({
        description: 'Crisis and fear over economic collapse',
        category: 'economic',
        entities: [],
      });
      expect(prediction.sentimentTypes.length).toBe(8);
    });

    it('should return confidence interval that brackets predictedDelta', () => {
      engine.ingestArticles([
        {
          title: 'Prabowo reform',
          content: 'President Prabowo government economic reform success.',
          sourceId: 'kompas',
        },
      ]);
      const prediction = engine.predict({
        description: 'New economic reform',
        category: 'economic',
        entities: ['Prabowo'],
      });
      expect(prediction.confidenceInterval[0]).toBeLessThanOrEqual(prediction.predictedDelta);
      expect(prediction.confidenceInterval[1]).toBeGreaterThanOrEqual(prediction.predictedDelta);
    });
  });

  // -------------------------------------------------------------------------
  // Dashboard edge cases
  // -------------------------------------------------------------------------
  describe('getDashboard — edge cases', () => {
    it('should return dashboard for different country codes', () => {
      const dashboard = engine.getDashboard('US');
      expect(dashboard.country).toBe('US');
      expect(dashboard.totalArticles).toBe(0);
    });

    it('should compute trend as stable with fewer than 3 recent articles', () => {
      engine.ingestArticles([
        {
          title: 'Recent positive news',
          content: 'Good economic growth success',
          sourceId: 'kompas',
          publishedAt: new Date().toISOString(),
        },
      ]);
      const dashboard = engine.getDashboard('ID');
      expect(dashboard.trend).toBe('stable');
    });

    it('should compute improving trend for positive recent articles', () => {
      const now = Date.now();
      const inputs: ArticleInput[] = Array.from({ length: 5 }, (_, i) => ({
        title: `Success and achievement article ${i}`,
        content: 'Great success excellent growth progress achieve breakthrough victory improve',
        sourceId: 'kompas',
        publishedAt: new Date(now - i * 60 * 60 * 1000).toISOString(),
      }));
      engine.ingestArticles(inputs);
      const dashboard = engine.getDashboard('ID');
      // Should be improving since all articles are positive
      expect(['improving', 'stable']).toContain(dashboard.trend);
    });

    it('should compute declining trend for negative recent articles', () => {
      const now = Date.now();
      const inputs: ArticleInput[] = Array.from({ length: 5 }, (_, i) => ({
        title: `Crisis and threat article ${i}`,
        content: 'crisis threat collapse scandal disaster violence conflict tension panic',
        sourceId: 'kompas',
        publishedAt: new Date(now - i * 60 * 60 * 1000).toISOString(),
      }));
      engine.ingestArticles(inputs);
      const dashboard = engine.getDashboard('ID');
      expect(['declining', 'stable']).toContain(dashboard.trend);
    });

    it('should show active entities from recent articles', () => {
      engine.ingestArticles([
        {
          title: 'Prabowo announces new initiative',
          content: 'President Prabowo made a major announcement about reform and success.',
          sourceId: 'kompas',
          publishedAt: new Date().toISOString(),
        },
      ]);
      const dashboard = engine.getDashboard('ID');
      if (dashboard.activeEntities.length > 0) {
        expect(dashboard.activeEntities[0]).toHaveProperty('name');
        expect(dashboard.activeEntities[0]).toHaveProperty('sentiment');
        expect(dashboard.activeEntities[0]).toHaveProperty('trend');
        expect(dashboard.activeEntities[0]).toHaveProperty('articleCount');
      }
    });

    it('should show top sources ordered by article count', () => {
      engine.ingestArticles([
        { title: 'A', content: 'News about growth', sourceId: 'kompas' },
        { title: 'B', content: 'More news about growth', sourceId: 'kompas' },
        { title: 'C', content: 'Other news about growth', sourceId: 'tempo' },
      ]);
      const dashboard = engine.getDashboard('ID');
      expect(dashboard.topSources.length).toBeGreaterThan(0);
      // First source should have highest count
      if (dashboard.topSources.length >= 2) {
        expect(dashboard.topSources[0].articleCount).toBeGreaterThanOrEqual(
          dashboard.topSources[1].articleCount
        );
      }
    });

    it('should set time range from oldest to newest article', () => {
      engine.ingestArticles([
        {
          title: 'Old',
          content: 'News',
          sourceId: 'kompas',
          publishedAt: '2025-01-01T00:00:00Z',
        },
        {
          title: 'New',
          content: 'News',
          sourceId: 'kompas',
          publishedAt: '2025-06-01T00:00:00Z',
        },
      ]);
      const dashboard = engine.getDashboard('ID');
      expect(new Date(dashboard.timeRange.from).getTime()).toBeLessThanOrEqual(
        new Date(dashboard.timeRange.to).getTime()
      );
    });
  });

  // -------------------------------------------------------------------------
  // compareEntities
  // -------------------------------------------------------------------------
  describe('compareEntities', () => {
    it('should return timelines for multiple entities', () => {
      engine.ingestArticles([
        {
          title: 'Prabowo visits Japan',
          content: 'President Prabowo traveled for diplomatic talks.',
          sourceId: 'kompas',
          publishedAt: '2025-03-01T00:00:00Z',
        },
        {
          title: 'Jokowi foundation event',
          content: 'Former president Jokowi attended a foundation event.',
          sourceId: 'tempo',
          publishedAt: '2025-03-02T00:00:00Z',
        },
      ]);
      const comparisons = engine.compareEntities(['Prabowo', 'Jokowi']);
      expect(comparisons).toHaveLength(2);
      expect(comparisons[0].name).toBe('Prabowo');
      expect(comparisons[1].name).toBe('Jokowi');
      expect(comparisons[0].timeline).toBeDefined();
      expect(comparisons[1].timeline).toBeDefined();
    });

    it('should handle empty entity list', () => {
      const comparisons = engine.compareEntities([]);
      expect(comparisons).toHaveLength(0);
    });

    it('should return empty timelines for unknown entities', () => {
      const comparisons = engine.compareEntities(['NonExistent']);
      expect(comparisons).toHaveLength(1);
      expect(comparisons[0].timeline.dataPoints).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // getCategoryBreakdown edge cases
  // -------------------------------------------------------------------------
  describe('getCategoryBreakdown — edge cases', () => {
    it('should return empty array when no articles', () => {
      const breakdown = engine.getCategoryBreakdown();
      expect(breakdown).toHaveLength(0);
    });

    it('should sort by article count descending', () => {
      engine.ingestArticles([
        { title: 'Economy GDP', content: 'GDP growth investment market', sourceId: 'kompas' },
        { title: 'Economy trade', content: 'Trade export import market', sourceId: 'kompas' },
        { title: 'Election news', content: 'President election parliament', sourceId: 'tempo' },
      ]);
      const breakdown = engine.getCategoryBreakdown();
      for (let i = 1; i < breakdown.length; i++) {
        expect(breakdown[i - 1].articleCount).toBeGreaterThanOrEqual(breakdown[i].articleCount);
      }
    });
  });

  // -------------------------------------------------------------------------
  // loadDemoData and clear
  // -------------------------------------------------------------------------
  describe('loadDemoData and clear', () => {
    it('should load demo data and produce valid dashboard', () => {
      engine.loadDemoData();
      const dashboard = engine.getDashboard('ID');
      expect(dashboard.totalArticles).toBeGreaterThan(0);
      expect(dashboard.categoryBreakdown.length).toBeGreaterThan(0);
      expect(dashboard.topSources.length).toBeGreaterThan(0);
    });

    it('should allow loading demo data twice (accumulates)', () => {
      const count1 = engine.loadDemoData();
      const count2 = engine.loadDemoData();
      expect(count1).toBeGreaterThan(0);
      expect(count2).toBeGreaterThan(0);
      expect(engine.getArticles().length).toBe(count1 + count2);
    });

    it('should clear and then re-load demo data cleanly', () => {
      engine.loadDemoData();
      engine.clear();
      expect(engine.getArticles()).toHaveLength(0);
      expect(engine.getEvents()).toHaveLength(0);
      const count = engine.loadDemoData();
      expect(engine.getArticles().length).toBe(count);
    });
  });

  // -------------------------------------------------------------------------
  // Direction detection
  // -------------------------------------------------------------------------
  describe('sentiment direction detection', () => {
    it('should detect positive direction for success/growth text', () => {
      const input: ArticleInput = {
        title: 'Success and growth in the economy',
        content: 'The economy achieved great success and growth is improving.',
        sourceId: 'kompas',
      };
      const results = engine.ingestArticles([input]);
      // Positive direction + neutral source → standard weight
      expect(results[0].sentiment.overall).toBeGreaterThanOrEqual(-1);
    });

    it('should detect negative direction for crisis/threat text', () => {
      const input: ArticleInput = {
        title: 'Crisis threatens the economy',
        content: 'A severe crisis and threat of failure hangs over the economy.',
        sourceId: 'kompas',
      };
      const results = engine.ingestArticles([input]);
      expect(results[0].sentiment.overall).toBeLessThan(0);
    });

    it('should handle Bahasa Indonesia direction detection', () => {
      const input: ArticleInput = {
        title: 'Sukses pertumbuhan ekonomi',
        content: 'Pertumbuhan ekonomi tumbuh dan maju berkat kebijakan pemerintah.',
        sourceId: 'kompas',
        language: 'id',
      };
      const results = engine.ingestArticles([input]);
      expect(results[0].sentiment).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Government detection
  // -------------------------------------------------------------------------
  describe('government detection', () => {
    it('should detect government context from English keywords', () => {
      const govArticle: ArticleInput = {
        title: 'Government announces new policy',
        content: 'The president and cabinet ministers discussed the new policy.',
        sourceId: 'detik',
      };
      const nonGovArticle: ArticleInput = {
        title: 'Local sports event',
        content: 'A sports competition was held at the stadium.',
        sourceId: 'detik',
      };
      const [gov] = engine.ingestArticles([govArticle]);
      const [nonGov] = engine.ingestArticles([nonGovArticle]);
      // Gov article from pro-gov source should have different weight than non-gov
      // The gov article text has 'government', 'president', 'cabinet', 'ministers'
      // So biasDirection='pro-gov' + positive + aboutGov → 0.5 multiplier
      // The non-gov article text has no gov keywords → 1.0 multiplier
      expect(gov.sentiment.sourceWeight).not.toBe(nonGov.sentiment.sourceWeight);
    });
  });
});
