import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import { createSentimentRoutes } from './sentiment-routes.js';
import { SentimentEngine } from '../sentiment-engine.js';
import { globalErrorHandler } from '../../middleware/error-handler.js';

/**
 * Helper: create an Express app wired up with the sentiment routes and error handler.
 */
function createTestApp(engine: SentimentEngine): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/sentiment', createSentimentRoutes(engine));
  app.use(globalErrorHandler);
  return app;
}

/**
 * Lightweight fetch wrapper for testing Express apps without supertest.
 * Starts the app on an ephemeral port, makes the request, then closes.
 */
async function testRequest(
  app: express.Express,
  method: string,
  path: string,
  body?: unknown
): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        reject(new Error('Failed to get server address'));
        return;
      }
      const port = addr.port;
      const url = `http://127.0.0.1:${port}${path}`;
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (body !== undefined) {
        options.body = JSON.stringify(body);
      }
      fetch(url, options)
        .then(async (res) => {
          const json = await res.json();
          server.close();
          resolve({ status: res.status, body: json });
        })
        .catch((err) => {
          server.close();
          reject(err);
        });
    });
  });
}

describe('Sentiment API Routes', () => {
  let engine: SentimentEngine;
  let app: express.Express;

  beforeEach(() => {
    engine = new SentimentEngine();
    app = createTestApp(engine);
  });

  // -------------------------------------------------------------------------
  // POST /sentiment/ingest
  // -------------------------------------------------------------------------
  describe('POST /sentiment/ingest', () => {
    it('should ingest articles and return results', async () => {
      const res = await testRequest(app, 'POST', '/sentiment/ingest', {
        articles: [
          {
            title: 'Economic growth soars',
            content: 'GDP growth exceeded expectations with strong investment.',
            sourceId: 'kompas',
          },
        ],
      });
      expect(res.status).toBe(200);
      expect(res.body.ingested).toBe(1);
      expect(Array.isArray(res.body.articles)).toBe(true);
    });

    it('should ingest multiple articles', async () => {
      const res = await testRequest(app, 'POST', '/sentiment/ingest', {
        articles: [
          { title: 'A', content: 'Content A', sourceId: 'kompas' },
          { title: 'B', content: 'Content B', sourceId: 'tempo' },
          { title: 'C', content: 'Content C', sourceId: 'antara' },
        ],
      });
      expect(res.status).toBe(200);
      expect(res.body.ingested).toBe(3);
    });

    it('should reject empty articles array', async () => {
      const res = await testRequest(app, 'POST', '/sentiment/ingest', {
        articles: [],
      });
      expect(res.status).toBe(400);
    });

    it('should reject missing articles field', async () => {
      const res = await testRequest(app, 'POST', '/sentiment/ingest', {});
      expect(res.status).toBe(400);
    });

    it('should reject article with empty title', async () => {
      const res = await testRequest(app, 'POST', '/sentiment/ingest', {
        articles: [{ title: '', content: 'Some content', sourceId: 'kompas' }],
      });
      expect(res.status).toBe(400);
    });

    it('should reject article with empty content', async () => {
      const res = await testRequest(app, 'POST', '/sentiment/ingest', {
        articles: [{ title: 'Some title', content: '', sourceId: 'kompas' }],
      });
      expect(res.status).toBe(400);
    });

    it('should reject article with missing sourceId', async () => {
      const res = await testRequest(app, 'POST', '/sentiment/ingest', {
        articles: [{ title: 'Title', content: 'Content' }],
      });
      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // GET /sentiment/articles
  // -------------------------------------------------------------------------
  describe('GET /sentiment/articles', () => {
    it('should return empty articles list', async () => {
      const res = await testRequest(app, 'GET', '/sentiment/articles');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.articles).toEqual([]);
    });

    it('should return ingested articles', async () => {
      engine.ingestArticles([
        { title: 'Test', content: 'Economic growth and success', sourceId: 'kompas' },
      ]);
      const res = await testRequest(app, 'GET', '/sentiment/articles');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
    });

    it('should support pagination with limit and offset', async () => {
      engine.ingestArticles(
        Array.from({ length: 10 }, (_, i) => ({
          title: `Article ${i}`,
          content: `Content about economy ${i}`,
          sourceId: 'kompas',
        }))
      );
      const res = await testRequest(app, 'GET', '/sentiment/articles?limit=3&offset=2');
      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(3);
      expect(res.body.offset).toBe(2);
      expect((res.body.articles as unknown[]).length).toBeLessThanOrEqual(3);
    });

    it('should filter by category', async () => {
      engine.ingestArticles([
        { title: 'Economy GDP', content: 'GDP growth and investment', sourceId: 'kompas' },
        { title: 'Election news', content: 'President election parliament', sourceId: 'tempo' },
      ]);
      const res = await testRequest(app, 'GET', '/sentiment/articles?category=economic');
      expect(res.status).toBe(200);
      const articles = res.body.articles as Array<{ category: string }>;
      for (const article of articles) {
        expect(article.category).toBe('economic');
      }
    });

    it('should filter by sourceId', async () => {
      engine.ingestArticles([
        { title: 'A', content: 'Content', sourceId: 'kompas' },
        { title: 'B', content: 'Content', sourceId: 'tempo' },
      ]);
      const res = await testRequest(app, 'GET', '/sentiment/articles?sourceId=kompas');
      expect(res.status).toBe(200);
      const articles = res.body.articles as Array<{ sourceId: string }>;
      for (const article of articles) {
        expect(article.sourceId).toBe('kompas');
      }
    });

    it('should filter by entity name', async () => {
      engine.ingestArticles([
        {
          title: 'Prabowo announces policy',
          content: 'President Prabowo made announcement.',
          sourceId: 'kompas',
        },
        { title: 'Weather update', content: 'Sunny skies tomorrow.', sourceId: 'kompas' },
      ]);
      const res = await testRequest(app, 'GET', '/sentiment/articles?entity=Prabowo');
      expect(res.status).toBe(200);
      expect((res.body.articles as unknown[]).length).toBeGreaterThanOrEqual(1);
    });

    it('should filter by minimum NIS score', async () => {
      engine.ingestArticles([
        {
          title: 'Major economic reform',
          content: 'GDP growth excellent success investment market great breakthrough victory',
          sourceId: 'kompas',
        },
      ]);
      const res = await testRequest(app, 'GET', '/sentiment/articles?minNIS=0');
      expect(res.status).toBe(200);
      const articles = res.body.articles as Array<{ nis: { score: number } }>;
      for (const article of articles) {
        expect(article.nis.score).toBeGreaterThanOrEqual(0);
      }
    });
  });

  // -------------------------------------------------------------------------
  // GET /sentiment/articles/:id
  // -------------------------------------------------------------------------
  describe('GET /sentiment/articles/:id', () => {
    it('should return article by id', async () => {
      const ingested = engine.ingestArticles([
        { title: 'Test', content: 'Content', sourceId: 'kompas' },
      ]);
      const res = await testRequest(app, 'GET', `/sentiment/articles/${ingested[0].id}`);
      expect(res.status).toBe(200);
      expect((res.body.article as { id: string }).id).toBe(ingested[0].id);
      expect(res.body.source).toBeDefined();
    });

    it('should return 400 for non-existent article', async () => {
      const res = await testRequest(app, 'GET', '/sentiment/articles/non-existent-id');
      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // GET /sentiment/events
  // -------------------------------------------------------------------------
  describe('GET /sentiment/events', () => {
    it('should return empty events list', async () => {
      const res = await testRequest(app, 'GET', '/sentiment/events');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.events).toEqual([]);
    });

    it('should support pagination', async () => {
      const res = await testRequest(app, 'GET', '/sentiment/events?limit=5&offset=0');
      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(5);
      expect(res.body.offset).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // GET /sentiment/timeline/:entity
  // -------------------------------------------------------------------------
  describe('GET /sentiment/timeline/:entity', () => {
    it('should return timeline for entity', async () => {
      engine.ingestArticles([
        {
          title: 'Prabowo visits Japan',
          content: 'President Prabowo traveled for talks.',
          sourceId: 'kompas',
          publishedAt: '2025-04-01T00:00:00Z',
        },
      ]);
      const res = await testRequest(app, 'GET', '/sentiment/timeline/Prabowo');
      expect(res.status).toBe(200);
      expect(res.body.entityName).toBe('Prabowo');
    });

    it('should return empty timeline for unknown entity', async () => {
      const res = await testRequest(app, 'GET', '/sentiment/timeline/UnknownEntity');
      expect(res.status).toBe(200);
      expect(res.body.dataPoints as unknown[]).toHaveLength(0);
    });

    it('should accept interval query parameter', async () => {
      const res = await testRequest(app, 'GET', '/sentiment/timeline/Prabowo?interval=7');
      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // GET /sentiment/categories
  // -------------------------------------------------------------------------
  describe('GET /sentiment/categories', () => {
    it('should return category breakdown', async () => {
      engine.ingestArticles([
        { title: 'Economy', content: 'GDP growth and investment', sourceId: 'kompas' },
      ]);
      const res = await testRequest(app, 'GET', '/sentiment/categories');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.categories)).toBe(true);
      expect((res.body.categories as unknown[]).length).toBeGreaterThan(0);
    });

    it('should return empty categories when no articles', async () => {
      const res = await testRequest(app, 'GET', '/sentiment/categories');
      expect(res.status).toBe(200);
      expect(res.body.categories).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // GET /sentiment/sources
  // -------------------------------------------------------------------------
  describe('GET /sentiment/sources', () => {
    it('should return all sources', async () => {
      const res = await testRequest(app, 'GET', '/sentiment/sources');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.sources)).toBe(true);
      expect((res.body.sources as unknown[]).length).toBeGreaterThanOrEqual(11);
    });
  });

  // -------------------------------------------------------------------------
  // GET /sentiment/sources/:id
  // -------------------------------------------------------------------------
  describe('GET /sentiment/sources/:id', () => {
    it('should return source by id', async () => {
      const res = await testRequest(app, 'GET', '/sentiment/sources/kompas');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe('kompas');
    });

    it('should return 400 for non-existent source', async () => {
      const res = await testRequest(app, 'GET', '/sentiment/sources/non-existent');
      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // POST /sentiment/predict
  // -------------------------------------------------------------------------
  describe('POST /sentiment/predict', () => {
    it('should return prediction result', async () => {
      const res = await testRequest(app, 'POST', '/sentiment/predict', {
        description: 'New economic stimulus package',
        category: 'economic',
        entities: [],
      });
      expect(res.status).toBe(200);
      expect(typeof res.body.predictedDelta).toBe('number');
      expect(res.body.confidenceInterval).toBeDefined();
      expect(typeof res.body.confidence).toBe('number');
    });

    it('should reject missing description', async () => {
      const res = await testRequest(app, 'POST', '/sentiment/predict', {
        category: 'economic',
      });
      expect(res.status).toBe(400);
    });

    it('should reject missing category', async () => {
      const res = await testRequest(app, 'POST', '/sentiment/predict', {
        description: 'Something',
      });
      expect(res.status).toBe(400);
    });

    it('should default entities to empty array', async () => {
      const res = await testRequest(app, 'POST', '/sentiment/predict', {
        description: 'New policy',
        category: 'political',
      });
      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // GET /sentiment/dashboard
  // -------------------------------------------------------------------------
  describe('GET /sentiment/dashboard', () => {
    it('should return dashboard for default country', async () => {
      const res = await testRequest(app, 'GET', '/sentiment/dashboard');
      expect(res.status).toBe(200);
      expect(res.body.country).toBe('ID');
      expect(typeof res.body.totalArticles).toBe('number');
    });

    it('should accept country query parameter', async () => {
      const res = await testRequest(app, 'GET', '/sentiment/dashboard?country=US');
      expect(res.status).toBe(200);
      expect(res.body.country).toBe('US');
    });

    it('should return populated dashboard after demo data', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/sentiment/dashboard');
      expect(res.status).toBe(200);
      expect(res.body.totalArticles).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // GET /sentiment/compare
  // -------------------------------------------------------------------------
  describe('GET /sentiment/compare', () => {
    it('should compare entities', async () => {
      const res = await testRequest(app, 'GET', '/sentiment/compare?entities=Prabowo,Jokowi');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.comparisons)).toBe(true);
      expect((res.body.comparisons as unknown[]).length).toBe(2);
    });

    it('should reject missing entities parameter', async () => {
      const res = await testRequest(app, 'GET', '/sentiment/compare');
      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // POST /sentiment/demo/load
  // -------------------------------------------------------------------------
  describe('POST /sentiment/demo/load', () => {
    it('should load demo data', async () => {
      const res = await testRequest(app, 'POST', '/sentiment/demo/load');
      expect(res.status).toBe(200);
      expect(res.body.loaded).toBe(true);
      expect(typeof res.body.articleCount).toBe('number');
      expect(res.body.articleCount as number).toBeGreaterThan(0);
    });
  });
});
