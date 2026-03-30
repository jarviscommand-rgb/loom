import { describe, it, expect } from 'vitest';
import { swaggerSpec } from './swagger.js';

describe('OpenAPI Specification', () => {
  it('should be a valid OpenAPI 3.0.x spec', () => {
    const spec = swaggerSpec as Record<string, unknown>;
    expect(spec.openapi).toMatch(/^3\.0\.\d+$/);
    expect(spec.info).toBeDefined();
    expect((spec.info as Record<string, unknown>).title).toBe(
      'LOOM — Causal Narrative Intelligence Engine'
    );
    expect((spec.info as Record<string, unknown>).version).toBe('0.1.0');
  });

  it('should have servers defined', () => {
    const spec = swaggerSpec as Record<string, unknown>;
    expect(spec.servers).toBeDefined();
    expect(Array.isArray(spec.servers)).toBe(true);
    expect((spec.servers as unknown[]).length).toBeGreaterThan(0);
  });

  it('should have tags defined', () => {
    const spec = swaggerSpec as Record<string, unknown>;
    expect(spec.tags).toBeDefined();
    expect(Array.isArray(spec.tags)).toBe(true);
    expect((spec.tags as unknown[]).length).toBeGreaterThan(0);
  });

  it('should have component schemas defined', () => {
    const spec = swaggerSpec as Record<string, unknown>;
    const components = spec.components as Record<string, unknown>;
    expect(components).toBeDefined();
    const schemas = components.schemas as Record<string, unknown>;
    expect(schemas).toBeDefined();

    const expectedSchemas = [
      'Entity',
      'Event',
      'Tension',
      'Arc',
      'GraphSnapshot',
      'ExtractionRequest',
      'DreamRequest',
      'SentimentArticle',
      'IngestRequest',
      'PredictRequest',
      'Source',
      'Error',
      'PaginatedResponse',
    ];

    for (const schema of expectedSchemas) {
      expect(schemas[schema], `Missing schema: ${schema}`).toBeDefined();
    }
  });

  describe('documented paths', () => {
    const expectedPaths = [
      // Health
      '/health',
      // Graph
      '/api/graph',
      '/api/graph/at/{timestamp}',
      // Entities
      '/api/entities',
      '/api/entities/{id}',
      '/api/entities/{id}/events',
      // Events
      '/api/events',
      '/api/events/range',
      // Tensions
      '/api/tensions',
      '/api/tensions/active',
      // Arcs
      '/api/arcs',
      // Analysis
      '/api/analysis/pressure-points',
      '/api/analysis/dream',
      // Extraction
      '/api/extract',
      // Demo
      '/api/demo/list',
      '/api/demo/load',
      '/api/demo/reset',
      // Sentiment
      '/api/sentiment/ingest',
      '/api/sentiment/articles',
      '/api/sentiment/articles/{id}',
      '/api/sentiment/events',
      '/api/sentiment/timeline/{entity}',
      '/api/sentiment/categories',
      '/api/sentiment/sources',
      '/api/sentiment/sources/{id}',
      '/api/sentiment/predict',
      '/api/sentiment/dashboard',
      '/api/sentiment/compare',
      '/api/sentiment/demo/load',
      // Social Intelligence
      '/api/social/dashboard',
      '/api/social/announcements',
      '/api/social/announcements/{id}',
      '/api/social/announcements/{id}/engagement',
      '/api/social/announcements/{id}/amplification',
      '/api/social/audiences/{entityId}',
      '/api/social/personas',
      '/api/social/personas/{id}',
      '/api/social/personas/{id}/predict',
      '/api/social/influencers',
      '/api/social/influencers/{entityId}',
      '/api/social/cross-platform/{eventId}',
      '/api/social/overlap',
      '/api/social/demo/load',
      // Social Bridge
      '/api/social/link',
      '/api/social/impact/{eventId}',
      '/api/social/correlation/{entityId}',
      '/api/social/impact-chain/{eventId}',
    ];

    const paths = (swaggerSpec as Record<string, unknown>).paths as Record<string, unknown>;

    it('should have all expected paths documented', () => {
      for (const path of expectedPaths) {
        expect(paths[path], `Missing path: ${path}`).toBeDefined();
      }
    });

    it('should not have extra undocumented paths', () => {
      const documentedPaths = Object.keys(paths);
      for (const path of documentedPaths) {
        expect(expectedPaths, `Unexpected path in spec: ${path}`).toContain(path);
      }
    });

    it('should have correct HTTP methods for each path', () => {
      const getOnlyPaths = [
        '/health',
        '/api/graph',
        '/api/graph/at/{timestamp}',
        '/api/entities',
        '/api/entities/{id}',
        '/api/entities/{id}/events',
        '/api/events',
        '/api/events/range',
        '/api/tensions',
        '/api/tensions/active',
        '/api/arcs',
        '/api/analysis/pressure-points',
        '/api/sentiment/articles',
        '/api/sentiment/articles/{id}',
        '/api/sentiment/events',
        '/api/sentiment/timeline/{entity}',
        '/api/sentiment/categories',
        '/api/sentiment/sources',
        '/api/sentiment/sources/{id}',
        '/api/sentiment/dashboard',
        '/api/sentiment/compare',
        // Social Intelligence GET-only
        '/api/social/dashboard',
        '/api/social/announcements/{id}',
        '/api/social/announcements/{id}/engagement',
        '/api/social/announcements/{id}/amplification',
        '/api/social/audiences/{entityId}',
        '/api/social/personas',
        '/api/social/personas/{id}',
        '/api/social/influencers',
        '/api/social/influencers/{entityId}',
        '/api/social/cross-platform/{eventId}',
        '/api/social/overlap',
        // Social Bridge GET-only
        '/api/social/impact/{eventId}',
        '/api/social/correlation/{entityId}',
        '/api/social/impact-chain/{eventId}',
      ];

      const postOnlyPaths = [
        '/api/analysis/dream',
        '/api/extract',
        '/api/demo/load',
        '/api/demo/reset',
        '/api/sentiment/ingest',
        '/api/sentiment/predict',
        '/api/sentiment/demo/load',
        // Social Intelligence POST-only
        '/api/social/personas/{id}/predict',
        '/api/social/demo/load',
        '/api/social/link',
      ];

      for (const path of getOnlyPaths) {
        const pathDef = paths[path] as Record<string, unknown>;
        expect(pathDef.get, `${path} should have GET`).toBeDefined();
      }

      for (const path of postOnlyPaths) {
        const pathDef = paths[path] as Record<string, unknown>;
        expect(pathDef.post, `${path} should have POST`).toBeDefined();
      }
    });

    it('should have responses defined for every operation', () => {
      for (const [pathKey, pathDef] of Object.entries(paths)) {
        const methods = pathDef as Record<string, unknown>;
        for (const method of ['get', 'post', 'put', 'delete', 'patch']) {
          if (methods[method]) {
            const operation = methods[method] as Record<string, unknown>;
            expect(
              operation.responses,
              `${method.toUpperCase()} ${pathKey} should have responses`
            ).toBeDefined();
          }
        }
      }
    });

    it('should have request bodies for POST endpoints that require input', () => {
      const postsWithBody = ['/api/extract', '/api/sentiment/ingest', '/api/sentiment/predict'];

      for (const path of postsWithBody) {
        const pathDef = paths[path] as Record<string, unknown>;
        const post = pathDef.post as Record<string, unknown>;
        expect(post.requestBody, `POST ${path} should have requestBody`).toBeDefined();
      }
    });
  });
});
