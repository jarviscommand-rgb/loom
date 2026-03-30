import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { TemporalGraph } from './graph/temporal-graph.js';
import { createRoutes } from './api/routes.js';
import { config } from './config/env.js';
import { globalErrorHandler } from './middleware/error-handler.js';

const app = express();
const server = createServer(app);

// --- WebSocket ---
const wss = new WebSocketServer({ server });
const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[ws] Client connected (${clients.size} total)`);

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

const graph = new TemporalGraph();
app.use('/api', createRoutes(graph, broadcast));

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
  res.json({ status: 'ok', entities: graph.getAllEntities().length });
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
