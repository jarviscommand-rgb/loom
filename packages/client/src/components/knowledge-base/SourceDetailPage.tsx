import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Shield,
  Building2,
  Calendar,
  Globe,
  AlertTriangle,
  Award,
  Users,
  ChevronRight,
} from 'lucide-react';
import { KnowledgeBaseSkeleton } from '../LoadingSkeleton';

interface SourceDetail {
  id: string;
  name: string;
  country: string;
  languages: string[];
  url: string;
  politicalLeaning: string;
  ownership: { owner: string; conglomerate?: string; politicalAffiliation?: string; notes: string };
  editorialGoal: string;
  reliabilityScore: number;
  audienceTypes: string[];
  biasDirection: string;
  signalWeight: number;
  extendedProfile?: {
    ownershipChain: Array<{ entity: string; role: string; stake?: string; since?: string }>;
    politicalHistory: Array<{
      period: string;
      stance: string;
      details: string;
      administration: string;
    }>;
    editorialStances: Array<{ topic: string; stance: string; examples: string[] }>;
    audienceDemographics: {
      estimatedMonthlyReach: string;
      primaryDemographic: string;
      geographicFocus: string;
      platformBreakdown: Record<string, string>;
    };
    reliabilityRecord: Array<{
      incident: string;
      date: string;
      impact: string;
      outcome: string;
    }>;
    biasExamples: Array<{
      topic: string;
      expectedCoverage: string;
      actualCoverage: string;
      analysis: string;
    }>;
    pressFreedomIncidents?: Array<{
      date: string;
      description: string;
      outcome: string;
    }>;
    awards?: Array<{ name: string; year: string; category?: string }>;
    foundingContext: string;
    keyMilestones: Array<{ year: string; event: string }>;
  };
}

/** Individual source deep-dive page. */
export default function SourceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [source, setSource] = useState<SourceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('overview');

  useEffect(() => {
    if (!id) return;
    fetch(`/api/knowledge-base/sources/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSource(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <KnowledgeBaseSkeleton />;
  if (!source) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center">
        <p className="text-loom-muted">Source not found.</p>
        <Link to="/knowledge-base/sources" className="text-loom-accent text-sm">
          Back to sources
        </Link>
      </div>
    );
  }

  const ext = source.extendedProfile;
  const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'ownership', label: 'Ownership' },
    { id: 'political', label: 'Political History' },
    { id: 'reliability', label: 'Reliability' },
    { id: 'bias', label: 'Bias Analysis' },
    ...(ext?.pressFreedomIncidents?.length ? [{ id: 'freedom', label: 'Press Freedom' }] : []),
    ...(ext?.awards?.length ? [{ id: 'awards', label: 'Awards' }] : []),
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6 animate-fadeSlideIn">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-loom-muted">
        <Link to="/knowledge-base" className="hover:text-loom-text">
          Knowledge Base
        </Link>
        <ChevronRight size={10} />
        <Link to="/knowledge-base/sources" className="hover:text-loom-text">
          Sources
        </Link>
        <ChevronRight size={10} />
        <span className="text-loom-text">{source.name}</span>
      </div>

      {/* Hero section */}
      <div className="border border-loom-border/50 rounded-xl p-6 bg-loom-surface/30">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-loom-text">{source.name}</h1>
            <p className="text-sm text-loom-muted mt-1">{source.editorialGoal}</p>
          </div>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-loom-accent flex items-center gap-1 hover:underline"
          >
            <Globe size={12} />
            Visit site
          </a>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            icon={<Shield size={14} />}
            label="Reliability"
            value={source.reliabilityScore.toFixed(2)}
            color={
              source.reliabilityScore >= 0.7
                ? 'text-emerald-400'
                : source.reliabilityScore >= 0.5
                  ? 'text-amber-400'
                  : 'text-red-400'
            }
          />
          <StatCard
            icon={<AlertTriangle size={14} />}
            label="Bias Direction"
            value={source.biasDirection}
            color="text-loom-text"
          />
          <StatCard
            icon={<Building2 size={14} />}
            label="Owner"
            value={source.ownership.owner}
            color="text-loom-text"
          />
          <StatCard
            icon={<Users size={14} />}
            label="Signal Weight"
            value={source.signalWeight.toFixed(1)}
            color="text-loom-accent"
          />
        </div>
      </div>

      {/* Section navigation */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`text-xs px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              activeSection === section.id
                ? 'bg-loom-accent/20 text-loom-accent'
                : 'text-loom-muted hover:text-loom-text hover:bg-white/5'
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className="border border-loom-border/30 rounded-xl p-5 bg-loom-bg/50 min-h-[300px]">
        {activeSection === 'overview' && <OverviewSection source={source} ext={ext} />}
        {activeSection === 'ownership' && ext && <OwnershipSection chain={ext.ownershipChain} />}
        {activeSection === 'political' && ext && (
          <PoliticalHistorySection history={ext.politicalHistory} />
        )}
        {activeSection === 'reliability' && ext && (
          <ReliabilitySection record={ext.reliabilityRecord} />
        )}
        {activeSection === 'bias' && ext && <BiasSection examples={ext.biasExamples} />}
        {activeSection === 'freedom' && ext?.pressFreedomIncidents && (
          <PressFreedomSection incidents={ext.pressFreedomIncidents} />
        )}
        {activeSection === 'awards' && ext?.awards && <AwardsSection awards={ext.awards} />}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="bg-loom-bg/50 border border-loom-border/20 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-loom-muted mb-1">
        {icon}
        <span className="text-[10px]">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function OverviewSection({
  source,
  ext,
}: {
  source: SourceDetail;
  ext?: SourceDetail['extendedProfile'];
}) {
  return (
    <div className="space-y-6">
      {ext?.foundingContext && (
        <div>
          <h3 className="text-sm font-semibold text-loom-text mb-2">Founding Context</h3>
          <p className="text-xs text-loom-muted leading-relaxed">{ext.foundingContext}</p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-loom-text mb-2">Ownership Notes</h3>
        <p className="text-xs text-loom-muted leading-relaxed">{source.ownership.notes}</p>
      </div>

      {ext?.audienceDemographics && (
        <div>
          <h3 className="text-sm font-semibold text-loom-text mb-2">Audience Demographics</h3>
          <div className="grid grid-cols-2 gap-3">
            <InfoRow label="Monthly Reach" value={ext.audienceDemographics.estimatedMonthlyReach} />
            <InfoRow label="Primary Demo" value={ext.audienceDemographics.primaryDemographic} />
            <InfoRow label="Geographic Focus" value={ext.audienceDemographics.geographicFocus} />
            {Object.entries(ext.audienceDemographics.platformBreakdown).map(([k, v]) => (
              <InfoRow key={k} label={k} value={v} />
            ))}
          </div>
        </div>
      )}

      {ext?.keyMilestones && ext.keyMilestones.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-loom-text mb-2">Key Milestones</h3>
          <div className="space-y-2 border-l border-loom-border/30 pl-4">
            {ext.keyMilestones.map((m, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-loom-accent/50" />
                <span className="text-[10px] font-mono text-loom-accent">{m.year}</span>
                <p className="text-xs text-loom-muted">{m.event}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OwnershipSection({
  chain,
}: {
  chain: Array<{ entity: string; role: string; stake?: string; since?: string }>;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-loom-text">Ownership Chain</h3>
      <div className="space-y-2">
        {chain.map((entry, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border border-loom-border/20 rounded-lg p-3 bg-loom-surface/20"
          >
            <div className="w-8 h-8 rounded bg-loom-accent/10 flex items-center justify-center text-xs text-loom-accent font-bold">
              {i + 1}
            </div>
            <div className="flex-1">
              <div className="text-xs font-semibold text-loom-text">{entry.entity}</div>
              <div className="text-[10px] text-loom-muted">
                {entry.role}
                {entry.stake && ` · ${entry.stake}`}
                {entry.since && ` · since ${entry.since}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PoliticalHistorySection({
  history,
}: {
  history: Array<{
    period: string;
    stance: string;
    details: string;
    administration: string;
  }>;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-loom-text">Political History</h3>
      <div className="space-y-3">
        {history.map((entry, i) => (
          <div key={i} className="border border-loom-border/20 rounded-lg p-3 bg-loom-surface/10">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-loom-accent">{entry.period}</span>
              <span className="text-[10px] text-loom-muted">{entry.administration}</span>
            </div>
            <div className="text-xs font-semibold text-loom-text mb-1">{entry.stance}</div>
            <p className="text-[11px] text-loom-muted leading-relaxed">{entry.details}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReliabilitySection({
  record,
}: {
  record: Array<{
    incident: string;
    date: string;
    impact: string;
    outcome: string;
  }>;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-loom-text">Reliability Track Record</h3>
      {record.length === 0 ? (
        <p className="text-xs text-loom-muted">No incidents recorded.</p>
      ) : (
        <div className="space-y-2">
          {record.map((entry, i) => (
            <div key={i} className="border border-loom-border/20 rounded-lg p-3 bg-loom-surface/10">
              <div className="flex items-center gap-2 mb-1">
                <Calendar size={10} className="text-loom-muted" />
                <span className="text-[10px] font-mono text-loom-muted">{entry.date}</span>
              </div>
              <div className="text-xs text-loom-text mb-1">{entry.incident}</div>
              <div className="text-[10px] text-loom-muted">
                <span className="text-amber-400">Impact:</span> {entry.impact}
              </div>
              <div className="text-[10px] text-loom-muted">
                <span className="text-emerald-400">Outcome:</span> {entry.outcome}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function BiasSection({
  examples,
}: {
  examples: Array<{
    topic: string;
    expectedCoverage: string;
    actualCoverage: string;
    analysis: string;
  }>;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-loom-text">Bias Examples</h3>
      <div className="space-y-2">
        {examples.map((ex, i) => (
          <div key={i} className="border border-loom-border/20 rounded-lg p-3 bg-loom-surface/10">
            <div className="text-xs font-semibold text-loom-text mb-2">{ex.topic}</div>
            <div className="grid grid-cols-2 gap-3 text-[10px]">
              <div>
                <span className="text-loom-muted block mb-0.5">Expected:</span>
                <span className="text-loom-text">{ex.expectedCoverage}</span>
              </div>
              <div>
                <span className="text-loom-muted block mb-0.5">Actual:</span>
                <span className="text-loom-text">{ex.actualCoverage}</span>
              </div>
            </div>
            <p className="text-[10px] text-loom-muted mt-2 italic">{ex.analysis}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PressFreedomSection({
  incidents,
}: {
  incidents: Array<{ date: string; description: string; outcome: string }>;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-loom-text">Press Freedom Incidents</h3>
      <div className="space-y-2">
        {incidents.map((inc, i) => (
          <div key={i} className="border border-red-500/10 rounded-lg p-3 bg-red-500/5">
            <span className="text-[10px] font-mono text-red-400">{inc.date}</span>
            <p className="text-xs text-loom-text mt-1">{inc.description}</p>
            <p className="text-[10px] text-loom-muted mt-1">Outcome: {inc.outcome}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AwardsSection({
  awards,
}: {
  awards: Array<{ name: string; year: string; category?: string }>;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-loom-text">Awards & Recognition</h3>
      <div className="space-y-2">
        {awards.map((award, i) => (
          <div
            key={i}
            className="flex items-center gap-3 border border-amber-500/10 rounded-lg p-3 bg-amber-500/5"
          >
            <Award size={16} className="text-amber-400 shrink-0" />
            <div>
              <div className="text-xs text-loom-text">{award.name}</div>
              <div className="text-[10px] text-loom-muted">
                {award.year}
                {award.category && ` · ${award.category}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs">
      <span className="text-loom-muted">{label}: </span>
      <span className="text-loom-text">{value}</span>
    </div>
  );
}
