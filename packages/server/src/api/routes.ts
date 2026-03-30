import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import type { TemporalGraph } from '../graph/temporal-graph.js';
import { extractNarrative } from '../extraction/narrative-extractor.js';
import { scanTensions } from '../analysis/tension-radar.js';
import { generateDreams } from '../analysis/dream-engine.js';
import { demoEntities, demoEvents, demoTensions, demoArcs } from '../demo/openai-crisis.js';
import {
  techWarEntities,
  techWarEvents,
  techWarTensions,
  techWarArcs,
} from '../demo/us-china-tech-war.js';
import {
  aiBubbleEntities,
  aiBubbleEvents,
  aiBubbleTensions,
  aiBubbleArcs,
} from '../demo/nvidia-ai-bubble.js';
import {
  electionEntities,
  electionEvents,
  electionTensions,
  electionArcs,
} from '../demo/indonesia-election.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { validateBody } from '../middleware/validation.js';
import { apiRateLimiter } from '../middleware/rate-limiter.js';
import { ValidationError } from '../errors/index.js';
import { researchTopic } from '../ingestion/auto-researcher.js';

// ============================================================
// Request validation schemas
// ============================================================

const extractSchema = z.object({
  text: z.string().min(1, 'text field is required').max(50000, 'text too long (max 50000 chars)'),
});

const researchSchema = z.object({
  topic: z.string().min(1, 'topic is required').max(500, 'topic too long (max 500 chars)'),
  country: z.string().max(100, 'country too long').optional(),
  maxArticles: z.coerce.number().int().min(1).max(20).default(10),
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

/**
 * Create Express router with all LOOM API routes.
 * Includes validation, pagination, rate limiting, and error handling.
 */
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

  // --- Research ---

  router.post(
    '/research',
    apiRateLimiter,
    validateBody(researchSchema),
    asyncHandler(async (req: Request, res: Response) => {
      const { topic, country, maxArticles } = req.body as z.infer<typeof researchSchema>;
      const result = await researchTopic({ topic, country, maxArticles });
      res.json(result);
    })
  );

  // --- Demo ---

  /** Available demo scenarios. */
  const demoScenarios: Record<
    string,
    {
      name: string;
      entities: typeof demoEntities;
      events: typeof demoEvents;
      tensions: typeof demoTensions;
      arcs: typeof demoArcs;
    }
  > = {
    'openai-crisis': {
      name: 'OpenAI Board Crisis (Nov 2023)',
      entities: demoEntities,
      events: demoEvents,
      tensions: demoTensions,
      arcs: demoArcs,
    },
    'us-china-tech-war': {
      name: 'US-China Semiconductor War',
      entities: techWarEntities,
      events: techWarEvents,
      tensions: techWarTensions,
      arcs: techWarArcs,
    },
    'ai-bubble': {
      name: 'NVIDIA & The AI Bubble Question',
      entities: aiBubbleEntities,
      events: aiBubbleEvents,
      tensions: aiBubbleTensions,
      arcs: aiBubbleArcs,
    },
    'indonesia-election': {
      name: 'Indonesian Minister Social Media Crisis',
      entities: electionEntities,
      events: electionEvents,
      tensions: electionTensions,
      arcs: electionArcs,
    },
  };

  /** List available demo scenarios. */
  router.get('/demo/list', (_req: Request, res: Response) => {
    const scenarios = Object.entries(demoScenarios).map(([id, scenario]) => ({
      id,
      name: scenario.name,
      entities: scenario.entities.length,
      events: scenario.events.length,
      tensions: scenario.tensions.length,
      arcs: scenario.arcs.length,
    }));
    res.json({ scenarios });
  });

  /** Load a specific demo scenario (default: openai-crisis). */
  router.post('/demo/load', (req: Request, res: Response) => {
    const scenarioId = (req.query.scenario as string) || 'openai-crisis';
    const scenario = demoScenarios[scenarioId];

    if (!scenario) {
      throw new ValidationError(`Unknown demo scenario: ${scenarioId}`, {
        available: Object.keys(demoScenarios),
      });
    }

    graph.clear();
    graph.load({
      entities: scenario.entities,
      events: scenario.events,
      tensions: scenario.tensions,
      arcs: scenario.arcs,
    });
    broadcast({ type: 'graph-updated', data: graph.getSnapshot() });
    res.json({
      message: `Demo loaded: ${scenario.name}`,
      scenario: scenarioId,
      ...graph.getSnapshot(),
    });
  });

  router.post('/demo/reset', (_req: Request, res: Response) => {
    graph.clear();
    broadcast({ type: 'graph-updated', data: graph.getSnapshot() });
    res.json({ message: 'Graph cleared' });
  });

  return router;
}
