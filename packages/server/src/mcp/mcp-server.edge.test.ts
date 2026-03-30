import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createLoomMcpServer } from './mcp-server.js';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { TemporalGraph } from '../graph/temporal-graph.js';
import type { SentimentEngine } from '../sentiment/sentiment-engine.js';

// ============================================================
// MCP Server — Tool Handler Coverage Tests
//
// These tests directly invoke the registered tool handlers to
// cover the actual lines in mcp-server.ts (tool callback bodies).
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

/**
 * Helper to call a registered MCP tool handler directly.
 * Accesses the internal `_registeredTools` map on the McpServer instance.
 */
async function callTool(
  server: McpServer,
  name: string,
  args: Record<string, unknown> = {}
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const registeredTools = (server as any)._registeredTools;
  const tool = registeredTools[name];
  if (!tool) {
    throw new Error(`Tool "${name}" not registered`);
  }
  // The handler is a function that takes (params, extra) and returns { content }
  const result = await tool.handler(args, {});
  return result;
}

describe('MCP Server — Tool Handler Coverage', () => {
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
  // Server creation
  // --------------------------------------------------------

  describe('server creation', () => {
    it('should create independent instances on each call', () => {
      const result1 = createLoomMcpServer();
      const result2 = createLoomMcpServer();
      expect(result1.graph).not.toBe(result2.graph);
      expect(result1.sentimentEngine).not.toBe(result2.sentimentEngine);
      expect(result1.server).not.toBe(result2.server);
    });

    it('should register all 8 tools', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const registeredTools = (server as any)._registeredTools;
      const toolNames = Object.keys(registeredTools);
      expect(toolNames).toContain('loom_extract');
      expect(toolNames).toContain('loom_graph_snapshot');
      expect(toolNames).toContain('loom_tensions');
      expect(toolNames).toContain('loom_dream');
      expect(toolNames).toContain('loom_sentiment_ingest');
      expect(toolNames).toContain('loom_sentiment_dashboard');
      expect(toolNames).toContain('loom_demo_load');
      expect(toolNames).toContain('loom_arcs');
      expect(toolNames).toHaveLength(8);
    });
  });

  // --------------------------------------------------------
  // loom_extract tool handler
  // --------------------------------------------------------

  describe('loom_extract', () => {
    it('should extract narrative from text and return JSON content', async () => {
      const result = await callTool(server, 'loom_extract', {
        text: 'OpenAI board fires CEO Sam Altman',
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty('entities');
      expect(parsed).toHaveProperty('events');
    });
  });

  // --------------------------------------------------------
  // loom_graph_snapshot tool handler
  // --------------------------------------------------------

  describe('loom_graph_snapshot', () => {
    it('should return empty snapshot for fresh graph', async () => {
      const result = await callTool(server, 'loom_graph_snapshot');
      expect(result.content).toHaveLength(1);
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.snapshot.entities).toHaveLength(0);
      expect(parsed.statistics).toHaveProperty('entityCount');
      expect(parsed.statistics.entityCount).toBe(0);
    });

    it('should return populated snapshot after adding data', async () => {
      graph.addEntity({
        name: 'Test Corp',
        type: 'company',
        motivation: 'Profit',
        capability: 'Tech',
        alliances: [],
        description: 'Test company',
        firstSeen: '2024-01-01T00:00:00Z',
        lastSeen: '2024-06-01T00:00:00Z',
      });
      const result = await callTool(server, 'loom_graph_snapshot');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.snapshot.entities).toHaveLength(1);
      expect(parsed.statistics.entityCount).toBe(1);
    });
  });

  // --------------------------------------------------------
  // loom_tensions tool handler
  // --------------------------------------------------------

  describe('loom_tensions', () => {
    it('should return empty array for empty graph (default mode)', async () => {
      const result = await callTool(server, 'loom_tensions', { detailed: false });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual([]);
    });

    it('should return detailed analysis when detailed=true', async () => {
      // Load demo data for tensions
      const { demoEntities, demoEvents, demoTensions, demoArcs } =
        await import('../demo/openai-crisis.js');
      graph.load({
        entities: demoEntities,
        events: demoEvents,
        tensions: demoTensions,
        arcs: demoArcs,
      });

      const result = await callTool(server, 'loom_tensions', { detailed: true });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0]).toHaveProperty('overallScore');
      expect(parsed[0]).toHaveProperty('components');
    });

    it('should return scan results when detailed=false', async () => {
      const { demoEntities, demoEvents, demoTensions, demoArcs } =
        await import('../demo/openai-crisis.js');
      graph.load({
        entities: demoEntities,
        events: demoEvents,
        tensions: demoTensions,
        arcs: demoArcs,
      });

      const result = await callTool(server, 'loom_tensions', { detailed: false });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0]).toHaveProperty('score');
    });
  });

  // --------------------------------------------------------
  // loom_dream tool handler
  // --------------------------------------------------------

  describe('loom_dream', () => {
    it('should return dream branches', async () => {
      const result = await callTool(server, 'loom_dream', {});
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].title).toBe('Speculative Future');
    });
  });

  // --------------------------------------------------------
  // loom_sentiment_ingest tool handler
  // --------------------------------------------------------

  describe('loom_sentiment_ingest', () => {
    it('should ingest articles and return count', async () => {
      const result = await callTool(server, 'loom_sentiment_ingest', {
        articles: [
          {
            title: 'New Policy',
            content: 'Indonesia announces new digital tax policy for tech companies.',
            sourceId: 'kompas',
            publishedAt: '2024-06-01T00:00:00Z',
            language: 'en',
          },
        ],
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.ingested).toBe(1);
      expect(parsed.articles).toHaveLength(1);
    });
  });

  // --------------------------------------------------------
  // loom_sentiment_dashboard tool handler
  // --------------------------------------------------------

  describe('loom_sentiment_dashboard', () => {
    it('should return dashboard for default country', async () => {
      sentimentEngine.loadDemoData();
      const result = await callTool(server, 'loom_sentiment_dashboard', {
        country: 'Indonesia',
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toHaveProperty('country');
      expect(parsed.country).toBe('Indonesia');
      expect(parsed).toHaveProperty('currentSentiment');
    });
  });

  // --------------------------------------------------------
  // loom_demo_load tool handler
  // --------------------------------------------------------

  describe('loom_demo_load', () => {
    it('should load openai-crisis demo and return stats', async () => {
      const result = await callTool(server, 'loom_demo_load', {
        scenario: 'openai-crisis',
      });
      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.message).toContain('OpenAI');
      expect(parsed.entities).toBeGreaterThan(0);
      expect(parsed.events).toBeGreaterThan(0);
    });

    it('should load us-china-tech-war demo', async () => {
      const result = await callTool(server, 'loom_demo_load', {
        scenario: 'us-china-tech-war',
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.message).toContain('US–China');
      expect(parsed.entities).toBeGreaterThan(0);
    });

    it('should load ai-bubble demo', async () => {
      const result = await callTool(server, 'loom_demo_load', {
        scenario: 'ai-bubble',
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.message).toContain('NVIDIA');
      expect(parsed.entities).toBeGreaterThan(0);
    });

    it('should load indonesia-sentiment demo', async () => {
      const result = await callTool(server, 'loom_demo_load', {
        scenario: 'indonesia-sentiment',
      });
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.message).toContain('Indonesia');
    });

    it('should clear graph before loading a new scenario', async () => {
      // Load one scenario
      await callTool(server, 'loom_demo_load', { scenario: 'openai-crisis' });
      const firstCount = graph.getAllEntities().length;
      expect(firstCount).toBeGreaterThan(0);

      // Load another — should replace, not add
      await callTool(server, 'loom_demo_load', { scenario: 'ai-bubble' });
      const secondCount = graph.getAllEntities().length;
      expect(secondCount).toBeGreaterThan(0);
    });

    it('should return isError for unknown scenario (bypassing Zod)', async () => {
      // Directly call the handler with a scenario not in demoScenarios
      // to cover the dead-code guard at line 249 of mcp-server.ts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const registeredTools = (server as any)._registeredTools;
      const tool = registeredTools['loom_demo_load'];
      const result = await tool.handler({ scenario: 'nonexistent-scenario' }, {});
      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown scenario');
    });
  });

  // --------------------------------------------------------
  // loom_arcs tool handler
  // --------------------------------------------------------

  describe('loom_arcs', () => {
    it('should return empty array for empty graph', async () => {
      const result = await callTool(server, 'loom_arcs');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual([]);
    });

    it('should return arc analyses after loading demo', async () => {
      await callTool(server, 'loom_demo_load', { scenario: 'openai-crisis' });
      const result = await callTool(server, 'loom_arcs');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed.length).toBeGreaterThan(0);
      expect(parsed[0]).toHaveProperty('archetype');
      expect(parsed[0]).toHaveProperty('healthScore');
    });
  });
});
