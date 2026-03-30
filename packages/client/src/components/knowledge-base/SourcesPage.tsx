import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Filter, ArrowLeft, Shield, ExternalLink } from 'lucide-react';
import { KnowledgeBaseSkeleton } from '../LoadingSkeleton';

interface SourceSummary {
  id: string;
  name: string;
  reliabilityScore: number;
  politicalLeaning: string;
  biasDirection: string;
  audienceTypes: string[];
  url: string;
  country: string;
}

/** Media Sources browsing page with filters. */
export default function SourcesPage() {
  const [sources, setSources] = useState<SourceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterBias, setFilterBias] = useState<string>('all');
  const [filterReliability, setFilterReliability] = useState<string>('all');

  useEffect(() => {
    fetch('/api/knowledge-base/sources')
      .then((r) => r.json())
      .then((data) => {
        setSources(data.sources || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <KnowledgeBaseSkeleton />;

  const filtered = sources.filter((s) => {
    if (filterBias !== 'all' && s.biasDirection !== filterBias) return false;
    if (filterReliability === 'high' && s.reliabilityScore < 0.7) return false;
    if (filterReliability === 'medium' && (s.reliabilityScore < 0.5 || s.reliabilityScore >= 0.7))
      return false;
    if (filterReliability === 'low' && s.reliabilityScore >= 0.5) return false;
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 animate-fadeSlideIn">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/knowledge-base"
          className="text-loom-muted hover:text-loom-text transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-serif font-bold text-loom-text">Media Sources</h1>
          <p className="text-xs text-loom-muted">
            {sources.length} Indonesian media sources profiled
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Filter size={14} className="text-loom-muted" />
        <select
          value={filterBias}
          onChange={(e) => setFilterBias(e.target.value)}
          className="text-xs bg-loom-surface border border-loom-border/50 rounded px-2 py-1.5 text-loom-text focus:outline-none focus:border-loom-accent/50"
        >
          <option value="all">All bias</option>
          <option value="pro-government">Pro-government</option>
          <option value="anti-government">Anti-government</option>
          <option value="neutral">Neutral</option>
        </select>
        <select
          value={filterReliability}
          onChange={(e) => setFilterReliability(e.target.value)}
          className="text-xs bg-loom-surface border border-loom-border/50 rounded px-2 py-1.5 text-loom-text focus:outline-none focus:border-loom-accent/50"
        >
          <option value="all">All reliability</option>
          <option value="high">High (0.7+)</option>
          <option value="medium">Medium (0.5-0.7)</option>
          <option value="low">Low (&lt;0.5)</option>
        </select>
        <span className="text-xs text-loom-muted ml-auto">
          Showing {filtered.length} of {sources.length}
        </span>
      </div>

      {/* Source cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((source) => (
          <SourceCard key={source.id} source={source} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-loom-muted text-sm">
          No sources match the current filters.
        </div>
      )}
    </div>
  );
}

function SourceCard({ source }: { source: SourceSummary }) {
  const reliabilityColor =
    source.reliabilityScore >= 0.7
      ? 'text-emerald-400'
      : source.reliabilityScore >= 0.5
        ? 'text-amber-400'
        : 'text-red-400';

  const biasColor =
    source.biasDirection === 'pro-government'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : source.biasDirection === 'anti-government'
        ? 'bg-orange-500/10 text-orange-400 border-orange-500/20'
        : 'bg-gray-500/10 text-gray-400 border-gray-500/20';

  return (
    <Link
      to={`/knowledge-base/sources/${source.id}`}
      className="group border border-loom-border/40 rounded-lg p-4 bg-loom-surface/20 hover:bg-loom-surface/50 hover:border-loom-border transition-all duration-200"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-sm font-semibold text-loom-text group-hover:text-loom-accent transition-colors">
          {source.name}
        </h3>
        <ExternalLink
          size={12}
          className="text-loom-muted opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${biasColor}`}>
          {source.biasDirection}
        </span>
        <span className="text-[10px] text-loom-muted">{source.politicalLeaning}</span>
      </div>

      {/* Reliability bar */}
      <div className="flex items-center gap-2 mb-2">
        <Shield size={10} className="text-loom-muted" />
        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${
              source.reliabilityScore >= 0.7
                ? 'bg-emerald-500'
                : source.reliabilityScore >= 0.5
                  ? 'bg-amber-500'
                  : 'bg-red-500'
            }`}
            style={{ width: `${source.reliabilityScore * 100}%` }}
          />
        </div>
        <span className={`text-[10px] font-mono ${reliabilityColor}`}>
          {source.reliabilityScore.toFixed(2)}
        </span>
      </div>

      {/* Audience types */}
      <div className="flex flex-wrap gap-1">
        {source.audienceTypes.map((type) => (
          <span key={type} className="text-[9px] px-1 py-0.5 rounded bg-white/5 text-loom-muted">
            {type}
          </span>
        ))}
      </div>
    </Link>
  );
}
