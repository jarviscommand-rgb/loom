import { describe, it, expect, beforeEach } from 'vitest';
import { SentimentEngine } from './sentiment-engine.js';
import type { ArticleInput } from './sentiment-engine.js';

describe('SentimentEngine', () => {
  let engine: SentimentEngine;

  beforeEach(() => {
    engine = new SentimentEngine();
  });

  describe('ingestArticles', () => {
    it('should ingest and analyze a single article', () => {
      const input: ArticleInput = {
        title: 'President Prabowo announces economic reform package',
        content:
          'President Prabowo Subianto announced a comprehensive economic reform package ' +
          'aimed at boosting growth and attracting foreign investment. The reforms include ' +
          'tax incentives for digital companies and streamlined regulations for investors.',
        sourceId: 'kompas',
        publishedAt: '2025-04-01T08:00:00Z',
        language: 'id',
      };

      const results = engine.ingestArticles([input]);

      expect(results).toHaveLength(1);
      const article = results[0];

      // Should have all required fields
      expect(article.id).toBeDefined();
      expect(article.title).toBe(input.title);
      expect(article.sourceId).toBe('kompas');
      expect(article.category).toBeDefined();
      expect(article.sentiment).toBeDefined();
      expect(article.sentiment.overall).toBeGreaterThanOrEqual(-1);
      expect(article.sentiment.overall).toBeLessThanOrEqual(1);
      expect(article.sentimentTypes).toBeDefined();
      expect(article.sentimentTypes.length).toBeGreaterThan(0);
      expect(article.nis).toBeDefined();
      expect(article.nis.score).toBeGreaterThanOrEqual(0);
      expect(article.nis.score).toBeLessThanOrEqual(100);
      expect(article.entities).toBeDefined();
      expect(article.effectiveness).toBeDefined();
      expect(article.audienceImpact).toBeDefined();
      expect(article.downstreamEffects).toBeDefined();
    });

    it('should handle unknown source gracefully', () => {
      const input: ArticleInput = {
        title: 'Test article from unknown source',
        content: 'Some content about the economy and growth prospects.',
        sourceId: 'unknown-source',
        language: 'en',
      };

      const results = engine.ingestArticles([input]);
      expect(results).toHaveLength(1);
      expect(results[0].sourceId).toBe('unknown-source');
    });

    it('should ingest multiple articles in batch', () => {
      const inputs: ArticleInput[] = [
        { title: 'Article 1', content: 'Good news about success and growth', sourceId: 'kompas' },
        { title: 'Article 2', content: 'Bad news about crisis and scandal', sourceId: 'tempo' },
        { title: 'Article 3', content: 'Neutral update on routine matters', sourceId: 'antara' },
      ];

      const results = engine.ingestArticles(inputs);
      expect(results).toHaveLength(3);
      // All should have unique IDs
      const ids = new Set(results.map((r) => r.id));
      expect(ids.size).toBe(3);
    });

    it('should detect government-related articles', () => {
      const input: ArticleInput = {
        title: 'Prabowo cabinet reshuffle incoming',
        content: 'The president is expected to reshuffle the cabinet next week.',
        sourceId: 'tempo',
        language: 'id',
      };

      const results = engine.ingestArticles([input]);
      // Should detect Prabowo as an entity
      const prabowo = results[0].entities.find((e) => e.name.includes('Prabowo'));
      expect(prabowo).toBeDefined();
    });

    it('should categorize articles correctly', () => {
      const economic: ArticleInput = {
        title: 'Bank Indonesia raises interest rate to combat inflation',
        content:
          'Bank Indonesia raised the benchmark rate by 25 basis points to control inflation.',
        sourceId: 'kompas',
      };

      const political: ArticleInput = {
        title: 'DPR passes controversial election bill',
        content: 'Parliament approved the new election law amid protests from opposition parties.',
        sourceId: 'tempo',
      };

      const ecoResult = engine.ingestArticles([economic])[0];
      const polResult = engine.ingestArticles([political])[0];

      expect(ecoResult.category).toBe('economic');
      expect(polResult.category).toBe('political');
    });
  });

  describe('getArticles', () => {
    it('should return articles sorted by date descending', () => {
      engine.ingestArticles([
        {
          title: 'Old',
          content: 'Old news',
          sourceId: 'kompas',
          publishedAt: '2025-01-01T00:00:00Z',
        },
        {
          title: 'New',
          content: 'New news',
          sourceId: 'kompas',
          publishedAt: '2025-04-01T00:00:00Z',
        },
        {
          title: 'Mid',
          content: 'Mid news',
          sourceId: 'kompas',
          publishedAt: '2025-02-15T00:00:00Z',
        },
      ]);

      const articles = engine.getArticles();
      expect(articles).toHaveLength(3);
      expect(articles[0].title).toBe('New');
      expect(articles[2].title).toBe('Old');
    });
  });

  describe('getArticleById', () => {
    it('should return article by ID', () => {
      const results = engine.ingestArticles([
        { title: 'Test article', content: 'Content', sourceId: 'kompas' },
      ]);

      const article = engine.getArticleById(results[0].id);
      expect(article).toBeDefined();
      expect(article?.title).toBe('Test article');
    });

    it('should return undefined for unknown ID', () => {
      expect(engine.getArticleById('non-existent')).toBeUndefined();
    });
  });

  describe('getSources', () => {
    it('should return all registered sources', () => {
      const sources = engine.getSources();
      expect(sources.length).toBeGreaterThanOrEqual(11); // 11 Indonesian sources
    });
  });

  describe('getSourceById', () => {
    it('should return known sources', () => {
      expect(engine.getSourceById('kompas')).toBeDefined();
      expect(engine.getSourceById('tempo')).toBeDefined();
      expect(engine.getSourceById('antara')).toBeDefined();
    });

    it('should return undefined for unknown source', () => {
      expect(engine.getSourceById('non-existent')).toBeUndefined();
    });
  });

  describe('getCategoryBreakdown', () => {
    it('should return category breakdown', () => {
      engine.ingestArticles([
        { title: 'Economic growth', content: 'GDP growth and investment', sourceId: 'kompas' },
        { title: 'Economic reform', content: 'Tax reform and fiscal policy', sourceId: 'tempo' },
        { title: 'Political news', content: 'Election and parliament DPR', sourceId: 'antara' },
      ]);

      const breakdown = engine.getCategoryBreakdown();
      expect(breakdown.length).toBeGreaterThan(0);
      for (const cat of breakdown) {
        expect(cat.category).toBeDefined();
        expect(cat.articleCount).toBeGreaterThan(0);
        expect(typeof cat.avgSentiment).toBe('number');
        expect(typeof cat.avgNIS).toBe('number');
      }
    });
  });

  describe('getTimeline', () => {
    it('should build timeline for a mentioned entity', () => {
      engine.ingestArticles([
        {
          title: 'Prabowo announces new policy',
          content: 'President Prabowo made a major policy announcement.',
          sourceId: 'kompas',
          publishedAt: '2025-04-01T08:00:00Z',
        },
        {
          title: 'Prabowo visits Japan',
          content: 'Prabowo traveled to Japan for diplomatic talks.',
          sourceId: 'tempo',
          publishedAt: '2025-04-05T08:00:00Z',
        },
      ]);

      const timeline = engine.getTimeline('Prabowo');
      expect(timeline.entityName).toBe('Prabowo');
      expect(timeline.dataPoints.length).toBeGreaterThan(0);
    });

    it('should return empty timeline for unknown entity', () => {
      const timeline = engine.getTimeline('Unknown Person');
      expect(timeline.dataPoints).toHaveLength(0);
      expect(timeline.trend).toBe('stable');
    });
  });

  describe('getDashboard', () => {
    it('should return valid dashboard data', () => {
      engine.ingestArticles([
        { title: 'Test', content: 'Economic growth and success', sourceId: 'kompas' },
      ]);

      const dashboard = engine.getDashboard('ID');
      expect(dashboard.country).toBe('ID');
      expect(typeof dashboard.currentSentiment).toBe('number');
      expect(dashboard.trend).toBeDefined();
      expect(dashboard.totalArticles).toBe(1);
      expect(dashboard.categoryBreakdown.length).toBeGreaterThan(0);
    });

    it('should handle empty state', () => {
      const dashboard = engine.getDashboard('ID');
      expect(dashboard.totalArticles).toBe(0);
      expect(dashboard.currentSentiment).toBe(0);
    });
  });

  describe('predict', () => {
    it('should return prediction for known category', () => {
      engine.ingestArticles([
        {
          title: 'Past economic event',
          content: 'GDP growth exceeded expectations',
          sourceId: 'kompas',
          publishedAt: '2025-01-01T00:00:00Z',
        },
        {
          title: 'Another economic event',
          content: 'Investment growth continues',
          sourceId: 'tempo',
          publishedAt: '2025-02-01T00:00:00Z',
        },
      ]);

      const prediction = engine.predict({
        description: 'New economic stimulus package announced',
        category: 'economic',
        entities: [],
      });

      expect(typeof prediction.predictedDelta).toBe('number');
      expect(prediction.confidenceInterval).toHaveLength(2);
      expect(prediction.explanation).toBeDefined();
      expect(prediction.sentimentTypes.length).toBeGreaterThan(0);
    });

    it('should return low-confidence prediction for empty data', () => {
      const prediction = engine.predict({
        description: 'Something completely new',
        category: 'military',
        entities: ['Unknown Entity'],
      });

      expect(prediction.confidence).toBeLessThanOrEqual(0.3);
    });
  });

  describe('loadDemoData', () => {
    it('should load Indonesian demo articles', () => {
      const count = engine.loadDemoData();
      expect(count).toBeGreaterThanOrEqual(20);

      const articles = engine.getArticles();
      expect(articles.length).toBeGreaterThanOrEqual(20);

      // Should have articles from multiple sources
      const sources = new Set(articles.map((a) => a.sourceId));
      expect(sources.size).toBeGreaterThan(5);
    });
  });

  describe('clear', () => {
    it('should clear all data', () => {
      engine.loadDemoData();
      expect(engine.getArticles().length).toBeGreaterThan(0);

      engine.clear();
      expect(engine.getArticles().length).toBe(0);
    });
  });

  describe('source-weighted sentiment', () => {
    it('should weight Tempo higher than Antara for unexpected sentiment', () => {
      // Tempo (opposition/independent) reporting positively on government = HIGH signal
      // Antara (state media) reporting positively on government = expected, LOW signal
      const tempoArticle: ArticleInput = {
        title: 'Prabowo reform praised by independent observers',
        content: 'President Prabowo government reform success achievement praised.',
        sourceId: 'tempo',
      };

      const antaraArticle: ArticleInput = {
        title: 'Prabowo reform praised by government spokesperson',
        content: 'President Prabowo government reform success achievement praised.',
        sourceId: 'antara',
      };

      const [tempoResult] = engine.ingestArticles([tempoArticle]);
      const [antaraResult] = engine.ingestArticles([antaraArticle]);

      // Tempo's signal weight should be higher (unexpected positive from critical source)
      expect(tempoResult.sentiment.sourceWeight).toBeGreaterThan(
        antaraResult.sentiment.sourceWeight
      );
    });
  });
});
