import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import { createSocialRoutes } from './social-routes.js';
import { SocialMediaEngine } from '../social-engine.js';
import { globalErrorHandler } from '../../middleware/error-handler.js';

// ============================================================
// LOOM — Social Media API Route Tests
// ============================================================

/** Create an Express app wired up with social routes and error handler. */
function createTestApp(engine: SocialMediaEngine): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/social', createSocialRoutes(engine));
  app.use(globalErrorHandler);
  return app;
}

/** Lightweight fetch wrapper for testing Express apps. */
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

describe('Social API Routes', () => {
  let engine: SocialMediaEngine;
  let app: express.Express;

  beforeEach(() => {
    engine = new SocialMediaEngine();
    app = createTestApp(engine);
  });

  describe('GET /social/dashboard', () => {
    it('should return dashboard data', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/dashboard');

      expect(res.status).toBe(200);
      expect(typeof res.body.totalAnnouncements).toBe('number');
      expect(typeof res.body.totalInfluencers).toBe('number');
    });

    it('should return empty dashboard when no data', async () => {
      const res = await testRequest(app, 'GET', '/social/dashboard');

      expect(res.status).toBe(200);
      expect(res.body.totalAnnouncements).toBe(0);
    });
  });

  describe('GET /social/announcements', () => {
    it('should return empty list initially', async () => {
      const res = await testRequest(app, 'GET', '/social/announcements');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.announcements).toEqual([]);
    });

    it('should return announcements after loading demo data', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/announcements');

      expect(res.status).toBe(200);
      expect(res.body.total).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/announcements?limit=3&offset=0');

      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(3);
      expect((res.body.announcements as unknown[]).length).toBeLessThanOrEqual(3);
    });

    it('should filter by entityId query param', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/announcements?entityId=entity-prabowo');

      expect(res.status).toBe(200);
      const announcements = res.body.announcements as Array<{ entityId: string }>;
      expect(announcements.length).toBeGreaterThan(0);
      announcements.forEach((a) => {
        expect(a.entityId).toBe('entity-prabowo');
      });
    });

    it('should filter by tag query param', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/announcements?tag=politics');

      expect(res.status).toBe(200);
      const announcements = res.body.announcements as Array<{ tags: string[] }>;
      announcements.forEach((a) => {
        const hasTag = a.tags.some((t) => t.toLowerCase().includes('politics'));
        expect(hasTag).toBe(true);
      });
    });

    it('should filter by combined entityId and tag', async () => {
      engine.loadDemoData();
      const res = await testRequest(
        app,
        'GET',
        '/social/announcements?entityId=entity-prabowo&tag=politics'
      );

      expect(res.status).toBe(200);
      const announcements = res.body.announcements as Array<{
        entityId: string;
        tags: string[];
      }>;
      announcements.forEach((a) => {
        expect(a.entityId).toBe('entity-prabowo');
        const hasTag = a.tags.some((t) => t.toLowerCase().includes('politics'));
        expect(hasTag).toBe(true);
      });
    });
  });

  describe('POST /social/announcements', () => {
    it('should track a new announcement', async () => {
      const res = await testRequest(app, 'POST', '/social/announcements', {
        entityId: 'entity-test',
        entityName: 'Test Entity',
        title: 'New Announcement',
        description: 'A test announcement',
        platforms: ['twitter', 'instagram'],
        tags: ['test'],
      });

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('New Announcement');
    });

    it('should reject missing title', async () => {
      const res = await testRequest(app, 'POST', '/social/announcements', {
        entityId: 'e1',
        entityName: 'E1',
        title: '',
        description: 'Desc',
        platforms: ['twitter'],
      });
      expect(res.status).toBe(400);
    });

    it('should reject missing platforms', async () => {
      const res = await testRequest(app, 'POST', '/social/announcements', {
        entityId: 'e1',
        entityName: 'E1',
        title: 'Test',
        description: 'Desc',
        platforms: [],
      });
      expect(res.status).toBe(400);
    });

    it('should reject invalid platform', async () => {
      const res = await testRequest(app, 'POST', '/social/announcements', {
        entityId: 'e1',
        entityName: 'E1',
        title: 'Test',
        description: 'Desc',
        platforms: ['myspace'],
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /social/announcements/:id', () => {
    it('should return announcement by id', async () => {
      engine.loadDemoData();
      const announcements = engine.getAnnouncements();
      const res = await testRequest(app, 'GET', `/social/announcements/${announcements[0].id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(announcements[0].id);
    });

    it('should return 400 for non-existent announcement', async () => {
      const res = await testRequest(app, 'GET', '/social/announcements/non-existent');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /social/announcements/:id/engagement', () => {
    it('should return engagement pattern', async () => {
      engine.loadDemoData();
      const announcements = engine.getAnnouncements();
      const res = await testRequest(
        app,
        'GET',
        `/social/announcements/${announcements[0].id}/engagement`
      );

      expect(res.status).toBe(200);
      expect(res.body.type).toBeDefined();
    });

    it('should return 400 for non-existent announcement', async () => {
      const res = await testRequest(app, 'GET', '/social/announcements/non-existent/engagement');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /social/announcements/:id/amplification', () => {
    it('should return amplification chain', async () => {
      engine.loadDemoData();
      const announcements = engine.getAnnouncements();
      const res = await testRequest(
        app,
        'GET',
        `/social/announcements/${announcements[0].id}/amplification`
      );

      expect(res.status).toBe(200);
      expect(res.body.source).toBeDefined();
      expect(typeof res.body.totalReach).toBe('number');
    });

    it('should return 400 for non-existent announcement', async () => {
      const res = await testRequest(app, 'GET', '/social/announcements/non-existent/amplification');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /social/audiences/:entityId', () => {
    it('should return audience segments for entity with data', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/audiences/entity-prabowo');

      expect(res.status).toBe(200);
      expect(res.body.entityId).toBe('entity-prabowo');
      expect(Array.isArray(res.body.segments)).toBe(true);
      expect((res.body.segments as unknown[]).length).toBeGreaterThan(0);
    });

    it('should return segments for unknown entity', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/audiences/unknown-entity');

      expect(res.status).toBe(200);
      expect(res.body.entityId).toBe('unknown-entity');
      expect(Array.isArray(res.body.segments)).toBe(true);
    });
  });

  describe('GET /social/personas', () => {
    it('should return personas after loading demo data', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/personas');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.personas)).toBe(true);
      expect((res.body.personas as unknown[]).length).toBeGreaterThan(0);
    });
  });

  describe('GET /social/personas/:id', () => {
    it('should return persona by id', async () => {
      engine.loadDemoData();
      const personas = engine.buildAudiencePersonas();
      const res = await testRequest(app, 'GET', `/social/personas/${personas[0].id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(personas[0].id);
      expect(res.body.name).toBe(personas[0].name);
    });

    it('should return 400 for non-existent persona', async () => {
      const res = await testRequest(app, 'GET', '/social/personas/non-existent');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /social/personas/:id/predict', () => {
    it('should predict persona reaction', async () => {
      engine.loadDemoData();
      const personas = engine.buildAudiencePersonas();

      const res = await testRequest(app, 'POST', `/social/personas/${personas[0].id}/predict`, {
        announcement: 'New economic growth program',
        tags: ['economics'],
        platforms: ['twitter'],
      });

      expect(res.status).toBe(200);
      expect(res.body.personaName).toBe(personas[0].name);
      expect(typeof res.body.sentimentScore).toBe('number');
    });

    it('should return 400 for unknown persona', async () => {
      const res = await testRequest(app, 'POST', '/social/personas/unknown-id/predict', {
        announcement: 'Test',
        tags: [],
        platforms: ['twitter'],
      });
      expect(res.status).toBe(400);
    });

    it('should reject missing announcement', async () => {
      engine.loadDemoData();
      const personas = engine.buildAudiencePersonas();
      const res = await testRequest(app, 'POST', `/social/personas/${personas[0].id}/predict`, {
        announcement: '',
        tags: [],
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /social/influencers', () => {
    it('should return influencer list', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/influencers');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.influencers)).toBe(true);
      expect((res.body.influencers as unknown[]).length).toBeGreaterThan(0);
    });

    it('should support limit', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/influencers?limit=3');

      expect(res.status).toBe(200);
      expect((res.body.influencers as unknown[]).length).toBeLessThanOrEqual(3);
    });
  });

  describe('GET /social/influencers/:entityId', () => {
    it('should return influencers for entity', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/influencers/entity-prabowo');

      expect(res.status).toBe(200);
      expect(res.body.entityId).toBe('entity-prabowo');
      expect(Array.isArray(res.body.influencers)).toBe(true);
      expect((res.body.influencers as unknown[]).length).toBeGreaterThan(0);
    });

    it('should return influencers for unknown entity', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/influencers/unknown-entity');

      expect(res.status).toBe(200);
      expect(res.body.entityId).toBe('unknown-entity');
      expect(Array.isArray(res.body.influencers)).toBe(true);
    });
  });

  describe('GET /social/cross-platform/:eventId', () => {
    it('should return cross-platform analysis', async () => {
      engine.loadDemoData();
      const announcements = engine.getAnnouncements();
      const res = await testRequest(app, 'GET', `/social/cross-platform/${announcements[0].id}`);

      expect(res.status).toBe(200);
      expect(res.body.eventId).toBe(announcements[0].id);
      expect(res.body.dominantPlatform).toBeDefined();
    });

    it('should return 400 for non-existent event', async () => {
      const res = await testRequest(app, 'GET', '/social/cross-platform/non-existent');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /social/overlap', () => {
    it('should return overlap between entities', async () => {
      engine.loadDemoData();
      const res = await testRequest(
        app,
        'GET',
        '/social/overlap?entity1=entity-prabowo&entity2=entity-ikn'
      );

      expect(res.status).toBe(200);
      expect(typeof res.body.overlapCoefficient).toBe('number');
    });

    it('should reject missing parameters', async () => {
      const res = await testRequest(app, 'GET', '/social/overlap');
      expect(res.status).toBe(400);
    });

    it('should reject missing entity2', async () => {
      const res = await testRequest(app, 'GET', '/social/overlap?entity1=test');
      expect(res.status).toBe(400);
    });

    it('should reject missing entity1 only', async () => {
      const res = await testRequest(app, 'GET', '/social/overlap?entity2=test');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /social/demo/load', () => {
    it('should load demo data', async () => {
      const res = await testRequest(app, 'POST', '/social/demo/load');

      expect(res.status).toBe(200);
      expect(res.body.loaded).toBe(true);
      expect(typeof res.body.announcementCount).toBe('number');
      expect(res.body.announcementCount as number).toBeGreaterThan(0);
    });
  });
});
