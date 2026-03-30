import { useState } from 'react';
import type { AudiencePersona } from '../../hooks/useApi';
import { User, TrendingUp, Hash, ChevronDown, ChevronUp } from 'lucide-react';

/** Platform color mapping. */
const PLATFORM_COLORS: Record<string, string> = {
  twitter: '#1DA1F2',
  instagram: '#E4405F',
  tiktok: '#00F2EA',
  facebook: '#1877F2',
  reddit: '#FF4500',
  youtube: '#FF0000',
};

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

/** Leaning color and label. */
function getLeaningStyle(leaning: string): { color: string; label: string } {
  const map: Record<string, { color: string; label: string }> = {
    'pro-government': { color: 'text-blue-400', label: 'Pro-Gov' },
    opposition: { color: 'text-red-400', label: 'Opposition' },
    independent: { color: 'text-gray-400', label: 'Independent' },
    centrist: { color: 'text-yellow-400', label: 'Centrist' },
    progressive: { color: 'text-green-400', label: 'Progressive' },
    conservative: { color: 'text-orange-400', label: 'Conservative' },
  };
  return map[leaning] || { color: 'text-loom-muted', label: leaning };
}

interface PersonaCardProps {
  persona: AudiencePersona;
}

export default function PersonaCard({ persona }: PersonaCardProps) {
  const [expanded, setExpanded] = useState(false);
  const leaning = getLeaningStyle(persona.politicalLeaning);

  return (
    <div
      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 transition-all duration-300 hover:border-loom-accent/30 hover:bg-white/[0.07] cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-loom-accent/10 flex items-center justify-center text-lg shrink-0">
          {getPersonaEmoji(persona.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-loom-text truncate">{persona.name}</h4>
            <span className={`text-[9px] ${leaning.color} opacity-70`}>{leaning.label}</span>
          </div>
          <p className="text-[10px] text-loom-muted mt-0.5">{persona.demographics}</p>
        </div>
        <button className="text-loom-muted hover:text-loom-text transition-colors">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Platform Activity */}
      <div className="flex gap-1.5 mt-3">
        {persona.platforms.map((platform) => (
          <div
            key={platform.name}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px]"
            style={{
              backgroundColor: `${PLATFORM_COLORS[platform.name.toLowerCase()] || '#64748b'}15`,
              color: PLATFORM_COLORS[platform.name.toLowerCase()] || '#64748b',
            }}
          >
            <div
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: PLATFORM_COLORS[platform.name.toLowerCase()] || '#64748b' }}
            />
            {platform.name}
            <span className="opacity-70">{platform.activityLevel}</span>
          </div>
        ))}
      </div>

      {/* Key Interests */}
      <div className="flex flex-wrap gap-1 mt-2">
        {persona.interests.slice(0, expanded ? undefined : 3).map((interest) => (
          <span
            key={interest}
            className="flex items-center gap-0.5 px-1.5 py-0.5 bg-loom-bg/50 rounded text-[9px] text-loom-muted"
          >
            <Hash size={8} />
            {interest}
          </span>
        ))}
        {!expanded && persona.interests.length > 3 && (
          <span className="text-[9px] text-loom-muted opacity-60 px-1">
            +{persona.interests.length - 3}
          </span>
        )}
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-2 animate-in fade-in duration-200">
          {/* Predicted Reaction */}
          <div className="flex items-start gap-2">
            <TrendingUp size={12} className="text-loom-accent mt-0.5 shrink-0" />
            <div>
              <span className="text-[10px] text-loom-muted uppercase tracking-wider">
                Predicted Reaction
              </span>
              <p className="text-xs text-loom-text mt-0.5">{persona.predictedReaction}</p>
            </div>
          </div>

          {/* Reach */}
          <div className="flex items-center gap-2">
            <User size={12} className="text-loom-calm shrink-0" />
            <span className="text-[10px] text-loom-muted">Estimated reach:</span>
            <span className="text-xs text-loom-text font-mono">
              {persona.estimatedReach.toLocaleString()}
            </span>
          </div>

          {/* Engagement Quality */}
          <div className="flex items-center gap-2">
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
            <span className="text-[9px] text-loom-muted font-mono">
              {(persona.engagementQuality * 100).toFixed(0)}% quality
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
