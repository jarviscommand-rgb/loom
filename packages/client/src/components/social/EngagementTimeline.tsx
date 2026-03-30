import { useState, useRef, useCallback, useEffect } from 'react';
import type { EngagementDataPoint } from '../../hooks/useApi';

/** Platform color mapping. */
const PLATFORM_COLORS: Record<string, string> = {
  twitter: '#1DA1F2',
  instagram: '#E4405F',
  tiktok: '#00F2EA',
  facebook: '#1877F2',
  reddit: '#FF4500',
  youtube: '#FF0000',
};

interface EngagementTimelineProps {
  dataPoints: EngagementDataPoint[];
  events?: Array<{ timestamp: string; label: string }>;
  height?: number;
}

export default function EngagementTimeline({
  dataPoints,
  events = [],
  height = 240,
}: EngagementTimelineProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [viewBox, setViewBox] = useState({ x: 0, scale: 1 });
  const [animationProgress, setAnimationProgress] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 800, height });

  /** Animate the line drawing in. */
  useEffect(() => {
    let frame: number;
    let start: number;
    const duration = 1200;

    const animate = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimationProgress(eased);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [dataPoints]);

  /** Resize observer. */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({ width: entry.contentRect.width, height });
      }
    });
    observer.observe(svg.parentElement as Element);
    return () => observer.disconnect();
  }, [height]);

  /** Handle zoom via mouse wheel. */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(1, Math.min(5, viewBox.scale * delta));
      const svgRect = svgRef.current?.getBoundingClientRect();
      if (svgRect) {
        const mouseX = (e.clientX - svgRect.left) / svgRect.width;
        const newX = viewBox.x + mouseX * (1 / viewBox.scale - 1 / newScale) * dimensions.width;
        setViewBox({ x: Math.max(0, newX), scale: newScale });
      }
    },
    [viewBox, dimensions.width]
  );

  if (dataPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-loom-muted text-sm">
        No engagement data available
      </div>
    );
  }

  const padding = { top: 20, right: 40, bottom: 30, left: 50 };
  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;

  const maxEngagement = Math.max(...dataPoints.map((dp) => dp.totalEngagement), 1);
  const platforms = [...new Set(dataPoints.flatMap((dp) => Object.keys(dp.byPlatform)))];

  /** Build path for a specific platform. */
  const buildPath = (platform: string): string => {
    const points = dataPoints.map((dp, i) => {
      const x = padding.left + (i / Math.max(dataPoints.length - 1, 1)) * chartWidth;
      const value = dp.byPlatform[platform] || 0;
      const y = padding.top + chartHeight - (value / maxEngagement) * chartHeight;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    });
    return points.join(' ');
  };

  /** Build the total engagement area path. */
  const buildAreaPath = (): string => {
    const topPoints = dataPoints.map((dp, i) => {
      const x = padding.left + (i / Math.max(dataPoints.length - 1, 1)) * chartWidth;
      const y = padding.top + chartHeight - (dp.totalEngagement / maxEngagement) * chartHeight;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    });
    const bottomRight = `L ${padding.left + chartWidth} ${padding.top + chartHeight}`;
    const bottomLeft = `L ${padding.left} ${padding.top + chartHeight} Z`;
    return topPoints.join(' ') + ' ' + bottomRight + ' ' + bottomLeft;
  };

  /** Y-axis labels. */
  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const value = (maxEngagement / yTicks) * i;
    const y = padding.top + chartHeight - (i / yTicks) * chartHeight;
    return { value, y };
  });

  /** Hovered data point tooltip. */
  const hoveredPoint =
    hoveredIndex !== null && hoveredIndex < dataPoints.length ? dataPoints[hoveredIndex] : null;
  const hoveredX =
    hoveredIndex !== null
      ? padding.left + (hoveredIndex / Math.max(dataPoints.length - 1, 1)) * chartWidth
      : 0;

  return (
    <div className="relative w-full" style={{ height: dimensions.height }}>
      <svg
        ref={svgRef}
        width="100%"
        height={dimensions.height}
        className="overflow-visible"
        onWheel={handleWheel}
      >
        <defs>
          <linearGradient id="engagement-area-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </linearGradient>
          <clipPath id="animation-clip">
            <rect
              x={padding.left}
              y={0}
              width={chartWidth * animationProgress}
              height={dimensions.height}
            />
          </clipPath>
        </defs>

        {/* Grid lines */}
        {yLabels.map(({ value, y }) => (
          <g key={value}>
            <line
              x1={padding.left}
              y1={y}
              x2={padding.left + chartWidth}
              y2={y}
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="4 4"
            />
            <text x={padding.left - 8} y={y + 3} textAnchor="end" fill="#64748b" fontSize="9">
              {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toFixed(0)}
            </text>
          </g>
        ))}

        {/* Event markers */}
        {events.map((event, i) => {
          const eventDate = new Date(event.timestamp).getTime();
          const minTime = new Date(dataPoints[0].timestamp).getTime();
          const maxTime = new Date(dataPoints[dataPoints.length - 1].timestamp).getTime();
          const ratio = (eventDate - minTime) / (maxTime - minTime || 1);
          const x = padding.left + ratio * chartWidth;
          if (ratio < 0 || ratio > 1) return null;
          return (
            <g key={i}>
              <line
                x1={x}
                y1={padding.top}
                x2={x}
                y2={padding.top + chartHeight}
                stroke="rgba(167,139,250,0.3)"
                strokeDasharray="3 3"
              />
              <text
                x={x}
                y={padding.top - 4}
                textAnchor="middle"
                fill="#a78bfa"
                fontSize="8"
                className="select-none"
              >
                {event.label}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <g clipPath="url(#animation-clip)">
          <path d={buildAreaPath()} fill="url(#engagement-area-grad)" />
        </g>

        {/* Platform lines */}
        <g clipPath="url(#animation-clip)">
          {platforms.map((platform) => (
            <path
              key={platform}
              d={buildPath(platform)}
              fill="none"
              stroke={PLATFORM_COLORS[platform] || '#64748b'}
              strokeWidth="1.5"
              strokeLinejoin="round"
              opacity="0.7"
            />
          ))}
        </g>

        {/* Hover interaction areas */}
        {dataPoints.map((_, i) => {
          const x = padding.left + (i / Math.max(dataPoints.length - 1, 1)) * chartWidth;
          return (
            <rect
              key={i}
              x={x - chartWidth / dataPoints.length / 2}
              y={padding.top}
              width={chartWidth / dataPoints.length}
              height={chartHeight}
              fill="transparent"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          );
        })}

        {/* Hover line */}
        {hoveredIndex !== null && (
          <line
            x1={hoveredX}
            y1={padding.top}
            x2={hoveredX}
            y2={padding.top + chartHeight}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="1"
          />
        )}

        {/* X-axis labels */}
        {dataPoints
          .filter(
            (_, i) =>
              i === 0 ||
              i === dataPoints.length - 1 ||
              i % Math.max(1, Math.floor(dataPoints.length / 6)) === 0
          )
          .map((dp, _idx, arr) => {
            const originalIndex = dataPoints.indexOf(dp);
            const x =
              padding.left + (originalIndex / Math.max(dataPoints.length - 1, 1)) * chartWidth;
            return (
              <text
                key={dp.timestamp}
                x={x}
                y={padding.top + chartHeight + 16}
                textAnchor={
                  originalIndex === 0 ? 'start' : dp === arr[arr.length - 1] ? 'end' : 'middle'
                }
                fill="#64748b"
                fontSize="9"
              >
                {new Date(dp.timestamp).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </text>
            );
          })}
      </svg>

      {/* Tooltip */}
      {hoveredPoint && (
        <div
          className="absolute pointer-events-none bg-loom-surface/95 backdrop-blur-md border border-white/10 rounded-lg px-3 py-2 shadow-xl z-10"
          style={{
            left: Math.min(hoveredX, dimensions.width - 180),
            top: padding.top,
          }}
        >
          <p className="text-[10px] text-loom-muted mb-1">
            {new Date(hoveredPoint.timestamp).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
          <p className="text-xs font-semibold text-loom-text mb-1">
            Total: {hoveredPoint.totalEngagement.toLocaleString()}
          </p>
          <div className="space-y-0.5">
            {Object.entries(hoveredPoint.byPlatform).map(([platform, value]) => (
              <div key={platform} className="flex items-center gap-1.5 text-[10px]">
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: PLATFORM_COLORS[platform] || '#64748b' }}
                />
                <span className="text-loom-muted capitalize">{platform}</span>
                <span className="text-loom-text font-mono ml-auto">
                  {(value as number).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform legend */}
      <div className="absolute bottom-1 right-2 flex gap-3">
        {platforms.map((platform) => (
          <div key={platform} className="flex items-center gap-1 text-[9px]">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: PLATFORM_COLORS[platform] || '#64748b' }}
            />
            <span className="text-loom-muted capitalize">{platform}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
