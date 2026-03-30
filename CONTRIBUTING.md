# Contributing to LOOM

LOOM is building something new — narrative intelligence as an analytical framework. Whether you're a TypeScript engineer, a data scientist, a journalist, or someone who thinks the world makes more sense as a story than a spreadsheet, there's a place for you here.

**No contribution is too small.** Fix a typo, add an edge case test, improve an error message. Every PR that makes LOOM better is welcome.

---

## Quick Start (5 minutes)

### Prerequisites

- **Node.js** v20+ (v24 recommended)
- **npm** v10+ (or **bun**)
- **Git**
- **OpenAI API key** (for extraction and dream engine — not needed for tests or UI work)

### Setup

```bash
# Clone
git clone https://github.com/jarviscommand-rgb/loom.git
cd loom

# Install all workspace dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env — at minimum, add OPENAI_API_KEY

# Start development servers (server on :3001, client on :5173)
npm run dev

# Verify everything works
npm run test       # Should see 624 tests passing
npm run lint       # Should pass clean
npm run build      # Should succeed
```

### With Docker

```bash
docker compose up --build
# Access at http://localhost:5173
```

### Verify Your Setup

1. Open http://localhost:5173
2. Click "Load Demo" → select "OpenAI Board Crisis"
3. You should see entities, events, tensions, and arcs populate
4. Switch to the Tapestry tab — you should see 3D visualization with bloom effects
5. Switch to Sentiment tab → Load the Indonesian demo

If all five steps work, you're ready to contribute.

---

## Project Structure

```
loom/
├── packages/
│   ├── server/                # Backend — Express + WebSocket + analysis engine
│   │   └── src/
│   │       ├── analysis/      # Tension radar, arc detector, dream engine
│   │       ├── extraction/    # LLM-powered narrative extraction pipeline
│   │       ├── graph/         # Temporal causal graph engine (in-memory, indexed)
│   │       ├── api/           # Express routes with Zod validation
│   │       ├── errors/        # Custom error classes (LoomError hierarchy)
│   │       ├── middleware/    # Rate limiting, validation, error handling
│   │       ├── config/        # Environment validation (fail-fast)
│   │       ├── mcp/           # MCP server for AI agent integration (8 tools)
│   │       ├── demo/          # 3 narrative demo scenarios
│   │       ├── sentiment/     # Country Sentiment Engine
│   │       │   ├── analysis/  # Scoring, classification, impact, trends
│   │       │   ├── sources/   # Media source registry + profiles
│   │       │   ├── api/       # Sentiment REST endpoints
│   │       │   └── demo/      # Demo data (50+ Indonesian articles)
│   │       └── knowledge-base/ # Source profiles, entity profiles, methodology
│   │
│   └── client/                # Frontend — React + Three.js + D3
│       └── src/
│           ├── components/    # UI components (Tapestry, Timeline, etc.)
│           │   └── knowledge-base/  # Knowledge base UI pages
│           ├── hooks/         # Custom React hooks
│           └── styles/        # CSS + Tailwind config
│
├── CLAUDE.md                  # Project standards and quality bar
├── CONTRIBUTING.md            # You are here
├── .env.example               # Environment template
└── docker-compose.yml         # Docker setup
```

---

## Code Style Guide

### TypeScript

- **Strict mode** — `strict: true` is enabled in tsconfig. No exceptions.
- **Zero `any` types** — Use `unknown` + type guards, proper generics, or specific types. If you're tempted to use `any`, that's a sign the type needs to be designed.
- **JSDoc on public functions** — Every exported function gets a JSDoc comment describing what it does, its parameters, and return value.
- **Files under 300 lines** — If a file grows past 300 lines, split it. Extract a helper, create a submodule, separate types into a `.types.ts` file.

### Naming

- **Descriptive names** — No single-letter variables except loop indices (`i`, `j`).
- **Files** — `kebab-case.ts` (e.g., `tension-radar.ts`, `arc-detector.test.ts`)
- **Interfaces/Types** — `PascalCase` (e.g., `TensionScore`, `NarrativeArc`)
- **Functions/Variables** — `camelCase` (e.g., `calculateCascadeRisk`, `tensionScore`)
- **Constants** — `UPPER_SNAKE_CASE` for true constants (e.g., `MAX_ENTITIES`, `INDONESIA_SOURCES`)

### Style

- **Functional style** — Pure functions where possible. Minimize side effects.
- **No wrapper functions with zero logic** — Every function must add value.
- **ESLint + Prettier** — Enforced via Husky pre-commit hooks. Run `npm run lint:fix` and `npm run format` before committing.

### Error Handling

- Use custom error classes from `packages/server/src/errors/` (extends `LoomError`).
- All async routes must be wrapped with the error handler middleware.
- Input validation via Zod schemas on all API endpoints.
- Retry logic with exponential backoff for external API calls (OpenAI, etc.).

### Commits

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add cascade risk scoring to tension radar
fix: handle empty entity list in arc detector
docs: update API documentation
test: add edge cases for graph traversal
chore: update dependencies
refactor: extract pressure calculation into pure function
```

---

## How Tests Work

LOOM uses **Vitest** for all testing. Tests are colocated next to their source files.

```bash
npm run test              # Run all 624 tests
npm run test:cov          # Run with coverage report (70% target)
npx vitest path/to/file   # Run a specific test file
npx vitest --watch        # Watch mode for development
```

### Test Organization

```
packages/server/src/
├── analysis/
│   ├── tension-radar.ts           # Source
│   ├── tension-radar.test.ts      # Unit tests
│   ├── arc-detector.ts
│   ├── arc-detector.test.ts
│   ├── dream-engine.ts
│   └── dream-engine.test.ts
├── graph/
│   ├── temporal-graph.ts
│   ├── temporal-graph.test.ts
│   └── temporal-graph.benchmark.test.ts  # Performance tests
├── sentiment/
│   ├── analysis/
│   │   ├── sentiment-engine.test.ts       # Core tests
│   │   ├── sentiment-engine.edge.test.ts  # Edge cases
│   │   └── sentiment-engine.stress.test.ts # Stress/perf
│   └── sources/
│       └── source-registry.test.ts
└── ...
```

### Writing Tests

Every algorithm needs:

1. **Happy path tests** — Does it produce correct output for normal input?
2. **Edge case tests** — Empty arrays, single items, boundary values, missing fields.
3. **Error case tests** — Does it throw the right errors for bad input?

```typescript
import { describe, it, expect } from 'vitest';
import { calculateTensionScore } from './tension-radar';

describe('calculateTensionScore', () => {
  it('should score critical tensions above 0.8', () => {
    const tension = createTestTension({ status: 'critical', intensity: 0.9 });
    const score = calculateTensionScore(tension, mockContext);
    expect(score.composite).toBeGreaterThan(0.8);
  });

  it('should handle tensions with no related events', () => {
    const tension = createTestTension({ relatedEvents: [] });
    const score = calculateTensionScore(tension, mockContext);
    expect(score.momentum).toBe(0);
  });
});
```

### Performance Tests

The graph engine has benchmark tests that verify performance at scale:

```typescript
it('should handle 1000+ entities without degradation', () => {
  // Creates 1000 entities, measures query time
  // Must complete under threshold
});
```

---

## How to Add a New Country to the Sentiment Engine

The sentiment engine is designed to be extended country by country. Here's how to add a new one:

### Step 1: Create Source Profiles

Create `packages/server/src/sentiment/sources/profiles/<country>.ts`:

```typescript
import { MediaSource } from '../source-registry'

/**
 * Media source profiles for <Country>.
 * Each profile captures ownership, political leaning, reliability,
 * and audience — used for source-weighted sentiment analysis.
 */
export const COUNTRY_SOURCES: MediaSource[] = [
  {
    id: 'source-id',
    name: 'Source Name',
    country: 'XX',                    // ISO 3166-1 alpha-2
    type: 'broadsheet',               // broadsheet, tabloid, digital, tv, wire, etc.
    owner: 'Owner Name',
    ownerType: 'independent',         // independent, state, oligarch, party
    politicalLeaning: 'centrist',     // left, center-left, centrist, center-right, right
    biasDirection: 'neutral',         // pro-government, anti-government, neutral
    reliabilityScore: 0.80,           // 0.0 - 1.0
    signalWeight: 1.0,               // Base signal multiplier
    audienceTypes: ['urban', 'elite'],
    // Extended profile with editorial history, ownership chains, etc.
    extendedProfile: { ... }
  },
  // ... more sources
]
```

**Research tips:** You need at minimum 8-10 sources spanning the political spectrum — pro-government, independent, opposition, state media. The signal weighting only works when you have sources with known biases to compare against.

### Step 2: Register Sources

In `packages/server/src/sentiment/sources/source-registry.ts`, import and register:

```typescript
import { COUNTRY_SOURCES } from './profiles/<country>';

// In the constructor or initialization:
this.registerSources(COUNTRY_SOURCES);
```

### Step 3: Add Entity Profiles (Optional but Recommended)

Create entity profiles in `packages/server/src/knowledge-base/entities/<country>.ts` for key political figures, business leaders, and media owners. These power the relationship mapping in the knowledge base UI.

### Step 4: Create Demo Data

Create `packages/server/src/sentiment/demo/<country>-demo.ts` with 20-50 realistic articles covering key topics. Include articles from different sources reporting on the same events with different tones — this demonstrates the source-weighting system.

### Step 5: Add Tests

Create test files for your source profiles and any country-specific scoring logic. At minimum:

```typescript
describe('<Country> source profiles', () => {
  it('should have all required fields for every source', () => { ... })
  it('should have reliability scores between 0 and 1', () => { ... })
  it('should cover the political spectrum', () => { ... })
  it('should compute signal weights correctly for biased sources', () => { ... })
})
```

### Step 6: Update Documentation

- Add the country to the source profiles table in README.md
- Add a demo scenario description

---

## How to Create a New Demo Scenario

Demo scenarios are self-contained narrative datasets that showcase LOOM's capabilities.

### Step 1: Create the Demo File

Create `packages/server/src/demo/<scenario-name>.ts`:

```typescript
import { Entity, NarrativeEvent, Tension, NarrativeArc } from '../graph/temporal-graph';

export const scenarioName = {
  id: 'scenario-id',
  name: 'Scenario Display Name',
  description: 'One-line description for the demo list',
  entities: [
    {
      id: 'ent-001',
      name: 'Character Name',
      type: 'person', // person, organization, country, concept
      motivation: 'What drives them',
      capability: 'What they can do',
      alliances: ['ent-002'],
      description: 'Brief description',
      firstSeen: '2024-01-01T00:00:00.000Z',
      lastSeen: '2024-03-01T00:00:00.000Z',
    },
    // 6-12 entities recommended
  ],
  events: [
    {
      id: 'evt-001',
      title: 'Event Title',
      description: 'What happened and why it matters',
      timestamp: '2024-01-15T00:00:00.000Z',
      participants: ['ent-001', 'ent-002'],
      causalPredecessors: [], // IDs of events that caused this one
      impact: 0.85, // 0-1
      sentiment: -0.6, // -1 to 1
    },
    // 8-15 events recommended, with causal chains
  ],
  tensions: [
    {
      id: 'ten-001',
      name: 'Tension Name',
      description: 'The core conflict',
      parties: ['ent-001', 'ent-002'],
      status: 'escalating', // simmering, escalating, critical, resolved
      intensity: 0.7,
      // ...
    },
    // 3-6 tensions recommended
  ],
  arcs: [
    // 2-4 narrative arcs
  ],
};
```

### Step 2: Register the Demo

Add your scenario to the demo loader in `packages/server/src/demo/` and expose it via the `/api/demo/load` endpoint.

### Step 3: Tips for Compelling Demos

- **Choose narratives with clear characters and tensions** — corporate crises, geopolitical conflicts, market disruptions
- **Build causal chains** — Events should reference their predecessors. LOOM's visualization shines when causality is explicit.
- **Include multiple tension types** — Economic, political, personal, strategic. Different tensions interacting is where cascade risk gets interesting.
- **Vary entity types** — Mix people, organizations, and countries. Alliance structures between different entity types create richer graphs.

---

## Development Workflow

### Branch Naming

- `feat/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation changes
- `refactor/description` — Code refactoring
- `test/description` — Test additions/fixes

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes with clear, atomic commits
3. Ensure all checks pass:
   ```bash
   npm run lint      # Must pass clean
   npm run test      # All 624+ tests must pass
   npm run build     # Must compile without errors
   ```
4. Open a PR with a clear description of **what** and **why**
5. Address review feedback
6. Squash-merge when approved

### What Makes a Good PR

- **Focused** — One logical change per PR. Don't mix a feature with unrelated refactoring.
- **Tested** — New algorithms need tests. New endpoints need integration tests. Edge cases matter.
- **Documented** — JSDoc on public functions. Update README if you're adding user-facing features.
- **Under 300 lines per file** — If your change pushes a file past 300 lines, split it as part of the PR.

---

## Architecture Decisions

### Why narrative intelligence?

Traditional analytics strips context. LOOM preserves narrative structure — characters, motivations, tensions, arcs — because that's where the real signal lives. Unresolved tensions are early-warning signals. Character arc shifts predict behavior. Narratives that don't cohere structurally are worth investigating.

### Why in-memory graph?

For v1, the in-memory temporal graph is simple, fast, and sufficient. It's benchmarked to handle 5,000+ entities without degradation. Future versions may add persistence (Neo4j, DGraph) but the interface is designed to be storage-agnostic.

### Why OpenAI for extraction?

GPT-4o provides the best balance of extraction quality and structured output reliability. The extraction interface is model-agnostic — swapping providers requires minimal changes.

### Why source-weighted sentiment?

Raw sentiment analysis is noisy. A positive article from state media means something completely different from a positive article from an investigative outlet. Source weighting turns noise into signal by treating the _source_ as part of the data.

---

## Questions?

Open an issue or start a discussion. Narrative intelligence is an emerging field — we welcome diverse perspectives, whether you're an engineer, analyst, journalist, or just someone who thinks data should tell better stories.
