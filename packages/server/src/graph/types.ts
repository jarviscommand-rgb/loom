export type EntityType = 'person' | 'company' | 'institution' | 'group' | 'concept';
export type ArcPhase = 'setup' | 'rising_action' | 'climax' | 'falling_action' | 'resolution';
export type TensionStatus = 'simmering' | 'escalating' | 'critical' | 'resolving' | 'resolved';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  motivation: string;
  capability: string;
  alliances: string[];
  description: string;
  firstSeen: string; // ISO date
  lastSeen: string;
}

export interface NarrativeEvent {
  id: string;
  title: string;
  description: string;
  timestamp: string; // ISO date
  participants: string[]; // entity IDs
  causalPredecessors: string[]; // event IDs
  impact: number; // 0-1
  sentiment: number; // -1 to 1
}

export interface Tension {
  id: string;
  name: string;
  description: string;
  parties: [string, string]; // entity IDs on opposing sides
  status: TensionStatus;
  intensity: number; // 0-1
  duration: number; // days
  relatedEvents: string[]; // event IDs
  validFrom: string;
  validTo?: string;
}

export interface NarrativeArc {
  id: string;
  name: string;
  description: string;
  phase: ArcPhase;
  characters: string[]; // entity IDs
  events: string[]; // event IDs
  tensions: string[]; // tension IDs
  startDate: string;
  endDate?: string;
}

export interface DreamBranch {
  id: string;
  title: string;
  narrative: string;
  probability: number; // 0-1
  triggerEvents: string[];
  consequences: string[];
  affectedEntities: string[];
}

export interface PressurePoint {
  tensionId: string;
  tensionName: string;
  score: number;
  factors: {
    duration: number;
    escalation: number;
    convergence: number;
  };
  narrative: string;
}

export interface GraphSnapshot {
  entities: Entity[];
  events: NarrativeEvent[];
  tensions: Tension[];
  arcs: NarrativeArc[];
  timestamp: string;
}
