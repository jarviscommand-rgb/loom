import { useState } from 'react';
import type { AudiencePersona } from '../../hooks/useApi';
import { Grid3X3, ChevronDown, ChevronUp, User, TrendingUp, Hash } from 'lucide-react';

/** Narrative types for the matrix columns. */
const NARRATIVE_TYPES = [
  'Political Reform',
  'Economic Policy',
  'Social Justice',
  'Infrastructure',
  'Corruption',
  'Technology',
];

/** Reaction emoji + score based on persona traits. */
function getReaction(
  persona: AudiencePersona,
  narrative: string
): { emoji: string; score: number } {
  const typeHash = persona.type.length + narrative.length;
  const leaningFactor =
    persona.politicalLeaning === 'opposition'
      ? -0.3
      : persona.politicalLeaning === 'pro-government'
        ? 0.3
        : 0;

  const baseScore = ((typeHash * 17 + persona.name.length * 7) % 100) / 100;
  const score = Math.max(0, Math.min(1, baseScore + leaningFactor));

  const emojis =
    score > 0.8
      ? '\uD83D\uDD25'
      : score > 0.6
        ? '\uD83D\uDC4D'
        : score > 0.4
          ? '\uD83E\uDD14'
          : score > 0.2
            ? '\uD83D\uDE10'
            : '\uD83D\uDC4E';

  return { emoji: emojis, score };
}

/** Avatar emoji based on persona type. */
function getPersonaEmoji(type: string): string {
  const map: Record<string, string> = {
    activist: '\u270A',
    analyst: '\uD83D\uDCCA',
    consumer: '\uD83D\uDED2',
    journalist: '\uD83D\uDCF0',
    influencer: '\u2B50',
    policymaker: '\uD83C\uDFDB\uFE0F',
    youth: '\uD83C\uDF93',
    business: '\uD83D\uDCBC',
    diaspora: '\uD83C\uDF0D',
    rural: '\uD83C\uDF3E',
    religious: '\uD83D\uDD4C',
    military: '\uD83C\uDF96\uFE0F',
  };
  return map[type.toLowerCase()] || '\uD83D\uDC64';
}

/** Leaning color. */
function getLeaningColor(leaning: string): string {
  const map: Record<string, string> = {
    'pro-government': 'text-blue-400',
    opposition: 'text-red-400',
    independent: 'text-gray-400',
    centrist: 'text-yellow-400',
    progressive: 'text-green-400',
    conservative: 'text-orange-400',
  };
  return map[leaning] || 'text-loom-muted';
}

/** Engagement score to green intensity. */
function scoreColor(score: number): string {
  if (score > 0.8) return 'rgba(34, 197, 94, 0.6)';
  if (score > 0.6) return 'rgba(34, 197, 94, 0.4)';
  if (score > 0.4) return 'rgba(234, 179, 8, 0.35)';
  if (score > 0.2) return 'rgba(249, 115, 22, 0.3)';
  return 'rgba(239, 68, 68, 0.25)';
}

interface PersonaMatrixProps {
  personas: AudiencePersona[];
}

export default function PersonaMatrix({ personas }: PersonaMatrixProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (personas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <Grid3X3 size={20} className="text-purple-400/50" />
        </div>
        <p className="text-loom-muted text-sm font-serif italic">No persona data available</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Column headers */}
      <div className="flex items-end mb-1 ml-48">
        {NARRATIVE_TYPES.map((type) => (
          <div
            key={type}
            className="w-20 text-[9px] text-loom-muted text-center px-1 truncate"
            title={type}
          >
            {type}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div className="space-y-0.5">
        {personas.map((persona) => {
          const isExpanded = expandedId === persona.id;

          return (
            <div key={persona.id}>
              {/* Matrix row */}
              <div
                className={`flex items-center rounded-lg transition-all duration-200 hover:bg-white/[0.03] cursor-pointer ${
                  isExpanded ? 'bg-white/[0.05] border border-loom-accent/20' : ''
                }`}
                onClick={() => setExpandedId(isExpanded ? null : persona.id)}
              >
                {/* Persona label */}
                <div className="w-48 flex items-center gap-2 px-3 py-2 shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-loom-accent/10 flex items-center justify-center text-sm shrink-0">
                    {getPersonaEmoji(persona.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium text-loom-text truncate">
                      {persona.name}
                    </p>
                    <p className={`text-[9px] ${getLeaningColor(persona.politicalLeaning)}`}>
                      {persona.politicalLeaning}
                    </p>
                  </div>
                  <button className="text-loom-muted shrink-0">
                    {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>

                {/* Reaction cells */}
                {NARRATIVE_TYPES.map((narrative) => {
                  const { emoji, score } = getReaction(persona, narrative);
                  return (
                    <div
                      key={narrative}
                      className="w-20 h-10 flex items-center justify-center rounded-sm mx-px transition-all duration-150 hover:scale-110 hover:z-10"
                      style={{ backgroundColor: scoreColor(score) }}
                      title={`${persona.name} × ${narrative}: ${(score * 100).toFixed(0)}%`}
                    >
                      <span className="text-sm mr-0.5">{emoji}</span>
                      <span className="text-[9px] font-mono text-white/70">
                        {(score * 100).toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Expanded persona profile */}
              {isExpanded && (
                <div className="ml-48 mr-4 mb-2 mt-1 p-3 bg-white/[0.03] rounded-lg border border-white/5 animate-in fade-in duration-200 space-y-2">
                  <div className="flex items-start gap-2">
                    <User size={12} className="text-loom-calm mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-loom-muted uppercase tracking-wider">
                        Demographics
                      </span>
                      <p className="text-xs text-loom-text">{persona.demographics}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <TrendingUp size={12} className="text-loom-accent mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[10px] text-loom-muted uppercase tracking-wider">
                        Predicted Reaction
                      </span>
                      <p className="text-xs text-loom-text">{persona.predictedReaction}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[9px] text-loom-muted">Reach</span>
                      <p className="text-xs font-mono text-loom-text">
                        {persona.estimatedReach.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] text-loom-muted">Engagement</span>
                      <p className="text-xs font-mono text-loom-accent">
                        {(persona.engagementRate * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="flex-1">
                      <span className="text-[9px] text-loom-muted">Quality</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex-1 h-1.5 bg-loom-bg/50 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${persona.engagementQuality * 100}%`,
                              backgroundColor:
                                persona.engagementQuality > 0.7
                                  ? '#22c55e'
                                  : persona.engagementQuality > 0.4
                                    ? '#f97316'
                                    : '#ef4444',
                            }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-loom-muted">
                          {(persona.engagementQuality * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 pt-1 border-t border-white/5">
                    {persona.interests.map((interest) => (
                      <span
                        key={interest}
                        className="flex items-center gap-0.5 px-1.5 py-0.5 bg-loom-bg/50 rounded text-[9px] text-loom-muted"
                      >
                        <Hash size={8} />
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 px-2">
        <span className="text-[9px] text-loom-muted">Engagement:</span>
        {[
          { label: 'High', color: 'rgba(34, 197, 94, 0.6)' },
          { label: 'Good', color: 'rgba(34, 197, 94, 0.4)' },
          { label: 'Moderate', color: 'rgba(234, 179, 8, 0.35)' },
          { label: 'Low', color: 'rgba(249, 115, 22, 0.3)' },
          { label: 'Minimal', color: 'rgba(239, 68, 68, 0.25)' },
        ].map((item) => (
          <span key={item.label} className="flex items-center gap-1 text-[9px] text-loom-muted">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
