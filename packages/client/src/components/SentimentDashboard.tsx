import { useState, useEffect, useCallback } from 'react';
import {
  sentimentApi,
  type SentimentDashboardData,
  type SentimentEvent,
  type SentimentFilters,
  type EventCategory,
} from '../hooks/useApi';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Loader2,
  Filter,
  BarChart3,
  Users,
  Newspaper,
  ChevronDown,
} from 'lucide-react';
import EventDetailPanel from './EventDetailPanel';

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
    <div className="flex flex-col items-center">
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

export default function SentimentDashboard() {
  const [dashboard, setDashboard] = useState<SentimentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SentimentEvent | null>(null);
  const [filters, setFilters] = useState<SentimentFilters>({});
  const [showFilters, setShowFilters] = useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sentimentApi.getDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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
      <div className="flex items-center justify-center h-full text-sm text-red-400">
        {error || 'No data available'}
      </div>
    );
  }

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
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1 text-xs text-loom-muted hover:text-loom-text transition-colors px-2 py-1 rounded bg-white/5"
        >
          <Filter size={12} />
          Filters
          <ChevronDown
            size={10}
            className={`transition-transform ${showFilters ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Filter bar */}
      {showFilters && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-white/5 backdrop-blur-xl border border-white/10 animate-fade-in">
          <select
            value={filters.category || ''}
            onChange={(e) =>
              setFilters({
                ...filters,
                category: (e.target.value || undefined) as EventCategory | undefined,
              })
            }
            className="bg-loom-bg border border-loom-border rounded px-2 py-1 text-xs text-loom-text"
          >
            <option value="">All Categories</option>
            {Object.keys(CATEGORY_COLORS).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <select
            value={filters.sourceId || ''}
            onChange={(e) => setFilters({ ...filters, sourceId: e.target.value || undefined })}
            className="bg-loom-bg border border-loom-border rounded px-2 py-1 text-xs text-loom-text"
          >
            <option value="">All Sources</option>
            {dashboard.topSources.map((s) => (
              <option key={s.sourceId} value={s.sourceId}>
                {s.sourceName}
              </option>
            ))}
          </select>
          <select
            value={filters.entity || ''}
            onChange={(e) => setFilters({ ...filters, entity: e.target.value || undefined })}
            className="bg-loom-bg border border-loom-border rounded px-2 py-1 text-xs text-loom-text"
          >
            <option value="">All Entities</option>
            {dashboard.activeEntities.map((ent) => (
              <option key={ent.name} value={ent.name}>
                {ent.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Top row: Gauge + Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sentiment Gauge */}
        <div className="glass-panel p-4 flex flex-col items-center justify-center bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
          <span className="text-[10px] text-loom-muted uppercase tracking-wider mb-2">
            Overall Sentiment
          </span>
          <SentimentGauge value={dashboard.currentSentiment} trend={dashboard.trend} />
        </div>

        {/* Category Breakdown */}
        <div className="lg:col-span-2 glass-panel p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 size={14} className="text-loom-calm" />
            <span className="text-xs font-semibold">Category Breakdown</span>
          </div>
          <div className="space-y-1.5">
            {dashboard.categoryBreakdown.map((cat) => (
              <div key={cat.category} className="flex items-center gap-2 text-[11px]">
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

      {/* Second row: Top Events + Sources + Entities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Events by NIS */}
        <div className="lg:col-span-2 glass-panel p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
          <div className="flex items-center gap-2 mb-3">
            <Newspaper size={14} className="text-loom-glow" />
            <span className="text-xs font-semibold">Top Events by NIS</span>
          </div>
          <div className="space-y-2">
            {dashboard.topEvents
              .filter((ev) => !filters.category || ev.category === filters.category)
              .slice(0, 8)
              .map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="w-full text-left p-2.5 rounded-lg bg-loom-bg/30 hover:bg-loom-bg/60 border border-transparent hover:border-loom-accent/30 transition-all duration-200 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-medium text-loom-text group-hover:text-loom-accent transition-colors line-clamp-1">
                        {event.title}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full capitalize"
                          style={{
                            backgroundColor: `${CATEGORY_COLORS[event.category] || '#64748b'}20`,
                            color: CATEGORY_COLORS[event.category] || '#64748b',
                          }}
                        >
                          {event.category}
                        </span>
                        <span
                          className={`text-[10px] font-mono ${event.sentimentDelta > 0 ? 'text-green-400' : 'text-red-400'}`}
                        >
                          Δ {event.sentimentDelta > 0 ? '+' : ''}
                          {event.sentimentDelta.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-lg font-bold text-loom-accent font-mono leading-none">
                        {Math.round(event.nis.score)}
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
          <div className="glass-panel p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
            <span className="text-xs font-semibold block mb-2">Source Signal</span>
            <div className="space-y-1.5">
              {dashboard.topSources.slice(0, 5).map((src) => (
                <div key={src.sourceId} className="flex items-center justify-between text-[11px]">
                  <span className="text-loom-text truncate flex-1 mr-2">{src.sourceName}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-1.5 bg-loom-bg/50 rounded overflow-hidden">
                      <div
                        className="h-full rounded bg-loom-calm transition-all duration-500"
                        style={{ width: `${src.signalStrength * 100}%` }}
                      />
                    </div>
                    <span className="text-loom-muted font-mono w-6 text-right">
                      {src.articleCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Entities */}
          <div className="glass-panel p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Users size={14} className="text-loom-accent" />
              <span className="text-xs font-semibold">Active Entities</span>
            </div>
            <div className="space-y-1.5">
              {dashboard.activeEntities.slice(0, 8).map((ent) => (
                <div key={ent.name} className="flex items-center justify-between text-[11px]">
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
      <EventDetailPanel event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
