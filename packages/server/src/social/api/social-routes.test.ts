import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import { createSocialRoutes } from './social-routes.js';
import { SocialMediaEngine } from '../social-engine.js';
import { globalErrorHandler } from '../../middleware/error-handler.js';
import type { SocialPlatform } from '../types.js';

// ============================================================
// LOOM — Social Media API Route Tests
//
// Integration tests for all social media intelligence endpoints.
// Follows the exact patterns from sentiment-routes.test.ts.
// ============================================================

/**
 * Helper: create an Express app wired up with social routes and error handler.
 */
function createTestApp(engine: SocialMediaEngine): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/social', createSocialRoutes(engine));
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

/** Helper to create a valid announcement payload. */
function makeAnnouncementPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'New Product Launch',
    content: 'We are thrilled to announce our latest AI platform.',
    platform: 'twitter',
    author: 'official_account',
    url: 'https://twitter.com/official/status/1',
    metrics: {
      likes: 2500,
      shares: 500,
      comments: 120,
      views: 80000,
    },
    ...overrides,
  };
}

describe('Social API Routes', () => {
  let engine: SocialMediaEngine;
  let app: express.Express;

  beforeEach(() => {
    engine = new SocialMediaEngine();
    app = createTestApp(engine);
  });

  // -------------------------------------------------------------------------
  // POST /social/announcements
  // -------------------------------------------------------------------------
  describe('POST /social/announcements', () => {
    it('should track announcement and return result', async () => {
      const res = await testRequest(
        app,
        'POST',
        '/social/announcements',
        makeAnnouncementPayload()
      );

      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('New Product Launch');
      expect(res.body.platform).toBe('twitter');
    });

    it('should reject missing title', async () => {
      const res = await testRequest(
        app,
        'POST',
        '/social/announcements',
        makeAnnouncementPayload({ title: '' })
      );
      expect(res.status).toBe(400);
    });

    it('should reject missing content', async () => {
      const res = await testRequest(
        app,
        'POST',
        '/social/announcements',
        makeAnnouncementPayload({ content: '' })
      );
      expect(res.status).toBe(400);
    });

    it('should reject missing platform', async () => {
      const payload = makeAnnouncementPayload();
      delete (payload as Record<string, unknown>).platform;
      const res = await testRequest(app, 'POST', '/social/announcements', payload);
      expect(res.status).toBe(400);
    });

    it('should reject invalid platform', async () => {
      const res = await testRequest(
        app,
        'POST',
        '/social/announcements',
        makeAnnouncementPayload({ platform: 'myspace' })
      );
      expect(res.status).toBe(400);
    });

    it('should reject missing author', async () => {
      const payload = makeAnnouncementPayload();
      delete (payload as Record<string, unknown>).author;
      const res = await testRequest(app, 'POST', '/social/announcements', payload);
      expect(res.status).toBe(400);
    });

    it('should reject missing metrics', async () => {
      const payload = makeAnnouncementPayload();
      delete (payload as Record<string, unknown>).metrics;
      const res = await testRequest(app, 'POST', '/social/announcements', payload);
      expect(res.status).toBe(400);
    });

    it('should accept announcement without optional url', async () => {
      const payload = makeAnnouncementPayload();
      delete (payload as Record<string, unknown>).url;
      const res = await testRequest(app, 'POST', '/social/announcements', payload);
      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // GET /social/announcements
  // -------------------------------------------------------------------------
  describe('GET /social/announcements', () => {
    it('should return empty list initially', async () => {
      const res = await testRequest(app, 'GET', '/social/announcements');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(0);
      expect(res.body.announcements).toEqual([]);
    });

    it('should return tracked announcements', async () => {
      engine.trackAnnouncement({
        title: 'Test',
        content: 'Content',
        platform: 'twitter' as SocialPlatform,
        author: 'user',
        metrics: { likes: 100, shares: 20, comments: 5, views: 5000 },
      });

      const res = await testRequest(app, 'GET', '/social/announcements');

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect((res.body.announcements as unknown[]).length).toBe(1);
    });

    it('should support pagination with limit and offset', async () => {
      for (let i = 0; i < 10; i++) {
        engine.trackAnnouncement({
          title: `Announcement ${i}`,
          content: `Content ${i}`,
          platform: 'twitter' as SocialPlatform,
          author: 'user',
          metrics: { likes: i * 100, shares: i * 20, comments: i * 5, views: i * 5000 },
        });
      }

      const res = await testRequest(app, 'GET', '/social/announcements?limit=3&offset=2');

      expect(res.status).toBe(200);
      expect(res.body.limit).toBe(3);
      expect(res.body.offset).toBe(2);
      expect((res.body.announcements as unknown[]).length).toBeLessThanOrEqual(3);
    });

    it('should filter by platform', async () => {
      engine.trackAnnouncement({
        title: 'Twitter post',
        content: 'Content',
        platform: 'twitter' as SocialPlatform,
        author: 'user',
        metrics: { likes: 100, shares: 20, comments: 5, views: 5000 },
      });
      engine.trackAnnouncement({
        title: 'Facebook post',
        content: 'Content',
        platform: 'facebook' as SocialPlatform,
        author: 'user',
        metrics: { likes: 100, shares: 20, comments: 5, views: 5000 },
      });

      const res = await testRequest(app, 'GET', '/social/announcements?platform=twitter');

      expect(res.status).toBe(200);
      const announcements = res.body.announcements as Array<{ platform: string }>;
      for (const a of announcements) {
        expect(a.platform).toBe('twitter');
      }
    });
  });

  // -------------------------------------------------------------------------
  // GET /social/announcements/:id
  // -------------------------------------------------------------------------
  describe('GET /social/announcements/:id', () => {
    it('should return announcement by id', async () => {
      const tracked = engine.trackAnnouncement({
        title: 'Specific post',
        content: 'Content here',
        platform: 'twitter' as SocialPlatform,
        author: 'user',
        metrics: { likes: 100, shares: 20, comments: 5, views: 5000 },
      });

      const res = await testRequest(app, 'GET', `/social/announcements/${tracked.id}`);

      expect(res.status).toBe(200);
      expect((res.body.announcement as { id: string }).id).toBe(tracked.id);
    });

    it('should return 404 for non-existent announcement', async () => {
      const res = await testRequest(app, 'GET', '/social/announcements/non-existent-id');
      expect([400, 404]).toContain(res.status);
    });
  });

  // -------------------------------------------------------------------------
  // GET /social/engagement/:id
  // -------------------------------------------------------------------------
  describe('GET /social/engagement/:id', () => {
    it('should return engagement pattern for announcement', async () => {
      const tracked = engine.trackAnnouncement({
        title: 'Engagement test',
        content: 'Content',
        platform: 'twitter' as SocialPlatform,
        author: 'user',
        metrics: { likes: 1000, shares: 200, comments: 50, views: 30000 },
      });

      const res = await testRequest(app, 'GET', `/social/engagement/${tracked.id}`);

      expect(res.status).toBe(200);
      expect(res.body.announcementId).toBe(tracked.id);
      expect(res.body.patternType).toBeDefined();
    });

    it('should return error for non-existent announcement', async () => {
      const res = await testRequest(app, 'GET', '/social/engagement/invalid-id');
      expect([400, 404]).toContain(res.status);
    });
  });

  // -------------------------------------------------------------------------
  // GET /social/engagement/:id/quality
  // -------------------------------------------------------------------------
  describe('GET /social/engagement/:id/quality', () => {
    it('should return engagement quality score', async () => {
      const tracked = engine.trackAnnouncement({
        title: 'Quality test',
        content: 'Content',
        platform: 'twitter' as SocialPlatform,
        author: 'user',
        metrics: { likes: 500, shares: 100, comments: 80, views: 15000 },
      });

      const res = await testRequest(app, 'GET', `/social/engagement/${tracked.id}/quality`);

      expect(res.status).toBe(200);
      expect(typeof res.body.authenticityScore).toBe('number');
      expect(typeof res.body.overallQuality).toBe('number');
    });
  });

  // -------------------------------------------------------------------------
  // GET /social/audience/segments
  // -------------------------------------------------------------------------
  describe('GET /social/audience/segments', () => {
    it('should return audience segments', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/audience/segments');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.segments)).toBe(true);
    });

    it('should return empty segments when no data', async () => {
      const res = await testRequest(app, 'GET', '/social/audience/segments');

      expect(res.status).toBe(200);
      expect(res.body.segments).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // GET /social/audience/overlap
  // -------------------------------------------------------------------------
  describe('GET /social/audience/overlap', () => {
    it('should return overlap between two platforms', async () => {
      engine.loadDemoData();
      const res = await testRequest(
        app,
        'GET',
        '/social/audience/overlap?platformA=twitter&platformB=facebook'
      );

      expect(res.status).toBe(200);
      expect(res.body.platformA).toBe('twitter');
      expect(res.body.platformB).toBe('facebook');
      expect(typeof res.body.overlapPercentage).toBe('number');
    });

    it('should reject missing platform parameters', async () => {
      const res = await testRequest(app, 'GET', '/social/audience/overlap');
      expect(res.status).toBe(400);
    });

    it('should reject missing platformB', async () => {
      const res = await testRequest(app, 'GET', '/social/audience/overlap?platformA=twitter');
      expect(res.status).toBe(400);
    });
  });

  // -------------------------------------------------------------------------
  // GET /social/audience/personas
  // -------------------------------------------------------------------------
  describe('GET /social/audience/personas', () => {
    it('should return audience personas', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/audience/personas');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.personas)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // POST /social/audience/personas/:name/predict
  // -------------------------------------------------------------------------
  describe('POST /social/audience/personas/:name/predict', () => {
    it('should predict persona reaction', async () => {
      engine.loadDemoData();
      const personas = engine.buildAudiencePersonas();

      if (personas.length > 0) {
        const res = await testRequest(
          app,
          'POST',
          `/social/audience/personas/${encodeURIComponent(personas[0].name)}/predict`,
          {
            title: 'New feature launch',
            content: 'Exciting new AI-powered analytics tool.',
            platform: 'twitter',
          }
        );

        expect(res.status).toBe(200);
        expect(res.body.personaName).toBe(personas[0].name);
        expect(res.body.likelyEngagement).toBeDefined();
      }
    });

    it('should return error for unknown persona', async () => {
      const res = await testRequest(
        app,
        'POST',
        '/social/audience/personas/UnknownPersona/predict',
        {
          title: 'Test',
          content: 'Content',
          platform: 'twitter',
        }
      );
      expect([400, 404]).toContain(res.status);
    });
  });

  // -------------------------------------------------------------------------
  // GET /social/influencers
  // -------------------------------------------------------------------------
  describe('GET /social/influencers', () => {
    it('should return influencer list', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/influencers');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.influencers)).toBe(true);
    });

    it('should support limit parameter', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/influencers?limit=3');

      expect(res.status).toBe(200);
      expect((res.body.influencers as unknown[]).length).toBeLessThanOrEqual(3);
    });

    it('should return empty list when no data', async () => {
      const res = await testRequest(app, 'GET', '/social/influencers');

      expect(res.status).toBe(200);
      expect(res.body.influencers).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // GET /social/cross-platform
  // -------------------------------------------------------------------------
  describe('GET /social/cross-platform', () => {
    it('should return cross-platform comparison', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/cross-platform');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.platforms)).toBe(true);
    });

    it('should return empty comparison when no data', async () => {
      const res = await testRequest(app, 'GET', '/social/cross-platform');

      expect(res.status).toBe(200);
      expect(res.body.platforms).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // GET /social/amplification/:id
  // -------------------------------------------------------------------------
  describe('GET /social/amplification/:id', () => {
    it('should return amplification chain for announcement', async () => {
      const tracked = engine.trackAnnouncement({
        title: 'Viral post',
        content: 'This is going viral',
        platform: 'twitter' as SocialPlatform,
        author: 'user',
        metrics: { likes: 10000, shares: 5000, comments: 2000, views: 500000 },
      });

      const res = await testRequest(app, 'GET', `/social/amplification/${tracked.id}`);

      expect(res.status).toBe(200);
      expect(res.body.originId).toBe(tracked.id);
      expect(Array.isArray(res.body.nodes)).toBe(true);
    });

    it('should return error for non-existent announcement', async () => {
      const res = await testRequest(app, 'GET', '/social/amplification/non-existent');
      expect([400, 404]).toContain(res.status);
    });
  });

  // -------------------------------------------------------------------------
  // GET /social/dashboard
  // -------------------------------------------------------------------------
  describe('GET /social/dashboard', () => {
    it('should return complete dashboard', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'GET', '/social/dashboard');

      expect(res.status).toBe(200);
      expect(typeof res.body.totalAnnouncements).toBe('number');
      expect(typeof res.body.totalEngagement).toBe('number');
      expect(Array.isArray(res.body.platformBreakdown)).toBe(true);
      expect(Array.isArray(res.body.recentAnnouncements)).toBe(true);
    });

    it('should return empty dashboard when no data', async () => {
      const res = await testRequest(app, 'GET', '/social/dashboard');

      expect(res.status).toBe(200);
      expect(res.body.totalAnnouncements).toBe(0);
      expect(res.body.totalEngagement).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // POST /social/demo/load
  // -------------------------------------------------------------------------
  describe('POST /social/demo/load', () => {
    it('should load demo data', async () => {
      const res = await testRequest(app, 'POST', '/social/demo/load');

      expect(res.status).toBe(200);
      expect(res.body.loaded).toBe(true);
      expect(typeof res.body.announcementCount).toBe('number');
      expect(res.body.announcementCount as number).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // POST /social/clear
  // -------------------------------------------------------------------------
  describe('POST /social/clear', () => {
    it('should clear all data', async () => {
      engine.loadDemoData();
      const res = await testRequest(app, 'POST', '/social/clear');

      expect(res.status).toBe(200);
      expect(res.body.cleared).toBe(true);

      const dashRes = await testRequest(app, 'GET', '/social/dashboard');
      expect(dashRes.body.totalAnnouncements).toBe(0);
    });
  });
});
