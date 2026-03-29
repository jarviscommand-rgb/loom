import { Router, type Request, type Response } from 'express';
import { TemporalGraph } from '../graph/temporal-graph.js';
import { extractNarrative } from '../extraction/narrative-extractor.js';
import { scanTensions } from '../analysis/tension-radar.js';
import { generateDreams } from '../analysis/dream-engine.js';
import { demoEntities, demoEvents, demoTensions, demoArcs } from '../demo/openai-crisis.js';

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

  router.get('/entities', (_req: Request, res: Response) => {
    res.json(graph.getAllEntities());
  });

  router.get('/entities/:id', (req: Request, res: Response) => {
    const entity = graph.getEntity(req.params.id as string);
    if (!entity) { res.status(404).json({ error: 'Entity not found' }); return; }
    res.json(entity);
  });

  router.get('/entities/:id/events', (req: Request, res: Response) => {
    res.json(graph.getEventsForEntity(req.params.id as string));
  });

  // --- Events ---

  router.get('/events', (_req: Request, res: Response) => {
    res.json(graph.getAllEvents());
  });

  router.get('/events/range', (req: Request, res: Response) => {
    const { from, to } = req.query;
    if (!from || !to) { res.status(400).json({ error: 'from and to query params required' }); return; }
    res.json(graph.getEventsInRange(from as string, to as string));
  });

  // --- Tensions ---

  router.get('/tensions', (_req: Request, res: Response) => {
    res.json(graph.getAllTensions());
  });

  router.get('/tensions/active', (_req: Request, res: Response) => {
    res.json(graph.getActiveTensions());
  });

  // --- Arcs ---

  router.get('/arcs', (_req: Request, res: Response) => {
    res.json(graph.getAllArcs());
  });

  // --- Analysis ---

  router.get('/analysis/pressure-points', (_req: Request, res: Response) => {
    res.json(scanTensions(graph));
  });

  router.post('/analysis/dream', async (_req: Request, res: Response) => {
    try {
      const dreams = await generateDreams(graph);
      res.json(dreams);
    } catch (err) {
      console.error('Dream generation failed:', err);
      res.status(500).json({ error: 'Dream generation failed', details: String(err) });
    }
  });

  // --- Extraction ---

  router.post('/extract', async (req: Request, res: Response) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
      res.status(400).json({ error: 'text field required' });
      return;
    }
    try {
      const result = await extractNarrative(text, graph);
      broadcast({ type: 'graph-updated', data: graph.getSnapshot() });
      res.json(result);
    } catch (err) {
      console.error('Extraction failed:', err);
      res.status(500).json({ error: 'Extraction failed', details: String(err) });
    }
  });

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
