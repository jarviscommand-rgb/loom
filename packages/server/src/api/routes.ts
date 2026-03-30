import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { TemporalGraph } from '../graph/temporal-graph.js';
import { extractNarrative } from '../extraction/narrative-extractor.js';
import { scanTensions } from '../analysis/tension-radar.js';
import { generateDreams } from '../analysis/dream-engine.js';
import { demoEntities, demoEvents, demoTensions, demoArcs } from '../demo/openai-crisis.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { validateBody } from '../middleware/validation.js';
import { apiRateLimiter } from '../middleware/rate-limiter.js';
import { ValidationError } from '../errors/index.js';

// ============================================================
// Request validation schemas
// ============================================================

const extractSchema = z.object({
  text: z.string().min(1, 'text field is required'),
});

const dreamSchema = z
  .object({
    strategies: z.array(z.enum(['conservative', 'wild_card', 'pattern_based'])).optional(),
  })
  .optional()
  .default({});

// ============================================================
// Pagination helper
// ============================================================

interface PaginationParams {
  limit: number;
  offset: number;
}

function parsePagination(req: Request): PaginationParams {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 100, 1), 1000);
  const offset = Math.max(parseInt(String(req.query.offset)) || 0, 0);
  return { limit, offset };
}

function paginate<T>(items: T[], { limit, offset }: PaginationParams): T[] {
  return items.slice(offset, offset + limit);
}

// ============================================================
// Route factory
// ============================================================

export function createRoutes(graph: TemporalGraph, broadcast: (data: unknown) => void): Router {
  const router = Router();

  // --- Graph state ---

  router.get('/graph', (_req: Request, res: Response) => {
    res.json(graph.getSnapshot());
  });

  router.get('/graph/at/:timestamp', (req: Request, res: Response) => {
    res.json(graph.getSnapshotAt(req.params.timestamp as string));
  });

  // --- Entities ---

  router.get('/entities', (req: Request, res: Response) => {
    const pagination = parsePagination(req);
    const entities = graph.getAllEntities();
    res.json({
      data: paginate(entities, pagination),
      total: entities.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  });

  router.get('/entities/:id', (req: Request, res: Response) => {
    const entity = graph.getEntity(req.params.id as string);
    if (!entity) {
      res.status(404).json({ error: 'Entity not found' });
      return;
    }
    res.json(entity);
  });

  router.get('/entities/:id/events', (req: Request, res: Response) => {
    const pagination = parsePagination(req);
    const events = graph.getEventsForEntity(req.params.id as string);
    res.json({
      data: paginate(events, pagination),
      total: events.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  });

  // --- Events ---

  router.get('/events', (req: Request, res: Response) => {
    const pagination = parsePagination(req);
    const events = graph.getAllEvents();
    res.json({
      data: paginate(events, pagination),
      total: events.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  });

  router.get('/events/range', (req: Request, res: Response) => {
    const { from, to } = req.query;
    if (!from || !to) {
      throw new ValidationError('from and to query params required');
    }
    res.json(graph.getEventsInRange(from as string, to as string));
  });

  // --- Tensions ---

  router.get('/tensions', (req: Request, res: Response) => {
    const pagination = parsePagination(req);
    const tensions = graph.getAllTensions();
    res.json({
      data: paginate(tensions, pagination),
      total: tensions.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  });

  router.get('/tensions/active', (_req: Request, res: Response) => {
    res.json(graph.getActiveTensions());
  });

  // --- Arcs ---

  router.get('/arcs', (req: Request, res: Response) => {
    const pagination = parsePagination(req);
    const arcs = graph.getAllArcs();
    res.json({
      data: paginate(arcs, pagination),
      total: arcs.length,
      limit: pagination.limit,
      offset: pagination.offset,
    });
  });

  // --- Analysis ---

  router.get('/analysis/pressure-points', (_req: Request, res: Response) => {
    res.json(scanTensions(graph));
  });

  router.post(
    '/analysis/dream',
    apiRateLimiter,
    validateBody(dreamSchema),
    asyncHandler(async (_req: Request, res: Response) => {
      const dreams = await generateDreams(graph);
      res.json(dreams);
    })
  );

  // --- Extraction ---

  router.post(
    '/extract',
    apiRateLimiter,
    validateBody(extractSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { text } = req.body as z.infer<typeof extractSchema>;
      const result = await extractNarrative(text, graph);
      broadcast({ type: 'graph-updated', data: graph.getSnapshot() });
      res.json(result);
    })
  );

  // --- Demo ---

  router.post('/demo/load', (_req: Request, res: Response) => {
    graph.clear();
    graph.load({
      entities: demoEntities,
      events: demoEvents,
      tensions: demoTensions,
      arcs: demoArcs,
    });
    broadcast({ type: 'graph-updated', data: graph.getSnapshot() });
    res.json({ message: 'Demo dataset loaded', ...graph.getSnapshot() });
  });

  router.post('/demo/reset', (_req: Request, res: Response) => {
    graph.clear();
    broadcast({ type: 'graph-updated', data: graph.getSnapshot() });
    res.json({ message: 'Graph cleared' });
  });

  return router;
}
