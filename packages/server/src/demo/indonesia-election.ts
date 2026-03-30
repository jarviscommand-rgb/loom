// LOOM — Demo: Indonesian Minister's Controversial Statement
// A minister's viral gaffe about "lazy workers," the social media firestorm, and political fallout.

import type { Entity, NarrativeEvent, Tension, NarrativeArc } from '../graph/types.js';

/** Key actors in the Indonesian labor reform controversy */
export const electionEntities: Entity[] = [
  {
    id: 'minister-eko-prasetyo', name: 'Minister Eko Prasetyo', type: 'person',
    motivation: 'Push through labor reform to attract foreign investment, consolidate political legacy',
    capability: 'Cabinet-level authority, media access, direct line to the President, labor policy power',
    alliances: ['kadin-chamber', 'foreign-investor-coalition'],
    description: 'Manpower Minister whose off-script remark about "lazy workers" ignited a nationwide firestorm.',
    firstSeen: '2024-03-01T00:00:00Z', lastSeen: '2024-03-28T00:00:00Z',
  },
  {
    id: 'kspi-workers-union', name: 'Indonesian Workers Union (KSPI)', type: 'group',
    motivation: 'Protect labor rights, block deregulation that weakens worker protections',
    capability: '2M+ members across industrial zones, nationwide strike capability, protest logistics',
    alliances: ['student-movement-alliance', 'social-media-activists'],
    description: 'Largest independent trade union federation in Indonesia, leading organized opposition.',
    firstSeen: '2024-03-01T00:00:00Z', lastSeen: '2024-03-28T00:00:00Z',
  },
  {
    id: 'kadin-chamber', name: 'Indonesian Chamber of Commerce (KADIN)', type: 'institution',
    motivation: 'Liberalize labor markets, reduce hiring friction, boost regional competitiveness',
    capability: 'Cabinet lobbyist access, employer coordination, media budget for pro-reform campaigns',
    alliances: ['minister-eko-prasetyo', 'foreign-investor-coalition'],
    description: 'National business lobby backing reform while distancing from the minister\'s rhetoric.',
    firstSeen: '2024-03-01T00:00:00Z', lastSeen: '2024-03-28T00:00:00Z',
  },
  {
    id: 'presidents-office', name: "President's Office", type: 'institution',
    motivation: 'Maintain political stability, protect reform agenda without losing popular support',
    capability: 'Executive authority, cabinet reshuffle power, state media influence, security apparatus',
    alliances: ['kadin-chamber'],
    description: 'The Istana trying to contain fallout while salvaging the labor reform policy.',
    firstSeen: '2024-03-03T00:00:00Z', lastSeen: '2024-03-28T00:00:00Z',
  },
  {
    id: 'social-media-activists', name: 'Social Media Activists', type: 'group',
    motivation: 'Amplify worker voices, hold elites accountable via viral content and hashtags',
    capability: 'Millions of followers across TikTok/X/Instagram, meme creation speed, hashtag coordination',
    alliances: ['kspi-workers-union', 'student-movement-alliance'],
    description: 'Decentralized digital organizers who turned a press conference clip into a national crisis.',
    firstSeen: '2024-03-02T00:00:00Z', lastSeen: '2024-03-28T00:00:00Z',
  },
  {
    id: 'mainstream-media', name: 'Indonesian Mainstream Media', type: 'group',
    motivation: 'Drive viewership with the controversy while maintaining government source access',
    capability: 'TV networks reaching 200M+ viewers, editorial framing power, panel show influence',
    alliances: [],
    description: 'Legacy media that reframed the crisis as a "generational divide" instead of labor rights.',
    firstSeen: '2024-03-02T00:00:00Z', lastSeen: '2024-03-28T00:00:00Z',
  },
  {
    id: 'student-movement-alliance', name: 'Student Movement Alliance', type: 'group',
    motivation: 'Fight for social justice, channel youth frustration at economic inequality',
    capability: 'Campus mobilization at 50+ universities, protest experience, strong social media presence',
    alliances: ['kspi-workers-union', 'social-media-activists'],
    description: 'Coalition of university student organizations that brought tens of thousands to the streets.',
    firstSeen: '2024-03-05T00:00:00Z', lastSeen: '2024-03-28T00:00:00Z',
  },
  {
    id: 'foreign-investor-coalition', name: 'Foreign Investor Coalition', type: 'group',
    motivation: 'Ensure regulatory predictability, protect capital in Indonesian manufacturing and tech',
    capability: '$30B+ in active investments, embassy channels, sovereign rating influence',
    alliances: ['kadin-chamber', 'minister-eko-prasetyo'],
    description: 'International funds and multinationals watching the crisis as a political risk signal.',
    firstSeen: '2024-03-06T00:00:00Z', lastSeen: '2024-03-28T00:00:00Z',
  },
  {
    id: 'opposition-party-coalition', name: 'Opposition Party Coalition', type: 'group',
    motivation: 'Weaken the ruling coalition, champion workers, force political concessions',
    capability: 'Parliamentary seats, media platforms, ability to call interpellation hearings',
    alliances: ['kspi-workers-union'],
    description: 'Opposition bloc seizing on the crisis to demand accountability and score political points.',
    firstSeen: '2024-03-04T00:00:00Z', lastSeen: '2024-03-28T00:00:00Z',
  },
];

/** Causal chain of events from the minister's gaffe to cabinet reshuffle */
export const electionEvents: NarrativeEvent[] = [
  {
    id: 'ie-event-01', title: 'Minister Calls Workers "Lazy" at Reform Press Conference',
    description: 'Minister Eko Prasetyo says workers "need to stop being lazy and start competing globally" during a labor reform unveiling.',
    timestamp: '2024-03-02T10:00:00Z', participants: ['minister-eko-prasetyo', 'kadin-chamber'],
    causalPredecessors: [], impact: 0.92, sentiment: -0.7,
  },
  {
    id: 'ie-event-02', title: 'Video Goes Viral — #MenteriMalas Trends Nationwide',
    description: 'A 15-second clip explodes on TikTok and X. Within 6 hours, #MenteriMalas is the top trending hashtag with 2M+ posts.',
    timestamp: '2024-03-02T18:00:00Z', participants: ['social-media-activists', 'minister-eko-prasetyo'],
    causalPredecessors: ['ie-event-01'], impact: 0.95, sentiment: -0.8,
  },
  {
    id: 'ie-event-03', title: 'Workers Union Demands Immediate Public Apology',
    description: 'KSPI demands the minister apologize within 48 hours or face industrial action across Java and Sumatra.',
    timestamp: '2024-03-03T09:00:00Z', participants: ['kspi-workers-union', 'minister-eko-prasetyo'],
    causalPredecessors: ['ie-event-02'], impact: 0.78, sentiment: -0.6,
  },
  {
    id: 'ie-event-04', title: 'Influencer War Splits Public Opinion Along Class Lines',
    description: 'Pro-business influencers defend the minister as "telling hard truths." Labor creators post 12-hour factory shift videos.',
    timestamp: '2024-03-04T12:00:00Z', participants: ['social-media-activists', 'kadin-chamber'],
    causalPredecessors: ['ie-event-02', 'ie-event-03'], impact: 0.7, sentiment: -0.2,
  },
  {
    id: 'ie-event-05', title: 'Student Protests Erupt at UI, UGM, ITB, and Unair',
    description: 'Thousands march at top universities. Signs read "We\'re not lazy — we\'re underpaid." Clashes at UI gates make international headlines.',
    timestamp: '2024-03-06T14:00:00Z', participants: ['student-movement-alliance', 'social-media-activists'],
    causalPredecessors: ['ie-event-02', 'ie-event-04'], impact: 0.88, sentiment: -0.7,
  },
  {
    id: 'ie-event-06', title: "President's Office Issues Measured Response",
    description: 'The Istana says the president "values all workers" and calls for "constructive dialogue" — stopping short of defending the minister.',
    timestamp: '2024-03-07T11:00:00Z', participants: ['presidents-office', 'minister-eko-prasetyo'],
    causalPredecessors: ['ie-event-05', 'ie-event-03'], impact: 0.72, sentiment: 0.1,
  },
  {
    id: 'ie-event-07', title: "Opposition Calls for Minister's Resignation",
    description: 'The opposition files a formal interpellation request in the DPR, calling the remarks "an insult to 130 million workers."',
    timestamp: '2024-03-08T10:00:00Z', participants: ['opposition-party-coalition', 'minister-eko-prasetyo'],
    causalPredecessors: ['ie-event-05', 'ie-event-06'], impact: 0.75, sentiment: -0.5,
  },
  {
    id: 'ie-event-08', title: 'Foreign Investors Flag Rising Political Risk',
    description: 'JP Morgan and Nomura flag "rising political risk." The rupiah weakens 1.2% and Jakarta Composite dips 3%.',
    timestamp: '2024-03-10T08:00:00Z', participants: ['foreign-investor-coalition', 'kadin-chamber'],
    causalPredecessors: ['ie-event-05', 'ie-event-07'], impact: 0.8, sentiment: -0.6,
  },
  {
    id: 'ie-event-09', title: 'Minister Issues Partial Apology — "Taken Out of Context"',
    description: 'Eko Prasetyo says his words were "taken out of context" with "utmost respect for workers." Critics call it tone-deaf.',
    timestamp: '2024-03-12T15:00:00Z', participants: ['minister-eko-prasetyo', 'social-media-activists'],
    causalPredecessors: ['ie-event-06', 'ie-event-08'], impact: 0.65, sentiment: -0.3,
  },
  {
    id: 'ie-event-10', title: 'Mainstream Media Reframes Crisis as "Generational Divide"',
    description: 'TV panels shift the narrative from labor rights to a "Gen Z vs. Boomer" culture war, diluting the economic substance.',
    timestamp: '2024-03-14T20:00:00Z', participants: ['mainstream-media', 'social-media-activists'],
    causalPredecessors: ['ie-event-09', 'ie-event-04'], impact: 0.6, sentiment: -0.1,
  },
  {
    id: 'ie-event-11', title: 'Workers Union Announces Nationwide Strike Threat',
    description: 'KSPI announces a 3-day strike for March 25 unless the reform bill is suspended. Tangerang garment factories begin shutdowns.',
    timestamp: '2024-03-18T09:00:00Z', participants: ['kspi-workers-union', 'kadin-chamber', 'presidents-office'],
    causalPredecessors: ['ie-event-09', 'ie-event-08'], impact: 0.9, sentiment: -0.7,
  },
  {
    id: 'ie-event-12', title: 'President Reshuffles Cabinet — Minister Reassigned',
    description: 'The president moves Eko Prasetyo to a powerless advisory role and appoints a labor-friendly technocrat. Strike is called off.',
    timestamp: '2024-03-24T19:00:00Z', participants: ['presidents-office', 'minister-eko-prasetyo', 'kspi-workers-union'],
    causalPredecessors: ['ie-event-11', 'ie-event-07', 'ie-event-08'], impact: 0.95, sentiment: 0.4,
  },
];

/** Core tensions driving the Indonesian labor reform crisis */
export const electionTensions: Tension[] = [
  {
    id: 'ie-tension-01', name: 'Labor vs. Capital',
    description: 'Workers fight to preserve protections while business demands flexibility to compete regionally.',
    parties: ['kspi-workers-union', 'kadin-chamber'], status: 'critical', intensity: 0.9, duration: 26,
    relatedEvents: ['ie-event-01', 'ie-event-03', 'ie-event-11', 'ie-event-12'],
    validFrom: '2024-03-02T00:00:00Z',
  },
  {
    id: 'ie-tension-02', name: 'Government Credibility Crisis',
    description: 'A single viral clip shattered public trust, forcing the Istana into damage-control mode.',
    parties: ['minister-eko-prasetyo', 'social-media-activists'], status: 'resolving', intensity: 0.85, duration: 22,
    relatedEvents: ['ie-event-02', 'ie-event-06', 'ie-event-09', 'ie-event-12'],
    validFrom: '2024-03-02T00:00:00Z',
  },
  {
    id: 'ie-tension-03', name: 'Political Opportunism',
    description: 'Opposition exploits the crisis to weaken the ruling coalition — advocacy or power play?',
    parties: ['opposition-party-coalition', 'presidents-office'], status: 'escalating', intensity: 0.7, duration: 20,
    relatedEvents: ['ie-event-07', 'ie-event-12'],
    validFrom: '2024-03-08T00:00:00Z',
  },
  {
    id: 'ie-tension-04', name: 'Investor Confidence vs. Social Stability',
    description: 'Foreign capital demands predictable reform; the streets demand justice. Indonesia cannot satisfy both.',
    parties: ['foreign-investor-coalition', 'kspi-workers-union'], status: 'escalating', intensity: 0.78, duration: 18,
    relatedEvents: ['ie-event-08', 'ie-event-11', 'ie-event-12'],
    validFrom: '2024-03-10T00:00:00Z',
  },
  {
    id: 'ie-tension-05', name: 'Generational Digital Divide',
    description: 'Young digital natives control the social media narrative while legacy media reframes for older audiences.',
    parties: ['student-movement-alliance', 'mainstream-media'], status: 'simmering', intensity: 0.6, duration: 12,
    relatedEvents: ['ie-event-05', 'ie-event-10'],
    validFrom: '2024-03-06T00:00:00Z',
  },
];

/** Narrative arcs spanning the Indonesian labor reform crisis */
export const electionArcs: NarrativeArc[] = [
  {
    id: 'ie-arc-01', name: "The Minister's Fall",
    description: 'A minister destroys his career in 15 seconds of unscripted arrogance — press conference to cabinet exile.',
    phase: 'rising_action',
    characters: ['minister-eko-prasetyo', 'presidents-office', 'opposition-party-coalition'],
    events: ['ie-event-01', 'ie-event-06', 'ie-event-09', 'ie-event-12'],
    tensions: ['ie-tension-02', 'ie-tension-03'], startDate: '2024-03-02T00:00:00Z',
  },
  {
    id: 'ie-arc-02', name: 'Digital Street vs. Marble Hall',
    description: 'Social media activists and students outmaneuver traditional power, proving viral truth outruns official spin.',
    phase: 'climax',
    characters: ['social-media-activists', 'student-movement-alliance', 'mainstream-media'],
    events: ['ie-event-02', 'ie-event-04', 'ie-event-05', 'ie-event-10'],
    tensions: ['ie-tension-02', 'ie-tension-05'], startDate: '2024-03-02T00:00:00Z',
  },
  {
    id: 'ie-arc-03', name: "Indonesia's Labor Reckoning",
    description: 'Can Indonesia modernize its economy without sacrificing the workers who built it?',
    phase: 'rising_action',
    characters: ['kspi-workers-union', 'kadin-chamber', 'foreign-investor-coalition', 'presidents-office'],
    events: ['ie-event-01', 'ie-event-03', 'ie-event-08', 'ie-event-11', 'ie-event-12'],
    tensions: ['ie-tension-01', 'ie-tension-04'], startDate: '2024-03-02T00:00:00Z',
  },
];
