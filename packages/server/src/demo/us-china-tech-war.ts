// ============================================================
// LOOM — Demo: US-China Tech War
//
// A geopolitical narrative scenario covering the semiconductor
// supply chain war, AI arms race, and SE Asian positioning.
// ============================================================

import type { Entity, NarrativeEvent, Tension, NarrativeArc } from '../graph/types.js';

export const techWarEntities: Entity[] = [
  {
    id: 'us-govt',
    name: 'United States Government',
    type: 'institution',
    motivation: "Maintain technological supremacy, contain China's rise, protect national security",
    capability: 'Export controls, CHIPS Act funding, alliance building, sanctions authority',
    alliances: ['taiwan-tsmc', 'japan-govt', 'netherlands-asml', 'south-korea-govt'],
    description:
      'The US government under Biden/successor pursuing aggressive semiconductor and AI export controls against China.',
    firstSeen: '2022-10-07T00:00:00Z',
    lastSeen: '2025-04-01T00:00:00Z',
  },
  {
    id: 'china-govt',
    name: "People's Republic of China",
    type: 'institution',
    motivation:
      'Achieve semiconductor self-sufficiency by 2030, lead in AI, reduce Western dependency',
    capability:
      'State subsidies ($150B+ chip fund), rare earth monopoly, massive domestic market, talent pipeline',
    alliances: ['huawei', 'smic'],
    description:
      "China's government mobilizing vast resources to overcome US-led tech restrictions.",
    firstSeen: '2022-10-07T00:00:00Z',
    lastSeen: '2025-04-01T00:00:00Z',
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    type: 'company',
    motivation:
      'Maximize AI chip revenue while complying with export controls, maintain market dominance',
    capability: 'GPU architecture monopoly, CUDA ecosystem lock-in, $2T+ market cap',
    alliances: ['us-govt'],
    description:
      'The dominant AI chip company caught between massive Chinese demand and US export restrictions.',
    firstSeen: '2022-10-07T00:00:00Z',
    lastSeen: '2025-04-01T00:00:00Z',
  },
  {
    id: 'huawei',
    name: 'Huawei Technologies',
    type: 'company',
    motivation:
      'Survive US sanctions, prove Chinese tech independence, rebuild 5G and chip business',
    capability: 'Kirin chip design (via SMIC), 5G infrastructure, massive R&D spend, state backing',
    alliances: ['china-govt', 'smic'],
    description:
      'Huawei as the symbol of Chinese tech resilience — sanctioned but innovating around restrictions.',
    firstSeen: '2019-05-15T00:00:00Z',
    lastSeen: '2025-04-01T00:00:00Z',
  },
  {
    id: 'taiwan-tsmc',
    name: 'TSMC (Taiwan Semiconductor)',
    type: 'company',
    motivation:
      'Maintain fabrication leadership, navigate geopolitical pressure, diversify away from Taiwan risk',
    capability: 'Most advanced chip fabrication (3nm/2nm), 90%+ of advanced logic chips',
    alliances: ['us-govt', 'apple-corp'],
    description:
      "The world's most important company sits on the most dangerous geopolitical fault line.",
    firstSeen: '2022-10-07T00:00:00Z',
    lastSeen: '2025-04-01T00:00:00Z',
  },
  {
    id: 'smic',
    name: 'SMIC (Semiconductor Manufacturing International)',
    type: 'company',
    motivation:
      'Close the gap with TSMC, achieve advanced node manufacturing despite equipment bans',
    capability:
      '7nm production achieved (limited), massive state funding, reverse engineering capability',
    alliances: ['china-govt', 'huawei'],
    description: "China's national champion chipmaker racing to close the technology gap.",
    firstSeen: '2022-10-07T00:00:00Z',
    lastSeen: '2025-04-01T00:00:00Z',
  },
  {
    id: 'netherlands-asml',
    name: 'ASML',
    type: 'company',
    motivation:
      'Sell EUV machines to all customers, maintain monopoly, comply with Dutch/US pressure',
    capability:
      'Sole producer of EUV lithography machines — the $350M tool that makes advanced chips possible',
    alliances: ['us-govt', 'netherlands-govt'],
    description:
      'The Dutch monopoly on extreme ultraviolet lithography — the choke point in the semiconductor supply chain.',
    firstSeen: '2022-10-07T00:00:00Z',
    lastSeen: '2025-04-01T00:00:00Z',
  },
  {
    id: 'indonesia-position',
    name: 'Indonesia',
    type: 'institution',
    motivation:
      'Leverage nickel monopoly for tech transfer, attract chip packaging investment, stay non-aligned',
    capability: 'Nickel supply (50% global), large domestic market, ASEAN centrality',
    alliances: [],
    description:
      'Indonesia positioning itself as a critical player through nickel and downstream processing leverage.',
    firstSeen: '2023-01-01T00:00:00Z',
    lastSeen: '2025-04-01T00:00:00Z',
  },
];

export const techWarEvents: NarrativeEvent[] = [
  {
    id: 'tw-event-01',
    title: 'US Imposes Sweeping Chip Export Controls on China',
    description:
      'The Biden administration enacts the most aggressive semiconductor export controls in history, banning advanced chip sales, EDA tools, and equipment to China.',
    timestamp: '2022-10-07T00:00:00Z',
    participants: ['us-govt', 'china-govt', 'nvidia'],
    causalPredecessors: [],
    impact: 0.95,
    sentiment: -0.4,
  },
  {
    id: 'tw-event-02',
    title: 'Huawei Launches Mate 60 Pro with Kirin 9000s — Made by SMIC at 7nm',
    description:
      'Huawei shocks the world by releasing a phone with a domestically produced 7nm chip, proving China can advance despite sanctions.',
    timestamp: '2023-08-29T00:00:00Z',
    participants: ['huawei', 'smic', 'china-govt'],
    causalPredecessors: ['tw-event-01'],
    impact: 0.9,
    sentiment: 0.6,
  },
  {
    id: 'tw-event-03',
    title: 'NVIDIA Creates China-Specific "Dumbed Down" AI Chips',
    description:
      'NVIDIA designs H800 and A800 chips specifically to comply with US export controls while still selling to China — a $5B revenue lifeline.',
    timestamp: '2023-03-15T00:00:00Z',
    participants: ['nvidia', 'us-govt', 'china-govt'],
    causalPredecessors: ['tw-event-01'],
    impact: 0.7,
    sentiment: -0.2,
  },
  {
    id: 'tw-event-04',
    title: 'US Closes Loopholes — Bans China-Specific Chip Designs Too',
    description:
      "The Commerce Department updates export controls to ban NVIDIA's China-specific chips, closing the compliance workaround.",
    timestamp: '2023-10-17T00:00:00Z',
    participants: ['us-govt', 'nvidia', 'china-govt'],
    causalPredecessors: ['tw-event-03'],
    impact: 0.85,
    sentiment: -0.6,
  },
  {
    id: 'tw-event-05',
    title: 'ASML Confirms Netherlands Will Block EUV Sales to China',
    description:
      'Under US pressure, the Dutch government restricts ASML from exporting EUV and advanced DUV lithography machines to China.',
    timestamp: '2023-06-30T00:00:00Z',
    participants: ['netherlands-asml', 'us-govt', 'china-govt'],
    causalPredecessors: ['tw-event-01'],
    impact: 0.88,
    sentiment: -0.5,
  },
  {
    id: 'tw-event-06',
    title: 'TSMC Begins Arizona Fab Production — First Chips Off Line',
    description:
      "TSMC's $40B Arizona fabrication facility produces its first test chips, marking the beginning of advanced chip manufacturing on US soil.",
    timestamp: '2025-01-15T00:00:00Z',
    participants: ['taiwan-tsmc', 'us-govt'],
    causalPredecessors: ['tw-event-01'],
    impact: 0.8,
    sentiment: 0.5,
  },
  {
    id: 'tw-event-07',
    title: 'China Restricts Gallium and Germanium Exports — Retaliatory Move',
    description:
      'China imposes export controls on gallium, germanium, and graphite — critical materials for semiconductors — in direct retaliation for US chip restrictions.',
    timestamp: '2023-07-03T00:00:00Z',
    participants: ['china-govt', 'us-govt'],
    causalPredecessors: ['tw-event-01'],
    impact: 0.75,
    sentiment: -0.5,
  },
  {
    id: 'tw-event-08',
    title: 'Indonesia Strikes Nickel-for-Tech Deal with China and US Separately',
    description:
      'Indonesia leverages its nickel monopoly to secure both Chinese EV battery investment and US chip packaging facility commitments.',
    timestamp: '2025-03-01T00:00:00Z',
    participants: ['indonesia-position', 'china-govt', 'us-govt'],
    causalPredecessors: ['tw-event-07'],
    impact: 0.65,
    sentiment: 0.4,
  },
  {
    id: 'tw-event-09',
    title: 'China Achieves 5nm Chip Production at SMIC — Yield Questions Remain',
    description:
      'SMIC reportedly achieves limited 5nm chip production using multi-patterning DUV lithography, a remarkable engineering feat if confirmed.',
    timestamp: '2025-02-20T00:00:00Z',
    participants: ['smic', 'china-govt', 'huawei'],
    causalPredecessors: ['tw-event-02', 'tw-event-05'],
    impact: 0.92,
    sentiment: 0.7,
  },
  {
    id: 'tw-event-10',
    title: 'NVIDIA Market Cap Falls 15% on China Revenue Warning',
    description:
      'NVIDIA warns that China-related revenue will decline 40% due to tightened export controls, triggering a broad tech selloff.',
    timestamp: '2024-11-20T00:00:00Z',
    participants: ['nvidia', 'us-govt', 'china-govt'],
    causalPredecessors: ['tw-event-04'],
    impact: 0.82,
    sentiment: -0.7,
  },
];

export const techWarTensions: Tension[] = [
  {
    id: 'tw-tension-01',
    name: 'Tech Decoupling vs. Economic Interdependence',
    description:
      'The US wants to decouple from China on advanced tech while maintaining $700B+ in bilateral trade.',
    parties: ['us-govt', 'china-govt'],
    status: 'escalating',
    intensity: 0.9,
    duration: 900,
    relatedEvents: ['tw-event-01', 'tw-event-04', 'tw-event-07'],
    validFrom: '2022-10-07T00:00:00Z',
    statusHistory: [
      { status: 'simmering', timestamp: '2022-10-07T00:00:00Z' },
      { status: 'escalating', timestamp: '2023-10-17T00:00:00Z' },
    ],
  },
  {
    id: 'tw-tension-02',
    name: "NVIDIA's China Dilemma",
    description:
      'NVIDIA must choose between $10B+ China revenue and US government compliance — no middle ground left.',
    parties: ['nvidia', 'us-govt'],
    status: 'critical',
    intensity: 0.85,
    duration: 600,
    relatedEvents: ['tw-event-03', 'tw-event-04', 'tw-event-10'],
    validFrom: '2023-03-15T00:00:00Z',
    statusHistory: [
      { status: 'simmering', timestamp: '2023-03-15T00:00:00Z' },
      { status: 'escalating', timestamp: '2023-10-17T00:00:00Z' },
      { status: 'critical', timestamp: '2024-11-20T00:00:00Z' },
    ],
  },
  {
    id: 'tw-tension-03',
    name: 'Taiwan Strait Risk',
    description:
      'TSMC fabricates 90% of advanced chips on an island China claims. Any conflict would devastate the global economy.',
    parties: ['taiwan-tsmc', 'china-govt'],
    status: 'simmering',
    intensity: 0.95,
    duration: 1000,
    relatedEvents: ['tw-event-06'],
    validFrom: '2022-10-07T00:00:00Z',
    statusHistory: [{ status: 'simmering', timestamp: '2022-10-07T00:00:00Z' }],
  },
  {
    id: 'tw-tension-04',
    name: 'Critical Minerals Escalation',
    description:
      "China's rare earth and critical mineral export controls vs. Western scramble to diversify supply chains.",
    parties: ['china-govt', 'us-govt'],
    status: 'escalating',
    intensity: 0.7,
    duration: 500,
    relatedEvents: ['tw-event-07', 'tw-event-08'],
    validFrom: '2023-07-03T00:00:00Z',
    statusHistory: [
      { status: 'simmering', timestamp: '2023-07-03T00:00:00Z' },
      { status: 'escalating', timestamp: '2025-01-01T00:00:00Z' },
    ],
  },
];

export const techWarArcs: NarrativeArc[] = [
  {
    id: 'tw-arc-01',
    name: 'The Semiconductor Iron Curtain',
    description:
      'The progressive bifurcation of the global semiconductor supply chain into US-led and China-led ecosystems.',
    phase: 'rising_action',
    characters: ['us-govt', 'china-govt', 'taiwan-tsmc', 'netherlands-asml'],
    events: ['tw-event-01', 'tw-event-04', 'tw-event-05', 'tw-event-06'],
    tensions: ['tw-tension-01', 'tw-tension-03'],
    startDate: '2022-10-07T00:00:00Z',
  },
  {
    id: 'tw-arc-02',
    name: "China's Great Leap Inward",
    description:
      "China's massive effort to achieve semiconductor self-sufficiency in the face of Western sanctions.",
    phase: 'rising_action',
    characters: ['china-govt', 'huawei', 'smic'],
    events: ['tw-event-02', 'tw-event-07', 'tw-event-09'],
    tensions: ['tw-tension-01', 'tw-tension-04'],
    startDate: '2022-10-07T00:00:00Z',
  },
  {
    id: 'tw-arc-03',
    name: "Southeast Asia's Leverage Play",
    description:
      'Indonesia and ASEAN nations positioning themselves as indispensable players in both camps.',
    phase: 'setup',
    characters: ['indonesia-position'],
    events: ['tw-event-08'],
    tensions: ['tw-tension-04'],
    startDate: '2023-01-01T00:00:00Z',
  },
];
