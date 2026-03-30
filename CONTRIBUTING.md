# Contributing to LOOM

Thank you for your interest in contributing to LOOM! This document provides guidelines and instructions for contributing.

## Development Setup

### Prerequisites

- **Node.js** v20+ (v22 recommended)
- **npm** v10+
- **Git**
- **OpenAI API key** (for extraction and dream engine features)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/jarviscommand-rgb/loom.git
cd loom

# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start development servers
npm run dev
```

This starts both the server (port 3001) and client (port 5173).

### Using Docker

```bash
# Build and start everything
docker compose up --build

# Access the app at http://localhost:5173
```

## Project Structure

```
loom/
├── packages/
│   ├── server/          # Backend — Express + WebSocket + analysis engine
│   │   └── src/
│   │       ├── analysis/    # Core algorithms (tension radar, arc detector, dream engine)
│   │       ├── extraction/  # LLM-powered narrative extraction
│   │       ├── graph/       # Temporal causal graph engine
│   │       ├── api/         # Express routes
│   │       ├── errors/      # Custom error classes
│   │       ├── middleware/   # Rate limiting, validation
│   │       └── config/      # Environment validation
│   └── client/          # Frontend — React + Three.js + D3
│       └── src/
│           ├── components/  # UI components
│           ├── hooks/       # Custom React hooks
│           └── styles/      # CSS + Tailwind
├── CLAUDE.md            # Project standards and quality bar
├── .env.example         # Environment template
└── docker-compose.yml   # Docker setup
```

## Development Workflow

### Branch Naming

- `feat/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation changes
- `refactor/description` — Code refactoring
- `test/description` — Test additions/fixes

### Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add cascade risk scoring to tension radar
fix: handle empty entity list in arc detector
docs: update API documentation
test: add edge cases for graph traversal
chore: update dependencies
refactor: extract pressure calculation into pure function
```

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear, atomic commits
3. Ensure all checks pass:
   ```bash
   npm run lint
   npm run test
   npm run build
   ```
4. Open a PR with a clear description of what and why
5. Address review feedback
6. Squash-merge when approved

## Code Quality Standards

See [CLAUDE.md](./CLAUDE.md) for the complete quality bar. Key highlights:

- **TypeScript strict mode** — no `any` types
- **JSDoc comments** on all public functions
- **Error handling** — use custom error classes from `src/errors/`
- **Tests** — every algorithm needs unit tests, 70%+ coverage target
- **Files under 300 lines** — split when larger

## Testing

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:cov

# Run specific test file
npx vitest packages/server/src/analysis/tension-radar.test.ts

# Watch mode
npx vitest --watch
```

## Architecture Decisions

### Why narrative intelligence?

Traditional analytics strips context. LOOM preserves narrative structure — characters, motivations, tensions, arcs — because that's where the real signal lives.

### Why in-memory graph?

For v1, the in-memory temporal graph is simple, fast, and sufficient. Future versions may add persistence (Neo4j, DGraph) but the interface is designed to be storage-agnostic.

### Why OpenAI for extraction?

GPT-4o provides the best balance of extraction quality and structured output reliability. The extraction interface is model-agnostic — swapping providers requires minimal changes.

## Questions?

Open an issue or start a discussion. We're building something new here — narrative intelligence is an emerging field, and we welcome diverse perspectives.
