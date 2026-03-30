# 🧵 LOOM — Causal Narrative Intelligence Engine

**Map the hidden threads that connect events, actors, and outcomes. Intelligence analysis meets narrative science.**

[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-1058%20passing-brightgreen)](.)
[![Coverage](https://img.shields.io/badge/coverage-93%25%2B-brightgreen)](.)
[![Lines](https://img.shields.io/badge/lines-48K%2B-blue)](.)
[![Zero Any](https://img.shields.io/badge/any%20types-zero-blue)](.)

---

## Visual Demo

### The Tapestry — 3D Narrative Space

![The Tapestry — 3D Narrative Visualization](docs/screenshots/tapestry.png)
_Characters orbit as glowing spheres. Tensions pulse as luminous threads. Events scatter like stars along a flowing time river. Bloom, fog, and particles at 60fps._

### Sentiment Dashboard — Country-Level Intelligence

![Sentiment Dashboard](docs/screenshots/sentiment.png)
_Source-weighted sentiment analysis across 16 Indonesian media outlets. NIS scoring, time-series tracking, category breakdowns._

<details>
<summary><strong>See more screenshots</strong></summary>

### Social Media Intelligence Dashboard

![Social Media Intelligence](docs/screenshots/social-intelligence.png)
_Track how announcements cascade across platforms. Audience segmentation, engagement heatmaps, amplification patterns._

### Knowledge Base — Entity & Source Profiles

![Knowledge Base](docs/screenshots/knowledge-base.png)
_Deep profiles on media sources, political figures, and organizations. Ownership chains, bias mapping, relationship graphs._

### Timeline View — Causal Event Chains

![Timeline View](docs/screenshots/timeline.png)

### Network Graph — Entity Relationships

![Network Graph](docs/screenshots/network.png)

### Tension Radar — Pressure Points

![Tension Radar](docs/screenshots/tensions.png)

</details>

---

## What is LOOM?

Most analytics tools show you _what happened_. LOOM shows you **the story** — who the characters are, what tensions are building, which subplots everyone stopped watching, and what happens next.

Feed it news articles, earnings calls, social media posts, or any unstructured text. LOOM extracts the **narrative skeleton** — characters with motivations, events in causal chains, tensions with cascade risk, and story arcs following classical patterns — then dreams plausible futures as explorable branches.

### Three Pillars

| Pillar                        | What it does                                                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Narrative Engine**          | Extract entities, events, tensions, and arcs from any text. Build temporal causal graphs. Detect narrative phases and predict climaxes. |
| **Sentiment Analysis**        | Source-weighted sentiment scoring across media outlets. A positive article from an opposition paper is worth 5x one from state media.   |
| **Social Media Intelligence** | Track how announcements cascade through platforms. Audience segmentation, persona generation, engagement pattern analysis.              |

### Real-World Use Case

A government announces a new economic policy. Within hours:

1. **LOOM ingests** articles from 16 media sources, each with known ownership and political bias
2. **The Narrative Engine** extracts key entities, maps causal chains, and detects emerging tensions
3. **The Sentiment Engine** scores each article with source weighting — a critical article from a pro-government outlet is high signal
4. **Social Intelligence** tracks how the narrative fragments across platforms, which audiences amplify which framing
5. **The Dream Engine** generates three plausible scenarios for how this plays out over the next 30 days

The result isn't a dashboard. It's a **briefing**.

### Why This Matters

In a world of information overload, the problem isn't access to data — it's understanding the **structure** behind the noise. Humans have understood the world through narrative for 100,000 years. Stories aren't a simplification of reality — they're the native data structure of human behavior.

LOOM takes this seriously. Unresolved tensions are early-warning signals. Character arc shifts predict behavior. Subplots that went quiet didn't resolve — they went underground. Narratives that don't cohere structurally are worth investigating.

```
$ curl -X POST localhost:3001/api/extract -d '{"text": "..."}'
→ 9 characters, 10 events, 5 tensions, 3 arcs detected
→ "Safety vs. Speed" tension at 0.87 — cascade risk: HIGH
→ Climax predicted in 4-7 days based on escalation rate
```

---

## Key Features

- 🧬 **Causal Narrative Extraction** — LLM-powered extraction of entities, events, tensions, and narrative arcs from any unstructured text
- 🌐 **Temporal Causal Graph** — Track how events chain together over time with indexed lookups and 10,000+ entity performance
- 📊 **Sentiment Engine** — Weighted sentiment analysis with source credibility scoring across 16+ media profiles
- 📱 **Social Media Intelligence** — Track announcements across platforms, audience segmentation, engagement patterns
- 🎭 **Audience Personas** — AI-generated audience profiles with reaction prediction and demographic modeling
- 🔮 **Dream Engine** — Probabilistic scenario generation for "what-if" analysis with three strategies and constraint satisfaction
- ⚡ **Tension Radar** — Detect and track escalating conflicts with 6-dimension scoring and cascade risk analysis
- 📈 **Narrative Impact Score (NIS)** — Universal 0-100 metric combining sentiment shift, source credibility, reach, duration, and amplification
- 🎨 **Stunning 3D Visualization** — Three.js-powered narrative tapestry with bloom effects, particle systems, and fog at 60fps
- 🤖 **MCP Integration** — Works with Claude, ChatGPT, and other AI assistants via Model Context Protocol (8 tools)
- 📚 **Knowledge Base** — Curated intelligence on 20 media sources, 15 entity profiles, ownership chains, and methodology docs
- 🔍 **Score Transparency** — Every computed metric is fully decomposable. No black boxes. Every number has a receipt.

---

## Quick Start

### Prerequisites

- **Node.js** 18+ (v24 recommended)
- **npm** 10+ (or bun)
- **OpenAI API key** (for extraction and dream engine)

### Install & Run

```bash
# Clone and install
git clone https://github.com/jarviscommand-rgb/loom.git
cd loom
npm install

# Configure
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start both server (port 3001) and client (port 5173)
npm run dev
```

### With Docker

```bash
docker compose up
```

### First Launch

Open **http://localhost:5173** and click **"Load Demo"** → select **"OpenAI Board Crisis"**.

You'll see 9 characters, 10 events, 5 active tensions, and 3 narrative arcs populate instantly. Switch to the **Tapestry** tab for the 3D visualization. Switch to **Sentiment** and load the Indonesian demo for source-weighted analysis across 50+ articles.

### Environment Variables

| Variable            | Required | Default  | Description                                    |
| ------------------- | -------- | -------- | ---------------------------------------------- |
| `OPENAI_API_KEY`    | Yes      | —        | OpenAI API key for extraction and dream engine |
| `PORT`              | No       | `3001`   | Server port                                    |
| `OPENAI_MODEL`      | No       | `gpt-4o` | Model for narrative extraction                 |
| `DREAM_MODEL`       | No       | `gpt-4o` | Model for dream generation                     |
| `LOG_LEVEL`         | No       | `info`   | `debug` \| `info` \| `warn` \| `error`         |
| `RATE_LIMIT_MAX`    | No       | `10`     | Max requests per rate limit window             |
| `SERPAPI_KEY`       | No       | —        | SerpAPI key for auto-research ingestion        |
| `FIRECRAWL_API_KEY` | No       | —        | Firecrawl key for web content extraction       |

---

## Architecture

```
                          ┌─────────────────────────────────────────────┐
                          │              LOOM Architecture              │
                          └─────────────────────────────────────────────┘

  ┌──────────────────┐     ┌───────────────────────────────────────────────────────┐
  │   Input Sources   │     │                   packages/server                     │
  │                    │     │                                                       │
  │  News Articles     │     │  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
  │  Social Media      │────▶│  │  Extraction   │─▶│  Temporal     │─▶│  Analysis  │ │
  │  Earnings Calls    │     │  │  Pipeline     │  │  Causal Graph │  │  Engine    │ │
  │  Intel Reports     │     │  │  (GPT-4o)     │  │  (In-Memory)  │  │           │ │
  └──────────────────┘     │  └──────────────┘  └──────┬───────┘  └─────┬──────┘ │
                              │                          │                │         │
  ┌──────────────────┐     │  ┌──────────────┐  ┌──────┴───────┐  ┌────┴───────┐ │
  │   MCP Clients     │     │  │  MCP Server   │  │  Graph Store  │  │  Tension   │ │
  │                    │◀──▶│  │  (8 tools)    │  │  Entities     │  │  Radar     │ │
  │  Claude Desktop    │     │  └──────────────┘  │  Events       │  │  Arc Det.  │ │
  │  GPT Agents        │     │                     │  Tensions     │  │  Dream     │ │
  │  Custom Agents     │     │  ┌──────────────┐  │  Arcs         │  │  Engine    │ │
  └──────────────────┘     │  │  Sentiment    │  └──────────────┘  └────────────┘ │
                              │  │  Engine       │                                   │
  ┌──────────────────┐     │  │  16 source    │  ┌──────────────┐                  │
  │   News Feeds       │────▶│  │  profiles    │  │  Social       │                  │
  │  RSS / SerpAPI     │     │  │  NIS scoring │  │  Intelligence │                  │
  │  Google News       │     │  └──────────────┘  │  Audiences    │                  │
  │  Firecrawl         │     │                     │  Personas     │                  │
  └──────────────────┘     │  ┌──────────────┐  └──────────────┘                  │
                              │  │  Knowledge    │                                   │
                              │  │  Base         │  ┌──────────────┐                │
                              │  │  20 sources   │  │  Express API  │                │
                              │  │  15 entities  │  │  30+ endpoints│                │
                              │  └──────────────┘  │  Zod + WS     │                │
                              │                     └──────────────┘                  │
                              └───────────────────────────────────────────────────────┘
                                                        │
                              ┌──────────────────────────┴──────────────────────────┐
                              │                    packages/client                    │
                              │                                                      │
                              │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
                              │  │ 3D Tapestry│  │ D3 Timeline│  │ Network    │    │
                              │  │ Three.js   │  │ Causal     │  │ Graph      │    │
                              │  │ Bloom+Fog  │  │ Curves     │  │ Force-dir. │    │
                              │  └────────────┘  └────────────┘  └────────────┘    │
                              │                                                      │
                              │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │
                              │  │ Sentiment  │  │ Knowledge  │  │ Dream Tree │    │
                              │  │ Dashboard  │  │ Base UI    │  │ Explorer   │    │
                              │  │ NIS+Trend  │  │ Profiles   │  │ Branches   │    │
                              │  └────────────┘  └────────────┘  └────────────┘    │
                              │                                                      │
                              │        React 18 + Vite + Tailwind (Dark Theme)      │
                              └──────────────────────────────────────────────────────┘
```

### Data Flow

```
Text → Extraction (GPT-4o) → Temporal Graph → Analysis → Visualization
                │                    │              │
                ▼                    ▼              ▼
          9 entities          Indexed by:     Tension Radar (6D scoring)
         10 events           • entity ID     Arc Detector (6 archetypes)
          5 tensions         • timestamp     Dream Engine (3 strategies)
          3 arcs             • causal links  NIS Scoring (5 components)
```

---

## The Intelligence Stack

| Layer                            | Function                 | Components                                                                             |
| -------------------------------- | ------------------------ | -------------------------------------------------------------------------------------- |
| **Layer 1: Ingestion**           | Raw data collection      | RSS feeds, SerpAPI, Google News, Firecrawl, manual input                               |
| **Layer 2: Extraction**          | NLP/LLM processing       | Entity extraction, sentiment scoring, category classification, bilingual support       |
| **Layer 3: Graph Analysis**      | Structural intelligence  | Causal chains, tension scoring, arc detection, phase classification                    |
| **Layer 4: Social Intelligence** | Audience & amplification | Platform tracking, audience segmentation, persona generation, engagement patterns      |
| **Layer 5: Predictive**          | Scenario modeling        | Dream engine, constraint satisfaction, persona reaction prediction, pattern projection |
| **Layer 6: Visualization**       | Human interface          | 3D Tapestry, D3 timeline, tension heatmaps, sentiment dashboards, score transparency   |

---

## API Documentation

### Interactive Docs (Swagger UI)

Start the server and visit **[http://localhost:3001/api-docs](http://localhost:3001/api-docs)** for auto-generated OpenAPI 3.0 documentation.

### Key Endpoints

#### Extract narrative from text

```bash
curl -X POST http://localhost:3001/api/extract \
  -H "Content-Type: application/json" \
  -d '{"text": "The board of OpenAI fired Sam Altman as CEO..."}'
```

```json
{
  "entities": [
    { "id": "ent-001", "name": "Sam Altman", "type": "person",
      "motivation": "Accelerate AGI development" }
  ],
  "events": [
    { "id": "evt-001", "title": "Board fires Sam Altman",
      "impact": 0.95, "sentiment": -0.8,
      "causalPredecessors": [] }
  ],
  "tensions": [
    { "id": "ten-001", "name": "Safety vs. Speed",
      "status": "critical", "intensity": 0.9 }
  ],
  "arcs": [...]
}
```

#### Get active tensions with cascade risk

```bash
curl http://localhost:3001/api/tensions/active
```

```json
[
  {
    "id": "ten-001",
    "name": "Safety vs. Speed",
    "status": "critical",
    "intensity": 0.9,
    "duration": 28,
    "cascadeRisk": "HIGH"
  }
]
```

#### Generate speculative futures

```bash
curl -X POST http://localhost:3001/api/analysis/dream
```

```json
[
  {
    "title": "The Regulatory Reckoning",
    "probability": 0.35,
    "narrative": "Congressional hearings force structural separation...",
    "consequences": ["Mandatory safety review board", "Delayed GPT-5 launch"]
  }
]
```

#### Sentiment dashboard

```bash
curl http://localhost:3001/api/sentiment/dashboard?country=indonesia
```

### Full API Reference

| Category      | Endpoints                                                             | Description                                         |
| ------------- | --------------------------------------------------------------------- | --------------------------------------------------- |
| **Graph**     | `GET /api/graph`, `GET /api/graph/at/:timestamp`                      | Full narrative graph snapshot or at a point in time |
| **Entities**  | `GET /api/entities`, `GET /api/entities/:id`                          | Paginated entity list with motivations, alliances   |
| **Events**    | `GET /api/events`, `GET /api/events/range`                            | Events with causal chains and impact scores         |
| **Tensions**  | `GET /api/tensions`, `GET /api/tensions/active`                       | Tension scoring with 6-dimension breakdown          |
| **Arcs**      | `GET /api/arcs`                                                       | Narrative arc detection with archetype matching     |
| **Analysis**  | `POST /api/analysis/dream`, `GET /api/analysis/pressure-points`       | Dream engine, pressure points, score breakdowns     |
| **Sentiment** | `POST /api/sentiment/ingest`, `GET /api/sentiment/dashboard`          | Article ingestion, NIS scoring, source profiles     |
| **Knowledge** | `GET /api/knowledge-base/sources`, `GET /api/knowledge-base/entities` | Media profiles, entity profiles, methodology        |
| **Demo**      | `GET /api/demo/list`, `POST /api/demo/load`                           | Load pre-built narrative scenarios                  |
| **MCP**       | 8 tools via stdio                                                     | AI agent integration (Claude, GPT, custom)          |

All list endpoints support pagination (`limit`, `offset`) and return `{ data, total, limit, offset }`.

---

## Demo Scenarios

LOOM ships with four pre-loaded scenarios. Load any in one click.

### 🏢 The OpenAI Board Crisis (November 2023)

9 characters, 10 events, 5 active tensions, 3 narrative arcs. The full drama from Sam Altman's firing to his return — with causal chains showing how Microsoft's power play and the employee revolt connected.

### 🌏 US-China Semiconductor War

8 entities spanning governments, chipmakers, and geopolitical wildcards. Export controls, Huawei's breakthrough, TSMC Arizona, and Southeast Asia's leverage play. Four interlocking tensions with high cascade risk.

### 💹 NVIDIA & The AI Bubble Question

NVIDIA's earnings tripling, DeepSeek's $6M shock, Goldman's bubble warning. Three arcs — The AI Gold Rush, The Efficiency Insurgency, and OpenAI's Existential Race — converging toward a reckoning.

### 🇮🇩 Indonesian Sentiment Engine Demo

50+ articles across 16 Indonesian media sources covering Prabowo's first 100 days, IKN, South China Sea, and anti-corruption. Full source-weighted sentiment analysis with NIS scoring and score transparency breakdowns.

---

## What Makes This Different

| Traditional Analytics   | LOOM                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| Entities in a database  | **Characters** with motivations and alliances                        |
| Timestamped data points | **Events** in causal chains                                          |
| KPI thresholds          | **Tension scores** with cascade risk                                 |
| Static dashboards       | **The Tapestry** — cinematic 3D narrative space                      |
| Linear forecasts        | **Dream branches** — speculative futures grounded in character logic |
| Anomaly detection       | **Plot twist detection** — structural breaks in narrative coherence  |

---

## Tech Stack

| Layer              | Technology                                                    |
| ------------------ | ------------------------------------------------------------- |
| Language           | TypeScript (strict mode, zero `any` types)                    |
| Server             | Express + WebSocket (ws)                                      |
| Client             | React 18 + Vite                                               |
| 3D Visualization   | Three.js via @react-three/fiber + postprocessing (bloom, fog) |
| 2D Visualization   | D3.js (force graphs, timeline with causal curves)             |
| AI                 | OpenAI GPT-4o (extraction + dream engine)                     |
| Auto-Research      | SerpAPI + Google News RSS + Firecrawl                         |
| Validation         | Zod (runtime schema validation on all endpoints)              |
| Styling            | Tailwind CSS (dark theme throughout)                          |
| MCP                | @modelcontextprotocol/sdk (AI agent integration)              |
| Knowledge Base     | 20 source profiles, 15 entity profiles, methodology docs      |
| Score Transparency | Universal breakdown system (40+ variables, full receipts)     |
| API Docs           | Swagger UI (auto-generated OpenAPI 3.0)                       |
| Testing            | Vitest (780 tests, 93%+ coverage)                             |
| Linting            | ESLint + Prettier (Husky pre-commit hooks)                    |
| CI/CD              | GitHub Actions (lint → test → build)                          |
| Container          | Docker + Docker Compose                                       |

**36,000+ lines of TypeScript. 780 passing tests. 93%+ coverage. Zero `any` types.**

---

## Contributing

We welcome contributions! See **[CONTRIBUTING.md](./CONTRIBUTING.md)** for setup instructions, code style guide, architecture decisions, and how to extend LOOM with new countries, demo scenarios, and analysis modules.

Narrative intelligence is an emerging field — whether you're an engineer, analyst, journalist, or someone who thinks data should tell better stories, there's a place for you here.

---

## License

MIT

---

_Every dataset tells a story. LOOM helps you read it._
