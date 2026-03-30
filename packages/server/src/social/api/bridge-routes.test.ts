import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import { createBridgeRoutes } from './bridge-routes.js';
import { NarrativeBridge } from '../integration/narrative-bridge.js';
import { SocialMediaEngine } from '../social-engine.js';
import { SentimentEngine } from '../../sentiment/sentiment-engine.js';
import { TemporalGraph } from '../../graph/temporal-graph.js';
import { globalErrorHandler } from '../../middleware/error-handler.js';

/**
 * Helper to make HTTP requests against an Express app without supertest.
 * Spins up a temporary server on a random port, makes the request, then closes.
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

describe('Bridge Routes', () => {
  let app: express.Express;
  let bridge: NarrativeBridge;
  let graph: TemporalGraph;
  let socialEngine: SocialMediaEngine;
  let sentimentEngine: SentimentEngine;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    socialEngine = new SocialMediaEngine();
    sentimentEngine = new SentimentEngine();
    graph = new TemporalGraph();
    bridge = new NarrativeBridge(socialEngine, sentimentEngine, graph);

    app.use('/bridge', createBridgeRoutes(bridge));
    app.use(globalErrorHandler);
  });

  // ─── POST /bridge/link ─────────────────────────────────────────────

  describe('POST /bridge/link', () => {
    it('should successfully link an announcement to an event and return 201', async () => {
      socialEngine.loadDemoData();

      const event = graph.addEvent({
        title: 'Cabinet Reshuffle Announcement',
        description: 'Major cabinet reshuffle announced by the president',
        timestamp: '2024-01-15T00:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.8,
        sentiment: 0.3,
      });

      const res = await testRequest(app, 'POST', '/bridge/link', {
        announcementId: 'ann-cabinet-reshuffle',
        narrativeEventId: event.id,
      });

      expect(res.status).toBe(201);
      expect(res.body).toBeDefined();
      expect(res.body).toHaveProperty('announcementId', 'ann-cabinet-reshuffle');
      expect(res.body).toHaveProperty('narrativeEventId', event.id);
    });

    it('should return 400 when the announcement ID does not exist', async () => {
      const event = graph.addEvent({
        title: 'Test Event',
        description: 'A test event for linking',
        timestamp: '2024-02-01T00:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.5,
        sentiment: 0.0,
      });

      const res = await testRequest(app, 'POST', '/bridge/link', {
        announcementId: 'ann-nonexistent',
        narrativeEventId: event.id,
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 when the event ID does not exist', async () => {
      socialEngine.loadDemoData();

      const res = await testRequest(app, 'POST', '/bridge/link', {
        announcementId: 'ann-cabinet-reshuffle',
        narrativeEventId: 'event-nonexistent',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 when both announcement and event are missing', async () => {
      const res = await testRequest(app, 'POST', '/bridge/link', {
        announcementId: 'ann-nonexistent',
        narrativeEventId: 'event-nonexistent',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 with invalid body — missing announcementId', async () => {
      const res = await testRequest(app, 'POST', '/bridge/link', {
        narrativeEventId: 'event-123',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 with invalid body — missing narrativeEventId', async () => {
      const res = await testRequest(app, 'POST', '/bridge/link', {
        announcementId: 'ann-cabinet-reshuffle',
      });

      expect(res.status).toBe(400);
    });

    it('should return 400 with completely empty body', async () => {
      const res = await testRequest(app, 'POST', '/bridge/link', {});

      expect(res.status).toBe(400);
    });
  });

  // ─── GET /bridge/impact/:eventId ───────────────────────────────────

  describe('GET /bridge/impact/:eventId', () => {
    it('should return impact data for a linked event', async () => {
      socialEngine.loadDemoData();

      const event = graph.addEvent({
        title: 'SCS Incident Impact',
        description: 'South China Sea incident report',
        timestamp: '2024-03-01T00:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.9,
        sentiment: -0.5,
      });

      // Link first so impact can be retrieved
      await testRequest(app, 'POST', '/bridge/link', {
        announcementId: 'ann-scs-incident',
        narrativeEventId: event.id,
      });

      const res = await testRequest(app, 'GET', `/bridge/impact/${event.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('should return 400 for an event that has no linked announcements', async () => {
      const event = graph.addEvent({
        title: 'Unlinked Event',
        description: 'This event has no social media links',
        timestamp: '2024-04-01T00:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.2,
        sentiment: 0.1,
      });

      const res = await testRequest(app, 'GET', `/bridge/impact/${event.id}`);

      expect(res.status).toBe(400);
    });

    it('should return 400 for a non-existent event ID', async () => {
      const res = await testRequest(app, 'GET', '/bridge/impact/event-does-not-exist');

      expect(res.status).toBe(400);
    });
  });

  // ─── GET /bridge/correlation/:entityId ─────────────────────────────

  describe('GET /bridge/correlation/:entityId', () => {
    it('should return correlation data for an entity with announcements', async () => {
      socialEngine.loadDemoData();

      const res = await testRequest(app, 'GET', '/bridge/correlation/entity-prabowo');

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('should return correlation data for another known entity', async () => {
      socialEngine.loadDemoData();

      const res = await testRequest(app, 'GET', '/bridge/correlation/entity-ikn');

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('should return 400 for an entity with no announcements', async () => {
      const res = await testRequest(app, 'GET', '/bridge/correlation/entity-unknown-no-data');

      expect(res.status).toBe(400);
    });
  });

  // ─── GET /bridge/impact-chain/:eventId ─────────────────────────────

  describe('GET /bridge/impact-chain/:eventId', () => {
    it('should return a full impact chain for a linked event', async () => {
      socialEngine.loadDemoData();

      const event = graph.addEvent({
        title: 'Free Meals Program Launch',
        description: 'National free meals program officially launched',
        timestamp: '2024-05-01T00:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.7,
        sentiment: 0.6,
      });

      await testRequest(app, 'POST', '/bridge/link', {
        announcementId: 'ann-free-meals',
        narrativeEventId: event.id,
      });

      const res = await testRequest(app, 'GET', `/bridge/impact-chain/${event.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('should return a chain directly when given an announcement ID', async () => {
      socialEngine.loadDemoData();

      const res = await testRequest(app, 'GET', '/bridge/impact-chain/ann-cabinet-reshuffle');

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('should return 400 for a non-existent event with no links', async () => {
      const res = await testRequest(app, 'GET', '/bridge/impact-chain/event-totally-fake');

      expect(res.status).toBe(400);
    });

    it('should return a chain for an event linked to the SCS incident', async () => {
      socialEngine.loadDemoData();

      const event = graph.addEvent({
        title: 'SCS Diplomatic Response',
        description: 'Diplomatic response to South China Sea incident',
        timestamp: '2024-03-05T00:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.85,
        sentiment: -0.3,
      });

      await testRequest(app, 'POST', '/bridge/link', {
        announcementId: 'ann-scs-incident',
        narrativeEventId: event.id,
      });

      const res = await testRequest(app, 'GET', `/bridge/impact-chain/${event.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });
  });

  // ─── Cross-cutting / integration scenarios ─────────────────────────

  describe('Cross-cutting scenarios', () => {
    it('should allow linking multiple announcements to different events', async () => {
      socialEngine.loadDemoData();

      const event1 = graph.addEvent({
        title: 'Event One',
        description: 'First event for multi-link test',
        timestamp: '2024-06-01T00:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.5,
        sentiment: 0.2,
      });

      const event2 = graph.addEvent({
        title: 'Event Two',
        description: 'Second event for multi-link test',
        timestamp: '2024-06-15T00:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.6,
        sentiment: -0.1,
      });

      const res1 = await testRequest(app, 'POST', '/bridge/link', {
        announcementId: 'ann-cabinet-reshuffle',
        narrativeEventId: event1.id,
      });

      const res2 = await testRequest(app, 'POST', '/bridge/link', {
        announcementId: 'ann-free-meals',
        narrativeEventId: event2.id,
      });

      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);

      // Both should now have impact data
      const impact1 = await testRequest(app, 'GET', `/bridge/impact/${event1.id}`);
      const impact2 = await testRequest(app, 'GET', `/bridge/impact/${event2.id}`);

      expect(impact1.status).toBe(200);
      expect(impact2.status).toBe(200);
    });

    it('should return impact chain after linking and fetching impact for same event', async () => {
      socialEngine.loadDemoData();

      const event = graph.addEvent({
        title: 'Full Pipeline Event',
        description: 'Test the full link -> impact -> chain pipeline',
        timestamp: '2024-07-01T00:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.75,
        sentiment: 0.4,
      });

      // Link
      const linkRes = await testRequest(app, 'POST', '/bridge/link', {
        announcementId: 'ann-free-meals',
        narrativeEventId: event.id,
      });
      expect(linkRes.status).toBe(201);

      // Impact
      const impactRes = await testRequest(app, 'GET', `/bridge/impact/${event.id}`);
      expect(impactRes.status).toBe(200);

      // Chain
      const chainRes = await testRequest(app, 'GET', `/bridge/impact-chain/${event.id}`);
      expect(chainRes.status).toBe(200);
    });
  });
});
