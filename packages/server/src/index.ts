import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import swaggerUi from 'swagger-ui-express';
import { TemporalGraph } from './graph/temporal-graph.js';
import { createRoutes } from './api/routes.js';
import { swaggerSpec } from './api/swagger.js';
import { config } from './config/env.js';
import { globalErrorHandler } from './middleware/error-handler.js';
import { SentimentEngine } from './sentiment/sentiment-engine.js';
import { createSentimentRoutes } from './sentiment/api/sentiment-routes.js';
import { extractNarrativeStreaming } from './extraction/streaming-extractor.js';

const app = express();
const server = createServer(app);

// --- WebSocket ---
const wss = new WebSocketServer({ server });
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[ws] Client connected (${clients.size} total)`);

  ws.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString()) as { type: string; text?: string };

      if (msg.type === 'extract-stream') {
        if (!msg.text || typeof msg.text !== 'string' || msg.text.trim().length === 0) {
          ws.send(JSON.stringify({ type: 'extraction-error', error: 'Text is required' }));
          return;
        }

        try {
          const result = await extractNarrativeStreaming(msg.text, graph, (chunk) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: 'extraction-progress',
                  stage: chunk.stage,
                  partial: chunk.partial,
                  done: chunk.done,
                })
              );
            }
          });

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'extraction-complete', result }));
          }

          // Broadcast graph update to all clients
          broadcast({ type: 'graph-updated', data: graph.getSnapshot() });
        } catch (err) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: 'extraction-error',
                error: err instanceof Error ? err.message : 'Extraction failed',
              })
            );
          }
        }
      }
    } catch {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'extraction-error', error: 'Invalid message format' }));
      }
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[ws] Client disconnected (${clients.size} total)`);
  });
});

function broadcast(data: unknown): void {
  const msg = JSON.stringify(data);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  }
}

// --- Express ---
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// --- Swagger / OpenAPI docs ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs/json', (_req, res) => res.json(swaggerSpec));

const graph = new TemporalGraph();
app.use('/api', createRoutes(graph, broadcast));

// --- Sentiment Engine ---
const sentimentEngine = new SentimentEngine();
app.use('/api/sentiment', createSentimentRoutes(sentimentEngine));

// Serve client static files in production
if (config.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    entities: graph.getAllEntities().length,
    sentimentArticles: sentimentEngine.getArticles().length,
  });
});

// Global error handler (must be registered after all routes)
app.use(globalErrorHandler);

// --- Start server ---
server.listen(config.PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║         L O O M   S E R V E R       ║
  ║   Causal Narrative Intelligence      ║
  ╠══════════════════════════════════════╣
  ║  HTTP:  http://localhost:${config.PORT}        ║
  ║  WS:    ws://localhost:${config.PORT}          ║
  ║  Docs:  http://localhost:${config.PORT}/api-docs  ║
  ║  ENV:   ${config.NODE_ENV}                  ║
  ╚══════════════════════════════════════╝
  `);
});

// --- Graceful shutdown ---
function shutdown(signal: string): void {
  console.log(`\n[LOOM] Received ${signal}, shutting down gracefully...`);

  // Close WebSocket connections
  for (const client of clients) {
    client.close(1001, 'Server shutting down');
  }
  wss.close();

  // Close HTTP server
  server.close(() => {
    console.log('[LOOM] Server closed.');
    process.exit(0);
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('[LOOM] Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
