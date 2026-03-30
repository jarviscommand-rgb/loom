import { useState, useEffect } from 'react';
import { api, type PressurePoint, type Tension, type Entity } from '../hooks/useApi';
import { AlertTriangle, Activity, Zap } from 'lucide-react';

interface TensionRadarProps {
  tensions: Tension[];
  entities: Entity[];
}

/** Mini radar gauge SVG showing overall tension level */
function RadarGauge({ pressurePoints }: { pressurePoints: PressurePoint[] }) {
  const avgScore =
    pressurePoints.length > 0
      ? pressurePoints.reduce((sum, pp) => sum + pp.score, 0) / pressurePoints.length
      : 0;
  const maxScore =
    pressurePoints.length > 0 ? Math.max(...pressurePoints.map((pp) => pp.score)) : 0;

  const rings = [0.25, 0.5, 0.75, 1.0];
  const cx = 80;
  const cy = 80;
  const maxR = 65;

  return (
    <div className="flex items-center justify-center py-3">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {/* Rings */}
        {rings.map((r, i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={maxR * r}
            fill="none"
            stroke="#1e1e2e"
            strokeWidth="1"
            strokeOpacity={0.6}
          />
        ))}

        {/* Cross lines */}
        {[0, 45, 90, 135].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={angle}
              x1={cx - Math.cos(rad) * maxR}
              y1={cy - Math.sin(rad) * maxR}
              x2={cx + Math.cos(rad) * maxR}
              y2={cy + Math.sin(rad) * maxR}
              stroke="#1e1e2e"
              strokeWidth="1"
              strokeOpacity={0.4}
            />
          );
        })}

        {/* Data points */}
        {pressurePoints.map((pp, i) => {
          const angle = (i / pressurePoints.length) * Math.PI * 2 - Math.PI / 2;
          const r = pp.score * maxR;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          const color = pp.score > 0.7 ? '#ef4444' : pp.score > 0.4 ? '#f97316' : '#eab308';
          return (
            <g key={pp.tensionId}>
              <circle cx={x} cy={y} r={4} fill={color} opacity={0.9}>
                <animate
                  attributeName="r"
                  values={pp.score > 0.7 ? '4;6;4' : '4;4;4'}
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx={x} cy={y} r={8} fill={color} opacity={0.15} />
            </g>
          );
        })}

        {/* Polygon connecting points */}
        {pressurePoints.length >= 3 && (
          <polygon
            points={pressurePoints
              .map((pp, i) => {
                const angle = (i / pressurePoints.length) * Math.PI * 2 - Math.PI / 2;
                const r = pp.score * maxR;
                return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
              })
              .join(' ')}
            fill={
              avgScore > 0.7
                ? 'rgba(239,68,68,0.08)'
                : avgScore > 0.4
                  ? 'rgba(249,115,22,0.08)'
                  : 'rgba(234,179,8,0.06)'
            }
            stroke={avgScore > 0.7 ? '#ef4444' : avgScore > 0.4 ? '#f97316' : '#eab308'}
            strokeWidth="1.5"
            strokeOpacity={0.4}
          />
        )}

        {/* Center score */}
        <text
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fill="#e2e8f0"
          fontSize="18"
          fontFamily="JetBrains Mono"
          fontWeight="bold"
        >
          {(maxScore * 100).toFixed(0)}
        </text>
        <text
          x={cx}
          y={cy + 10}
          textAnchor="middle"
          fill="#64748b"
          fontSize="8"
          fontFamily="JetBrains Mono"
          letterSpacing="0.1em"
        >
          PEAK TENSION
        </text>
      </svg>
    </div>
  );
}

/** Animated score bar */
function ScoreBar({ score, color }: { score: number; color: string }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setWidth(score * 100), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="w-full h-1.5 bg-loom-bg rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{
          width: `${width}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
          boxShadow: `0 0 8px ${color}40`,
        }}
      />
    </div>
  );
}

export default function TensionRadar({ tensions, entities }: TensionRadarProps) {
  const [pressurePoints, setPressurePoints] = useState<PressurePoint[]>([]);
  const [loading, setLoading] = useState(false);

  const entityMap = new Map(entities.map((e) => [e.id, e]));

  useEffect(() => {
    if (tensions.length === 0) {
      setPressurePoints([]);
      return;
    }
    setLoading(true);
    api
      .getPressurePoints()
      .then(setPressurePoints)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tensions]);

  const getUrgencyColor = (score: number) => {
    if (score > 0.7)
      return { classes: 'text-red-400 border-red-500/30 bg-red-500/5', hex: '#ef4444' };
    if (score > 0.4)
      return { classes: 'text-orange-400 border-orange-500/30 bg-orange-500/5', hex: '#f97316' };
    return { classes: 'text-yellow-400 border-yellow-500/30 bg-yellow-500/5', hex: '#eab308' };
  };

  const getUrgencyIcon = (score: number) => {
    if (score > 0.7) return <Zap size={14} className="text-red-400" />;
    if (score > 0.4) return <AlertTriangle size={14} className="text-orange-400" />;
    return <Activity size={14} className="text-yellow-400" />;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      simmering: 'Simmering',
      escalating: 'Escalating',
      critical: 'CRITICAL',
      resolving: 'Resolving',
      resolved: 'Resolved',
    };
    return labels[status] || status;
  };

  const getTension = (id: string) => tensions.find((t) => t.id === id);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-3">
      {tensions.length === 0 ? (
        <div className="flex items-center justify-center h-full text-loom-muted text-sm italic font-serif">
          No tensions detected. Load a narrative to reveal the pressure points...
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-loom-accent/30 border-t-loom-accent rounded-full animate-spin" />
            <span className="text-loom-muted text-sm">Scanning for narrative tensions...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Radar Gauge */}
          {pressurePoints.length > 0 && <RadarGauge pressurePoints={pressurePoints} />}

          <div className="text-xs text-loom-muted uppercase tracking-wider mb-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-loom-tension animate-pulse" />
            {pressurePoints.length} Pressure Points Detected
          </div>

          {pressurePoints.map((pp) => {
            const tension = getTension(pp.tensionId);
            if (!tension) return null;
            const party1 = entityMap.get(tension.parties[0])?.name || tension.parties[0];
            const party2 = entityMap.get(tension.parties[1])?.name || tension.parties[1];
            const urgency = getUrgencyColor(pp.score);

            return (
              <div
                key={pp.tensionId}
                className={`border rounded-lg p-3 ${urgency.classes} transition-all duration-300 hover:bg-opacity-20 ${
                  pp.score > 0.7 ? 'animate-pulse-slow' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getUrgencyIcon(pp.score)}
                    <span className="font-serif font-semibold text-sm">{pp.tensionName}</span>
                  </div>
                  <span className="text-xs font-mono opacity-70">
                    {(pp.score * 100).toFixed(0)}%
                  </span>
                </div>

                {/* Animated score bar */}
                <ScoreBar score={pp.score} color={urgency.hex} />

                <div className="flex items-center gap-2 mt-2 mb-2 text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-loom-bg/50 border border-loom-border/50">
                    {party1}
                  </span>
                  <span className="text-loom-muted">vs</span>
                  <span className="px-1.5 py-0.5 rounded bg-loom-bg/50 border border-loom-border/50">
                    {party2}
                  </span>
                </div>

                <div className="text-xs opacity-80 font-serif italic mb-2">
                  {tension.description}
                </div>

                <div className="flex gap-3 text-[10px] opacity-60 font-mono">
                  <span>Duration: {pp.factors.duration.toFixed(2)}</span>
                  <span>Escalation: {pp.factors.escalation.toFixed(2)}</span>
                  <span>Convergence: {pp.factors.convergence.toFixed(2)}</span>
                </div>

                <div className="mt-2 flex items-center gap-2 text-[10px]">
                  <span
                    className={`px-1.5 py-0.5 rounded font-mono ${
                      tension.status === 'critical'
                        ? 'bg-red-500/20 text-red-300 shadow-sm shadow-red-500/20'
                        : tension.status === 'escalating'
                          ? 'bg-orange-500/20 text-orange-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                    }`}
                  >
                    {getStatusLabel(tension.status)}
                  </span>
                  <span className="text-loom-muted font-mono">{tension.duration} days</span>
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
