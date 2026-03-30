// ============================================================
// LOOM — Sentiment Engine API Routes
//
// REST endpoints for the country sentiment analysis engine.
// ============================================================

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler.js';
import { validateBody } from '../../middleware/validation.js';
import { ValidationError } from '../../errors/index.js';
import type { SentimentEngine } from '../sentiment-engine.js';

// ============================================================
// Request validation schemas
// ============================================================

const predictSchema = z.object({
  description: z.string().min(1, 'description is required'),
  category: z.string().min(1, 'category is required'),
  entities: z.array(z.string()).default([]),
  sourceType: z.enum(['pro-government', 'anti-government', 'neutral']).optional(),
});

const ingestSchema = z.object({
  articles: z
    .array(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        url: z.string().url().optional().default(''),
        sourceId: z.string().min(1),
        publishedAt: z.string().optional(),
        language: z.string().default('id'),
      })
    )
    .min(1, 'at least one article is required'),
});

// ============================================================
// Pagination helper
// ============================================================

interface PaginationParams {
  limit: number;
  offset: number;
}

function parsePagination(req: Request): PaginationParams {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 50, 1), 500);
  const offset = Math.max(parseInt(String(req.query.offset)) || 0, 0);
  return { limit, offset };
}

function paginate<T>(items: T[], { limit, offset }: PaginationParams): T[] {
  return items.slice(offset, offset + limit);
}

// ============================================================
// Route factory
// ============================================================

/**
 * Create sentiment engine API routes.
 *
 * @param engine - The sentiment engine instance
 * @returns Express router with all sentiment endpoints
 */
export function createSentimentRoutes(engine: SentimentEngine): Router {
  const router = Router();

  // --- Article ingestion ---

  router.post(
    '/ingest',
    validateBody(ingestSchema),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const { articles } = req.body;
      const results = engine.ingestArticles(articles);
      res.json({
        ingested: results.length,
        articles: results,
      });
    })
  );

  // --- Article listing ---

  router.get(
    '/articles',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const { limit, offset } = parsePagination(req);
      const category = req.query.category as string | undefined;
      const sourceId = req.query.sourceId as string | undefined;
      const entity = req.query.entity as string | undefined;
      const minNIS = req.query.minNIS ? parseFloat(String(req.query.minNIS)) : undefined;

      let articles = engine.getArticles();

      // Filters
      if (category) {
        articles = articles.filter((a) => a.category === category);
      }
      if (sourceId) {
        articles = articles.filter((a) => a.sourceId === sourceId);
      }
      if (entity) {
        const entityLower = entity.toLowerCase();
        articles = articles.filter(
          (a) =>
            a.entities.some((e) => e.name.toLowerCase().includes(entityLower)) ||
            a.title.toLowerCase().includes(entityLower)
        );
      }
      if (minNIS !== undefined) {
        articles = articles.filter((a) => a.nis.score >= minNIS);
      }

      // Sort by NIS descending
      articles.sort((a, b) => b.nis.score - a.nis.score);

      res.json({
        total: articles.length,
        limit,
        offset,
        articles: paginate(articles, { limit, offset }),
      });
    })
  );

  // --- Single article detail ---

  router.get(
    '/articles/:id',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const article = engine.getArticleById(req.params.id);
      if (!article) {
        throw new ValidationError('Article not found', { id: req.params.id });
      }

      const source = engine.getSourceById(article.sourceId);

      res.json({
        article,
        source,
      });
    })
  );

  // --- Sentiment events ---

  router.get(
    '/events',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const { limit, offset } = parsePagination(req);
      const category = req.query.category as string | undefined;

      let events = engine.getEvents();

      if (category) {
        events = events.filter((e) => e.category === category);
      }

      // Sort by NIS descending
      events.sort((a, b) => b.nis.score - a.nis.score);

      res.json({
        total: events.length,
        limit,
        offset,
        events: paginate(events, { limit, offset }),
      });
    })
  );

  // --- Timeline for entity ---

  router.get(
    '/timeline/:entity',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entityName = decodeURIComponent(req.params.entity);
      const intervalDays = parseInt(String(req.query.interval)) || 1;

      const timeSeries = engine.getTimeline(entityName, intervalDays);

      res.json(timeSeries);
    })
  );

  // --- Category breakdown ---

  router.get(
    '/categories',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const breakdown = engine.getCategoryBreakdown();
      res.json({ categories: breakdown });
    })
  );

  // --- Source registry ---

  router.get(
    '/sources',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const sources = engine.getSources();
      res.json({ sources });
    })
  );

  router.get(
    '/sources/:id',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const source = engine.getSourceById(req.params.id);
      if (!source) {
        throw new ValidationError('Source not found', { id: req.params.id });
      }
      res.json(source);
    })
  );

  // --- Predict impact ---

  router.post(
    '/predict',
    validateBody(predictSchema),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const prediction = engine.predict(req.body);
      res.json(prediction);
    })
  );

  // --- Dashboard aggregate ---

  router.get(
    '/dashboard',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const country = (req.query.country as string) || 'ID';
      const dashboard = engine.getDashboard(country);
      res.json(dashboard);
    })
  );

  // --- Compare entities ---

  router.get(
    '/compare',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entitiesParam = req.query.entities as string;
      if (!entitiesParam) {
        throw new ValidationError('entities query parameter is required');
      }

      const entityNames = entitiesParam.split(',').map((e) => e.trim());
      const comparisons = engine.compareEntities(entityNames);

      res.json({ comparisons });
    })
  );

  // --- Load demo data ---

  router.post(
    '/demo/load',
    asyncHandler(async (_req: Request, res: Response): Promise<void> => {
      const count = engine.loadDemoData();
      res.json({
        loaded: true,
        articleCount: count,
        message: 'Indonesian sentiment demo data loaded',
      });
    })
  );

  return router;
}
