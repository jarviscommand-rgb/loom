import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { SocialInfluencer } from '../../hooks/useApi';
import { Users, Loader2 } from 'lucide-react';

/** Platform color map. */
const PLATFORM_COLORS: Record<string, string> = {
  twitter: '#1DA1F2',
  instagram: '#E4405F',
  tiktok: '#00F2EA',
  facebook: '#1877F2',
  reddit: '#FF4500',
  youtube: '#FF0000',
};

interface NodePosition {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface InfluencerNetworkProps {
  influencers: SocialInfluencer[];
  width?: number;
  height?: number;
}

/** Format large numbers for display. */
function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

/** Compute force-directed layout with animated settling. */
function useForceLayout(
  influencers: SocialInfluencer[],
  width: number,
  height: number
): Map<string, NodePosition> {
  const [positions, setPositions] = useState<Map<string, NodePosition>>(new Map());
  const frameRef = useRef<number>(0);
  const iterRef = useRef(0);

  useEffect(() => {
    if (influencers.length === 0) return;

    const posMap = new Map<string, NodePosition>();
    const cx = width / 2;
    const cy = height / 2;

    influencers.forEach((inf, i) => {
      const angle = (i / influencers.length) * Math.PI * 2;
      const r = Math.min(width, height) * 0.3;
      posMap.set(inf.id, {
        x: cx + Math.cos(angle) * r + Math.sin(i * 2.39) * 30,
        y: cy + Math.sin(angle) * r + Math.cos(i * 3.17) * 30,
        vx: 0,
        vy: 0,
      });
    });

    iterRef.current = 0;
    const maxIter = 120;
    const damping = 0.92;

    const simulate = () => {
      if (iterRef.current >= maxIter) return;
      iterRef.current++;

      const alpha = 1 - iterRef.current / maxIter;
      const entries = Array.from(posMap.entries());

      /* Repulsion between all nodes */
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const [, a] = entries[i];
          const [, b] = entries[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (800 * alpha) / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      /* Attraction to center */
      for (const [, pos] of entries) {
        const dx = cx - pos.x;
        const dy = cy - pos.y;
        pos.vx += dx * 0.002 * alpha;
        pos.vy += dy * 0.002 * alpha;
      }

      /* Attraction between same-platform nodes */
      for (let i = 0; i < entries.length; i++) {
        for (let j = i + 1; j < entries.length; j++) {
          const infA = influencers[i];
          const infB = influencers[j];
          if (infA.platform === infB.platform) {
            const [, a] = entries[i];
            const [, b] = entries[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            if (dist > 60) {
              const force = 0.3 * alpha;
              a.vx += (dx / dist) * force;
              a.vy += (dy / dist) * force;
              b.vx -= (dx / dist) * force;
              b.vy -= (dy / dist) * force;
            }
          }
        }
      }

      /* Apply velocities */
      for (const [, pos] of entries) {
        pos.vx *= damping;
        pos.vy *= damping;
        pos.x += pos.vx;
        pos.y += pos.vy;
        pos.x = Math.max(40, Math.min(width - 40, pos.x));
        pos.y = Math.max(40, Math.min(height - 40, pos.y));
      }

      setPositions(new Map(posMap));
      frameRef.current = requestAnimationFrame(simulate);
    };

    frameRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [influencers, width, height]);

  return positions;
}

export default function InfluencerNetwork({
  influencers,
  width = 700,
  height = 450,
}: InfluencerNetworkProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const positions = useForceLayout(influencers, width, height);

  const maxFollowers = useMemo(
    () => Math.max(...influencers.map((i) => i.followers), 1),
    [influencers]
  );

  /** Node radius proportional to follower count. */
  const nodeRadius = useCallback(
    (followers: number) => 10 + (followers / maxFollowers) * 22,
    [maxFollowers]
  );

  /** Build edges between influencers who share topics. */
  const edges = useMemo(() => {
    const result: Array<{ from: string; to: string; strength: number }> = [];
    for (let i = 0; i < influencers.length; i++) {
      for (let j = i + 1; j < influencers.length; j++) {
        const shared = influencers[i].topTopics.filter((t) => influencers[j].topTopics.includes(t));
        if (shared.length > 0) {
          result.push({
            from: influencers[i].id,
            to: influencers[j].id,
            strength: shared.length / Math.max(influencers[i].topTopics.length, 1),
          });
        }
      }
    }
    return result;
  }, [influencers]);

  if (influencers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-12 h-12 rounded-xl bg-loom-accent/10 flex items-center justify-center">
          <Users size={20} className="text-loom-accent/50" />
        </div>
        <p className="text-loom-muted text-sm font-serif italic">No influencer data available</p>
      </div>
    );
  }

  if (positions.size === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-loom-accent" />
        <span className="ml-2 text-sm text-loom-muted">Computing network layout...</span>
      </div>
    );
  }

  const hovered = hoveredId ? influencers.find((i) => i.id === hoveredId) : null;

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <defs>
          <filter id="inf-glow">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        {edges.map((edge, i) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;

          const highlighted = hoveredId && (edge.from === hoveredId || edge.to === hoveredId);

          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={highlighted ? '#a78bfa' : 'rgba(255,255,255,0.06)'}
              strokeWidth={highlighted ? 1.5 : 0.5 + edge.strength}
              strokeOpacity={highlighted ? 0.8 : 0.3}
              className="transition-all duration-200"
            />
          );
        })}

        {/* Nodes */}
        {influencers.map((inf) => {
          const pos = positions.get(inf.id);
          if (!pos) return null;
          const r = nodeRadius(inf.followers);
          const color = PLATFORM_COLORS[inf.platform] || '#64748b';
          const isHovered = hoveredId === inf.id;

          return (
            <g
              key={inf.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredId(inf.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{ transition: 'opacity 200ms' }}
            >
              {/* Glow circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r + 6}
                fill={color}
                opacity={isHovered ? 0.35 : 0.1}
                filter="url(#inf-glow)"
                className="transition-opacity duration-200"
              />
              {/* Main node */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                fill={`${color}30`}
                stroke={color}
                strokeWidth={isHovered ? 2.5 : 1.5}
                className="transition-all duration-200"
              />
              {/* Amplification score ring */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r + 3}
                fill="none"
                stroke={color}
                strokeWidth="1"
                strokeDasharray={`${(inf.amplificationScore / 10) * Math.PI * 2 * (r + 3)} ${Math.PI * 2 * (r + 3)}`}
                strokeLinecap="round"
                opacity={0.6}
                transform={`rotate(-90 ${pos.x} ${pos.y})`}
              />
              {/* Initial letter */}
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={color}
                fontSize={Math.max(9, r * 0.7)}
                fontWeight="bold"
                className="select-none"
              >
                {inf.name.charAt(0)}
              </text>
              {/* Name label */}
              <text
                x={pos.x}
                y={pos.y + r + 12}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
                className="select-none"
              >
                {inf.name.length > 14 ? `${inf.name.slice(0, 14)}...` : inf.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hovered && (
        <div className="absolute top-4 right-4 bg-loom-surface/95 backdrop-blur-lg border border-white/10 rounded-lg p-3 text-xs shadow-xl z-10 min-w-[180px]">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: `${PLATFORM_COLORS[hovered.platform] || '#64748b'}30`,
                color: PLATFORM_COLORS[hovered.platform] || '#64748b',
              }}
            >
              {hovered.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-loom-text">{hovered.name}</p>
              <p className="text-[9px] text-loom-muted">@{hovered.handle}</p>
            </div>
          </div>
          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between gap-4">
              <span className="text-loom-muted">Platform</span>
              <span className="capitalize" style={{ color: PLATFORM_COLORS[hovered.platform] }}>
                {hovered.platform}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-loom-muted">Followers</span>
              <span className="font-mono text-loom-text">{formatNumber(hovered.followers)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-loom-muted">Engagement</span>
              <span className="font-mono text-loom-text">
                {(hovered.engagementRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-loom-muted">Amplification</span>
              <span className="font-mono text-loom-accent">
                {hovered.amplificationScore.toFixed(1)}x
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-loom-muted">Authenticity</span>
              <span
                className={`font-mono ${hovered.authenticity > 0.7 ? 'text-green-400' : hovered.authenticity > 0.4 ? 'text-yellow-400' : 'text-red-400'}`}
              >
                {(hovered.authenticity * 100).toFixed(0)}%
              </span>
            </div>
          </div>
          {hovered.topTopics.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-white/5">
              {hovered.topTopics.map((topic) => (
                <span
                  key={topic}
                  className="px-1.5 py-0.5 bg-loom-bg/50 rounded text-[8px] text-loom-muted"
                >
                  #{topic}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Platform legend */}
      <div className="flex flex-wrap gap-3 mt-2 px-2">
        {Object.entries(PLATFORM_COLORS)
          .filter(([platform]) => influencers.some((i) => i.platform === platform))
          .map(([platform, color]) => (
            <span key={platform} className="flex items-center gap-1 text-[10px] text-loom-muted">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="capitalize">{platform}</span>
            </span>
          ))}
      </div>
    </div>
  );
}
