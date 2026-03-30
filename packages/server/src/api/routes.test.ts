import { describe, it, expect, beforeEach } from 'vitest';
import http from 'http';
import express from 'express';
import { createRoutes } from './routes.js';
import { TemporalGraph } from '../graph/temporal-graph.js';
import { globalErrorHandler } from '../middleware/error-handler.js';

// ============================================================
// API Routes — Integration Tests
// ============================================================

/** Make a test request to an Express app. */
async function request(
  app: express.Express,
  method: 'GET' | 'POST',
  path: string,
  body?: Record<string, unknown>
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
        headers: {
          'Content-Type': 'application/json',
        },
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

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  });
}

describe('API Routes', () => {
  let app: express.Express;
  let graph: TemporalGraph;
  const broadcasts: unknown[] = [];

  beforeEach(() => {
    graph = new TemporalGraph();
    broadcasts.length = 0;

    app = express();
    app.use(express.json());
    app.use(
      '/api',
      createRoutes(graph, (data) => broadcasts.push(data))
    );
    app.use(globalErrorHandler);
  });

  // --- Health / Graph ---

  describe('GET /api/graph', () => {
    it('should return empty graph snapshot', async () => {
      const res = await request(app, 'GET', '/api/graph');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('entities');
      expect(res.body).toHaveProperty('events');
      expect(res.body).toHaveProperty('tensions');
      expect(res.body).toHaveProperty('arcs');
    });
  });

  describe('GET /api/graph/at/:timestamp', () => {
    it('should return historical snapshot', async () => {
      graph.addEntity({
        name: 'Test',
        type: 'person',
        motivation: 'T',
        capability: 'T',
        alliances: [],
        description: 'T',
        firstSeen: '2023-01-01T00:00:00Z',
        lastSeen: '2023-01-01T00:00:00Z',
      });

      const res = await request(app, 'GET', '/api/graph/at/2023-06-01T00:00:00Z');
      expect(res.status).toBe(200);
      expect((res.body as Record<string, unknown[]>).entities).toHaveLength(1);
    });
  });

  // --- Entities ---

  describe('GET /api/entities', () => {
    it('should return paginated entities', async () => {
      for (let i = 0; i < 5; i++) {
        graph.addEntity({
          name: `Entity${i}`,
          type: 'person',
          motivation: 'T',
          capability: 'T',
          alliances: [],
          description: 'T',
          firstSeen: '2023-01-01T00:00:00Z',
          lastSeen: '2023-01-01T00:00:00Z',
        });
      }

      const res = await request(app, 'GET', '/api/entities?limit=2&offset=0');
      expect(res.status).toBe(200);
      const body = res.body as { data: unknown[]; total: number; limit: number; offset: number };
      expect(body.data).toHaveLength(2);
      expect(body.total).toBe(5);
      expect(body.limit).toBe(2);
      expect(body.offset).toBe(0);
    });
  });

  describe('GET /api/entities/:id', () => {
    it('should return entity by id', async () => {
      const entity = graph.addEntity({
        name: 'Found',
        type: 'person',
        motivation: 'T',
        capability: 'T',
        alliances: [],
        description: 'T',
        firstSeen: '2023-01-01T00:00:00Z',
        lastSeen: '2023-01-01T00:00:00Z',
      });

      const res = await request(app, 'GET', `/api/entities/${entity.id}`);
      expect(res.status).toBe(200);
      expect((res.body as { name: string }).name).toBe('Found');
    });

    it('should return 404 for unknown entity', async () => {
      const res = await request(app, 'GET', '/api/entities/unknown-id');
      expect(res.status).toBe(404);
    });
  });

  // --- Events ---

  describe('GET /api/events', () => {
    it('should return paginated events', async () => {
      graph.addEvent({
        title: 'Ev1',
        description: 'D',
        timestamp: '2023-01-01T00:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.5,
        sentiment: 0,
      });

      const res = await request(app, 'GET', '/api/events');
      expect(res.status).toBe(200);
      expect((res.body as { total: number }).total).toBe(1);
    });
  });

  describe('GET /api/events/range', () => {
    it('should return events in time range', async () => {
      graph.addEvent({
        title: 'InRange',
        description: 'D',
        timestamp: '2023-01-15T00:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.5,
        sentiment: 0,
      });

      const res = await request(
        app,
        'GET',
        '/api/events/range?from=2023-01-01T00:00:00Z&to=2023-02-01T00:00:00Z'
      );
      expect(res.status).toBe(200);
    });

    it('should return 400 when from/to missing', async () => {
      const res = await request(app, 'GET', '/api/events/range');
      expect(res.status).toBe(400);
    });
  });

  // --- Tensions ---

  describe('GET /api/tensions', () => {
    it('should return paginated tensions', async () => {
      graph.addTension({
        name: 'T1',
        description: 'D',
        parties: ['a', 'b'],
        status: 'simmering',
        intensity: 0.5,
        duration: 5,
        relatedEvents: [],
        validFrom: '2023-01-01T00:00:00Z',
      });

      const res = await request(app, 'GET', '/api/tensions');
      expect(res.status).toBe(200);
      expect((res.body as { total: number }).total).toBe(1);
    });
  });

  describe('GET /api/tensions/active', () => {
    it('should return only active tensions', async () => {
      graph.addTension({
        name: 'Active',
        description: 'D',
        parties: ['a', 'b'],
        status: 'escalating',
        intensity: 0.5,
        duration: 5,
        relatedEvents: [],
        validFrom: '2023-01-01T00:00:00Z',
      });
      graph.addTension({
        name: 'Resolved',
        description: 'D',
        parties: ['c', 'd'],
        status: 'resolved',
        intensity: 0.5,
        duration: 5,
        relatedEvents: [],
        validFrom: '2023-01-01T00:00:00Z',
      });

      const res = await request(app, 'GET', '/api/tensions/active');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
    });
  });

  // --- Arcs ---

  describe('GET /api/arcs', () => {
    it('should return paginated arcs', async () => {
      graph.addArc({
        name: 'Arc1',
        description: 'D',
        phase: 'setup',
        characters: [],
        events: [],
        tensions: [],
        startDate: '2023-01-01T00:00:00Z',
      });

      const res = await request(app, 'GET', '/api/arcs');
      expect(res.status).toBe(200);
      expect((res.body as { total: number }).total).toBe(1);
    });
  });

  // --- Analysis ---

  describe('GET /api/analysis/pressure-points', () => {
    it('should return pressure points (empty if no active tensions)', async () => {
      const res = await request(app, 'GET', '/api/analysis/pressure-points');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  // --- Extraction validation ---

  describe('POST /api/extract', () => {
    it('should return 400 for missing text field', async () => {
      const res = await request(app, 'POST', '/api/extract', {});
      expect(res.status).toBe(400);
    });

    it('should return 400 for empty text field', async () => {
      const res = await request(app, 'POST', '/api/extract', { text: '' });
      expect(res.status).toBe(400);
    });
  });

  // --- Demo ---

  describe('POST /api/demo/load', () => {
    it('should load demo dataset and broadcast', async () => {
      const res = await request(app, 'POST', '/api/demo/load');
      expect(res.status).toBe(200);
      expect((res.body as { message: string }).message).toBe('Demo dataset loaded');
      expect(broadcasts.length).toBe(1);
      expect(graph.getAllEntities().length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/demo/reset', () => {
    it('should clear graph and broadcast', async () => {
      // Load then reset
      await request(app, 'POST', '/api/demo/load');
      const res = await request(app, 'POST', '/api/demo/reset');
      expect(res.status).toBe(200);
      expect((res.body as { message: string }).message).toBe('Graph cleared');
      expect(graph.getAllEntities()).toEqual([]);
    });
  });
});
