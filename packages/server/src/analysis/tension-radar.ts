import type { TemporalGraph } from '../graph/temporal-graph.js';
import type { PressurePoint } from '../graph/types.js';

export function scanTensions(graph: TemporalGraph): PressurePoint[] {
  return graph.computePressurePoints();
}
