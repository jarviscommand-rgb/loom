# 🧶 LOOM — Causal Narrative Intelligence Engine

> *"LOOM doesn't analyze what happened — it reads the story your data is telling, detects the plot twists coming, and lets you write the next chapter."*

## What is LOOM?

Every business situation, every market shift, every competitive move is a **story**. It has characters with motivations. It has rising tension and approaching climaxes. It has unresolved conflicts and hidden subplots.

But we analyze all of this with spreadsheets, dashboards, and bullet points — killing the narrative structure that actually contains the signal.

**LOOM** is the first system that treats real-world data as a **living narrative** and applies the deep structure of storytelling — character arcs, tension dynamics, plot mechanics — to extract insights that traditional analysis misses.

## Core Capabilities

### 🎭 Story Extraction
Feed LOOM any text — news articles, earnings calls, intelligence reports — and it extracts the **narrative skeleton**: characters and their motivations, events and their causal chains, conflicts and their trajectory.

### ⚡ Tension Radar
LOOM scans for unresolved narrative tensions — contradictions, building pressures, unstable equilibria. These aren't just "data points" — they're **dramatic pressure** that signals what's about to break.

- **Duration**: Long-simmering tensions carry more energy
- **Escalation**: Getting worse = approaching climax
- **Convergence**: Multiple tensions pointing at one entity = critical mass

### 🌿 Dream Mode
Given the current narrative state, LOOM generates plausible "next chapters" as interactive, explorable story branches. Not prediction — **narrative dreaming** grounded in character motivation and dramatic logic.

### 🌐 The Tapestry
An interactive 3D visualization where stories are threads, tensions glow, and time flows as a river. Characters orbit as luminous spheres. Tensions pulse between them. Events scatter like stars along the timeline.

## Demo: The OpenAI Board Crisis

LOOM ships with a pre-loaded demo of the November 2023 OpenAI crisis — one of the most dramatic corporate narratives in recent memory:

- **9 characters** with tracked motivations and alliances
- **10 key events** with causal links
- **5 active tensions** from "Safety vs. Speed" to "Non-Profit vs. For-Profit"
- **3 narrative arcs** including "The Boardroom Coup" and "Microsoft's Power Play"

## Architecture

```
LOOM
├── packages/server    TypeScript + Express + WebSocket
│   ├── extraction/    LLM-powered narrative extraction
│   ├── graph/         In-memory temporal causal graph
│   ├── analysis/      Tension radar + arc detection + dream engine
│   └── demo/          Pre-loaded OpenAI crisis narrative
└── packages/client    React + Vite + Three.js + D3.js
    └── components/    Timeline, Network, Tapestry (3D), Dream Tree, Tension Radar
```

## Quick Start

```bash
# Install dependencies
cd packages/server && npm install
cd ../client && npm install

# Set your OpenAI API key (needed for extraction + dream mode)
export OPENAI_API_KEY=your-key-here

# Start the server (port 3001)
cd packages/server && npm run dev

# Start the client (port 5173)
cd packages/client && npm run dev
```

Then open http://localhost:5173 and click **"Load Demo"** to explore the OpenAI crisis narrative.

## The Narrative Lens

Traditional analysis asks: *"What are the metrics?"*

LOOM asks: *"What's the story?"*

| Traditional | LOOM |
|------------|------|
| Entities | Characters |
| Data points | Events |
| Metrics | Tension scores |
| Dashboards | The Tapestry |
| Forecasts | Dream branches |
| Anomalies | Plot twists |

## Why This Matters

The narrative lens isn't a gimmick. It's a genuinely powerful analytical framework:

- **Tension = instability.** Unresolved narrative tensions are early-warning signals.
- **Character arc = trajectory.** Tracking motivation shifts predicts behavior.
- **Unresolved subplot = hidden risk.** What everyone stopped talking about is often what matters most.
- **Plot hole = disinformation.** Narratives that don't cohere structurally are worth investigating.
- **Dramatic irony = information asymmetry.** When the audience knows something the characters don't.

## Tech Stack

- **TypeScript** throughout
- **Express + WebSocket** for real-time API
- **OpenAI GPT-4o** for narrative extraction
- **React + Vite** for the frontend
- **Three.js** (via @react-three/fiber) for the 3D Tapestry
- **D3.js** for timeline and network visualizations
- **Zod** for runtime validation

## License

MIT

---

*Built with narrative intelligence. Every dataset tells a story. LOOM helps you read it.*
