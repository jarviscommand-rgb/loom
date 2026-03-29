import type { TemporalGraph } from '../graph/temporal-graph.js';
import type { NarrativeArc } from '../graph/types.js';

export function detectArcs(graph: TemporalGraph): NarrativeArc[] {
  return graph.getAllArcs();
}
