import { Router, type Request, type Response } from 'express';
import type { TemporalGraph } from '../graph/temporal-graph.js';
import { analyzeTensions } from '../analysis/tension-radar.js';
import { analyzeArcs } from '../analysis/arc-detector.js';
import { ValidationError } from '../errors/index.js';
import {
  getIndonesiaSources,
  getIndonesiaSourceById,
} from '../sentiment/sources/profiles/indonesia.js';
import { getEntityProfiles, getEntityById } from '../knowledge-base/entities/indonesia.js';
import { getAllMethodologies, getMethodology } from '../knowledge-base/methodology.js';

// ============================================================
// LOOM — Knowledge Base & Breakdown API Routes
//
// Provides endpoints for:
// - Score breakdowns for any metric
// - Media source profiles with extended data
// - Entity profiles
// - Scoring methodology documentation
// ============================================================

/** Metric types available for breakdown queries. */
const METRIC_TYPES = ['tension', 'arc', 'dream'] as const;
type MetricType = (typeof METRIC_TYPES)[number];

/**
 * Create the knowledge base and breakdown API routes.
 *
 * @param graph - The temporal graph instance
 * @returns Express Router with knowledge base endpoints
 */
export function createKnowledgeBaseRoutes(graph: TemporalGraph): Router {
  const router = Router();

  // ============================================================
  // Score Breakdown Endpoints
  // ============================================================

  /**
   * GET /analysis/breakdown/:metricType/:id
   * Get the full score breakdown for any metric by type and ID.
   */
  router.get('/analysis/breakdown/:metricType/:id', (req: Request, res: Response) => {
    const metricType = req.params.metricType as string;
    const id = req.params.id as string;

    if (!METRIC_TYPES.includes(metricType as MetricType)) {
      throw new ValidationError(`Invalid metric type: ${metricType}`, {
        available: METRIC_TYPES,
      });
    }

    if (metricType === 'tension') {
      const analyses = analyzeTensions(graph);
      const analysis = analyses.find((a) => a.tensionId === id);
      if (!analysis) {
        res.status(404).json({ error: `Tension ${id} not found or not active` });
        return;
      }
      res.json({
        metricType: 'tension',
        id,
        name: analysis.tensionName,
        overallScore: analysis.overallScore,
        breakdown: analysis.scoreBreakdown,
        components: analysis.components,
      });
      return;
    }

    if (metricType === 'arc') {
      const analyses = analyzeArcs(graph);
      const analysis = analyses.find((a) => a.arcId === id);
      if (!analysis) {
        res.status(404).json({ error: `Arc ${id} not found` });
        return;
      }
      res.json({
        metricType: 'arc',
        id,
        name: analysis.arcName,
        healthScore: analysis.healthScore,
        healthBreakdown: analysis.healthBreakdown,
        archetypeBreakdown: analysis.archetypeBreakdown,
      });
      return;
    }

    res.status(404).json({ error: `Breakdown not available for ${metricType}/${id}` });
  });

  // ============================================================
  // Knowledge Base — Sources
  // ============================================================

  /**
   * GET /knowledge-base/sources
   * List all source profiles with full metadata.
   */
  router.get('/knowledge-base/sources', (_req: Request, res: Response) => {
    const sources = getIndonesiaSources();
    res.json({
      sources: sources.map((s) => ({
        id: s.id,
        name: s.name,
        country: s.country,
        languages: s.languages,
        url: s.url,
        politicalLeaning: s.politicalLeaning,
        reliabilityScore: s.reliabilityScore,
        audienceTypes: s.audienceTypes,
        biasDirection: s.biasDirection,
        signalWeight: s.signalWeight,
        active: s.active,
        hasExtendedProfile: !!s.extendedProfile,
      })),
      total: sources.length,
    });
  });

  /**
   * GET /knowledge-base/sources/:id
   * Get a single source with full extended profile.
   */
  router.get('/knowledge-base/sources/:id', (req: Request, res: Response) => {
    const source = getIndonesiaSourceById(req.params.id as string);
    if (!source) {
      res.status(404).json({ error: 'Source not found' });
      return;
    }
    res.json(source);
  });

  // ============================================================
  // Knowledge Base — Entities
  // ============================================================

  /**
   * GET /knowledge-base/entities
   * List all entity profiles.
   */
  router.get('/knowledge-base/entities', (_req: Request, res: Response) => {
    const entities = getEntityProfiles();
    res.json({
      entities: [...entities],
      total: entities.length,
    });
  });

  /**
   * GET /knowledge-base/entities/:id
   * Get a single entity profile.
   */
  router.get('/knowledge-base/entities/:id', (req: Request, res: Response) => {
    const entity = getEntityById(req.params.id as string);
    if (!entity) {
      res.status(404).json({ error: 'Entity not found' });
      return;
    }
    res.json(entity);
  });

  // ============================================================
  // Knowledge Base — Methodology
  // ============================================================

  /**
   * GET /knowledge-base/methodology
   * Get scoring methodology documentation.
   */
  router.get('/knowledge-base/methodology', (_req: Request, res: Response) => {
    const methodologies = getAllMethodologies();
    res.json({
      methodologies,
      total: methodologies.length,
    });
  });

  /**
   * GET /knowledge-base/methodology/:id
   * Get a specific methodology entry.
   */
  router.get('/knowledge-base/methodology/:id', (req: Request, res: Response) => {
    const methodology = getMethodology(req.params.id as string);
    if (!methodology) {
      res.status(404).json({ error: 'Methodology not found' });
      return;
    }
    res.json(methodology);
  });

  return router;
}
