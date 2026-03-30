import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface EngagementQualityGaugeProps {
  /** Overall quality score 0-100. */
  quality: number;
  /** Bot vs real ratio 0-1 (0 = all bots, 1 = all real). */
  realRatio: number;
  /** Active vs passive ratio 0-1 (0 = all passive, 1 = all active). */
  activeRatio: number;
  /** Optional size in pixels. */
  size?: number;
}

/** Interpolate between two hex colors. */
function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    const c = hex.replace('#', '');
    return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

/** Quality label from score. */
function qualityLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  if (score >= 20) return 'Poor';
  return 'Critical';
}

export default function EngagementQualityGauge({
  quality,
  realRatio,
  activeRatio,
  size = 200,
}: EngagementQualityGaugeProps) {
  const [animatedQuality, setAnimatedQuality] = useState(0);
  const [animatedReal, setAnimatedReal] = useState(0);
  const [animatedActive, setAnimatedActive] = useState(0);

  /* Animated fill on mount */
  useEffect(() => {
    const duration = 1200;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setAnimatedQuality(quality * eased);
      setAnimatedReal(realRatio * eased);
      setAnimatedActive(activeRatio * eased);

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [quality, realRatio, activeRatio]);

  const cx = size / 2;
  const cy = size / 2;

  /* Ring dimensions */
  const outerR = size * 0.42;
  const outerWidth = size * 0.06;
  const innerR = size * 0.32;
  const innerWidth = size * 0.06;

  /** Generate arc path for a circular gauge. */
  const arcPath = (radius: number, startAngle: number, endAngle: number): string => {
    const start = {
      x: cx + radius * Math.cos(startAngle),
      y: cy + radius * Math.sin(startAngle),
    };
    const end = {
      x: cx + radius * Math.cos(endAngle),
      y: cy + radius * Math.sin(endAngle),
    };
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  /* Arc angles: start from top (-90deg), sweep proportionally */
  const startAngle = -Math.PI / 2;
  const fullSweep = Math.PI * 2 * 0.75; /* 270deg gauge */

  const outerAngle = startAngle + fullSweep * animatedActive;
  const innerAngle = startAngle + fullSweep * animatedReal;

  /* Colors */
  const qualityColor = lerpColor('#ef4444', '#22c55e', quality / 100);
  const realColor = animatedReal > 0.7 ? '#22c55e' : animatedReal > 0.4 ? '#f97316' : '#ef4444';
  const activeColor = '#22d3ee';

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <filter id="gauge-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background tracks */}
        <path
          d={arcPath(outerR, startAngle, startAngle + fullSweep)}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={outerWidth}
          strokeLinecap="round"
        />
        <path
          d={arcPath(innerR, startAngle, startAngle + fullSweep)}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={innerWidth}
          strokeLinecap="round"
        />

        {/* Outer ring: active vs passive */}
        {animatedActive > 0.01 && (
          <path
            d={arcPath(outerR, startAngle, outerAngle)}
            fill="none"
            stroke={activeColor}
            strokeWidth={outerWidth}
            strokeLinecap="round"
            filter="url(#gauge-glow)"
            opacity={0.9}
          />
        )}

        {/* Inner ring: bot vs real */}
        {animatedReal > 0.01 && (
          <path
            d={arcPath(innerR, startAngle, innerAngle)}
            fill="none"
            stroke={realColor}
            strokeWidth={innerWidth}
            strokeLinecap="round"
            filter="url(#gauge-glow)"
            opacity={0.9}
          />
        )}

        {/* Center quality score */}
        <text
          x={cx}
          y={cy - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={qualityColor}
          fontSize={size * 0.18}
          fontWeight="bold"
          fontFamily="JetBrains Mono, monospace"
        >
          {Math.round(animatedQuality)}
        </text>
        <text
          x={cx}
          y={cy + size * 0.1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#94a3b8"
          fontSize={size * 0.06}
          fontFamily="Crimson Pro, serif"
        >
          {qualityLabel(quality)}
        </text>

        {/* Tick marks at gauge ends */}
        <circle
          cx={cx + outerR * Math.cos(startAngle + fullSweep)}
          cy={cy + outerR * Math.sin(startAngle + fullSweep)}
          r={2}
          fill="rgba(255,255,255,0.2)"
        />
        <circle
          cx={cx + innerR * Math.cos(startAngle + fullSweep)}
          cy={cy + innerR * Math.sin(startAngle + fullSweep)}
          r={2}
          fill="rgba(255,255,255,0.2)"
        />
      </svg>

      {/* Legend */}
      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: activeColor }} />
          <span className="text-[10px] text-loom-muted">
            Active {(animatedActive * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: realColor }} />
          <span className="text-[10px] text-loom-muted">
            Real {(animatedReal * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

/** Compact inline version of the gauge for dashboard cards. */
export function EngagementQualityBadge({ quality }: { quality: number }) {
  const color =
    quality >= 70
      ? 'text-green-400 bg-green-400/10'
      : quality >= 40
        ? 'text-yellow-400 bg-yellow-400/10'
        : 'text-red-400 bg-red-400/10';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono ${color}`}
    >
      <Activity size={10} />
      {quality}
    </span>
  );
}
