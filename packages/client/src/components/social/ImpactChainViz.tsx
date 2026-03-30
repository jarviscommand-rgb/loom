import { useState, useEffect } from 'react';
import { Megaphone, Share2, Newspaper, TrendingUp, Zap, ChevronRight } from 'lucide-react';

/** Stage in the impact chain. */
interface ImpactStage {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  metrics: { label: string; value: string }[];
  description: string;
}

interface ImpactChainVizProps {
  /** Announcement reach. */
  totalReach?: number;
  /** Social amplification count. */
  socialAmplification?: number;
  /** Media coverage count. */
  mediaCoverage?: number;
  /** Sentiment shift (-1 to 1). */
  sentimentShift?: number;
  /** Actions triggered. */
  actionsTaken?: number;
}

/** Format large numbers. */
function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export default function ImpactChainViz({
  totalReach = 125000,
  socialAmplification = 8400,
  mediaCoverage = 12,
  sentimentShift = 0.15,
  actionsTaken = 340,
}: ImpactChainVizProps) {
  const [litStages, setLitStages] = useState(0);
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);

  /* Sequential stage lighting animation */
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= 5; i++) {
      timers.push(setTimeout(() => setLitStages(i), i * 300));
    }
    return () => timers.forEach(clearTimeout);
  }, []);

  const stages: ImpactStage[] = [
    {
      id: 'announcement',
      label: 'Announcement',
      icon: <Megaphone size={18} />,
      color: '#8b5cf6',
      metrics: [
        { label: 'Reach', value: formatNumber(totalReach) },
        { label: 'Platforms', value: '4' },
      ],
      description: 'Initial narrative release across platforms, seeding the information ecosystem.',
    },
    {
      id: 'social',
      label: 'Social Spread',
      icon: <Share2 size={18} />,
      color: '#6366f1',
      metrics: [
        { label: 'Amplification', value: formatNumber(socialAmplification) },
        { label: 'Shares', value: formatNumber(Math.round(socialAmplification * 0.6)) },
      ],
      description: 'Organic and influencer-driven amplification across social networks.',
    },
    {
      id: 'media',
      label: 'Media Pickup',
      icon: <Newspaper size={18} />,
      color: '#22d3ee',
      metrics: [
        { label: 'Articles', value: String(mediaCoverage) },
        { label: 'Sources', value: String(Math.ceil(mediaCoverage * 0.7)) },
      ],
      description: 'Traditional and digital media coverage triggered by social momentum.',
    },
    {
      id: 'sentiment',
      label: 'Sentiment Shift',
      icon: <TrendingUp size={18} />,
      color: '#f97316',
      metrics: [
        {
          label: 'Shift',
          value: `${sentimentShift > 0 ? '+' : ''}${(sentimentShift * 100).toFixed(0)}%`,
        },
        { label: 'Direction', value: sentimentShift > 0 ? 'Positive' : 'Negative' },
      ],
      description: 'Measurable change in public sentiment and narrative framing.',
    },
    {
      id: 'action',
      label: 'Action',
      icon: <Zap size={18} />,
      color: '#ef4444',
      metrics: [
        { label: 'Actions', value: formatNumber(actionsTaken) },
        { label: 'Type', value: 'Mixed' },
      ],
      description:
        'Real-world behavioral changes: policy pressure, consumer action, social mobilization.',
    },
  ];

  return (
    <div className="w-full">
      {/* Flow chain */}
      <div className="flex items-center gap-1 overflow-x-auto pb-4">
        {stages.map((stage, idx) => {
          const isLit = idx < litStages;
          const isHovered = hoveredStage === stage.id;

          return (
            <div key={stage.id} className="flex items-center">
              {/* Stage node */}
              <div
                className={`relative flex flex-col items-center p-4 rounded-xl border transition-all duration-300 cursor-pointer min-w-[130px] ${
                  isLit
                    ? 'bg-white/[0.06] border-white/10'
                    : 'bg-white/[0.02] border-white/5 opacity-40'
                } ${isHovered ? 'scale-105 z-10' : ''}`}
                style={{
                  borderColor: isLit ? `${stage.color}30` : undefined,
                  boxShadow: isHovered ? `0 0 20px ${stage.color}20` : undefined,
                }}
                onMouseEnter={() => setHoveredStage(stage.id)}
                onMouseLeave={() => setHoveredStage(null)}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2 transition-all duration-300"
                  style={{
                    backgroundColor: isLit ? `${stage.color}20` : 'rgba(255,255,255,0.05)',
                    color: isLit ? stage.color : '#64748b',
                  }}
                >
                  {stage.icon}
                </div>

                {/* Label */}
                <span
                  className="text-[11px] font-semibold mb-2 transition-colors duration-300"
                  style={{ color: isLit ? stage.color : '#64748b' }}
                >
                  {stage.label}
                </span>

                {/* Metrics */}
                <div className="space-y-1 w-full">
                  {stage.metrics.map((metric) => (
                    <div key={metric.label} className="flex justify-between gap-2">
                      <span className="text-[9px] text-loom-muted">{metric.label}</span>
                      <span
                        className="text-[10px] font-mono font-medium transition-colors duration-300"
                        style={{ color: isLit ? '#e2e8f0' : '#64748b' }}
                      >
                        {metric.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Animated pulse dot */}
                {isLit && (
                  <div
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: stage.color,
                      animation: 'tension-pulse 2s ease-in-out infinite',
                      animationDelay: `${idx * 0.2}s`,
                    }}
                  />
                )}
              </div>

              {/* Arrow connector */}
              {idx < stages.length - 1 && (
                <div className="flex items-center px-1">
                  <ChevronRight
                    size={16}
                    className="transition-colors duration-300"
                    style={{
                      color: idx < litStages - 1 ? stages[idx + 1].color : '#334155',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hover detail panel */}
      {hoveredStage && (
        <div className="mt-2 p-3 bg-white/[0.04] backdrop-blur-sm border border-white/5 rounded-lg transition-all duration-200">
          <p className="text-xs text-loom-text">
            {stages.find((s) => s.id === hoveredStage)?.description}
          </p>
        </div>
      )}

      {/* Flow progress indicator */}
      <div className="mt-3 flex items-center gap-1">
        <span className="text-[9px] text-loom-muted">Impact Flow</span>
        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden flex">
          {stages.map((stage, idx) => (
            <div
              key={stage.id}
              className="h-full transition-all duration-500"
              style={{
                width: `${100 / stages.length}%`,
                backgroundColor: idx < litStages ? stage.color : 'transparent',
                opacity: idx < litStages ? 0.7 : 0,
                transitionDelay: `${idx * 150}ms`,
              }}
            />
          ))}
        </div>
        <span className="text-[9px] text-loom-muted font-mono">
          {litStages}/{stages.length}
        </span>
      </div>
    </div>
  );
}
