import { useState } from 'react';
import { api, type DreamBranch } from '../hooks/useApi';
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface DreamTreeProps {
  hasData: boolean;
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
              <h3 className="text-sm font-serif font-semibold text-loom-accent">Dream Mode</h3>
              <p className="text-xs text-loom-muted mt-0.5">
                What chapters might come next?
              </p>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs bg-loom-accent/20 text-loom-accent border border-loom-accent/30 rounded hover:bg-loom-accent/30 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              {loading ? 'Dreaming...' : 'Generate Futures'}
            </button>
          </div>

          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded p-2">
              {error}
            </div>
          )}

          {dreams.length > 0 && (
            <div className="space-y-3">
              {dreams.map((dream) => {
                const isExpanded = expandedId === dream.id;
                return (
                  <div
                    key={dream.id}
                    className={`border rounded-lg overflow-hidden transition-all ${probabilityColor(dream.probability)}`}
                  >
                    <button
                      className="w-full p-3 flex items-center justify-between text-left"
                      onClick={() => setExpandedId(isExpanded ? null : dream.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-serif font-semibold text-sm">
                            {dream.title}
                          </span>
                          <span className="text-[10px] font-mono opacity-60">
                            {(dream.probability * 100).toFixed(0)}% likely
                          </span>
                        </div>
                        {!isExpanded && (
                          <p className="text-xs opacity-70 line-clamp-1">
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
                            <span className="text-[10px] uppercase tracking-wider text-loom-muted">
                              Trigger Events
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {dream.triggerEvents.map((t, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-1.5 py-0.5 bg-loom-bg/50 rounded"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-loom-muted">
                              Consequences
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {dream.consequences.map((c, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-1.5 py-0.5 bg-loom-bg/50 rounded"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Probability bar */}
                        <div className="mt-2">
                          <div className="w-full h-1.5 bg-loom-bg rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${dream.probability * 100}%`,
                                background:
                                  dream.probability > 0.4
                                    ? '#22c55e'
                                    : dream.probability > 0.2
                                      ? '#eab308'
                                      : '#64748b',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
