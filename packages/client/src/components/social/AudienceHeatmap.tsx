import { useState, useMemo } from 'react';
import { Grid3X3 } from 'lucide-react';

interface HeatmapCell {
  segment: string;
  topic: string;
  engagement: number;
  reach: number;
  sentiment: number;
}

interface AudienceHeatmapProps {
  cells: HeatmapCell[];
}

export default function AudienceHeatmap({ cells }: AudienceHeatmapProps) {
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);
  const [sortBy, setSortBy] = useState<'engagement' | 'alphabetical'>('engagement');

  const segments = useMemo(() => {
    const unique = [...new Set(cells.map((c) => c.segment))];
    if (sortBy === 'engagement') {
      return unique.sort((a, b) => {
        const aTotal = cells
          .filter((c) => c.segment === a)
          .reduce((sum, c) => sum + c.engagement, 0);
        const bTotal = cells
          .filter((c) => c.segment === b)
          .reduce((sum, c) => sum + c.engagement, 0);
        return bTotal - aTotal;
      });
    }
    return unique.sort();
  }, [cells, sortBy]);

  const topics = useMemo(() => [...new Set(cells.map((c) => c.topic))], [cells]);

  const maxEngagement = useMemo(() => Math.max(...cells.map((c) => c.engagement), 1), [cells]);

  /** Get cell data. */
  const getCell = (segment: string, topic: string): HeatmapCell | undefined =>
    cells.find((c) => c.segment === segment && c.topic === topic);

  /** Engagement intensity to green gradient. */
  const getColor = (engagement: number): string => {
    const intensity = engagement / maxEngagement;
    if (intensity > 0.8) return 'rgba(34, 197, 94, 0.7)';
    if (intensity > 0.6) return 'rgba(34, 197, 94, 0.5)';
    if (intensity > 0.4) return 'rgba(34, 197, 94, 0.35)';
    if (intensity > 0.2) return 'rgba(34, 197, 94, 0.2)';
    if (intensity > 0) return 'rgba(34, 197, 94, 0.08)';
    return 'rgba(255, 255, 255, 0.02)';
  };

  if (cells.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-loom-muted text-sm">
        No audience data available
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Grid3X3 size={14} className="text-green-400" />
          <span className="text-xs font-semibold">Audience Engagement Heatmap</span>
        </div>
        <div className="flex rounded bg-white/5 p-0.5">
          <button
            onClick={() => setSortBy('engagement')}
            className={`text-[9px] px-2 py-0.5 rounded transition-colors ${sortBy === 'engagement' ? 'bg-loom-accent/20 text-loom-accent' : 'text-loom-muted'}`}
          >
            By Engagement
          </button>
          <button
            onClick={() => setSortBy('alphabetical')}
            className={`text-[9px] px-2 py-0.5 rounded transition-colors ${sortBy === 'alphabetical' ? 'bg-loom-accent/20 text-loom-accent' : 'text-loom-muted'}`}
          >
            A-Z
          </button>
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="min-w-fit">
          {/* Column headers (topics) */}
          <div className="flex ml-28 mb-1">
            {topics.map((topic) => (
              <div
                key={topic}
                className="w-16 text-[9px] text-loom-muted text-center truncate px-0.5"
                title={topic}
              >
                {topic}
              </div>
            ))}
          </div>

          {/* Rows */}
          {segments.map((segment) => (
            <div key={segment} className="flex items-center mb-0.5">
              <div className="w-28 text-[10px] text-loom-text truncate pr-2" title={segment}>
                {segment}
              </div>
              <div className="flex">
                {topics.map((topic) => {
                  const cell = getCell(segment, topic);
                  const engagement = cell?.engagement || 0;
                  const isHovered =
                    hoveredCell?.segment === segment && hoveredCell?.topic === topic;
                  return (
                    <div
                      key={topic}
                      className={`w-16 h-8 rounded-sm mx-px flex items-center justify-center cursor-pointer transition-all duration-150 ${isHovered ? 'ring-1 ring-loom-accent scale-110 z-10' : ''}`}
                      style={{ backgroundColor: getColor(engagement) }}
                      onMouseEnter={() => cell && setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {engagement > 0 && (
                        <span className="text-[8px] text-white/60 font-mono">
                          {engagement >= 1000 ? `${(engagement / 1000).toFixed(1)}k` : engagement}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && (
        <div className="absolute bottom-4 left-4 bg-loom-surface/95 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 shadow-xl pointer-events-none">
          <p className="text-[10px] text-loom-muted">
            {hoveredCell.segment} / {hoveredCell.topic}
          </p>
          <div className="flex gap-4 mt-1">
            <div>
              <span className="text-[9px] text-loom-muted">Engagement</span>
              <p className="text-xs font-mono text-green-400">
                {hoveredCell.engagement.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[9px] text-loom-muted">Reach</span>
              <p className="text-xs font-mono text-loom-text">
                {hoveredCell.reach.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-[9px] text-loom-muted">Sentiment</span>
              <p
                className={`text-xs font-mono ${hoveredCell.sentiment > 0 ? 'text-green-400' : 'text-red-400'}`}
              >
                {hoveredCell.sentiment > 0 ? '+' : ''}
                {hoveredCell.sentiment.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-2 px-4 py-2 border-t border-white/5">
        <span className="text-[9px] text-loom-muted">Low</span>
        <div className="flex gap-px">
          {[0.08, 0.2, 0.35, 0.5, 0.7].map((opacity) => (
            <div
              key={opacity}
              className="w-6 h-2 rounded-sm"
              style={{ backgroundColor: `rgba(34, 197, 94, ${opacity})` }}
            />
          ))}
        </div>
        <span className="text-[9px] text-loom-muted">High</span>
      </div>
    </div>
  );
}
