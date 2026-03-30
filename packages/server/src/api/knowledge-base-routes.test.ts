import { describe, it, expect, beforeEach } from 'vitest';
import http from 'http';
import express from 'express';
import { createKnowledgeBaseRoutes } from './knowledge-base-routes.js';
import { TemporalGraph } from '../graph/temporal-graph.js';
import { globalErrorHandler } from '../middleware/error-handler.js';

// ============================================================
// Knowledge Base Routes — Tests
// ============================================================

/** Make a test request to an Express app. */
async function request(
  app: express.Express,
  method: 'GET' | 'POST',
  path: string
): Promise<{ status: number; body: Record<string, unknown> }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        reject(new Error('Failed to get server address'));
        return;
      }

      const options = {
        hostname: '127.0.0.1',
        port: addr.port,
        path,
        method,
        headers: { 'Content-Type': 'application/json' },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk: string) => (data += chunk));
        res.on('end', () => {
          server.close();
          try {
            resolve({ status: res.statusCode ?? 500, body: JSON.parse(data) });
          } catch {
            resolve({
              status: res.statusCode ?? 500,
              body: { raw: data } as Record<string, unknown>,
            });
          }
        });
      });

      req.on('error', (err: Error) => {
        server.close();
        reject(err);
      });

      req.end();
    });
  });
}

describe('Knowledge Base Routes', () => {
  let app: express.Express;
  let graph: TemporalGraph;

  beforeEach(() => {
    graph = new TemporalGraph();
    app = express();
    app.use(express.json());
    app.use('/api', createKnowledgeBaseRoutes(graph));
    app.use(globalErrorHandler);
  });

  // --------------------------------------------------------
  // GET /analysis/breakdown/:metricType/:id
  // --------------------------------------------------------

  describe('GET /api/analysis/breakdown/:metricType/:id', () => {
    it('should return 400 for invalid metric type', async () => {
      const res = await request(app, 'GET', '/api/analysis/breakdown/invalid/some-id');
      expect(res.status).toBe(400);
    });

    it('should return 404 for unknown tension id', async () => {
      // Add a tension so analyzeTensions runs, but look up wrong id
      graph.addEntity({
        name: 'Alice',
        type: 'person',
        motivation: 'T',
        capability: 'T',
        alliances: [],
        description: 'T',
        firstSeen: '2023-01-01T00:00:00Z',
        lastSeen: '2023-01-01T00:00:00Z',
      });
      graph.addTension({
        name: 'Test Tension',
        description: 'D',
        parties: ['a', 'b'],
        status: 'escalating',
        intensity: 0.5,
        duration: 5,
        relatedEvents: [],
        validFrom: '2023-01-01T00:00:00Z',
      });

      const res = await request(app, 'GET', '/api/analysis/breakdown/tension/nonexistent-id');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should return tension breakdown for valid tension id', async () => {
      const entity1 = graph.addEntity({
        name: 'Alice',
        type: 'person',
        motivation: 'Power',
        capability: 'Politics',
        alliances: [],
        description: 'Leader',
        firstSeen: '2023-01-01T00:00:00Z',
        lastSeen: '2023-06-01T00:00:00Z',
      });
      const entity2 = graph.addEntity({
        name: 'Bob',
        type: 'person',
        motivation: 'Justice',
        capability: 'Law',
        alliances: [],
        description: 'Rival',
        firstSeen: '2023-01-01T00:00:00Z',
        lastSeen: '2023-06-01T00:00:00Z',
      });
      const event = graph.addEvent({
        title: 'Confrontation',
        description: 'They met',
        timestamp: '2023-03-01T00:00:00Z',
        participants: [entity1.id, entity2.id],
        causalPredecessors: [],
        impact: 0.8,
        sentiment: -0.5,
      });
      const tension = graph.addTension({
        name: 'Power Struggle',
        description: 'Conflict between Alice and Bob',
        parties: [entity1.id, entity2.id],
        status: 'escalating',
        intensity: 0.7,
        duration: 90,
        relatedEvents: [event.id],
        validFrom: '2023-01-01T00:00:00Z',
      });

      const res = await request(app, 'GET', `/api/analysis/breakdown/tension/${tension.id}`);
      expect(res.status).toBe(200);
      expect(res.body.metricType).toBe('tension');
      expect(res.body.id).toBe(tension.id);
      expect(res.body).toHaveProperty('overallScore');
      expect(res.body).toHaveProperty('breakdown');
    });

    it('should return 404 for unknown arc id', async () => {
      const res = await request(app, 'GET', '/api/analysis/breakdown/arc/nonexistent-id');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });

    it('should return arc breakdown for valid arc id', async () => {
      const entity = graph.addEntity({
        name: 'Alice',
        type: 'person',
        motivation: 'Power',
        capability: 'Politics',
        alliances: [],
        description: 'Leader',
        firstSeen: '2023-01-01T00:00:00Z',
        lastSeen: '2023-06-01T00:00:00Z',
      });
      const event = graph.addEvent({
        title: 'Rise',
        description: 'First move',
        timestamp: '2023-02-01T00:00:00Z',
        participants: [entity.id],
        causalPredecessors: [],
        impact: 0.6,
        sentiment: 0.3,
      });
      const arc = graph.addArc({
        name: 'Rise to Power',
        description: 'A quest for dominance',
        phase: 'rising_action',
        characters: [entity.id],
        events: [event.id],
        tensions: [],
        startDate: '2023-01-01T00:00:00Z',
      });

      const res = await request(app, 'GET', `/api/analysis/breakdown/arc/${arc.id}`);
      expect(res.status).toBe(200);
      expect(res.body.metricType).toBe('arc');
      expect(res.body.id).toBe(arc.id);
      expect(res.body).toHaveProperty('healthScore');
    });

    it('should return 404 for dream metric type (not yet implemented)', async () => {
      const res = await request(app, 'GET', '/api/analysis/breakdown/dream/some-id');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not available');
    });
  });

  // --------------------------------------------------------
  // GET /knowledge-base/sources
  // --------------------------------------------------------

  describe('GET /api/knowledge-base/sources', () => {
    it('should return all sources with correct shape', async () => {
      const res = await request(app, 'GET', '/api/knowledge-base/sources');
      expect(res.status).toBe(200);

      const body = res.body as { sources: Array<Record<string, unknown>>; total: number };
      expect(body.total).toBeGreaterThan(0);
      expect(body.sources).toHaveLength(body.total);

      const first = body.sources[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('country');
      expect(first).toHaveProperty('reliabilityScore');
      expect(first).toHaveProperty('hasExtendedProfile');
      expect(first).toHaveProperty('signalWeight');
      expect(first).toHaveProperty('active');
    });

    it('should include hasExtendedProfile boolean for each source', async () => {
      const res = await request(app, 'GET', '/api/knowledge-base/sources');
      const body = res.body as { sources: Array<{ hasExtendedProfile: boolean }> };
      for (const source of body.sources) {
        expect(typeof source.hasExtendedProfile).toBe('boolean');
      }
    });
  });

  // --------------------------------------------------------
  // GET /knowledge-base/sources/:id
  // --------------------------------------------------------

  describe('GET /api/knowledge-base/sources/:id', () => {
    it('should return a specific source by id', async () => {
      const res = await request(app, 'GET', '/api/knowledge-base/sources/kompas');
      expect(res.status).toBe(200);
      expect((res.body as { id: string }).id).toBe('kompas');
      expect((res.body as { name: string }).name).toBe('Kompas');
    });

    it('should return 404 for unknown source id', async () => {
      const res = await request(app, 'GET', '/api/knowledge-base/sources/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Source not found');
    });

    it('should return full source with extendedProfile', async () => {
      const res = await request(app, 'GET', '/api/knowledge-base/sources/kompas');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('extendedProfile');
    });
  });

  // --------------------------------------------------------
  // GET /knowledge-base/entities
  // --------------------------------------------------------

  describe('GET /api/knowledge-base/entities', () => {
    it('should return all entity profiles', async () => {
      const res = await request(app, 'GET', '/api/knowledge-base/entities');
      expect(res.status).toBe(200);
      const body = res.body as { entities: unknown[]; total: number };
      expect(body.total).toBeGreaterThan(0);
      expect(body.entities).toHaveLength(body.total);
    });
  });

  // --------------------------------------------------------
  // GET /knowledge-base/entities/:id
  // --------------------------------------------------------

  describe('GET /api/knowledge-base/entities/:id', () => {
    it('should return a specific entity by id', async () => {
      const res = await request(app, 'GET', '/api/knowledge-base/entities/id-prabowo-subianto');
      expect(res.status).toBe(200);
      expect((res.body as { id: string }).id).toBe('id-prabowo-subianto');
    });

    it('should return 404 for unknown entity id', async () => {
      const res = await request(app, 'GET', '/api/knowledge-base/entities/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Entity not found');
    });
  });

  // --------------------------------------------------------
  // GET /knowledge-base/methodology
  // --------------------------------------------------------

  describe('GET /api/knowledge-base/methodology', () => {
    it('should return all methodologies', async () => {
      const res = await request(app, 'GET', '/api/knowledge-base/methodology');
      expect(res.status).toBe(200);
      const body = res.body as { methodologies: unknown[]; total: number };
      expect(body.total).toBeGreaterThan(0);
      expect(body.methodologies).toHaveLength(body.total);
    });
  });

  // --------------------------------------------------------
  // GET /knowledge-base/methodology/:id
  // --------------------------------------------------------

  describe('GET /api/knowledge-base/methodology/:id', () => {
    it('should return a specific methodology by id', async () => {
      const res = await request(
        app,
        'GET',
        '/api/knowledge-base/methodology/tension-pressure-score'
      );
      expect(res.status).toBe(200);
      expect((res.body as { id: string }).id).toBe('tension-pressure-score');
    });

    it('should return 404 for unknown methodology id', async () => {
      const res = await request(app, 'GET', '/api/knowledge-base/methodology/nonexistent');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Methodology not found');
    });
  });
});
