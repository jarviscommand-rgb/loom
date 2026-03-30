#!/usr/bin/env node
// ============================================================
// LOOM — MCP Server Entry Point
//
// Starts the LOOM MCP server using stdio transport.
// Usage: npx tsx src/mcp/index.ts
// ============================================================

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createLoomMcpServer } from './mcp-server.js';

async function main(): Promise<void> {
  const { server } = createLoomMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Server is now running — MCP messages flow over stdin/stdout.
}

main().catch((error: unknown) => {
  console.error('LOOM MCP server failed to start:', error);
  process.exit(1);
});
