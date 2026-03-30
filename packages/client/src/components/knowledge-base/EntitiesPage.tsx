import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, User, Building2, ChevronDown } from 'lucide-react';
import { KnowledgeBaseSkeleton } from '../LoadingSkeleton';

interface EntityProfile {
  id: string;
  name: string;
  role: string;
  background: string;
  knownRelationships: Array<{
    entityId: string;
    name: string;
    relationship: string;
  }>;
  publicStances: Array<{ topic: string; stance: string }>;
  historicalPositions: Array<{ period: string; position: string }>;
  mediaOwnershipConnections: Array<{
    sourceId: string;
    sourceName: string;
    role: string;
  }>;
}

/** Entity profiles browsing page. */
export default function EntitiesPage() {
  const [entities, setEntities] = useState<EntityProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/knowledge-base/entities')
      .then((r) => r.json())
      .then((data) => {
        setEntities(data.entities || []);
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
          <h1 className="text-heading-lg font-serif font-bold text-loom-text">Entity Profiles</h1>
          <p className="text-body-sm text-loom-muted">
            {entities.length} key Indonesian political and media figures
          </p>
        </div>
      </div>

      {/* Entity cards */}
      <div className="space-y-3 list-stagger">
        {entities.map((entity) => (
          <EntityCard
            key={entity.id}
            entity={entity}
            expanded={expandedId === entity.id}
            onToggle={() => setExpandedId(expandedId === entity.id ? null : entity.id)}
          />
        ))}
      </div>
    </div>
  );
}

function EntityCard({
  entity,
  expanded,
  onToggle,
}: {
  entity: EntityProfile;
  expanded: boolean;
  onToggle: () => void;
}) {
  const hasMedia = entity.mediaOwnershipConnections.length > 0;

  return (
    <div className="kb-card overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-lg bg-loom-accent/10 flex items-center justify-center shrink-0">
          {hasMedia ? (
            <Building2 size={18} className="text-loom-accent" />
          ) : (
            <User size={18} className="text-loom-accent" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-heading-sm text-loom-text">{entity.name}</h3>
          <p className="text-body-sm text-loom-muted truncate">{entity.role}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {hasMedia && (
            <span className="text-micro px-1.5 py-0.5 rounded bg-loom-accent/10 text-loom-accent">
              {entity.mediaOwnershipConnections.length} media
            </span>
          )}
          <span className="text-micro px-1.5 py-0.5 rounded bg-white/5 text-loom-muted">
            {entity.knownRelationships.length} connections
          </span>
          <div
            className="text-loom-muted transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(0)' : 'rotate(-90deg)' }}
          >
            <ChevronDown size={14} />
          </div>
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-loom-border/20 pt-3 accordion-enter">
          {/* Background */}
          <div>
            <h4 className="text-body-sm font-semibold text-loom-text mb-1">Background</h4>
            <p className="text-body-sm text-loom-muted leading-relaxed">{entity.background}</p>
          </div>

          {/* Media connections — interactive links */}
          {entity.mediaOwnershipConnections.length > 0 && (
            <div>
              <h4 className="text-body-sm font-semibold text-loom-text mb-2">Media Connections</h4>
              <div className="flex flex-wrap gap-2">
                {entity.mediaOwnershipConnections.map((conn, i) => (
                  <Link
                    key={i}
                    to={`/knowledge-base/sources/${conn.sourceId}`}
                    className="text-micro px-2.5 py-1 rounded-lg border border-loom-accent/20 bg-loom-accent/5 text-loom-accent hover:bg-loom-accent/15 hover:border-loom-accent/40 transition-all duration-200"
                  >
                    {conn.sourceName} — {conn.role}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Relationships — interactive links to other entities */}
          {entity.knownRelationships.length > 0 && (
            <div>
              <h4 className="text-body-sm font-semibold text-loom-text mb-2">Key Relationships</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {entity.knownRelationships.map((rel, i) => (
                  <div
                    key={i}
                    className="text-body-sm border border-loom-border/20 rounded-lg p-2.5 bg-loom-bg/30 hover:bg-loom-bg/50 hover:border-loom-border/40 transition-all cursor-default"
                  >
                    <span className="text-loom-text font-medium">{rel.name}</span>
                    <span className="text-loom-muted"> — {rel.relationship}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Historical positions */}
          {entity.historicalPositions.length > 0 && (
            <div>
              <h4 className="text-body-sm font-semibold text-loom-text mb-2">
                Historical Positions
              </h4>
              <div className="space-y-1.5 border-l-2 border-loom-border/30 pl-4">
                {entity.historicalPositions.map((pos, i) => (
                  <div key={i} className="flex items-baseline gap-2 text-body-sm relative">
                    <div className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-loom-accent/50" />
                    <span className="font-mono text-micro text-loom-accent shrink-0">
                      {pos.period}
                    </span>
                    <span className="text-loom-muted">{pos.position}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Public stances */}
          {entity.publicStances.length > 0 && (
            <div>
              <h4 className="text-body-sm font-semibold text-loom-text mb-2">Public Stances</h4>
              <div className="space-y-1.5">
                {entity.publicStances.map((stance, i) => (
                  <div key={i} className="text-body-sm">
                    <span className="text-loom-text font-medium">{stance.topic}: </span>
                    <span className="text-loom-muted">{stance.stance}</span>
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
