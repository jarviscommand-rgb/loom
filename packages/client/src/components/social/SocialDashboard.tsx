import { useState } from 'react';
import { useSocialDashboard, useLoadSocialDemo } from '../../hooks/useSocial';
import EngagementTimeline from './EngagementTimeline';
import AudienceHeatmap from './AudienceHeatmap';
import PersonaCard from './PersonaCard';
import PersonaMatrix from './PersonaMatrix';
import InfluencerNetwork from './InfluencerNetwork';
import EngagementQualityGauge from './EngagementQualityGauge';
import ImpactChainViz from './ImpactChainViz';
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
  Network,
  Target,
  Zap,
  LayoutGrid,
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

type SubTab = 'overview' | 'announcements' | 'audiences' | 'influencers' | 'impact';

const SUB_TABS: Array<{ id: SubTab; label: string; icon: React.ReactNode }> = [
  { id: 'overview', label: 'Overview', icon: <LayoutGrid size={13} /> },
  { id: 'announcements', label: 'Announcements', icon: <Megaphone size={13} /> },
  { id: 'audiences', label: 'Audiences', icon: <Users size={13} /> },
  { id: 'influencers', label: 'Influencers', icon: <Network size={13} /> },
  { id: 'impact', label: 'Impact', icon: <Zap size={13} /> },
];

export default function SocialDashboard() {
  const { data: dashboard, loading, error, refetch } = useSocialDashboard();
  const { load: loadDemo, loading: demoLoading } = useLoadSocialDemo();
  const [activeTab, setActiveTab] = useState<SubTab>('overview');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<SocialAnnouncement | null>(null);

  const handleLoadDemo = async () => {
    await loadDemo();
    refetch();
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
    <div className="h-full flex flex-col">
      {/* Header + Sub-tab navigation */}
      <div className="px-4 pt-4 pb-2 border-b border-white/5 space-y-3 shrink-0">
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

        {/* Sub-tabs */}
        <div className="flex gap-1">
          {SUB_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-loom-accent/20 text-loom-accent border border-loom-accent/30'
                  : 'text-loom-muted hover:text-loom-text hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'overview' && (
          <OverviewTab
            dashboard={dashboard}
            selectedAnnouncement={selectedAnnouncement}
            setSelectedAnnouncement={setSelectedAnnouncement}
          />
        )}
        {activeTab === 'announcements' && (
          <AnnouncementsTab
            dashboard={dashboard}
            selectedAnnouncement={selectedAnnouncement}
            setSelectedAnnouncement={setSelectedAnnouncement}
          />
        )}
        {activeTab === 'audiences' && <AudiencesTab dashboard={dashboard} />}
        {activeTab === 'influencers' && <InfluencersTab dashboard={dashboard} />}
        {activeTab === 'impact' && <ImpactTab dashboard={dashboard} />}
      </div>
    </div>
  );
}

/* --- Sub-tab components --- */

interface TabProps {
  dashboard: NonNullable<ReturnType<typeof useSocialDashboard>['data']>;
}

interface AnnouncementTabProps extends TabProps {
  selectedAnnouncement: SocialAnnouncement | null;
  setSelectedAnnouncement: (a: SocialAnnouncement | null) => void;
}

/** Overview tab: key metrics, platform bar, top announcements, timeline. */
function OverviewTab({
  dashboard,
  selectedAnnouncement,
  setSelectedAnnouncement,
}: AnnouncementTabProps) {
  return (
    <>
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          icon={<Megaphone size={14} className="text-loom-accent" />}
          label="Announcements"
          value={String(dashboard.totalAnnouncements)}
        />
        <MetricCard
          icon={<TrendingUp size={14} className="text-green-400" />}
          label="Avg Engagement"
          value={formatNumber(dashboard.avgEngagement)}
        />
        <MetricCard
          icon={<Activity size={14} className="text-cyan-400" />}
          label="Top Platform"
          value={dashboard.topPlatform}
          valueColor={PLATFORM_COLORS[dashboard.topPlatform]}
          capitalize
        />
        <MetricCard
          icon={<Users size={14} className="text-purple-400" />}
          label="Active Personas"
          value={String(dashboard.activePersonas)}
        />
      </div>

      {/* Platform Distribution */}
      <PlatformBar dashboard={dashboard} />

      {/* Engagement Timeline */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} className="text-loom-calm" />
          <span className="text-xs font-semibold">Engagement Timeline</span>
        </div>
        <EngagementTimeline dataPoints={dashboard.engagementTimeline} />
      </div>

      {/* Recent Announcements */}
      <AnnouncementsList
        announcements={dashboard.recentAnnouncements.slice(0, 5)}
        selectedAnnouncement={selectedAnnouncement}
        setSelectedAnnouncement={setSelectedAnnouncement}
      />

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
          <EngagementTimeline dataPoints={selectedAnnouncement.engagementTimeline} height={180} />
        </div>
      )}
    </>
  );
}

/** Announcements tab: full list with engagement charts. */
function AnnouncementsTab({
  dashboard,
  selectedAnnouncement,
  setSelectedAnnouncement,
}: AnnouncementTabProps) {
  return (
    <>
      <AnnouncementsList
        announcements={dashboard.recentAnnouncements}
        selectedAnnouncement={selectedAnnouncement}
        setSelectedAnnouncement={setSelectedAnnouncement}
      />
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
          <EngagementTimeline dataPoints={selectedAnnouncement.engagementTimeline} height={180} />
        </div>
      )}
    </>
  );
}

/** Audiences tab: heatmap + persona matrix. */
function AudiencesTab({ dashboard }: TabProps) {
  return (
    <>
      {/* Audience Heatmap */}
      {dashboard.recentAnnouncements.length > 0 && (
        <div
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden relative"
          style={{ minHeight: 300 }}
        >
          <AudienceHeatmap cells={buildHeatmapCells(dashboard)} />
        </div>
      )}

      {/* Persona Matrix */}
      {dashboard.personas.length > 0 && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Target size={14} className="text-purple-400" />
            <span className="text-xs font-semibold">Persona Reaction Matrix</span>
          </div>
          <PersonaMatrix personas={dashboard.personas} />
        </div>
      )}

      {/* Persona Cards */}
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
    </>
  );
}

/** Influencers tab: network graph + list. */
function InfluencersTab({ dashboard }: TabProps) {
  return (
    <>
      {/* Influencer Network Graph */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Network size={14} className="text-loom-calm" />
          <span className="text-xs font-semibold">Influencer Network</span>
        </div>
        <InfluencerNetwork influencers={dashboard.topInfluencers} />
      </div>

      {/* Influencer List */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={14} className="text-loom-accent" />
          <span className="text-xs font-semibold">Top Influencers</span>
        </div>
        <div className="space-y-2">
          {dashboard.topInfluencers.map((inf, idx) => (
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
    </>
  );
}

/** Impact tab: impact chain + engagement quality gauges. */
function ImpactTab({ dashboard }: TabProps) {
  /* Derive metrics from dashboard data */
  const totalReach = dashboard.recentAnnouncements.reduce((sum, a) => sum + a.totalReach, 0);
  const totalEng = dashboard.recentAnnouncements.reduce((sum, a) => sum + a.totalEngagement, 0);
  const avgSentiment =
    dashboard.recentAnnouncements.length > 0
      ? dashboard.recentAnnouncements.reduce((sum, a) => sum + a.sentiment, 0) /
        dashboard.recentAnnouncements.length
      : 0;

  /* Derive quality metrics from personas */
  const avgQuality =
    dashboard.personas.length > 0
      ? dashboard.personas.reduce((sum, p) => sum + p.engagementQuality, 0) /
        dashboard.personas.length
      : 0.6;

  return (
    <>
      {/* Impact Chain */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={14} className="text-loom-glow" />
          <span className="text-xs font-semibold">Narrative Impact Chain</span>
        </div>
        <ImpactChainViz
          totalReach={totalReach}
          socialAmplification={totalEng}
          mediaCoverage={dashboard.totalAnnouncements}
          sentimentShift={avgSentiment}
        />
      </div>

      {/* Engagement Quality Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col items-center">
          <span className="text-[10px] text-loom-muted uppercase tracking-wider mb-2">
            Overall Quality
          </span>
          <EngagementQualityGauge
            quality={Math.round(avgQuality * 100)}
            realRatio={avgQuality * 0.9 + 0.1}
            activeRatio={avgQuality * 0.7 + 0.2}
            size={160}
          />
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col items-center">
          <span className="text-[10px] text-loom-muted uppercase tracking-wider mb-2">
            Bot Detection
          </span>
          <EngagementQualityGauge
            quality={Math.round((1 - avgQuality * 0.3) * 100)}
            realRatio={0.82}
            activeRatio={0.45}
            size={160}
          />
        </div>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex flex-col items-center">
          <span className="text-[10px] text-loom-muted uppercase tracking-wider mb-2">
            Authenticity Score
          </span>
          <EngagementQualityGauge quality={75} realRatio={0.75} activeRatio={0.6} size={160} />
        </div>
      </div>

      {/* Platform breakdown */}
      <PlatformBar dashboard={dashboard} />
    </>
  );
}

/* --- Shared sub-components --- */

/** Metric card used in overview. */
function MetricCard({
  icon,
  label,
  value,
  valueColor,
  capitalize: cap,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueColor?: string;
  capitalize?: boolean;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] text-loom-muted uppercase tracking-wider">{label}</span>
      </div>
      <p
        className={`text-2xl font-bold font-mono ${cap ? 'capitalize' : ''}`}
        style={{ color: valueColor || '#e2e8f0' }}
      >
        {value}
      </p>
    </div>
  );
}

/** Platform distribution bar. */
function PlatformBar({ dashboard }: TabProps) {
  return (
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
  );
}

/** Announcements list. */
function AnnouncementsList({
  announcements,
  selectedAnnouncement,
  setSelectedAnnouncement,
}: {
  announcements: SocialAnnouncement[];
  selectedAnnouncement: SocialAnnouncement | null;
  setSelectedAnnouncement: (a: SocialAnnouncement | null) => void;
}) {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Megaphone size={14} className="text-loom-glow" />
        <span className="text-xs font-semibold">Announcements ({announcements.length})</span>
      </div>
      <div className="space-y-2">
        {announcements.map((ann) => (
          <button
            key={ann.id}
            onClick={() =>
              setSelectedAnnouncement(selectedAnnouncement?.id === ann.id ? null : ann)
            }
            className={`w-full text-left p-2.5 rounded-lg bg-loom-bg/30 hover:bg-loom-bg/60 border transition-all duration-200 group ${
              selectedAnnouncement?.id === ann.id
                ? 'border-loom-accent/40'
                : 'border-transparent hover:border-loom-accent/30'
            }`}
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
  );
}

/** Build heatmap cells from dashboard data. */
function buildHeatmapCells(
  dashboard: NonNullable<ReturnType<typeof useSocialDashboard>['data']>
): Array<{ segment: string; topic: string; engagement: number; reach: number; sentiment: number }> {
  const segments = dashboard.personas.map((p) => p.type);
  const topics = [...new Set(dashboard.personas.flatMap((p) => p.interests.slice(0, 3)))].slice(
    0,
    6
  );

  if (segments.length === 0 || topics.length === 0) return [];

  return segments.flatMap((segment) =>
    topics.map((topic) => {
      const persona = dashboard.personas.find((p) => p.type === segment);
      const hasTopic = persona?.interests.includes(topic);
      return {
        segment,
        topic,
        engagement: hasTopic
          ? Math.round(persona!.engagementRate * 10000)
          : Math.round(Math.random() * 500),
        reach: persona?.estimatedReach || 0,
        sentiment: hasTopic ? 0.3 : -0.1,
      };
    })
  );
}
