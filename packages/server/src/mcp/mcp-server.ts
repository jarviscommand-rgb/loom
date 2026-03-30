// ============================================================
// LOOM — MCP (Model Context Protocol) Server
//
// Exposes LOOM's narrative intelligence capabilities as MCP
// tools so other AI agents can call them directly.
// ============================================================

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { TemporalGraph } from '../graph/temporal-graph.js';
import { extractNarrative } from '../extraction/narrative-extractor.js';
import { scanTensions, analyzeTensions } from '../analysis/tension-radar.js';
import { analyzeArcs } from '../analysis/arc-detector.js';
import { generateDreams } from '../analysis/dream-engine.js';
import { SentimentEngine, type ArticleInput } from '../sentiment/sentiment-engine.js';
import { demoEntities, demoEvents, demoTensions, demoArcs } from '../demo/openai-crisis.js';
import {
  techWarEntities,
  techWarEvents,
  techWarTensions,
  techWarArcs,
} from '../demo/us-china-tech-war.js';
import {
  aiBubbleEntities,
  aiBubbleEvents,
  aiBubbleTensions,
  aiBubbleArcs,
} from '../demo/nvidia-ai-bubble.js';

// ============================================================
// Demo scenario registry
// ============================================================

interface DemoScenario {
  name: string;
  entities: ReturnType<TemporalGraph['getAllEntities']>;
  events: ReturnType<TemporalGraph['getAllEvents']>;
  tensions: ReturnType<TemporalGraph['getAllTensions']>;
  arcs: ReturnType<TemporalGraph['getAllArcs']>;
}

const demoScenarios: Record<string, DemoScenario> = {
  'openai-crisis': {
    name: 'OpenAI Leadership Crisis',
    entities: demoEntities,
    events: demoEvents,
    tensions: demoTensions,
    arcs: demoArcs,
  },
  'us-china-tech-war': {
    name: 'US–China Tech War',
    entities: techWarEntities,
    events: techWarEvents,
    tensions: techWarTensions,
    arcs: techWarArcs,
  },
  'ai-bubble': {
    name: 'NVIDIA / AI Bubble',
    entities: aiBubbleEntities,
    events: aiBubbleEvents,
    tensions: aiBubbleTensions,
    arcs: aiBubbleArcs,
  },
};

// ============================================================
// Create MCP Server
// ============================================================

/**
 * Creates and configures the LOOM MCP server with all tools registered.
 * Uses a shared TemporalGraph and SentimentEngine instance.
 */
export function createLoomMcpServer(): {
  server: McpServer;
  graph: TemporalGraph;
  sentimentEngine: SentimentEngine;
} {
  const graph = new TemporalGraph();
  const sentimentEngine = new SentimentEngine();

  const server = new McpServer(
    { name: 'loom', version: '0.1.0' },
    {
      capabilities: { tools: {} },
      instructions:
        'LOOM — Causal Narrative Intelligence Engine. ' +
        'Extract narratives from text, analyse tensions, detect arcs, ' +
        'generate speculative futures, and run sentiment analysis.',
    }
  );

  // ----------------------------------------------------------
  // Tool: loom_extract
  // ----------------------------------------------------------
  server.tool(
    'loom_extract',
    'Extract entities, events, tensions, and narrative arcs from text. ' +
      'The text should describe real-world events or narratives.',
    { text: z.string().min(1).describe('The narrative text to analyse') },
    async ({ text }) => {
      const result = await extractNarrative(text, graph);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ----------------------------------------------------------
  // Tool: loom_graph_snapshot
  // ----------------------------------------------------------
  server.tool(
    'loom_graph_snapshot',
    'Return the current state of the narrative graph including all entities, events, tensions, and arcs.',
    {},
    async () => {
      const snapshot = graph.getSnapshot();
      const stats = graph.computeStatistics();
      return {
        content: [{ type: 'text', text: JSON.stringify({ snapshot, statistics: stats }, null, 2) }],
      };
    }
  );

  // ----------------------------------------------------------
  // Tool: loom_tensions
  // ----------------------------------------------------------
  server.tool(
    'loom_tensions',
    'Return active tensions with pressure scores, momentum, and cascade risk analysis.',
    {
      detailed: z
        .boolean()
        .optional()
        .default(false)
        .describe('If true, return full TensionAnalysis with scoring components'),
    },
    async ({ detailed }) => {
      const result = detailed ? analyzeTensions(graph) : scanTensions(graph);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  // ----------------------------------------------------------
  // Tool: loom_dream
  // ----------------------------------------------------------
  server.tool(
    'loom_dream',
    'Generate speculative future branches (dream scenarios) based on the current graph state. ' +
      'Uses LLM to imagine possible futures.',
    {
      strategies: z
        .array(z.enum(['conservative', 'wild_card', 'pattern_based']))
        .optional()
        .describe('Dream strategies to use. Defaults to all three.'),
    },
    async () => {
      const branches = await generateDreams(graph);
      return {
        content: [{ type: 'text', text: JSON.stringify(branches, null, 2) }],
      };
    }
  );

  // ----------------------------------------------------------
  // Tool: loom_sentiment_ingest
  // ----------------------------------------------------------
  server.tool(
    'loom_sentiment_ingest',
    'Ingest articles for sentiment analysis. Each article is scored, categorized, and measured for narrative impact.',
    {
      articles: z
        .array(
          z.object({
            title: z.string().describe('Article headline'),
            content: z.string().describe('Full article text'),
            url: z.string().optional().describe('Source URL'),
            sourceId: z.string().describe('Media source ID (e.g. "kompas", "tempo")'),
            publishedAt: z.string().optional().describe('ISO date of publication'),
            language: z.string().optional().describe('Language code (e.g. "id", "en")'),
          })
        )
        .min(1)
        .describe('Array of articles to ingest'),
    },
    async ({ articles }) => {
      const results = sentimentEngine.ingestArticles(articles as ArticleInput[]);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ ingested: results.length, articles: results }, null, 2),
          },
        ],
      };
    }
  );

  // ----------------------------------------------------------
  // Tool: loom_sentiment_dashboard
  // ----------------------------------------------------------
  server.tool(
    'loom_sentiment_dashboard',
    'Get the sentiment dashboard for a country, including overall sentiment, top stories, trends, and source breakdown.',
    {
      country: z.string().default('Indonesia').describe('Country to get dashboard for'),
    },
    async ({ country }) => {
      const dashboard = sentimentEngine.getDashboard(country);
      return {
        content: [{ type: 'text', text: JSON.stringify(dashboard, null, 2) }],
      };
    }
  );

  // ----------------------------------------------------------
  // Tool: loom_demo_load
  // ----------------------------------------------------------
  server.tool(
    'loom_demo_load',
    'Load a pre-built demo scenario into the graph. ' +
      'Available: "openai-crisis", "us-china-tech-war", "ai-bubble", "indonesia-sentiment".',
    {
      scenario: z
        .enum(['openai-crisis', 'us-china-tech-war', 'ai-bubble', 'indonesia-sentiment'])
        .describe('Demo scenario to load'),
    },
    async ({ scenario }) => {
      if (scenario === 'indonesia-sentiment') {
        const count = sentimentEngine.loadDemoData();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                { message: `Loaded Indonesia sentiment demo: ${count} articles` },
                null,
                2
              ),
            },
          ],
        };
      }

      const demo = demoScenarios[scenario];
      if (!demo) {
        return {
          content: [{ type: 'text', text: `Unknown scenario: ${scenario}` }],
          isError: true,
        };
      }

      graph.clear();
      graph.load({
        entities: demo.entities,
        events: demo.events,
        tensions: demo.tensions,
        arcs: demo.arcs,
      });

      const stats = graph.computeStatistics();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                message: `Loaded demo: ${demo.name}`,
                entities: stats.entityCount,
                events: stats.eventCount,
                tensions: stats.tensionCount,
                arcs: stats.arcCount,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // ----------------------------------------------------------
  // Tool: loom_arcs
  // ----------------------------------------------------------
  server.tool(
    'loom_arcs',
    'Detect and analyse narrative arcs in the current graph. ' +
      'Returns archetype, phase, health score, subplot info, and predicted climax dates.',
    {},
    async () => {
      const arcs = analyzeArcs(graph);
      return {
        content: [{ type: 'text', text: JSON.stringify(arcs, null, 2) }],
      };
    }
  );

  return { server, graph, sentimentEngine };
}
