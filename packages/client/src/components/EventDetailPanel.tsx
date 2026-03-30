import { useEffect, useState } from 'react';
import type { SentimentArticle } from '../hooks/useApi';
import { X } from 'lucide-react';
import ScoreBreakdown from './ScoreBreakdown';

interface EventDetailPanelProps {
  article: SentimentArticle;
  onClose: () => void;
}

/** NIS score color based on severity. */
function nisColor(score: number): string {
  if (score >= 70) return 'text-red-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-emerald-400';
}

/** NIS glow ring color. */
function nisRing(score: number): string {
  if (score >= 70) return 'ring-red-400/30';
  if (score >= 40) return 'ring-amber-400/30';
  return 'ring-emerald-400/30';
}

/** Labeled progress bar. */
function ProgressBar({ label, value, max = 1 }: { label: string; value: number; max?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-0.5">
        <span className="text-loom-muted">{label}</span>
        <span className="text-loom-text font-mono">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-loom-accent/70 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Emotion type bar with intensity color. */
function EmotionBar({ type, intensity }: { type: string; intensity: number }) {
  const emotionColors: Record<string, string> = {
    fear: 'bg-red-500',
    hope: 'bg-emerald-500',
    anger: 'bg-red-600',
    trust: 'bg-blue-500',
    pride: 'bg-amber-500',
    confusion: 'bg-purple-500',
    urgency: 'bg-orange-500',
    apathy: 'bg-gray-500',
  };
  const color = emotionColors[type] || 'bg-loom-accent';

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-loom-muted w-16 capitalize">{type}</span>
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${intensity * 100}%`, opacity: 0.8 }}
        />
      </div>
      <span className="text-[10px] font-mono text-loom-text w-8 text-right">
        {(intensity * 100).toFixed(0)}
      </span>
    </div>
  );
}

type DetailTab = 'overview' | 'breakdown' | 'audience' | 'effects';

export default function EventDetailPanel({ article, onClose }: EventDetailPanelProps) {
  const [visible, setVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    return () => setVisible(false);
  }, [article]);

  // Close with Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 200);
  };

  const { nis, sentiment, sentimentTypes, effectiveness, audienceImpact } = article;

  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'breakdown', label: 'Score Breakdown' },
    { id: 'audience', label: 'Audience' },
    { id: 'effects', label: 'Effects' },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[420px] max-w-full z-50 bg-loom-bg/95 backdrop-blur-xl border-l border-white/10 overflow-y-auto transition-transform duration-200 ease-out ${visible ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-5 space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-loom-text leading-snug">{article.title}</h3>
              <p className="text-[10px] text-loom-muted mt-1">
                {new Date(article.publishedAt).toLocaleString()} · {article.category}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded hover:bg-white/10 transition-colors text-loom-muted hover:text-loom-text"
            >
              <X size={16} />
            </button>
          </div>

          {/* NIS Score */}
          <div className="flex flex-col items-center py-4">
            <span className="text-[10px] uppercase tracking-widest text-loom-muted mb-2">
              Narrative Impact Score
            </span>
            <div
              className={`w-24 h-24 rounded-full ring-4 ${nisRing(nis.score)} flex flex-col items-center justify-center bg-white/5`}
            >
              <span className={`text-3xl font-mono font-bold ${nisColor(nis.score)}`}>
                {Math.round(nis.score)}
              </span>
              <span className="text-[9px] text-loom-muted">P{nis.percentile}</span>
            </div>
            <p className="text-[11px] text-loom-muted text-center mt-2 max-w-xs italic font-serif">
              {nis.summary}
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-white/10 pb-0.5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`text-[10px] px-3 py-1.5 rounded-t transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white/5 text-loom-accent border-b-2 border-loom-accent'
                    : 'text-loom-muted hover:text-loom-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fadeSlideIn">
              {/* NIS Component Breakdown */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <h4 className="text-[10px] uppercase tracking-wider text-loom-muted mb-3">
                  NIS Components
                </h4>
                <div className="space-y-2">
                  <ProgressBar label="Sentiment Shift" value={nis.components.sentimentShift} />
                  <ProgressBar
                    label="Source Credibility"
                    value={nis.components.sourceCredibility}
                  />
                  <ProgressBar label="Audience Reach" value={nis.components.audienceReach} />
                  <ProgressBar label="Impact Duration" value={nis.components.impactDuration} />
                  <ProgressBar label="Amplification" value={nis.components.amplification} />
                </div>
              </div>

              {/* Sentiment Types */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <h4 className="text-[10px] uppercase tracking-wider text-loom-muted mb-3">
                  Sentiment Types
                </h4>
                <div className="space-y-1.5">
                  {sentimentTypes
                    .sort((a, b) => b.intensity - a.intensity)
                    .map((st) => (
                      <EmotionBar key={st.type} type={st.type} intensity={st.intensity} />
                    ))}
                </div>
              </div>

              {/* Source Profile */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <h4 className="text-[10px] uppercase tracking-wider text-loom-muted mb-3">
                  Source Profile
                </h4>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-loom-muted">Source ID</span>
                    <span className="text-loom-text font-mono">{article.sourceId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-loom-muted">Language</span>
                    <span className="text-loom-text">{article.language}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-loom-muted">Method</span>
                    <span className="text-loom-text capitalize">{sentiment.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-loom-muted">Confidence</span>
                    <span className="text-loom-text font-mono">
                      {(sentiment.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-loom-muted">Weighted Score</span>
                    <span
                      className={`font-mono ${sentiment.weightedScore > 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {sentiment.weightedScore > 0 ? '+' : ''}
                      {sentiment.weightedScore.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'breakdown' && (
            <div className="space-y-3 animate-fadeSlideIn">
              {/* NIS Score Breakdown */}
              {nis.scoreBreakdown && (
                <ScoreBreakdown breakdown={nis.scoreBreakdown} defaultExpanded />
              )}

              {/* Sentiment Score Breakdown */}
              {sentiment.scoreBreakdown && <ScoreBreakdown breakdown={sentiment.scoreBreakdown} />}

              {/* Effectiveness Breakdown */}
              {effectiveness.scoreBreakdown && (
                <ScoreBreakdown breakdown={effectiveness.scoreBreakdown} />
              )}

              {!nis.scoreBreakdown && !sentiment.scoreBreakdown && (
                <div className="text-xs text-loom-muted text-center py-8">
                  Score breakdowns not available for this article.
                  <br />
                  Re-analyze to generate full variable transparency.
                </div>
              )}
            </div>
          )}

          {activeTab === 'audience' && (
            <div className="space-y-4 animate-fadeSlideIn">
              {/* Effectiveness */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <h4 className="text-[10px] uppercase tracking-wider text-loom-muted mb-3">
                  Effectiveness Analysis
                </h4>
                <div className="space-y-2">
                  <ProgressBar label="Source Credibility" value={effectiveness.sourceCredibility} />
                  <ProgressBar label="Timing Relevance" value={effectiveness.timingRelevance} />
                  <ProgressBar label="Framing Quality" value={effectiveness.framingQuality} />
                  <ProgressBar
                    label="Emotional Resonance"
                    value={effectiveness.emotionalResonance}
                  />
                  <ProgressBar label="Novelty Factor" value={effectiveness.noveltyFactor} />
                </div>
                <p className="text-[10px] text-loom-muted mt-2 italic font-serif">
                  {effectiveness.explanation}
                </p>
              </div>

              {/* Audience Impact */}
              {audienceImpact.length > 0 && (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                  <h4 className="text-[10px] uppercase tracking-wider text-loom-muted mb-3">
                    Audience Impact
                  </h4>
                  <div className="space-y-2.5">
                    {audienceImpact
                      .sort((a, b) => b.impact - a.impact)
                      .map((ai) => (
                        <div key={ai.segment}>
                          <div className="flex justify-between text-[10px] mb-0.5">
                            <span className="text-loom-muted capitalize">
                              {ai.segment.replace(/-/g, ' ')}
                            </span>
                            <span className="text-loom-text font-mono">
                              {(ai.impact * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-loom-calm/70 rounded-full transition-all duration-500"
                                style={{ width: `${ai.reach * 100}%` }}
                              />
                            </div>
                            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-loom-accent/70 rounded-full transition-all duration-500"
                                style={{ width: `${ai.relevance * 100}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex gap-1 text-[8px] text-loom-muted mt-0.5">
                            <span className="flex-1">Reach</span>
                            <span className="flex-1">Relevance</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'effects' && (
            <div className="space-y-4 animate-fadeSlideIn">
              {article.downstreamEffects.length > 0 ? (
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                  <h4 className="text-[10px] uppercase tracking-wider text-loom-muted mb-3">
                    Downstream Effects
                  </h4>
                  <div className="space-y-2">
                    {article.downstreamEffects.map((de) => (
                      <div key={de.effect} className="flex items-start gap-2 text-[11px]">
                        <span
                          className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${de.direction === 'positive' ? 'bg-green-400' : 'bg-red-400'}`}
                        />
                        <div>
                          <span className="text-loom-text capitalize">
                            {de.effect.replace(/-/g, ' ')}
                          </span>
                          <span className="text-loom-muted ml-1">— {de.description}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-loom-muted text-center py-8">
                  No downstream effects predicted for this article.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
