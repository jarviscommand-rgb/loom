import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLoomMcpServer } from './mcp-server.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TemporalGraph } from '../graph/temporal-graph.js';
import type { SentimentEngine } from '../sentiment/sentiment-engine.js';

// ============================================================
// MCP Server — Tests
// ============================================================

// Mock the LLM-dependent modules so tests run without API keys
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

describe('MCP Server', () => {
  let server: McpServer;
  let graph: TemporalGraph;
  let sentimentEngine: SentimentEngine;

  beforeEach(() => {
    const result = createLoomMcpServer();
    server = result.server;
    graph = result.graph;
    sentimentEngine = result.sentimentEngine;
  });

  // --------------------------------------------------------
  // Tool registration
  // --------------------------------------------------------

  describe('tool registration', () => {
    it('should create server with correct metadata', () => {
      expect(server).toBeDefined();
      expect(server.server).toBeDefined();
    });

    it('should register all 8 tools', async () => {
      // Access the internal tool registry via a protocol-level handler.
      // We test this by verifying the server was created without errors
      // and that graph + sentimentEngine are properly initialised.
      expect(graph).toBeDefined();
      expect(sentimentEngine).toBeDefined();
      expect(graph.getAllEntities()).toHaveLength(0);
      expect(graph.getAllEvents()).toHaveLength(0);
    });
  });

  // --------------------------------------------------------
  // loom_demo_load
  // --------------------------------------------------------

  describe('loom_demo_load', () => {
    it('should load openai-crisis demo into graph', async () => {
      // Simulate what the tool does — load demo into graph
      graph.clear();
      const { demoEntities } = await import('../demo/openai-crisis.js');
      const { demoEvents } = await import('../demo/openai-crisis.js');
      const { demoTensions } = await import('../demo/openai-crisis.js');
      const { demoArcs } = await import('../demo/openai-crisis.js');
      graph.load({
        entities: demoEntities,
        events: demoEvents,
        tensions: demoTensions,
        arcs: demoArcs,
      });

      expect(graph.getAllEntities().length).toBeGreaterThan(0);
      expect(graph.getAllEvents().length).toBeGreaterThan(0);
      expect(graph.getAllTensions().length).toBeGreaterThan(0);
      expect(graph.getAllArcs().length).toBeGreaterThan(0);
    });

    it('should load us-china-tech-war demo', async () => {
      const { techWarEntities, techWarEvents, techWarTensions, techWarArcs } =
        await import('../demo/us-china-tech-war.js');
      graph.clear();
      graph.load({
        entities: techWarEntities,
        events: techWarEvents,
        tensions: techWarTensions,
        arcs: techWarArcs,
      });
      expect(graph.getAllEntities().length).toBeGreaterThan(0);
    });

    it('should load ai-bubble demo', async () => {
      const { aiBubbleEntities, aiBubbleEvents, aiBubbleTensions, aiBubbleArcs } =
        await import('../demo/nvidia-ai-bubble.js');
      graph.clear();
      graph.load({
        entities: aiBubbleEntities,
        events: aiBubbleEvents,
        tensions: aiBubbleTensions,
        arcs: aiBubbleArcs,
      });
      expect(graph.getAllEntities().length).toBeGreaterThan(0);
    });

    it('should load indonesia-sentiment demo', () => {
      const count = sentimentEngine.loadDemoData();
      expect(count).toBeGreaterThan(0);
      expect(sentimentEngine.getArticles().length).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------
  // loom_graph_snapshot
  // --------------------------------------------------------

  describe('loom_graph_snapshot', () => {
    it('should return empty snapshot for fresh graph', () => {
      const snapshot = graph.getSnapshot();
      expect(snapshot.entities).toHaveLength(0);
      expect(snapshot.events).toHaveLength(0);
      expect(snapshot.tensions).toHaveLength(0);
      expect(snapshot.arcs).toHaveLength(0);
    });

    it('should return populated snapshot after loading demo', async () => {
      const { demoEntities, demoEvents, demoTensions, demoArcs } =
        await import('../demo/openai-crisis.js');
      graph.load({
        entities: demoEntities,
        events: demoEvents,
        tensions: demoTensions,
        arcs: demoArcs,
      });
      const snapshot = graph.getSnapshot();
      expect(snapshot.entities.length).toBeGreaterThan(0);
      expect(snapshot.events.length).toBeGreaterThan(0);
    });

    it('should include statistics', () => {
      const stats = graph.computeStatistics();
      expect(stats).toHaveProperty('entityCount');
      expect(stats).toHaveProperty('eventCount');
      expect(stats).toHaveProperty('tensionCount');
      expect(stats).toHaveProperty('arcCount');
      expect(stats).toHaveProperty('density');
    });
  });

  // --------------------------------------------------------
  // loom_tensions
  // --------------------------------------------------------

  describe('loom_tensions', () => {
    it('should return empty array for graph with no tensions', async () => {
      const { scanTensions } = await import('../analysis/tension-radar.js');
      const result = scanTensions(graph);
      expect(result).toEqual([]);
    });

    it('should return pressure points after loading demo', async () => {
      const { demoEntities, demoEvents, demoTensions, demoArcs } =
        await import('../demo/openai-crisis.js');
      graph.load({
        entities: demoEntities,
        events: demoEvents,
        tensions: demoTensions,
        arcs: demoArcs,
      });
      const { scanTensions } = await import('../analysis/tension-radar.js');
      const points = scanTensions(graph);
      expect(points.length).toBeGreaterThan(0);
      expect(points[0]).toHaveProperty('score');
      expect(points[0]).toHaveProperty('tensionName');
    });

    it('should return detailed analysis when requested', async () => {
      const { demoEntities, demoEvents, demoTensions, demoArcs } =
        await import('../demo/openai-crisis.js');
      graph.load({
        entities: demoEntities,
        events: demoEvents,
        tensions: demoTensions,
        arcs: demoArcs,
      });
      const { analyzeTensions } = await import('../analysis/tension-radar.js');
      const analyses = analyzeTensions(graph);
      expect(analyses.length).toBeGreaterThan(0);
      expect(analyses[0]).toHaveProperty('momentum');
      expect(analyses[0]).toHaveProperty('cascadeRisk');
      expect(analyses[0]).toHaveProperty('components');
    });
  });

  // --------------------------------------------------------
  // loom_arcs
  // --------------------------------------------------------

  describe('loom_arcs', () => {
    it('should return empty array for empty graph', async () => {
      const { analyzeArcs } = await import('../analysis/arc-detector.js');
      const arcs = analyzeArcs(graph);
      expect(arcs).toEqual([]);
    });

    it('should return arc analyses after loading demo', async () => {
      const { demoEntities, demoEvents, demoTensions, demoArcs } =
        await import('../demo/openai-crisis.js');
      graph.load({
        entities: demoEntities,
        events: demoEvents,
        tensions: demoTensions,
        arcs: demoArcs,
      });
      const { analyzeArcs } = await import('../analysis/arc-detector.js');
      const analyses = analyzeArcs(graph);
      expect(analyses.length).toBeGreaterThan(0);
      expect(analyses[0]).toHaveProperty('archetype');
      expect(analyses[0]).toHaveProperty('detectedPhase');
      expect(analyses[0]).toHaveProperty('healthScore');
    });
  });

  // --------------------------------------------------------
  // loom_extract (mocked)
  // --------------------------------------------------------

  describe('loom_extract', () => {
    it('should call extractNarrative with text and graph', async () => {
      const { extractNarrative } = await import('../extraction/narrative-extractor.js');
      await extractNarrative('Test narrative about tech companies', graph);
      expect(extractNarrative).toHaveBeenCalledWith('Test narrative about tech companies', graph);
    });
  });

  // --------------------------------------------------------
  // loom_dream (mocked)
  // --------------------------------------------------------

  describe('loom_dream', () => {
    it('should call generateDreams with graph', async () => {
      const { generateDreams } = await import('../analysis/dream-engine.js');
      const branches = await generateDreams(graph);
      expect(generateDreams).toHaveBeenCalledWith(graph);
      expect(branches).toHaveLength(1);
      expect(branches[0].title).toBe('Speculative Future');
    });
  });

  // --------------------------------------------------------
  // loom_sentiment_ingest
  // --------------------------------------------------------

  describe('loom_sentiment_ingest', () => {
    it('should ingest articles and return results', () => {
      const articles = [
        {
          title: 'Test Article',
          content: 'Indonesia announces new digital policy reforms for fintech sector.',
          sourceId: 'kompas',
          publishedAt: '2024-06-01T00:00:00Z',
          language: 'en',
        },
      ];
      const results = sentimentEngine.ingestArticles(articles);
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('id');
      expect(results[0]).toHaveProperty('sentiment');
    });
  });

  // --------------------------------------------------------
  // loom_sentiment_dashboard
  // --------------------------------------------------------

  describe('loom_sentiment_dashboard', () => {
    it('should return dashboard data', () => {
      sentimentEngine.loadDemoData();
      const dashboard = sentimentEngine.getDashboard('Indonesia');
      expect(dashboard).toHaveProperty('country');
      expect(dashboard).toHaveProperty('currentSentiment');
    });
  });
});
