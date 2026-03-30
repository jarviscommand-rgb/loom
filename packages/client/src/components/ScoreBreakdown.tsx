import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';

// ============================================================
// Score Breakdown Component
//
// Animated, expandable visualization of any computed metric's
// full variable breakdown. Reusable for tension scores, NIS,
// sentiment, arc scores, or any other LOOM metric.
// ============================================================

interface ScoreVariable {
  name: string;
  rawValue: number;
  normalizedValue: number;
  weight: number;
  weightedContribution: number;
  description: string;
}

interface ScoreBreakdownData {
  metricName: string;
  finalScore: number;
  formula: string;
  variables: ScoreVariable[];
  minValue?: number;
  maxValue?: number;
  scoreUnit?: string;
}

interface ScoreBreakdownProps {
  /** The breakdown data to display. */
  breakdown: ScoreBreakdownData;
  /** Whether the panel starts expanded. */
  defaultExpanded?: boolean;
  /** Compact mode for inline use. */
  compact?: boolean;
}

/** Get color class based on normalized value. */
function getContributionColor(value: number): string {
  if (value >= 0.6) return 'bg-emerald-500';
  if (value >= 0.3) return 'bg-amber-500';
  return 'bg-red-500';
}

/** Get text color for the score value. */
function getScoreColor(score: number, min: number, max: number): string {
  const normalized = max > min ? (score - min) / (max - min) : 0.5;
  if (normalized >= 0.7) return 'text-emerald-400';
  if (normalized >= 0.4) return 'text-amber-400';
  return 'text-red-400';
}

export default function ScoreBreakdown({
  breakdown,
  defaultExpanded = false,
  compact = false,
}: ScoreBreakdownProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    if (expanded) {
      const timer = setTimeout(() => setAnimateIn(true), 50);
      return () => clearTimeout(timer);
    }
    setAnimateIn(false);
  }, [expanded]);

  const min = breakdown.minValue ?? 0;
  const max = breakdown.maxValue ?? 1;
  const scoreColor = getScoreColor(breakdown.finalScore, min, max);

  return (
    <div className="rounded-lg border border-loom-border/50 bg-loom-bg/50 overflow-hidden">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expanded ? (
            <ChevronDown size={14} className="text-loom-muted" />
          ) : (
            <ChevronRight size={14} className="text-loom-muted" />
          )}
          <span className="text-xs font-medium text-loom-text">{breakdown.metricName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-mono font-bold ${scoreColor}`}>
            {breakdown.finalScore.toFixed(breakdown.finalScore >= 10 ? 1 : 3)}
          </span>
          {breakdown.scoreUnit && (
            <span className="text-[10px] text-loom-muted">{breakdown.scoreUnit}</span>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div
          className={`border-t border-loom-border/30 px-3 py-2 space-y-3 transition-opacity duration-300 ${
            animateIn ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* Formula */}
          {!compact && (
            <div className="flex items-start gap-1.5 text-[10px] text-loom-muted bg-white/3 rounded px-2 py-1.5">
              <Info size={10} className="mt-0.5 shrink-0" />
              <code className="font-mono break-all">{breakdown.formula}</code>
            </div>
          )}

          {/* Variables */}
          <div className="space-y-2">
            {breakdown.variables.map((variable, idx) => (
              <VariableRow
                key={variable.name}
                variable={variable}
                animateIn={animateIn}
                delay={idx * 80}
                compact={compact}
              />
            ))}
          </div>

          {/* Weight sum check */}
          {!compact && (
            <div className="flex justify-between text-[10px] text-loom-muted pt-1 border-t border-loom-border/20">
              <span>
                Total weight:{' '}
                {(breakdown.variables.reduce((s, v) => s + v.weight, 0) * 100).toFixed(1)}%
              </span>
              <span>
                Sum of contributions:{' '}
                {breakdown.variables.reduce((s, v) => s + v.weightedContribution, 0).toFixed(4)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** A single variable row with animated bar and description. */
function VariableRow({
  variable,
  animateIn,
  delay,
  compact,
}: {
  variable: ScoreVariable;
  animateIn: boolean;
  delay: number;
  compact: boolean;
}) {
  const [showDesc, setShowDesc] = useState(false);
  const barColor = getContributionColor(variable.normalizedValue);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowDesc(!showDesc)}
          className="flex items-center gap-1 text-xs text-loom-text hover:text-loom-accent transition-colors"
        >
          <span className="font-medium">{variable.name}</span>
          <Info size={9} className="text-loom-muted" />
        </button>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="text-loom-muted">
            raw: {variable.rawValue.toFixed(variable.rawValue >= 10 ? 1 : 3)}
          </span>
          <span className="text-loom-muted">w: {(variable.weight * 100).toFixed(0)}%</span>
          <span className="text-loom-text font-semibold">
            +{variable.weightedContribution.toFixed(4)}
          </span>
        </div>
      </div>

      {/* Animated bar */}
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{
            width: animateIn ? `${Math.max(variable.normalizedValue * 100, 1)}%` : '0%',
            transitionDelay: `${delay}ms`,
          }}
        />
      </div>

      {/* Weight bar (subtle, below) */}
      {!compact && (
        <div className="h-0.5 bg-white/3 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-loom-accent/30 transition-all duration-500 ease-out"
            style={{
              width: animateIn ? `${variable.weight * 100}%` : '0%',
              transitionDelay: `${delay + 100}ms`,
            }}
          />
        </div>
      )}

      {/* Description tooltip */}
      {showDesc && (
        <p className="text-[10px] text-loom-muted leading-relaxed pl-2 border-l border-loom-accent/30 animate-fadeSlideIn">
          {variable.description}
        </p>
      )}
    </div>
  );
}

/**
 * Slide-in panel variant — used when clicking a score in the UI.
 * Slides in from the right side of the screen.
 */
export function ScoreBreakdownPanel({
  breakdown,
  onClose,
}: {
  breakdown: ScoreBreakdownData | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!breakdown) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40 animate-fadeSlideIn" onClick={onClose} />
      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-96 max-w-full bg-loom-surface border-l border-loom-border z-50 overflow-y-auto shadow-2xl shadow-black/50 animate-slideInRight">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-loom-text">Score Breakdown</h2>
            <button
              onClick={onClose}
              className="text-loom-muted hover:text-loom-text text-xs px-2 py-1 rounded hover:bg-white/5"
            >
              ESC
            </button>
          </div>
          <ScoreBreakdown breakdown={breakdown} defaultExpanded compact={false} />
        </div>
      </div>
    </>
  );
}
