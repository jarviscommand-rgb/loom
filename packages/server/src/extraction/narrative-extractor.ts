import OpenAI from 'openai';
import { v4 as uuid } from 'uuid';
import type { Entity, NarrativeEvent, Tension, NarrativeArc } from '../graph/types.js';
import { TemporalGraph } from '../graph/temporal-graph.js';
import { NARRATIVE_EXTRACTION_PROMPT } from './prompts.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface RawExtraction {
  characters: Array<{
    name: string;
    type: string;
    motivation: string;
    capability: string;
    alliances: string[];
    description: string;
  }>;
  events: Array<{
    title: string;
    description: string;
    timestamp: string;
    participants: string[];
    causalPredecessors: string[];
    impact: number;
    sentiment: number;
  }>;
  tensions: Array<{
    name: string;
    description: string;
    parties: [string, string];
    status: string;
    intensity: number;
    relatedEvents: string[];
  }>;
  arcs: Array<{
    name: string;
    description: string;
    phase: string;
    characters: string[];
    events: string[];
    tensions: string[];
  }>;
}

export async function extractNarrative(
  text: string,
  graph: TemporalGraph
): Promise<{ entities: Entity[]; events: NarrativeEvent[]; tensions: Tension[]; arcs: NarrativeArc[] }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: NARRATIVE_EXTRACTION_PROMPT },
      { role: 'user', content: text },
    ],
    temperature: 0.3,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from LLM');

  let raw: RawExtraction;
  try {
    raw = JSON.parse(content);
  } catch {
    // Try to extract JSON from possible markdown code blocks
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      raw = JSON.parse(match[1]);
    } else {
      throw new Error('Failed to parse LLM response as JSON');
    }
  }

  // Build name -> ID maps
  const nameToEntityId = new Map<string, string>();
  const titleToEventId = new Map<string, string>();
  const nameToTensionId = new Map<string, string>();

  // Process entities
  const entities: Entity[] = raw.characters.map((c) => {
    const existing = graph.findEntityByName(c.name);
    const id = existing?.id || uuid();
    nameToEntityId.set(c.name, id);
    return graph.addEntity({
      id,
      name: c.name,
      type: c.type as Entity['type'],
      motivation: c.motivation,
      capability: c.capability,
      alliances: c.alliances.map((a) => nameToEntityId.get(a) || a),
      description: c.description,
      firstSeen: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    });
  });

  // Re-resolve alliances now that all entities have IDs
  for (const entity of entities) {
    entity.alliances = entity.alliances.map((a) => nameToEntityId.get(a) || a);
  }

  // Process events
  const events: NarrativeEvent[] = raw.events.map((e) => {
    const id = uuid();
    titleToEventId.set(e.title, id);
    return graph.addEvent({
      id,
      title: e.title,
      description: e.description,
      timestamp: e.timestamp,
      participants: e.participants.map((p) => nameToEntityId.get(p) || p),
      causalPredecessors: e.causalPredecessors.map((p) => titleToEventId.get(p) || p),
      impact: e.impact,
      sentiment: e.sentiment,
    });
  });

  // Resolve causal predecessors now that all events have IDs
  for (const event of events) {
    event.causalPredecessors = event.causalPredecessors.map(
      (p) => titleToEventId.get(p) || p
    );
  }

  // Process tensions
  const tensions: Tension[] = raw.tensions.map((t) => {
    const id = uuid();
    nameToTensionId.set(t.name, id);

    const firstEvent = t.relatedEvents[0];
    const firstEventObj = firstEvent ? raw.events.find((e) => e.title === firstEvent) : undefined;
    const lastEvent = t.relatedEvents[t.relatedEvents.length - 1];
    const lastEventObj = lastEvent ? raw.events.find((e) => e.title === lastEvent) : undefined;

    const validFrom = firstEventObj?.timestamp || new Date().toISOString();
    const duration = firstEventObj && lastEventObj
      ? Math.max(
          1,
          Math.round(
            (new Date(lastEventObj.timestamp).getTime() -
              new Date(firstEventObj.timestamp).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 1;

    return graph.addTension({
      id,
      name: t.name,
      description: t.description,
      parties: [
        nameToEntityId.get(t.parties[0]) || t.parties[0],
        nameToEntityId.get(t.parties[1]) || t.parties[1],
      ],
      status: t.status as Tension['status'],
      intensity: t.intensity,
      duration,
      relatedEvents: t.relatedEvents.map((e) => titleToEventId.get(e) || e),
      validFrom,
      validTo: t.status === 'resolved' ? lastEventObj?.timestamp : undefined,
    });
  });

  // Process arcs
  const arcs: NarrativeArc[] = raw.arcs.map((a) => {
    const arcEvents = a.events.map((e) => titleToEventId.get(e) || e);
    const firstEventTitle = a.events[0];
    const firstEvent = firstEventTitle ? raw.events.find((e) => e.title === firstEventTitle) : undefined;

    return graph.addArc({
      id: uuid(),
      name: a.name,
      description: a.description,
      phase: a.phase as NarrativeArc['phase'],
      characters: a.characters.map((c) => nameToEntityId.get(c) || c),
      events: arcEvents,
      tensions: a.tensions.map((t) => nameToTensionId.get(t) || t),
      startDate: firstEvent?.timestamp || new Date().toISOString(),
    });
  });

  return { entities, events, tensions, arcs };
}
