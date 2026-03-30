// ============================================================
// LOOM — Social Media Intelligence API Routes
//
// REST endpoints for social media tracking, audience analysis,
// engagement patterns, and amplification chains.
// ============================================================

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler.js';
import { validateBody } from '../../middleware/validation.js';
import { ValidationError } from '../../errors/index.js';
import type { SocialMediaEngine } from '../social-engine.js';
import type { NarrativeBridge } from '../integration/narrative-bridge.js';

// ============================================================
// Request validation schemas
// ============================================================

const trackAnnouncementSchema = z.object({
  entityId: z.string().min(1, 'entityId is required'),
  entityName: z.string().min(1, 'entityName is required'),
  title: z.string().min(1, 'title is required'),
  description: z.string().min(1, 'description is required'),
  platforms: z
    .array(z.enum(['twitter', 'instagram', 'tiktok', 'facebook', 'reddit', 'youtube']))
    .min(1, 'at least one platform is required'),
  tags: z.array(z.string()).default([]),
});

const linkAnnouncementSchema = z.object({
  announcementId: z.string().min(1, 'announcementId is required'),
  narrativeEventId: z.string().min(1, 'narrativeEventId is required'),
});

const predictReactionSchema = z.object({
  announcement: z.string().min(1, 'announcement text is required'),
  tags: z.array(z.string()).default([]),
  platforms: z
    .array(z.enum(['twitter', 'instagram', 'tiktok', 'facebook', 'reddit', 'youtube']))
    .default(['twitter', 'instagram', 'tiktok']),
});

// ============================================================
// Pagination helper
// ============================================================

/** Pagination parameters. */
interface PaginationParams {
  /** Maximum items to return. */
  limit: number;
  /** Items to skip. */
  offset: number;
}

/** Parse pagination params from query string. */
function parsePagination(req: Request): PaginationParams {
  const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 50, 1), 500);
  const offset = Math.max(parseInt(String(req.query.offset)) || 0, 0);
  return { limit, offset };
}

/** Apply pagination to an array. */
function paginate<T>(items: T[], { limit, offset }: PaginationParams): T[] {
  return items.slice(offset, offset + limit);
}

// ============================================================
// Route factory
// ============================================================

/**
 * Create social media intelligence API routes.
 *
 * @param engine - The social media engine instance
 * @returns Express router with all social endpoints
 */
export function createSocialRoutes(engine: SocialMediaEngine, bridge?: NarrativeBridge): Router {
  const router = Router();

  // --- Dashboard ---

  router.get(
    '/dashboard',
    asyncHandler(async (_req: Request, res: Response): Promise<void> => {
      const dashboard = engine.getDashboard();
      res.json(dashboard);
    })
  );

  // --- Announcements listing ---

  router.get(
    '/announcements',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const { limit, offset } = parsePagination(req);
      const entityId = req.query.entityId as string | undefined;
      const tag = req.query.tag as string | undefined;

      let announcements = engine.getAnnouncements();

      if (entityId) {
        announcements = announcements.filter((a) => a.entityId === entityId);
      }
      if (tag) {
        const tagLower = tag.toLowerCase();
        announcements = announcements.filter((a) =>
          a.tags.some((t) => t.toLowerCase().includes(tagLower))
        );
      }

      // Sort by impact score descending
      announcements.sort((a, b) => b.impactScore.score - a.impactScore.score);

      res.json({
        total: announcements.length,
        limit,
        offset,
        announcements: paginate(announcements, { limit, offset }),
      });
    })
  );

  // --- Single announcement detail ---

  router.get(
    '/announcements/:id',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const announcement = engine.getAnnouncementById(req.params.id as string);
      if (!announcement) {
        throw new ValidationError('Announcement not found', {
          id: req.params.id as string as string,
        });
      }
      res.json(announcement);
    })
  );

  // --- Track new announcement ---

  router.post(
    '/announcements',
    validateBody(trackAnnouncementSchema),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const { entityId, entityName, title, description, platforms, tags } = req.body;
      const announcement = engine.trackAnnouncement(
        entityId,
        entityName,
        title,
        description,
        platforms,
        tags
      );
      res.status(201).json(announcement);
    })
  );

  // --- Engagement pattern ---

  router.get(
    '/announcements/:id/engagement',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const pattern = engine.getEngagementPattern(req.params.id as string);
      if (!pattern) {
        throw new ValidationError('Announcement not found', {
          id: req.params.id as string as string,
        });
      }
      res.json(pattern);
    })
  );

  // --- Amplification chain ---

  router.get(
    '/announcements/:id/amplification',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const chain = engine.buildAmplificationChain(req.params.id as string);
      if (!chain) {
        throw new ValidationError('Announcement not found', {
          id: req.params.id as string as string,
        });
      }
      res.json(chain);
    })
  );

  // --- Audience segmentation ---

  router.get(
    '/audiences/:entityId',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const segments = engine.getAudienceSegmentation(req.params.entityId as string);
      res.json({ entityId: req.params.entityId as string, segments });
    })
  );

  // --- Personas listing ---

  router.get(
    '/personas',
    asyncHandler(async (_req: Request, res: Response): Promise<void> => {
      const personas = engine.buildAudiencePersonas();
      res.json({ total: personas.length, personas });
    })
  );

  // --- Single persona detail ---

  router.get(
    '/personas/:id',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const persona = engine.getPersonaById(req.params.id as string);
      if (!persona) {
        throw new ValidationError('Persona not found', { id: req.params.id as string as string });
      }
      res.json(persona);
    })
  );

  // --- Predict persona reaction ---

  router.post(
    '/personas/:id/predict',
    validateBody(predictReactionSchema),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const { announcement, tags, platforms } = req.body;
      const reaction = engine.predictPersonaReaction(
        req.params.id as string,
        announcement,
        tags,
        platforms
      );
      if (!reaction) {
        throw new ValidationError('Persona not found', { id: req.params.id as string as string });
      }
      res.json(reaction);
    })
  );

  // --- Influencers listing ---

  router.get(
    '/influencers',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const { limit, offset } = parsePagination(req);
      const influencers = engine.getInfluencers();
      res.json({
        total: influencers.length,
        limit,
        offset,
        influencers: paginate(influencers, { limit, offset }),
      });
    })
  );

  // --- Influencers for entity ---

  router.get(
    '/influencers/:entityId',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const influencers = engine.identifyInfluencers(req.params.entityId as string);
      res.json({ entityId: req.params.entityId as string, influencers });
    })
  );

  // --- Cross-platform analysis ---

  router.get(
    '/cross-platform/:eventId',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const analysis = engine.analyzeCrossPlatform(req.params.eventId as string);
      if (!analysis) {
        throw new ValidationError('Event not found', {
          eventId: req.params.eventId as string as string,
        });
      }
      res.json(analysis);
    })
  );

  // --- Audience overlap ---

  router.get(
    '/overlap',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const entity1 = req.query.entity1 as string | undefined;
      const entity2 = req.query.entity2 as string | undefined;

      if (!entity1 || !entity2) {
        throw new ValidationError('Both entity1 and entity2 query parameters are required');
      }

      const overlap = engine.getAudienceOverlap(entity1, entity2);
      res.json(overlap);
    })
  );

  // --- Narrative Bridge: Link announcement to event ---

  router.post(
    '/link',
    validateBody(linkAnnouncementSchema),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      if (!bridge) {
        throw new ValidationError('Narrative bridge not configured');
      }
      const { announcementId, narrativeEventId } = req.body;
      const link = bridge.linkAnnouncementToEvent(announcementId, narrativeEventId);
      if (!link) {
        throw new ValidationError('Announcement or event not found', {
          announcementId,
          narrativeEventId,
        });
      }
      res.status(201).json(link);
    })
  );

  // --- Narrative Bridge: Social impact for event ---

  router.get(
    '/impact/:eventId',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      if (!bridge) {
        throw new ValidationError('Narrative bridge not configured');
      }
      const impact = bridge.getEventSocialImpact(req.params.eventId as string);
      if (!impact) {
        throw new ValidationError('No social impact data for event', {
          eventId: req.params.eventId as string,
        });
      }
      res.json(impact);
    })
  );

  // --- Narrative Bridge: Engagement-sentiment correlation ---

  router.get(
    '/correlation/:entityId',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      if (!bridge) {
        throw new ValidationError('Narrative bridge not configured');
      }
      const correlation = bridge.correlateEngagementWithSentiment(req.params.entityId as string);
      if (!correlation) {
        throw new ValidationError('No correlation data for entity', {
          entityId: req.params.entityId as string,
        });
      }
      res.json(correlation);
    })
  );

  // --- Narrative Bridge: Full impact chain ---

  router.get(
    '/impact-chain/:eventId',
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
      if (!bridge) {
        throw new ValidationError('Narrative bridge not configured');
      }
      const chain = bridge.buildFullImpactChain(req.params.eventId as string);
      if (!chain) {
        throw new ValidationError('No impact chain data for event', {
          eventId: req.params.eventId as string,
        });
      }
      res.json(chain);
    })
  );

  // --- Load demo data ---

  router.post(
    '/demo/load',
    asyncHandler(async (_req: Request, res: Response): Promise<void> => {
      const count = engine.loadDemoData();
      res.json({
        loaded: true,
        announcementCount: count,
        message: 'Indonesian social media intelligence demo data loaded',
      });
    })
  );

  return router;
}
