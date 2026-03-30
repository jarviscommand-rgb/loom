import type { PlatformMetrics } from '../../hooks/useApi';

/** Platform color and icon config. */
const PLATFORM_CONFIG: Record<string, { color: string; label: string }> = {
  twitter: { color: '#1DA1F2', label: 'Twitter/X' },
  instagram: { color: '#E4405F', label: 'Instagram' },
  tiktok: { color: '#00F2EA', label: 'TikTok' },
  facebook: { color: '#1877F2', label: 'Facebook' },
  reddit: { color: '#FF4500', label: 'Reddit' },
  youtube: { color: '#FF0000', label: 'YouTube' },
};

/** Radar chart axes. */
const RADAR_AXES = ['reach', 'engagement', 'sentiment', 'shares', 'virality'] as const;

interface PlatformComparisonProps {
  platforms: PlatformMetrics[];
  eventTitle?: string;
}

/** SVG Radar chart comparing platforms. */
function RadarChart({ platforms }: { platforms: PlatformMetrics[] }) {
  const size = 200;
  const center = size / 2;
  const radius = 70;
  const axisCount = RADAR_AXES.length;

  const angleStep = (Math.PI * 2) / axisCount;

  const getPoint = (axisIdx: number, value: number) => ({
    x: center + radius * value * Math.cos(axisIdx * angleStep - Math.PI / 2),
    y: center + radius * value * Math.sin(axisIdx * angleStep - Math.PI / 2),
  });

  /** Normalize values 0-1. */
  const maxValues = RADAR_AXES.map((axis) => Math.max(...platforms.map((p) => p[axis] ?? 0), 1));

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[240px] mx-auto">
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((ring) => {
        const points = Array.from({ length: axisCount }, (_, i) => {
          const pt = getPoint(i, ring);
          return `${pt.x},${pt.y}`;
        }).join(' ');
        return (
          <polygon
            key={ring}
            points={points}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Axis lines and labels */}
      {RADAR_AXES.map((axis, i) => {
        const pt = getPoint(i, 1.15);
        const end = getPoint(i, 1);
        return (
          <g key={axis}>
            <line
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.5"
            />
            <text
              x={pt.x}
              y={pt.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#64748b"
              fontSize="7"
              className="capitalize select-none"
            >
              {axis}
            </text>
          </g>
        );
      })}

      {/* Platform polygons */}
      {platforms.map((platform) => {
        const color = PLATFORM_CONFIG[platform.platform]?.color || '#64748b';
        const points = RADAR_AXES.map((axis, i) => {
          const normalized = (platform[axis] ?? 0) / maxValues[i];
          const pt = getPoint(i, normalized);
          return `${pt.x},${pt.y}`;
        }).join(' ');
        return (
          <polygon
            key={platform.platform}
            points={points}
            fill={`${color}15`}
            stroke={color}
            strokeWidth="1.5"
            strokeOpacity="0.7"
          />
        );
      })}
    </svg>
  );
}

/** Bar chart showing engagement by platform. */
function EngagementBars({ platforms }: { platforms: PlatformMetrics[] }) {
  const maxEngagement = Math.max(...platforms.map((p) => p.engagement), 1);

  return (
    <div className="space-y-2">
      {platforms
        .sort((a, b) => b.engagement - a.engagement)
        .map((platform) => {
          const config = PLATFORM_CONFIG[platform.platform];
          const color = config?.color || '#64748b';
          const pct = (platform.engagement / maxEngagement) * 100;
          return (
            <div key={platform.platform} className="flex items-center gap-2 text-[11px]">
              <span className="w-16 text-loom-muted truncate capitalize">
                {config?.label || platform.platform}
              </span>
              <div className="flex-1 h-5 bg-loom-bg/50 rounded overflow-hidden">
                <div
                  className="h-full rounded flex items-center px-1.5 transition-all duration-700 ease-out"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: `${color}60`,
                    borderLeft: `3px solid ${color}`,
                    minWidth: '2rem',
                  }}
                >
                  <span className="text-[9px] text-white font-mono">
                    {platform.engagement.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
    </div>
  );
}

export default function PlatformComparison({ platforms, eventTitle }: PlatformComparisonProps) {
  if (platforms.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-loom-muted text-sm">
        No cross-platform data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {eventTitle && (
        <h3 className="text-sm font-semibold text-loom-text truncate">{eventTitle}</h3>
      )}

      {/* Platform cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {platforms.map((platform) => {
          const config = PLATFORM_CONFIG[platform.platform];
          const color = config?.color || '#64748b';
          return (
            <div
              key={platform.platform}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-3 hover:border-white/20 transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: `${color}20`, color }}
                >
                  {(config?.label || platform.platform).charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-semibold text-loom-text">
                  {config?.label || platform.platform}
                </span>
              </div>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-loom-muted">Reach</span>
                  <span className="font-mono text-loom-text">
                    {platform.reach.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-loom-muted">Engagement</span>
                  <span className="font-mono text-loom-text">
                    {platform.engagement.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-loom-muted">Sentiment</span>
                  <span
                    className={`font-mono ${platform.sentiment > 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {platform.sentiment > 0 ? '+' : ''}
                    {platform.sentiment.toFixed(2)}
                  </span>
                </div>
                {platform.topReactionType && (
                  <div className="flex justify-between">
                    <span className="text-loom-muted">Top Reaction</span>
                    <span className="text-loom-text capitalize">{platform.topReactionType}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <span className="text-[10px] text-loom-muted uppercase tracking-wider block mb-2">
            Platform Radar
          </span>
          <RadarChart platforms={platforms} />
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <span className="text-[10px] text-loom-muted uppercase tracking-wider block mb-2">
            Engagement by Platform
          </span>
          <EngagementBars platforms={platforms} />
        </div>
      </div>
    </div>
  );
}
