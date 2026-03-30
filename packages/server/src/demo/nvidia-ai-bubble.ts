// ============================================================
// LOOM — Demo: NVIDIA & The AI Bubble Question
//
// A market/financial narrative covering the AI investment frenzy,
// the NVIDIA supercycle, and the growing bubble concerns.
// ============================================================

import type { Entity, NarrativeEvent, Tension, NarrativeArc } from '../graph/types.js';

export const aiBubbleEntities: Entity[] = [
  {
    id: 'nvidia-corp',
    name: 'NVIDIA Corporation',
    type: 'company',
    motivation:
      'Dominate AI infrastructure, sell GPUs at massive margins, build the computing platform for the AI era',
    capability:
      '$3T market cap, 80%+ AI accelerator market share, CUDA monopoly, data center revenue $100B+ run rate',
    alliances: ['microsoft-corp', 'openai-org', 'meta-corp'],
    description:
      'The most important company in the AI revolution — or the biggest beneficiary of a bubble.',
    firstSeen: '2023-01-01T00:00:00Z',
    lastSeen: '2025-04-01T00:00:00Z',
  },
  {
    id: 'microsoft-corp',
    name: 'Microsoft',
    type: 'company',
    motivation:
      'Win the enterprise AI platform war, monetize $13B OpenAI investment, transform Azure into AI cloud leader',
    capability:
      'Azure cloud, $50B+ AI capex, Office/GitHub/LinkedIn distribution, enterprise relationships',
    alliances: ['nvidia-corp', 'openai-org'],
    description:
      'Betting the company on AI via OpenAI partnership and massive infrastructure build-out.',
    firstSeen: '2023-01-01T00:00:00Z',
    lastSeen: '2025-04-01T00:00:00Z',
  },
  {
    id: 'openai-org',
    name: 'OpenAI',
    type: 'company',
    motivation:
      'Build AGI, generate revenue to fund compute, maintain leadership in frontier models',
    capability: 'GPT-5 frontier models, ChatGPT 300M+ users, $10B+ revenue run rate, top AI talent',
    alliances: ['microsoft-corp', 'nvidia-corp'],
    description:
      'The company that started the AI gold rush — now racing to justify its $300B valuation.',
    firstSeen: '2022-11-30T00:00:00Z',
    lastSeen: '2025-04-01T00:00:00Z',
  },
  {
    id: 'deepseek-ai',
    name: 'DeepSeek',
    type: 'company',
    motivation:
      'Prove open-source Chinese AI can match proprietary Western models at a fraction of the cost',
    capability:
      'R1 model matching GPT-4o at 1/20th cost, efficient training techniques, open weights',
    alliances: [],
    description:
      "The Chinese lab that triggered a $1T market cap wipeout by proving AI doesn't need NVIDIA's most expensive chips.",
    firstSeen: '2025-01-20T00:00:00Z',
    lastSeen: '2025-04-01T00:00:00Z',
  },
  {
    id: 'wall-street',
    name: 'Wall Street / Institutional Investors',
    type: 'group',
    motivation: 'Maximize returns, find the next mega-trade, manage risk of potential AI bubble',
    capability: 'Trillions in AUM, market-moving analysis, short-selling capability',
    alliances: [],
    description:
      'The market collectively trying to price the AI revolution — oscillating between FOMO and fear.',
    firstSeen: '2023-01-01T00:00:00Z',
    lastSeen: '2025-04-01T00:00:00Z',
  },
  {
    id: 'meta-corp',
    name: 'Meta Platforms',
    type: 'company',
    motivation:
      'Open-source AI leadership, integrate AI into social products, pivot from metaverse narrative',
    capability: 'Llama models, 3.5B users, $40B+ AI capex, research talent',
    alliances: ['nvidia-corp'],
    description:
      "The largest buyer of NVIDIA GPUs and champion of open-source AI — spending more than some countries' GDP on compute.",
    firstSeen: '2023-01-01T00:00:00Z',
    lastSeen: '2025-04-01T00:00:00Z',
  },
];

export const aiBubbleEvents: NarrativeEvent[] = [
  {
    id: 'ab-event-01',
    title: 'NVIDIA Reports Q4 FY24 — Revenue Triples, Stock Surges',
    description:
      'NVIDIA reports $22.1B in quarterly revenue, tripling year-over-year. Data center revenue up 409%. The market adds $200B in a single day.',
    timestamp: '2024-02-21T00:00:00Z',
    participants: ['nvidia-corp', 'wall-street'],
    causalPredecessors: [],
    impact: 0.95,
    sentiment: 0.9,
  },
  {
    id: 'ab-event-02',
    title: 'DeepSeek R1 Launch — $6M Training Cost Shocks the World',
    description:
      'Chinese lab DeepSeek releases R1, matching GPT-4o performance while reportedly training for just $6M. NVIDIA loses $600B in market cap. The "efficiency revolution" narrative begins.',
    timestamp: '2025-01-27T00:00:00Z',
    participants: ['deepseek-ai', 'nvidia-corp', 'wall-street', 'openai-org'],
    causalPredecessors: ['ab-event-01'],
    impact: 0.98,
    sentiment: -0.8,
  },
  {
    id: 'ab-event-03',
    title: 'Hyperscaler Capex Hits $250B — "Show Me the Revenue" Chorus Grows',
    description:
      'Combined AI capex from Microsoft, Meta, Google, and Amazon reaches $250B annually. Analysts begin asking when this spending will generate proportional revenue.',
    timestamp: '2025-02-15T00:00:00Z',
    participants: ['microsoft-corp', 'meta-corp', 'wall-street'],
    causalPredecessors: ['ab-event-01'],
    impact: 0.8,
    sentiment: -0.3,
  },
  {
    id: 'ab-event-04',
    title: 'OpenAI Hits $10B Revenue Run Rate — But Burns $8B Annually',
    description:
      'OpenAI reveals $10B annualized revenue but operating losses of $8B. The unit economics of frontier AI remain deeply unprofitable.',
    timestamp: '2025-03-10T00:00:00Z',
    participants: ['openai-org', 'microsoft-corp', 'wall-street'],
    causalPredecessors: ['ab-event-03'],
    impact: 0.75,
    sentiment: -0.4,
  },
  {
    id: 'ab-event-05',
    title: 'NVIDIA Blackwell B200 Sells Out Through 2026 — Demand Undeniable',
    description:
      "NVIDIA's next-gen Blackwell GPU platform is completely sold out for 18 months. Every major cloud provider and sovereign AI initiative is placing orders.",
    timestamp: '2025-03-20T00:00:00Z',
    participants: ['nvidia-corp', 'microsoft-corp', 'meta-corp'],
    causalPredecessors: ['ab-event-02'],
    impact: 0.85,
    sentiment: 0.7,
  },
  {
    id: 'ab-event-06',
    title: 'First Major AI Startup Collapses — Inflection AI Fire Sale to Microsoft',
    description:
      'Inflection AI, once valued at $4B, effectively shuts down as Microsoft acquires its team and IP for a fraction. The AI startup shakeout begins.',
    timestamp: '2024-03-19T00:00:00Z',
    participants: ['microsoft-corp', 'wall-street'],
    causalPredecessors: ['ab-event-01'],
    impact: 0.6,
    sentiment: -0.5,
  },
  {
    id: 'ab-event-07',
    title: 'Meta AI: Llama 4 Matches GPT-5 — Open Source Closes the Gap',
    description:
      'Meta releases Llama 4, which benchmarks within 5% of GPT-5 on major evaluations. The commoditization of frontier AI accelerates.',
    timestamp: '2025-04-05T00:00:00Z',
    participants: ['meta-corp', 'openai-org', 'nvidia-corp'],
    causalPredecessors: ['ab-event-02'],
    impact: 0.88,
    sentiment: 0.3,
  },
  {
    id: 'ab-event-08',
    title: 'Goldman Sachs Report: "AI Spending May Be the Biggest Bubble Since Dotcom"',
    description:
      'Goldman publishes a provocative research note comparing current AI capex to dotcom-era spending, noting that revenue realization is lagging investment by 3-5 years.',
    timestamp: '2025-04-10T00:00:00Z',
    participants: ['wall-street', 'nvidia-corp', 'microsoft-corp'],
    causalPredecessors: ['ab-event-03', 'ab-event-04'],
    impact: 0.78,
    sentiment: -0.6,
  },
];

export const aiBubbleTensions: Tension[] = [
  {
    id: 'ab-tension-01',
    name: 'AI Capex vs. Revenue Realization',
    description:
      'Hundreds of billions spent on AI infrastructure with unclear return timelines. Will this be transformative or a bubble?',
    parties: ['wall-street', 'nvidia-corp'],
    status: 'escalating',
    intensity: 0.85,
    duration: 400,
    relatedEvents: ['ab-event-01', 'ab-event-03', 'ab-event-04', 'ab-event-08'],
    validFrom: '2024-02-21T00:00:00Z',
    statusHistory: [
      { status: 'simmering', timestamp: '2024-02-21T00:00:00Z' },
      { status: 'escalating', timestamp: '2025-02-15T00:00:00Z' },
    ],
  },
  {
    id: 'ab-tension-02',
    name: 'Proprietary AI vs. Open Source Commoditization',
    description:
      'OpenAI and Anthropic need AI to stay expensive. Meta and DeepSeek are making it cheap. Who wins?',
    parties: ['openai-org', 'meta-corp'],
    status: 'escalating',
    intensity: 0.8,
    duration: 300,
    relatedEvents: ['ab-event-02', 'ab-event-07'],
    validFrom: '2025-01-27T00:00:00Z',
    statusHistory: [
      { status: 'simmering', timestamp: '2024-07-01T00:00:00Z' },
      { status: 'escalating', timestamp: '2025-01-27T00:00:00Z' },
    ],
  },
  {
    id: 'ab-tension-03',
    name: "NVIDIA's Pricing Power vs. Efficiency Revolution",
    description:
      "DeepSeek proved you don't need the most expensive GPUs. If training costs keep falling, does NVIDIA's $40K-per-chip pricing hold?",
    parties: ['nvidia-corp', 'deepseek-ai'],
    status: 'critical',
    intensity: 0.88,
    duration: 100,
    relatedEvents: ['ab-event-02', 'ab-event-05'],
    validFrom: '2025-01-27T00:00:00Z',
    statusHistory: [
      { status: 'escalating', timestamp: '2025-01-27T00:00:00Z' },
      { status: 'critical', timestamp: '2025-03-01T00:00:00Z' },
    ],
  },
];

export const aiBubbleArcs: NarrativeArc[] = [
  {
    id: 'ab-arc-01',
    name: 'The AI Gold Rush',
    description:
      'The greatest infrastructure spending boom since the railroad era — building the compute layer for artificial intelligence.',
    phase: 'climax',
    characters: ['nvidia-corp', 'microsoft-corp', 'meta-corp', 'wall-street'],
    events: ['ab-event-01', 'ab-event-03', 'ab-event-05', 'ab-event-08'],
    tensions: ['ab-tension-01'],
    startDate: '2023-01-01T00:00:00Z',
  },
  {
    id: 'ab-arc-02',
    name: 'The Efficiency Insurgency',
    description:
      "DeepSeek and open-source challengers proving that AI doesn't need to be expensive — threatening the entire bull thesis.",
    phase: 'rising_action',
    characters: ['deepseek-ai', 'meta-corp', 'nvidia-corp'],
    events: ['ab-event-02', 'ab-event-07'],
    tensions: ['ab-tension-02', 'ab-tension-03'],
    startDate: '2025-01-27T00:00:00Z',
  },
  {
    id: 'ab-arc-03',
    name: "OpenAI's Existential Race",
    description:
      'Can OpenAI generate enough revenue to justify its valuation before open-source catches up?',
    phase: 'rising_action',
    characters: ['openai-org', 'microsoft-corp'],
    events: ['ab-event-04', 'ab-event-06'],
    tensions: ['ab-tension-02'],
    startDate: '2024-03-19T00:00:00Z',
  },
];
