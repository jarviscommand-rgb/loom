import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLoomMcpServer } from './mcp-server.js';
import type { TemporalGraph } from '../graph/temporal-graph.js';
import type { SentimentEngine } from '../sentiment/sentiment-engine.js';

// ============================================================
// MCP Server — Edge Case & Extended Coverage Tests
// ============================================================

// Mock LLM-dependent modules
vi.mock('../extraction/narrative-extractor.js', () => ({
  extractNarrative: vi.fn().mockResolvedValue({
    entities: [{ id: 'e1', name: 'TestEntity', type: 'person' }],
    events: [{ id: 'ev1', title: 'TestEvent', timestamp: '2024-01-01T00:00:00Z' }],
    tensions: [],
    arcs: [],
  }),
}));

vi.mock('../analysis/dream-engine.js', () => ({
  generateDreams: vi.fn().mockResolvedValue([
    {
      id: 'dream-1',
      title: 'Speculative Future',
      narrative: 'Something happens next',
      probability: 0.6,
      triggerEvents: [],
      consequences: [],
      affectedEntities: [],
      strategy: 'conservative',
    },
  ]),
}));

describe('MCP Server — Extended Coverage', () => {
  let graph: TemporalGraph;
  let sentimentEngine: SentimentEngine;

  beforeEach(() => {
    const result = createLoomMcpServer();
    graph = result.graph;
    sentimentEngine = result.sentimentEngine;
  });

  // --------------------------------------------------------
  // Server creation edge cases
  // --------------------------------------------------------

  describe('server creation', () => {
    it('should create independent instances on each call', () => {
      const result1 = createLoomMcpServer();
      const result2 = createLoomMcpServer();
      expect(result1.graph).not.toBe(result2.graph);
      expect(result1.sentimentEngine).not.toBe(result2.sentimentEngine);
      expect(result1.server).not.toBe(result2.server);
    });

    it('should start with an empty graph', () => {
      expect(graph.getAllEntities()).toHaveLength(0);
      expect(graph.getAllEvents()).toHaveLength(0);
      expect(graph.getAllTensions()).toHaveLength(0);
      expect(graph.getAllArcs()).toHaveLength(0);
    });

    it('should return a graph that supports all operations', () => {
      const entity = graph.addEntity({
        name: 'Test',
        type: 'person',
        motivation: 'T',
        capability: 'T',
        alliances: [],
        description: 'T',
        firstSeen: '2023-01-01T00:00:00Z',
        lastSeen: '2023-01-01T00:00:00Z',
      });
      expect(graph.getEntity(entity.id)).toBeDefined();
      expect(graph.getAllEntities()).toHaveLength(1);
    });
  });

  // --------------------------------------------------------
  // Demo scenario edge cases
  // --------------------------------------------------------

  describe('demo scenario loading', () => {
    it('should clear graph before loading new scenario', async () => {
      // Load one scenario
      const { demoEntities, demoEvents, demoTensions, demoArcs } =
        await import('../demo/openai-crisis.js');
      graph.load({
        entities: demoEntities,
        events: demoEvents,
        tensions: demoTensions,
        arcs: demoArcs,
      });
      const count1 = graph.getAllEntities().length;
      expect(count1).toBeGreaterThan(0);

      // Clear and load another
      graph.clear();
      const { techWarEntities, techWarEvents, techWarTensions, techWarArcs } =
        await import('../demo/us-china-tech-war.js');
      graph.load({
        entities: techWarEntities,
        events: techWarEvents,
        tensions: techWarTensions,
        arcs: techWarArcs,
      });
      const count2 = graph.getAllEntities().length;
      expect(count2).toBeGreaterThan(0);
    });

    it('should compute statistics after loading demo', async () => {
      const { demoEntities, demoEvents, demoTensions, demoArcs } =
        await import('../demo/openai-crisis.js');
      graph.load({
        entities: demoEntities,
        events: demoEvents,
        tensions: demoTensions,
        arcs: demoArcs,
      });
      const stats = graph.computeStatistics();
      expect(stats.entityCount).toBeGreaterThan(0);
      expect(stats.eventCount).toBeGreaterThan(0);
      expect(stats.tensionCount).toBeGreaterThan(0);
      expect(stats.arcCount).toBeGreaterThan(0);
    });

    it('should support loading indonesia-sentiment demo data', () => {
      const count = sentimentEngine.loadDemoData();
      expect(count).toBeGreaterThan(0);

      // Loading again should work (idempotent or additive)
      const count2 = sentimentEngine.loadDemoData();
      expect(count2).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------
  // Graph snapshot edge cases
  // --------------------------------------------------------

  describe('graph snapshot after operations', () => {
    it('should reflect entities added after server creation', () => {
      graph.addEntity({
        name: 'Dynamic',
        type: 'company',
        motivation: 'Profit',
        capability: 'Tech',
        alliances: [],
        description: 'Added dynamically',
        firstSeen: '2024-01-01T00:00:00Z',
        lastSeen: '2024-06-01T00:00:00Z',
      });
      const snapshot = graph.getSnapshot();
      expect(snapshot.entities.length).toBe(1);
      expect(snapshot.entities[0].name).toBe('Dynamic');
    });

    it('should return correct statistics for populated graph', () => {
      graph.addEntity({
        name: 'E1',
        type: 'person',
        motivation: 'T',
        capability: 'T',
        alliances: [],
        description: 'T',
        firstSeen: '2023-01-01T00:00:00Z',
        lastSeen: '2023-01-01T00:00:00Z',
      });
      graph.addEvent({
        title: 'Ev1',
        description: 'D',
        timestamp: '2023-01-01T00:00:00Z',
        participants: [],
        causalPredecessors: [],
        impact: 0.5,
        sentiment: 0,
      });
      const stats = graph.computeStatistics();
      expect(stats.entityCount).toBe(1);
      expect(stats.eventCount).toBe(1);
    });
  });

  // --------------------------------------------------------
  // Sentiment operations
  // --------------------------------------------------------

  describe('sentiment operations', () => {
    it('should ingest multiple articles and return results', () => {
      const articles = [
        {
          title: 'Article 1',
          content: 'Indonesia announces new digital policy reforms.',
          sourceId: 'kompas',
          publishedAt: '2024-06-01T00:00:00Z',
          language: 'en',
        },
        {
          title: 'Article 2',
          content: 'Economic crisis looms over Southeast Asia.',
          sourceId: 'tempo',
          publishedAt: '2024-06-02T00:00:00Z',
          language: 'en',
        },
      ];
      const results = sentimentEngine.ingestArticles(articles);
      expect(results).toHaveLength(2);
      for (const result of results) {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('sentiment');
      }
    });

    it('should return dashboard after ingesting articles', () => {
      sentimentEngine.loadDemoData();
      const dashboard = sentimentEngine.getDashboard('Indonesia');
      expect(dashboard).toHaveProperty('country');
      expect(dashboard).toHaveProperty('currentSentiment');
      expect(dashboard.country).toBe('Indonesia');
    });

    it('should return dashboard for country with no data', () => {
      const dashboard = sentimentEngine.getDashboard('Mars');
      expect(dashboard).toHaveProperty('country');
      expect(dashboard.country).toBe('Mars');
    });
  });

  // --------------------------------------------------------
  // Analysis with loaded data
  // --------------------------------------------------------

  describe('analysis tools with data', () => {
    beforeEach(async () => {
      const { demoEntities, demoEvents, demoTensions, demoArcs } =
        await import('../demo/openai-crisis.js');
      graph.load({
        entities: demoEntities,
        events: demoEvents,
        tensions: demoTensions,
        arcs: demoArcs,
      });
    });

    it('should return tension analysis with score components', async () => {
      const { analyzeTensions } = await import('../analysis/tension-radar.js');
      const analyses = analyzeTensions(graph);
      for (const analysis of analyses) {
        expect(analysis).toHaveProperty('tensionId');
        expect(analysis).toHaveProperty('tensionName');
        expect(analysis).toHaveProperty('overallScore');
        expect(analysis).toHaveProperty('scoreBreakdown');
        expect(analysis).toHaveProperty('components');
        expect(analysis).toHaveProperty('momentum');
        expect(analysis).toHaveProperty('cascadeRisk');
        expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
        expect(analysis.overallScore).toBeLessThanOrEqual(100);
      }
    });

    it('should return arc analyses with archetype detection', async () => {
      const { analyzeArcs } = await import('../analysis/arc-detector.js');
      const analyses = analyzeArcs(graph);
      for (const analysis of analyses) {
        expect(analysis).toHaveProperty('arcId');
        expect(analysis).toHaveProperty('arcName');
        expect(analysis).toHaveProperty('archetype');
        expect(analysis).toHaveProperty('detectedPhase');
        expect(analysis).toHaveProperty('healthScore');
        expect(analysis.healthScore).toBeGreaterThanOrEqual(0);
        expect(analysis.healthScore).toBeLessThanOrEqual(100);
      }
    });

    it('should extract narrative from text (mocked)', async () => {
      const { extractNarrative } = await import('../extraction/narrative-extractor.js');
      const result = await extractNarrative('Test narrative text', graph);
      expect(result).toHaveProperty('entities');
      expect(result).toHaveProperty('events');
    });

    it('should generate dreams (mocked)', async () => {
      const { generateDreams } = await import('../analysis/dream-engine.js');
      const branches = await generateDreams(graph);
      expect(branches.length).toBeGreaterThan(0);
      expect(branches[0]).toHaveProperty('title');
      expect(branches[0]).toHaveProperty('probability');
      expect(branches[0]).toHaveProperty('strategy');
    });
  });
});
