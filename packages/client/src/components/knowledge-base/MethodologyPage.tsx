import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Calculator, Beaker } from 'lucide-react';
import { KnowledgeBaseSkeleton } from '../LoadingSkeleton';

interface MethodologyVariable {
  name: string;
  description: string;
  range: string;
  unit: string;
}

interface MethodologyEntry {
  id: string;
  name: string;
  module: string;
  description: string;
  formula: string;
  variables: MethodologyVariable[];
  weightJustification: string;
  examples: Array<{
    scenario: string;
    expectedScore: string;
    explanation: string;
  }>;
  range: { min: number; max: number };
  unit: string;
}

/** Scoring methodology documentation page. */
export default function MethodologyPage() {
  const [methodologies, setMethodologies] = useState<MethodologyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/knowledge-base/methodology')
      .then((r) => r.json())
      .then((data) => {
        setMethodologies(data.methodologies || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <KnowledgeBaseSkeleton />;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 page-enter">
      <div className="flex items-center gap-3">
        <Link
          to="/knowledge-base"
          className="text-loom-muted hover:text-loom-text transition-colors p-1 rounded hover:bg-white/5"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-heading-lg font-serif font-bold text-loom-text">
            Scoring Methodology
          </h1>
          <p className="text-body-sm text-loom-muted">
            {methodologies.length} algorithms fully documented
          </p>
        </div>
      </div>

      <div className="text-body-sm text-loom-muted bg-loom-accent/5 border border-loom-accent/20 rounded-lg p-3">
        Every number in LOOM is computed from a transparent, documented algorithm. Click any
        algorithm below to see the full formula, variables, weight justifications, and worked
        examples.
      </div>

      {/* Methodology cards */}
      <div className="space-y-3 list-stagger">
        {methodologies.map((entry) => (
          <MethodologyCard
            key={entry.id}
            entry={entry}
            expanded={expandedId === entry.id}
            onToggle={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
          />
        ))}
      </div>
    </div>
  );
}

function MethodologyCard({
  entry,
  expanded,
  onToggle,
}: {
  entry: MethodologyEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="kb-card overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-lg bg-loom-glow/10 flex items-center justify-center shrink-0">
          <Calculator size={16} className="text-loom-glow" />
        </div>
        <div className="flex-1">
          <h3 className="text-heading-sm text-loom-text">{entry.name}</h3>
          <p className="text-micro text-loom-muted">
            {entry.module} · Range: {entry.range.min}–{entry.range.max} {entry.unit}
          </p>
        </div>
        <div
          className="text-loom-muted transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(0)' : 'rotate(-90deg)' }}
        >
          <ChevronDown size={14} />
        </div>
      </button>

      {/* Expanded */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-loom-border/20 pt-3 accordion-enter">
          {/* Description */}
          <p className="text-body-sm text-loom-muted leading-relaxed">{entry.description}</p>

          {/* Formula */}
          <div className="bg-loom-bg/80 border border-loom-border/20 rounded-lg p-3">
            <h4 className="text-micro text-loom-muted uppercase tracking-wider mb-1.5">Formula</h4>
            <code className="text-body-sm font-mono text-loom-accent break-all">
              {entry.formula}
            </code>
          </div>

          {/* Variables table */}
          <div>
            <h4 className="text-body-sm font-semibold text-loom-text mb-2">Variables</h4>
            <div className="border border-loom-border/20 rounded-lg overflow-hidden">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="bg-white/[0.03]">
                    <th className="text-left text-micro text-loom-muted font-normal px-3 py-2">
                      Name
                    </th>
                    <th className="text-left text-micro text-loom-muted font-normal px-3 py-2">
                      Range
                    </th>
                    <th className="text-left text-micro text-loom-muted font-normal px-3 py-2">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entry.variables.map((v, i) => (
                    <tr
                      key={i}
                      className="border-t border-loom-border/10 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-3 py-2 font-mono text-loom-text">{v.name}</td>
                      <td className="px-3 py-2 text-loom-muted">
                        {v.range} {v.unit}
                      </td>
                      <td className="px-3 py-2 text-loom-muted">{v.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weight justification */}
          <div>
            <h4 className="text-body-sm font-semibold text-loom-text mb-1">Weight Justification</h4>
            <p className="text-body-sm text-loom-muted leading-relaxed">
              {entry.weightJustification}
            </p>
          </div>

          {/* Examples */}
          {entry.examples.length > 0 && (
            <div>
              <h4 className="text-body-sm font-semibold text-loom-text mb-2 flex items-center gap-1.5">
                <Beaker size={12} className="text-loom-glow" />
                Worked Examples
              </h4>
              <div className="space-y-2">
                {entry.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="border border-loom-border/20 rounded-lg p-3 bg-loom-bg/30 hover:bg-loom-bg/50 transition-colors"
                  >
                    <div className="text-body-sm text-loom-text font-medium mb-1">
                      {ex.scenario}
                    </div>
                    <div className="text-micro text-loom-accent font-mono mb-1">
                      Expected: {ex.expectedScore}
                    </div>
                    <p className="text-micro text-loom-muted">{ex.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
