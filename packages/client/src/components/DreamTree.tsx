import { useState, useEffect } from 'react';
import { api, type DreamBranch } from '../hooks/useApi';
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface DreamTreeProps {
  hasData: boolean;
}

/** Animated branching tree SVG visualization */
function BranchTree({ dreams }: { dreams: DreamBranch[] }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const width = 280;
  const height = Math.max(120, dreams.length * 50 + 40);
  const trunkX = 40;
  const trunkTop = 20;
  const trunkBottom = height - 20;

  return (
    <svg width={width} height={height} className="mx-auto mb-3">
      {/* Trunk */}
      <line
        x1={trunkX}
        y1={trunkTop}
        x2={trunkX}
        y2={trunkBottom}
        stroke="#8b5cf6"
        strokeWidth="2"
        strokeOpacity={visible ? 0.6 : 0}
        style={{ transition: 'stroke-opacity 0.5s ease' }}
      />

      {/* Root glow */}
      <circle
        cx={trunkX}
        cy={trunkTop}
        r={4}
        fill="#8b5cf6"
        opacity={visible ? 0.8 : 0}
        style={{ transition: 'opacity 0.5s ease 0.2s' }}
      >
        <animate attributeName="r" values="4;6;4" dur="3s" repeatCount="indefinite" />
      </circle>

      {/* Branches */}
      {dreams.map((dream, i) => {
        const y = trunkTop + ((i + 1) / (dreams.length + 1)) * (trunkBottom - trunkTop);
        const branchLen = 80 + dream.probability * 120;
        const color =
          dream.probability > 0.4 ? '#22c55e' : dream.probability > 0.2 ? '#eab308' : '#64748b';
        const delay = 0.3 + i * 0.15;

        return (
          <g key={dream.id}>
            {/* Branch line */}
            <path
              d={`M${trunkX},${y} Q${trunkX + branchLen * 0.4},${y - 8} ${trunkX + branchLen},${y}`}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              strokeOpacity={visible ? 0.5 : 0}
              style={{ transition: `stroke-opacity 0.5s ease ${delay}s` }}
            />

            {/* Branch endpoint */}
            <circle
              cx={trunkX + branchLen}
              cy={y}
              r={3 + dream.probability * 4}
              fill={color}
              opacity={visible ? 0.7 : 0}
              style={{ transition: `opacity 0.5s ease ${delay + 0.1}s` }}
            >
              {dream.probability > 0.4 && (
                <animate
                  attributeName="opacity"
                  values="0.7;1;0.7"
                  dur="2s"
                  repeatCount="indefinite"
                />
              )}
            </circle>

            {/* Branch glow */}
            <circle
              cx={trunkX + branchLen}
              cy={y}
              r={6 + dream.probability * 6}
              fill={color}
              opacity={visible ? 0.1 : 0}
              style={{ transition: `opacity 0.5s ease ${delay + 0.1}s` }}
            />

            {/* Label */}
            <text
              x={trunkX + branchLen + 10}
              y={y + 3}
              fill="#e2e8f0"
              fontSize="9"
              fontFamily="Crimson Pro, serif"
              opacity={visible ? 0.7 : 0}
              style={{ transition: `opacity 0.5s ease ${delay + 0.2}s` }}
            >
              {dream.title.length > 20 ? dream.title.slice(0, 20) + '...' : dream.title}
            </text>

            {/* Probability label */}
            <text
              x={trunkX + branchLen + 10}
              y={y + 14}
              fill={color}
              fontSize="8"
              fontFamily="JetBrains Mono, monospace"
              opacity={visible ? 0.5 : 0}
              style={{ transition: `opacity 0.5s ease ${delay + 0.2}s` }}
            >
              {(dream.probability * 100).toFixed(0)}%
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Dreaming/thinking loading animation */
function DreamingAnimation() {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <div className="relative w-16 h-16">
        {/* Orbiting particles */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-loom-accent"
            style={{
              animation: `orbit ${2 + i * 0.5}s linear infinite`,
              animationDelay: `${i * 0.3}s`,
              top: '50%',
              left: '50%',
              opacity: 0.6 - i * 0.15,
            }}
          />
        ))}
        {/* Center glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 rounded-full bg-loom-accent/60 animate-pulse" />
        </div>
      </div>
      <div className="text-sm text-loom-muted font-serif italic animate-pulse">
        Dreaming of possible futures...
      </div>
    </div>
  );
}

/** Animated probability bar */
function ProbabilityBar({ probability }: { probability: number }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(probability * 100), 150);
    return () => clearTimeout(timer);
  }, [probability]);

  const color = probability > 0.4 ? '#22c55e' : probability > 0.2 ? '#eab308' : '#64748b';

  return (
    <div className="w-full h-1.5 bg-loom-bg rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${width}%`,
          background: `linear-gradient(90deg, ${color}66, ${color})`,
          boxShadow: `0 0 8px ${color}30`,
        }}
      />
    </div>
  );
}

export default function DreamTree({ hasData }: DreamTreeProps) {
  const [dreams, setDreams] = useState<DreamBranch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.generateDreams();
      setDreams(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate dreams');
    } finally {
      setLoading(false);
    }
  };

  const probabilityColor = (p: number) => {
    if (p > 0.4) return 'text-green-400 border-green-500/30';
    if (p > 0.2) return 'text-yellow-400 border-yellow-500/30';
    return 'text-loom-muted border-loom-border';
  };

  const glowStyle = (p: number) => {
    if (p > 0.4) return { boxShadow: '0 0 12px rgba(34,197,94,0.1)' };
    if (p > 0.2) return { boxShadow: '0 0 8px rgba(234,179,8,0.08)' };
    return {};
  };

  return (
    <div className="h-full overflow-y-auto p-4">
      {!hasData ? (
        <div className="flex items-center justify-center h-full text-loom-muted text-sm italic font-serif">
          Load a narrative first, then dream of possible futures...
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-serif font-semibold text-loom-accent flex items-center gap-2">
                <Sparkles size={14} className="text-loom-accent/70" />
                Dream Mode
              </h3>
              <p className="text-xs text-loom-muted mt-0.5 font-serif italic">
                What chapters might come next?
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-loom-accent/20 text-loom-accent border border-loom-accent/30 rounded-lg hover:bg-loom-accent/30 hover:shadow-lg hover:shadow-loom-accent/10 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {loading ? 'Dreaming...' : 'Generate Futures'}
            </button>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-2">
              {error}
            </div>
          )}

          {loading && <DreamingAnimation />}

          {!loading && dreams.length > 0 && (
            <>
              {/* Branch Tree Visualization */}
              <BranchTree dreams={dreams} />

              <div className="space-y-3">
                {dreams.map((dream) => {
                  const isExpanded = expandedId === dream.id;
                  return (
                    <div
                      key={dream.id}
                      className={`border rounded-lg overflow-hidden transition-all duration-300 ${probabilityColor(dream.probability)} hover:bg-loom-surface/30`}
                      style={glowStyle(dream.probability)}
                    >
                      <button
                        className="w-full p-3 flex items-center justify-between text-left"
                        onClick={() => setExpandedId(isExpanded ? null : dream.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-serif font-semibold text-sm">{dream.title}</span>
                            <span className="text-[10px] font-mono opacity-60">
                              {(dream.probability * 100).toFixed(0)}% likely
                            </span>
                          </div>
                          {!isExpanded && (
                            <p className="text-xs opacity-70 line-clamp-1 font-serif">
                              {dream.narrative.split('\n')[0]}
                            </p>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-3">
                          <div className="text-xs font-serif leading-relaxed whitespace-pre-line opacity-90">
                            {dream.narrative}
                          </div>

                          <div className="space-y-2">
                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-loom-muted font-mono">
                                Trigger Events
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {dream.triggerEvents.map((t, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] px-1.5 py-0.5 bg-loom-bg/50 rounded border border-loom-border/50"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] uppercase tracking-wider text-loom-muted font-mono">
                                Consequences
                              </span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {dream.consequences.map((c, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] px-1.5 py-0.5 bg-loom-bg/50 rounded border border-loom-border/50"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Probability bar */}
                          <ProbabilityBar probability={dream.probability} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
