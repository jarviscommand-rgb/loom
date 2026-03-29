import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { TemporalGraph } from './graph/temporal-graph.js';
import { createRoutes } from './api/routes.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
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

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', entities: graph.getAllEntities().length });
});

server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║         L O O M   S E R V E R       ║
  ║   Causal Narrative Intelligence      ║
  ╠══════════════════════════════════════╣
  ║  HTTP:  http://localhost:${PORT}        ║
  ║  WS:    ws://localhost:${PORT}          ║
  ╚══════════════════════════════════════╝
  `);
});
