import { useState } from 'react';
import { useSocialDashboard, useLoadSocialDemo } from '../../hooks/useSocial';
import EngagementTimeline from './EngagementTimeline';
import _AudienceHeatmap from './AudienceHeatmap';
import _AmplificationFlow from './AmplificationFlow';
import _PlatformComparison from './PlatformComparison';
import PersonaCard from './PersonaCard';
import type { SocialAnnouncement } from '../../hooks/useApi';
import {
  Activity,
  Loader2,
  Download,
  Users,
  Megaphone,
  TrendingUp,
  Globe,
  BarChart3,
  Share2,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

/** Platform color map. */
const PLATFORM_COLORS: Record<string, string> = {
  twitter: '#1DA1F2',
  instagram: '#E4405F',
  tiktok: '#00F2EA',
  facebook: '#1877F2',
  reddit: '#FF4500',
  youtube: '#FF0000',
};

/** Format large numbers for display. */
function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

/** Mini sparkline SVG for engagement data. */
function Sparkline({ data, color = '#a78bfa' }: { data: number[]; color?: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const width = 80;
  const height = 24;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - (v / max) * height}`)
    .join(' L ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-20 h-6">
      <path d={`M ${points}`} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d={`M ${points} L ${width},${height} L 0,${height} Z`} fill={`${color}15`} />
    </svg>
  );
}

type Section = 'timeline' | 'heatmap' | 'amplification' | 'platforms' | null;

export default function SocialDashboard() {
  const { data: dashboard, loading, error, refetch } = useSocialDashboard();
  const { load: loadDemo, loading: demoLoading } = useLoadSocialDemo();
  const [expandedSection, setExpandedSection] = useState<Section>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<SocialAnnouncement | null>(null);

  const handleLoadDemo = async () => {
    await loadDemo();
    refetch();
  };

  const toggleSection = (section: Section) => {
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin text-loom-accent" />
        <span className="ml-2 text-sm text-loom-muted">Loading social intelligence...</span>
      </div>
    );
  }

  if (error || !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-16 h-16 rounded-2xl bg-loom-accent/10 flex items-center justify-center">
          <Share2 size={28} className="text-loom-accent/50" />
        </div>
        <p className="text-loom-muted text-sm font-serif italic">
          {error || 'No social media data available.'}
        </p>
        <button
          onClick={handleLoadDemo}
          disabled={demoLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-loom-accent/20 text-loom-accent hover:bg-loom-accent/30 transition-colors text-sm disabled:opacity-50"
        >
          {demoLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Load Social Demo Data
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe size={16} className="text-loom-accent" />
          <h2 className="text-sm font-semibold">Social Media Intelligence</h2>
          <span className="text-[10px] text-loom-muted">
            {dashboard.totalAnnouncements} announcements tracked
          </span>
        </div>
        <button
          onClick={handleLoadDemo}
          disabled={demoLoading}
          className="flex items-center gap-1.5 text-xs text-loom-muted hover:text-loom-accent transition-colors px-2 py-1 rounded bg-white/5"
        >
          {demoLoading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          Reload Demo
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone size={14} className="text-loom-accent" />
            <span className="text-[10px] text-loom-muted uppercase tracking-wider">
              Announcements
            </span>
          </div>
          <p className="text-2xl font-bold text-loom-text font-mono">
            {dashboard.totalAnnouncements}
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={14} className="text-green-400" />
            <span className="text-[10px] text-loom-muted uppercase tracking-wider">
              Avg Engagement
            </span>
          </div>
          <p className="text-2xl font-bold text-loom-text font-mono">
            {formatNumber(dashboard.avgEngagement)}
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-cyan-400" />
            <span className="text-[10px] text-loom-muted uppercase tracking-wider">
              Top Platform
            </span>
          </div>
          <p
            className="text-2xl font-bold font-mono capitalize"
            style={{ color: PLATFORM_COLORS[dashboard.topPlatform] || '#a78bfa' }}
          >
            {dashboard.topPlatform}
          </p>
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users size={14} className="text-purple-400" />
            <span className="text-[10px] text-loom-muted uppercase tracking-wider">
              Active Personas
            </span>
          </div>
          <p className="text-2xl font-bold text-loom-text font-mono">{dashboard.activePersonas}</p>
        </div>
      </div>

      {/* Platform breakdown bar */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={14} className="text-loom-calm" />
          <span className="text-xs font-semibold">Platform Distribution</span>
        </div>
        <div className="flex h-6 rounded-lg overflow-hidden">
          {dashboard.platformBreakdown.map((pb) => {
            const totalEng = dashboard.platformBreakdown.reduce(
              (sum, p) => sum + p.totalEngagement,
              0
            );
            const pct = totalEng > 0 ? (pb.totalEngagement / totalEng) * 100 : 0;
            return (
              <div
                key={pb.platform}
                className="flex items-center justify-center text-[9px] font-medium text-white/90 transition-all duration-500"
                style={{
                  width: `${Math.max(pct, 3)}%`,
                  backgroundColor: PLATFORM_COLORS[pb.platform] || '#64748b',
                }}
                title={`${pb.platform}: ${pct.toFixed(1)}%`}
              >
                {pct > 8 && <span className="capitalize">{pb.platform}</span>}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 mt-2">
          {dashboard.platformBreakdown.map((pb) => (
            <span key={pb.platform} className="flex items-center gap-1 text-[10px] text-loom-muted">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: PLATFORM_COLORS[pb.platform] || '#64748b' }}
              />
              <span className="capitalize">{pb.platform}</span>
              <span className="font-mono">{pb.announcements}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Recent Announcements + Top Influencers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Announcements */}
        <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Megaphone size={14} className="text-loom-glow" />
            <span className="text-xs font-semibold">Recent Announcements</span>
          </div>
          <div className="space-y-2">
            {dashboard.recentAnnouncements.slice(0, 8).map((ann) => (
              <button
                key={ann.id}
                onClick={() =>
                  setSelectedAnnouncement(selectedAnnouncement?.id === ann.id ? null : ann)
                }
                className="w-full text-left p-2.5 rounded-lg bg-loom-bg/30 hover:bg-loom-bg/60 border border-transparent hover:border-loom-accent/30 transition-all duration-200 group"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-loom-text group-hover:text-loom-accent transition-colors line-clamp-1">
                      {ann.title}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      {ann.platforms.map((p) => (
                        <span
                          key={p}
                          className="text-[8px] px-1 py-0.5 rounded capitalize"
                          style={{
                            backgroundColor: `${PLATFORM_COLORS[p] || '#64748b'}20`,
                            color: PLATFORM_COLORS[p] || '#64748b',
                          }}
                        >
                          {p}
                        </span>
                      ))}
                      <span className="text-[9px] text-loom-muted">
                        {new Date(ann.publishedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkline
                      data={ann.engagementTimeline.map((d) => d.totalEngagement)}
                      color={PLATFORM_COLORS[ann.platforms[0]] || '#a78bfa'}
                    />
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-loom-accent font-mono leading-none">
                        {formatNumber(ann.totalEngagement)}
                      </span>
                      <span className="text-[9px] text-loom-muted flex items-center gap-0.5">
                        <Eye size={8} /> {formatNumber(ann.totalReach)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Top Influencers */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-loom-accent" />
            <span className="text-xs font-semibold">Top Influencers</span>
          </div>
          <div className="space-y-2">
            {dashboard.topInfluencers.slice(0, 8).map((inf, idx) => (
              <div
                key={inf.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <span className="text-[10px] text-loom-muted font-mono w-4">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{
                    backgroundColor: `${PLATFORM_COLORS[inf.platform] || '#64748b'}30`,
                    color: PLATFORM_COLORS[inf.platform] || '#64748b',
                  }}
                >
                  {inf.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-loom-text truncate">{inf.name}</p>
                  <p className="text-[9px] text-loom-muted">@{inf.handle}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-mono text-loom-accent">
                    {inf.amplificationScore.toFixed(1)}x
                  </p>
                  <p className="text-[9px] text-loom-muted">{formatNumber(inf.followers)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audience Personas */}
      {dashboard.personas.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-purple-400" />
            <span className="text-xs font-semibold">Audience Personas</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {dashboard.personas.map((persona) => (
              <PersonaCard key={persona.id} persona={persona} />
            ))}
          </div>
        </div>
      )}

      {/* Expandable Sections */}
      <div className="space-y-2">
        {/* Engagement Timeline */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleSection('timeline')}
            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-loom-calm" />
              <span className="text-xs font-semibold">Engagement Timeline</span>
            </div>
            {expandedSection === 'timeline' ? (
              <ChevronUp size={14} className="text-loom-muted" />
            ) : (
              <ChevronDown size={14} className="text-loom-muted" />
            )}
          </button>
          {expandedSection === 'timeline' && (
            <div className="px-4 pb-4">
              <EngagementTimeline dataPoints={dashboard.engagementTimeline} />
            </div>
          )}
        </div>

        {/* Selected Announcement Detail */}
        {selectedAnnouncement && (
          <div className="bg-white/5 backdrop-blur-xl border border-loom-accent/20 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-loom-text">{selectedAnnouncement.title}</h3>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-loom-muted hover:text-loom-text text-xs"
              >
                Close
              </button>
            </div>

            {/* Announcement engagement timeline */}
            <EngagementTimeline dataPoints={selectedAnnouncement.engagementTimeline} height={180} />
          </div>
        )}
      </div>
    </div>
  );
}
