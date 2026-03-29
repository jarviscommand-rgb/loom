import OpenAI from 'openai';
import { v4 as uuid } from 'uuid';
import type { TemporalGraph } from '../graph/temporal-graph.js';
import type { DreamBranch } from '../graph/types.js';
import { DREAM_MODE_PROMPT } from '../extraction/prompts.js';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateDreams(graph: TemporalGraph): Promise<DreamBranch[]> {
  const snapshot = graph.getSnapshot();

  const stateDescription = JSON.stringify(
    {
      characters: snapshot.entities.map((e) => ({
        name: e.name,
        type: e.type,
        motivation: e.motivation,
        alliances: e.alliances,
      })),
      recentEvents: snapshot.events.slice(-10).map((e) => ({
        title: e.title,
        description: e.description,
        timestamp: e.timestamp,
      })),
      activeTensions: snapshot.tensions
        .filter((t) => t.status !== 'resolved')
        .map((t) => ({
          name: t.name,
          description: t.description,
          status: t.status,
          intensity: t.intensity,
        })),
      arcs: snapshot.arcs.map((a) => ({
        name: a.name,
        phase: a.phase,
        description: a.description,
      })),
    },
    null,
    2
  );

  const prompt = DREAM_MODE_PROMPT.replace('{state}', stateDescription);

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: prompt },
      {
        role: 'user',
        content: 'Generate the next possible chapters for this narrative.',
      },
    ],
    temperature: 0.8,
    max_tokens: 4096,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No response from LLM');

  let rawBranches: Array<{
    title: string;
    narrative: string;
    probability: number;
    triggerEvents: string[];
    consequences: string[];
    affectedEntities: string[];
  }>;

  try {
    rawBranches = JSON.parse(content);
  } catch {
    const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) {
      rawBranches = JSON.parse(match[1]);
    } else {
      throw new Error('Failed to parse dream response as JSON');
    }
  }

  return rawBranches.map((b) => ({
    id: uuid(),
    title: b.title,
    narrative: b.narrative,
    probability: b.probability,
    triggerEvents: b.triggerEvents,
    consequences: b.consequences,
    affectedEntities: b.affectedEntities,
  }));
}
