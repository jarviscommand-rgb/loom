import { Link } from 'react-router-dom';
import { Newspaper, Users, BookOpen, Search, ArrowRight } from 'lucide-react';

/**
 * Knowledge Base landing page.
 * Shows search, category cards, and quick stats.
 */
export default function KnowledgeBaseLanding() {
  const categories = [
    {
      to: '/knowledge-base/sources',
      icon: <Newspaper size={24} />,
      title: 'Media Sources',
      description:
        'Deep profiles of Indonesian media outlets including ownership chains, political history, and reliability records.',
      color: 'text-loom-accent',
      bgColor: 'bg-loom-accent/10',
      borderHover: 'group-hover:border-loom-accent/30',
      glowColor: 'group-hover:shadow-loom-accent/5',
    },
    {
      to: '/knowledge-base/entities',
      icon: <Users size={24} />,
      title: 'Entity Profiles',
      description:
        'Key political figures, media moguls, and institutions with relationship mapping and historical positions.',
      color: 'text-loom-calm',
      bgColor: 'bg-loom-calm/10',
      borderHover: 'group-hover:border-loom-calm/30',
      glowColor: 'group-hover:shadow-loom-calm/5',
    },
    {
      to: '/knowledge-base/methodology',
      icon: <BookOpen size={24} />,
      title: 'Scoring Methodology',
      description:
        'Complete documentation of every scoring algorithm in LOOM — formulas, weights, justifications, and examples.',
      color: 'text-loom-glow',
      bgColor: 'bg-loom-glow/10',
      borderHover: 'group-hover:border-loom-glow/30',
      glowColor: 'group-hover:shadow-loom-glow/5',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 page-enter">
      {/* Hero */}
      <div className="text-center space-y-3">
        <h1 className="text-heading-xl font-serif font-bold text-loom-text">Knowledge Base</h1>
        <p className="text-body text-loom-muted max-w-lg mx-auto text-balance">
          Deep research profiles, entity maps, and full scoring methodology. Every number in LOOM is
          explainable.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md mx-auto">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-loom-muted" />
        <input
          type="text"
          placeholder="Search sources, entities, or methodology..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-loom-surface border border-loom-border/50 text-body text-loom-text placeholder:text-loom-muted/50 focus:outline-none focus:border-loom-accent/50 focus:ring-1 focus:ring-loom-accent/20 transition-all"
        />
      </div>

      {/* Category cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.to}
            to={cat.to}
            className={`group border border-loom-border/50 rounded-xl p-5 bg-loom-surface/30 hover:bg-loom-surface/60 transition-all duration-300 hover:shadow-lg ${cat.borderHover} ${cat.glowColor}`}
          >
            <div
              className={`w-12 h-12 rounded-lg ${cat.bgColor} flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110`}
            >
              <span className={cat.color}>{cat.icon}</span>
            </div>
            <h3 className="text-heading-sm text-loom-text mb-1.5">{cat.title}</h3>
            <p className="text-body-sm text-loom-muted leading-relaxed mb-3">{cat.description}</p>
            <span className="flex items-center gap-1 text-body-sm text-loom-accent opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1">
              Explore <ArrowRight size={12} />
            </span>
          </Link>
        ))}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Media Sources', value: '16', sublabel: 'Indonesia' },
          { label: 'Entity Profiles', value: '9', sublabel: 'key figures' },
          { label: 'Scoring Algorithms', value: '8', sublabel: 'documented' },
          { label: 'Score Variables', value: '40+', sublabel: 'transparent' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="border border-loom-border/30 rounded-lg p-3 bg-loom-bg/50 text-center hover:border-loom-border/50 transition-colors"
          >
            <div className="text-heading-lg font-mono font-bold text-loom-text">{stat.value}</div>
            <div className="text-body-sm text-loom-muted">{stat.label}</div>
            <div className="text-micro text-loom-muted/60">{stat.sublabel}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
