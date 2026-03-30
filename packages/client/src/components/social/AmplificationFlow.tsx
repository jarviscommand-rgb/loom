import { useMemo, useState, useEffect } from 'react';
import type { AmplificationNode, AmplificationLink } from '../../hooks/useApi';

interface AmplificationFlowProps {
  nodes: AmplificationNode[];
  links: AmplificationLink[];
  width?: number;
  height?: number;
}

/** Simple force-directed layout. */
function computeLayout(
  nodes: AmplificationNode[],
  links: AmplificationLink[],
  width: number,
  height: number
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  /* Initialize positions by tier */
  const tiers: Record<string, number> = { source: 0.15, influencer: 0.5, audience: 0.85 };

  nodes.forEach((node) => {
    const tierX = tiers[node.tier] ?? 0.5;
    const nodesInTier = nodes.filter((n) => n.tier === node.tier);
    const tierIdx = nodesInTier.indexOf(node);
    const tierSpacing = height / (nodesInTier.length + 1);
    positions.set(node.id, {
      x: tierX * width,
      y: (tierIdx + 1) * tierSpacing,
    });
  });

  /* Run a few iterations of force simulation */
  const linkMap = new Map<string, string[]>();
  for (const link of links) {
    if (!linkMap.has(link.source)) linkMap.set(link.source, []);
    linkMap.get(link.source)!.push(link.target);
  }

  for (let iter = 0; iter < 50; iter++) {
    /* Repulsion between same-tier nodes */
    for (const a of nodes) {
      for (const b of nodes) {
        if (a.id >= b.id || a.tier !== b.tier) continue;
        const posA = positions.get(a.id)!;
        const posB = positions.get(b.id)!;
        const dy = posB.y - posA.y;
        const dist = Math.abs(dy) || 1;
        const force = 200 / (dist * dist);
        posA.y -= force * Math.sign(dy);
        posB.y += force * Math.sign(dy);
      }
    }

    /* Keep within bounds */
    for (const node of nodes) {
      const pos = positions.get(node.id)!;
      pos.y = Math.max(30, Math.min(height - 30, pos.y));
    }
  }

  return positions;
}

export default function AmplificationFlow({
  nodes,
  links,
  width = 800,
  height = 400,
}: AmplificationFlowProps) {
  const [hoveredNode, setHoveredNode] = useState<AmplificationNode | null>(null);
  const [_animationPhase, _setAnimationPhase] = useState(0);

  /* Animate flow lines */
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setAnimationPhase((prev) => (prev + 0.5) % 100);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const positions = useMemo(
    () => computeLayout(nodes, links, width, height),
    [nodes, links, width, height]
  );

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-loom-muted text-sm">
        No amplification data available
      </div>
    );
  }

  const maxReach = Math.max(...nodes.map((n) => n.reach), 1);

  /** Node radius proportional to reach. */
  const nodeRadius = (reach: number) => 8 + (reach / maxReach) * 20;

  /** Tier colors. */
  const tierColor = (tier: string): string => {
    const colors: Record<string, string> = {
      source: '#a78bfa',
      influencer: '#22d3ee',
      audience: '#22c55e',
    };
    return colors[tier] || '#64748b';
  };

  return (
    <div className="relative w-full">
      {/* Tier labels */}
      <div className="flex justify-between px-16 mb-2 text-[10px] text-loom-muted uppercase tracking-wider">
        <span>Source</span>
        <span>Influencers</span>
        <span>Audience</span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height }}>
        <defs>
          {/* Glow filter */}
          <filter id="amp-glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Links with animated flow */}
        {links.map((link, i) => {
          const source = positions.get(link.source);
          const target = positions.get(link.target);
          if (!source || !target) return null;

          const opacity = link.quality === 'genuine' ? 0.6 : 0.2;
          const highlighted =
            hoveredNode && (link.source === hoveredNode.id || link.target === hoveredNode.id);

          /* Curved path */
          const midX = (source.x + target.x) / 2;
          const path = `M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x} ${target.y}`;

          return (
            <g key={i}>
              <path
                d={path}
                fill="none"
                stroke={highlighted ? '#a78bfa' : 'rgba(255,255,255,0.1)'}
                strokeWidth={highlighted ? 2 : 1}
                strokeOpacity={highlighted ? 1 : opacity}
                className="transition-all duration-200"
              />
              {/* Animated flow dot */}
              <circle r="2.5" fill={highlighted ? '#a78bfa' : 'rgba(255,255,255,0.3)'}>
                <animateMotion
                  dur={`${2 + Math.random() * 2}s`}
                  repeatCount="indefinite"
                  path={path}
                  begin={`${(i * 0.3) % 3}s`}
                />
              </circle>
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          const r = nodeRadius(node.reach);
          const color = tierColor(node.tier);
          const isHovered = hoveredNode?.id === node.id;

          return (
            <g
              key={node.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Glow */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r + 4}
                fill={color}
                opacity={isHovered ? 0.3 : 0.1}
                filter="url(#amp-glow)"
                className="transition-opacity duration-200"
              />
              {/* Node circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                fill={`${color}40`}
                stroke={color}
                strokeWidth={isHovered ? 2 : 1}
                className="transition-all duration-200"
              />
              {/* Label */}
              <text
                x={pos.x}
                y={pos.y + r + 14}
                textAnchor="middle"
                fill="#94a3b8"
                fontSize="9"
                className="select-none"
              >
                {node.name.length > 12 ? `${node.name.slice(0, 12)}...` : node.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      {hoveredNode && (
        <div className="absolute top-4 right-4 bg-loom-surface/95 backdrop-blur-lg border border-white/10 rounded-lg p-3 text-xs shadow-xl z-10">
          <p className="font-semibold text-loom-text mb-1">{hoveredNode.name}</p>
          <div className="space-y-1 text-[10px]">
            <div className="flex justify-between gap-4">
              <span className="text-loom-muted">Tier</span>
              <span className="capitalize" style={{ color: tierColor(hoveredNode.tier) }}>
                {hoveredNode.tier}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-loom-muted">Reach</span>
              <span className="font-mono text-loom-text">{hoveredNode.reach.toLocaleString()}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-loom-muted">Engagement</span>
              <span className="font-mono text-loom-text">
                {(hoveredNode.engagementRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-loom-muted">Quality</span>
              <span
                className={`capitalize ${hoveredNode.quality === 'genuine' ? 'text-green-400' : 'text-yellow-400'}`}
              >
                {hoveredNode.quality}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
