import { useState, useEffect } from 'react';
import {
  useSentimentDashboard,
  useSentimentArticles,
  useLoadSentimentDemo,
} from '../hooks/useSentiment';
import type { SentimentArticle } from '../hooks/useApi';
import EventDetailPanel from './EventDetailPanel';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Loader2,
  BarChart3,
  Users,
  Newspaper,
  Download,
} from 'lucide-react';

/** Category colors for the bar chart. */
const CATEGORY_COLORS: Record<string, string> = {
  political: '#8b5cf6',
  economic: '#22d3ee',
  regulatory: '#f97316',
  social: '#ec4899',
  technology: '#22c55e',
  military: '#ef4444',
  diplomatic: '#3b82f6',
  environmental: '#10b981',
  corruption: '#f59e0b',
  infrastructure: '#6366f1',
  education: '#a78bfa',
  health: '#34d399',
};

/** Trend icon component. */
function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'improving') return <TrendingUp size={14} className="text-green-400" />;
  if (trend === 'declining') return <TrendingDown size={14} className="text-red-400" />;
  if (trend === 'volatile') return <Zap size={14} className="text-yellow-400" />;
  return <Minus size={14} className="text-loom-muted" />;
}

/** Animated sentiment gauge SVG. */
function SentimentGauge({ value, trend }: { value: number; trend: string }) {
  const normalized = (value + 1) / 2;
  const angle = -120 + normalized * 240;
  const color = value > 0.2 ? '#22c55e' : value > -0.2 ? '#f97316' : '#ef4444';

  return (
    <div className="flex flex-col items-center gauge-entrance">
      <svg viewBox="0 0 200 120" className="w-48 h-28">
        <defs>
          <linearGradient id="gauge-bg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#gauge-bg)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${normalized * 251} 251`}
          className="transition-all duration-1000 ease-out"
        />
        <line
          x1="100"
          y1="100"
          x2={100 + 60 * Math.cos((angle * Math.PI) / 180)}
          y2={100 + 60 * Math.sin((angle * Math.PI) / 180)}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <circle cx="100" cy="100" r="4" fill={color} />
        <text x="100" y="90" textAnchor="middle" fill="#e2e8f0" fontSize="24" fontWeight="bold">
          {value.toFixed(2)}
        </text>
      </svg>
      <div className="flex items-center gap-1.5 text-xs mt-1">
        <TrendIcon trend={trend} />
        <span className="text-loom-muted capitalize">{trend}</span>
      </div>
    </div>
  );
}

/** Reliability dots (1-5 from reliabilityScore 0-1). */
function ReliabilityDots({ score }: { score: number }) {
  const filled = Math.round(score * 5);
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full ${i < filled ? 'bg-loom-accent' : 'bg-white/10'}`}
        />
      ))}
    </div>
  );
}

export default function SentimentDashboard() {
  const { data: dashboard, loading, error, refetch } = useSentimentDashboard();
  const { data: articlesData } = useSentimentArticles(undefined, { limit: 10 });
  const { load: loadDemo, loading: demoLoading } = useLoadSentimentDemo();
  const [selectedArticle, setSelectedArticle] = useState<SentimentArticle | null>(null);

  // Close panel on Escape key (via App keyboard nav)
  useEffect(() => {
    const handleClose = () => setSelectedArticle(null);
    document.addEventListener('loom:close-panel', handleClose);
    return () => document.removeEventListener('loom:close-panel', handleClose);
  }, []);

  const handleLoadDemo = async () => {
    await loadDemo();
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-loom-accent" />
        <span className="ml-2 text-sm text-loom-muted">Loading sentiment data…</span>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-loom-muted text-sm font-serif italic">
          {error || 'No sentiment data available.'}
        </p>
        <button
          onClick={handleLoadDemo}
          disabled={demoLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-loom-accent/20 text-loom-accent hover:bg-loom-accent/30 transition-colors text-sm disabled:opacity-50"
        >
          {demoLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Load Indonesia Demo
        </button>
      </div>
    );
  }

  const articles = articlesData?.data ?? [];
  const maxCategoryCount = Math.max(...dashboard.categoryBreakdown.map((c) => c.articleCount), 1);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-loom-accent" />
          <h2 className="text-sm font-semibold">Country Sentiment — {dashboard.country}</h2>
          <span className="text-[10px] text-loom-muted">
            {dashboard.totalArticles} articles · {dashboard.totalEvents} events
          </span>
        </div>
        <button
          onClick={handleLoadDemo}
          disabled={demoLoading}
          className="flex items-center gap-1.5 text-xs text-loom-muted hover:text-loom-accent transition-colors px-2 py-1 rounded bg-white/5"
        >
          {demoLoading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          Reload Demo
        </button>
      </div>

      {/* Top row: Gauge + Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sentiment Gauge */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col items-center justify-center">
          <span className="text-[10px] text-loom-muted uppercase tracking-wider mb-2">
            Overall Sentiment
          </span>
          <SentimentGauge value={dashboard.currentSentiment} trend={dashboard.trend} />
        </div>

        {/* Category Breakdown */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-loom-calm" />
            <span className="text-xs font-semibold">Category Breakdown</span>
          </div>
          <div className="space-y-1.5">
            {dashboard.categoryBreakdown.map((cat, idx) => (
              <div
                key={cat.category}
                className="flex items-center gap-2 text-[11px] stagger-fade-in"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <span className="w-20 text-loom-muted truncate capitalize">{cat.category}</span>
                <div className="flex-1 h-4 bg-loom-bg/50 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-700 ease-out flex items-center px-1.5"
                    style={{
                      width: `${(cat.articleCount / maxCategoryCount) * 100}%`,
                      backgroundColor: CATEGORY_COLORS[cat.category] || '#64748b',
                      minWidth: '2rem',
                    }}
                  >
                    <span className="text-[9px] text-white font-mono">{cat.articleCount}</span>
                  </div>
                </div>
                <span
                  className={`w-12 text-right font-mono ${cat.avgSentiment > 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {cat.avgSentiment > 0 ? '+' : ''}
                  {cat.avgSentiment.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second row: Top Articles + Sources + Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Articles by NIS */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Newspaper size={14} className="text-loom-glow" />
            <span className="text-xs font-semibold">Top Articles by NIS</span>
          </div>
          <div className="space-y-2">
            {articles
              .sort((a, b) => b.nis.score - a.nis.score)
              .slice(0, 8)
              .map((article) => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="w-full text-left p-2.5 rounded-lg bg-loom-bg/30 hover:bg-loom-bg/60 border border-transparent hover:border-loom-accent/30 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-loom-text group-hover:text-loom-accent transition-colors line-clamp-1">
                        {article.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full capitalize"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[article.category] || '#64748b'}20`,
                            color: CATEGORY_COLORS[article.category] || '#64748b',
                          }}
                        >
                          {article.category}
                        </span>
                        <span className="text-[9px] text-loom-muted">
                          {new Date(article.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-loom-accent font-mono leading-none">
                        {Math.round(article.nis.score)}
                      </span>
                      <span className="text-[9px] text-loom-muted">NIS</span>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Right column: Sources + Entities */}
        <div className="space-y-4">
          {/* Source Reliability */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <span className="text-xs font-semibold block mb-2">Source Signal</span>
            <div className="space-y-1.5">
              {dashboard.topSources.slice(0, 5).map((src, idx) => (
                <div
                  key={src.sourceId}
                  className="flex items-center justify-between text-[11px] stagger-fade-in"
                  style={{ animationDelay: `${idx * 80}ms` }}
                >
                  <span className="text-loom-text truncate flex-1 mr-2">{src.sourceName}</span>
                  <div className="flex items-center gap-2">
                    <ReliabilityDots score={src.signalStrength} />
                    <span className="text-loom-muted font-mono w-6 text-right">
                      {src.articleCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Entities */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-loom-accent" />
              <span className="text-xs font-semibold">Active Entities</span>
            </div>
            <div className="space-y-1.5">
              {dashboard.activeEntities.slice(0, 8).map((ent, idx) => (
                <div
                  key={ent.name}
                  className="flex items-center justify-between text-[11px] entity-breathe stagger-fade-in"
                  style={
                    {
                      animationDelay: `${idx * 80}ms`,
                      '--breathe-color':
                        ent.sentiment > 0 ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                    } as React.CSSProperties
                  }
                >
                  <span className="text-loom-text truncate flex-1 mr-2">{ent.name}</span>
                  <div className="flex items-center gap-1.5">
                    <TrendIcon trend={ent.trend} />
                    <span
                      className={`font-mono ${ent.sentiment > 0 ? 'text-green-400' : 'text-red-400'}`}
                    >
                      {ent.sentiment > 0 ? '+' : ''}
                      {ent.sentiment.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail Panel (slide-in) */}
      {selectedArticle && (
        <EventDetailPanel article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
    </div>
  );
}
