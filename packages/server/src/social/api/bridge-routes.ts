// ============================================================
// LOOM — Narrative Bridge API Routes
//
// REST endpoints for linking social media announcements to
// narrative events, impact analysis, and correlation data.
// ============================================================

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../../middleware/error-handler.js';
import { validateBody } from '../../middleware/validation.js';
import { ValidationError } from '../../errors/index.js';
import type { NarrativeBridge } from '../integration/narrative-bridge.js';

// ============================================================
// Request validation schemas
// ============================================================

const linkAnnouncementSchema = z.object({
  announcementId: z.string().min(1, 'announcementId is required').max(200, 'announcementId too long'),
  narrativeEventId: z.string().min(1, 'narrativeEventId is required').max(200, 'narrativeEventId too long'),
});

// ============================================================
// Route factory
// ============================================================

/**
 * Create narrative bridge API routes.
 *
 * @param bridge - The narrative bridge instance
 * @returns Express router with bridge endpoints
 */
export function createBridgeRoutes(bridge: NarrativeBridge): Router {
  const router = Router();

  // --- Narrative Bridge: Link announcement to event ---

  router.post(
    '/link',
    validateBody(linkAnnouncementSchema),
    asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
      const chain = bridge.buildFullImpactChain(req.params.eventId as string);
      if (!chain) {
        throw new ValidationError('No impact chain data for event', {
          eventId: req.params.eventId as string,
        });
      }
      res.json(chain);
    })
  );

  return router;
}
