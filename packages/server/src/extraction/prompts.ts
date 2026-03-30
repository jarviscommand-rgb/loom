// ============================================================
// LOOM — LLM Prompts for Narrative Extraction and Dream Generation
// ============================================================

export const NARRATIVE_EXTRACTION_PROMPT = `You are a narrative intelligence analyst. Your job is to read text and extract the underlying story structure — characters, events, tensions, and narrative arcs.

Analyze the provided text and extract structured narrative data.

Return a JSON object with this exact structure:
{
  "characters": [
    {
      "name": "string — full name of person/org",
      "type": "person | company | institution | group | concept",
      "motivation": "string — what drives this character",
      "capability": "string — what power/resources they have",
      "alliances": ["string — names of allied characters"],
      "description": "string — one-line character summary",
      "confidence": 0.0-1.0
    }
  ],
  "events": [
    {
      "title": "string — short event title",
      "description": "string — what happened",
      "timestamp": "string — ISO date (best estimate)",
      "participants": ["string — character names involved"],
      "causalPredecessors": ["string — titles of events that caused this"],
      "impact": 0.0-1.0,
      "sentiment": -1.0 to 1.0,
      "confidence": 0.0-1.0
    }
  ],
  "tensions": [
    {
      "name": "string — tension title",
      "description": "string — the core conflict",
      "parties": ["string — name of side A", "string — name of side B"],
      "status": "simmering | escalating | critical | resolving | resolved",
      "intensity": 0.0-1.0,
      "relatedEvents": ["string — event titles"],
      "confidence": 0.0-1.0
    }
  ],
  "arcs": [
    {
      "name": "string — arc title",
      "description": "string — the story being told",
      "phase": "setup | rising_action | climax | falling_action | resolution",
      "characters": ["string — character names"],
      "events": ["string — event titles"],
      "tensions": ["string — tension names"],
      "confidence": 0.0-1.0
    }
  ]
}

## Examples

### Input:
"In March 2024, TechCorp CEO Jane Smith announced a hostile takeover bid for rival company DataFlow. DataFlow's board, led by chairman Bob Lee, immediately rejected the offer and adopted a poison pill defense."

### Output:
{
  "characters": [
    {"name": "Jane Smith", "type": "person", "motivation": "Expand TechCorp through acquisition", "capability": "CEO authority and corporate resources", "alliances": ["TechCorp"], "description": "Aggressive CEO pursuing hostile takeover", "confidence": 0.95},
    {"name": "Bob Lee", "type": "person", "motivation": "Protect DataFlow independence", "capability": "Board chairman with defensive authority", "alliances": ["DataFlow"], "description": "Chairman leading defense against hostile bid", "confidence": 0.95},
    {"name": "TechCorp", "type": "company", "motivation": "Growth through acquisition", "capability": "Capital for hostile takeover", "alliances": ["Jane Smith"], "description": "Acquiring company in hostile bid", "confidence": 0.95},
    {"name": "DataFlow", "type": "company", "motivation": "Maintain independence", "capability": "Poison pill defense, board control", "alliances": ["Bob Lee"], "description": "Target company resisting acquisition", "confidence": 0.95}
  ],
  "events": [
    {"title": "TechCorp Hostile Takeover Bid", "description": "Jane Smith announced hostile takeover bid for DataFlow", "timestamp": "2024-03-01T00:00:00Z", "participants": ["Jane Smith", "TechCorp"], "causalPredecessors": [], "impact": 0.9, "sentiment": -0.3, "confidence": 0.9},
    {"title": "DataFlow Rejects Offer", "description": "DataFlow board rejected the hostile bid and adopted poison pill defense", "timestamp": "2024-03-01T00:00:00Z", "participants": ["Bob Lee", "DataFlow"], "causalPredecessors": ["TechCorp Hostile Takeover Bid"], "impact": 0.8, "sentiment": -0.4, "confidence": 0.9}
  ],
  "tensions": [
    {"name": "TechCorp-DataFlow Takeover Battle", "description": "Hostile acquisition attempt met with defensive measures", "parties": ["TechCorp", "DataFlow"], "status": "escalating", "intensity": 0.8, "relatedEvents": ["TechCorp Hostile Takeover Bid", "DataFlow Rejects Offer"], "confidence": 0.9}
  ],
  "arcs": [
    {"name": "The DataFlow Acquisition Saga", "description": "Corporate battle over DataFlow's future", "phase": "rising_action", "characters": ["Jane Smith", "Bob Lee", "TechCorp", "DataFlow"], "events": ["TechCorp Hostile Takeover Bid", "DataFlow Rejects Offer"], "tensions": ["TechCorp-DataFlow Takeover Battle"], "confidence": 0.85}
  ]
}

## Rules
- Extract ALL characters mentioned, even minor ones
- Order events chronologically
- Identify causal links between events — what caused what
- Tensions are UNRESOLVED conflicts between opposing parties
- Arcs are overarching story structures that contain multiple events
- Be specific with dates. If only a month/year is known, use the 1st of the month
- Impact scores: 0.1 = minor, 0.5 = moderate, 0.8 = major, 1.0 = transformative
- Sentiment: -1 = very negative, 0 = neutral, 1 = very positive
- Confidence: 0.5 = inferred/guessed, 0.8 = strongly implied, 1.0 = explicitly stated
- Each character name must be used consistently across events, tensions, and arcs
- Each event title must be used consistently across causal references and arc event lists

IMPORTANT: Return ONLY the JSON object, no markdown formatting, no code blocks.`;

export const DREAM_MODE_PROMPT = `You are a narrative futurist. Given the current state of a narrative — its characters, recent events, active tensions, and story arcs — you must imagine plausible "next chapters."

Current narrative state:
{state}

Generate plausible future scenarios (next chapters) for this narrative. Each scenario should:
1. Be grounded in the existing character motivations and tensions
2. Follow narrative logic (tensions tend toward resolution or eruption)
3. Include specific trigger events that would initiate the scenario
4. Assess probability based on narrative momentum
5. Consider character capabilities and alliances — don't have characters do things they can't
6. Account for the current arc phase — setup leads to rising action, not resolution

Return a JSON array:
[
  {
    "title": "string — chapter title",
    "narrative": "string — 2-3 paragraph narrative description",
    "probability": 0.0-1.0,
    "triggerEvents": ["string — what would need to happen"],
    "consequences": ["string — what would follow"],
    "affectedEntities": ["string — character names affected"]
  }
]

Rules:
- At least one scenario should be surprising but plausible
- At least one should follow the most obvious narrative trajectory
- Probabilities should reflect relative likelihood (they will be normalized)
- Use vivid narrative language — these are stories, not reports
- Trigger events must be specific and actionable
- Consequences should cascade logically from the scenario
- Affected entities must reference existing characters by their exact names

IMPORTANT: Return ONLY the JSON array, no markdown formatting, no code blocks.`;
