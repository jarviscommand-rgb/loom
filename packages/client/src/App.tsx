import { useState, useCallback, useRef, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import {
  api,
  type GraphSnapshot,
  type Entity,
  type NarrativeEvent,
  type Tension,
  type NarrativeArc,
} from './hooks/useApi';
import { useWebSocket } from './hooks/useWebSocket';
import InputPanel from './components/InputPanel';
import Timeline from './components/Timeline';
import NetworkGraph from './components/NetworkGraph';
import TensionRadar from './components/TensionRadar';
import DreamTree from './components/DreamTree';
import Tapestry from './components/Tapestry';
import SentimentDashboard from './components/SentimentDashboard';
import KnowledgeBaseLanding from './components/knowledge-base/KnowledgeBaseLanding';
import SourcesPage from './components/knowledge-base/SourcesPage';
import SourceDetailPage from './components/knowledge-base/SourceDetailPage';
import EntitiesPage from './components/knowledge-base/EntitiesPage';
import MethodologyPage from './components/knowledge-base/MethodologyPage';
import {
  Clock,
  Network,
  Layers,
  Sparkles,
  AlertTriangle,
  Wifi,
  WifiOff,
  BarChart3,
  BookOpen,
} from 'lucide-react';

type TopTab = 'narrative' | 'sentiment' | 'knowledge-base';
type ViewTab = 'timeline' | 'network' | 'tapestry' | 'dream' | 'tension';

export default function App() {
  const location = useLocation();
  const isKnowledgeBase = location.pathname.startsWith('/knowledge-base');
  const [entities, setEntities] = useState<Entity[]>([]);
  const [events, setEvents] = useState<NarrativeEvent[]>([]);
  const [tensions, setTensions] = useState<Tension[]>([]);
  const [arcs, setArcs] = useState<NarrativeArc[]>([]);
  const [topTab, setTopTab] = useState<TopTab>('narrative');
  const [activeTab, setActiveTab] = useState<ViewTab>('timeline');

  const handleWsMessage = useCallback((data: unknown) => {
    const msg = data as { type: string; data: GraphSnapshot };
    if (msg.type === 'graph-updated') {
      setEntities(msg.data.entities);
      setEvents(msg.data.events);
      setTensions(msg.data.tensions);
      setArcs(msg.data.arcs);
    }
  }, []);

  const { connected } = useWebSocket(handleWsMessage);

  const refreshData = useCallback(async () => {
    try {
      const snapshot = await api.getGraph();
      setEntities(snapshot.entities);
      setEvents(snapshot.events);
      setTensions(snapshot.tensions);
      setArcs(snapshot.arcs);
    } catch (err) {
      console.error('Failed to refresh data:', err);
    }
  }, []);

  const [isLoading, _setIsLoading] = useState(false);
  const [tabTransitionKey, setTabTransitionKey] = useState(0);
  const prevTabRef = useRef<ViewTab>(activeTab);

  // Smooth tab transition
  useEffect(() => {
    if (prevTabRef.current !== activeTab) {
      setTabTransitionKey((k) => k + 1);
      prevTabRef.current = activeTab;
    }
  }, [activeTab]);

  const hasData = entities.length > 0;

  const tabs: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    { id: 'timeline', label: 'Timeline', icon: <Clock size={14} /> },
    { id: 'network', label: 'Network', icon: <Network size={14} /> },
    { id: 'tapestry', label: 'Tapestry', icon: <Layers size={14} /> },
    { id: 'tension', label: 'Tensions', icon: <AlertTriangle size={14} /> },
    { id: 'dream', label: 'Dream', icon: <Sparkles size={14} /> },
  ];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-loom-border/80 bg-loom-surface/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg logo-gradient flex items-center justify-center shadow-lg shadow-loom-accent/20">
            <Layers size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold tracking-wide text-loom-text">LOOM</h1>
            <p className="text-[10px] text-loom-muted uppercase tracking-[0.2em]">
              Causal Narrative Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Top-level tab switcher */}
          <div className="flex rounded-lg bg-white/5 p-0.5">
            {[
              {
                id: 'narrative' as TopTab,
                label: 'Narrative',
                icon: <Layers size={12} />,
                to: '/',
              },
              {
                id: 'sentiment' as TopTab,
                label: 'Sentiment',
                icon: <BarChart3 size={12} />,
                to: '/',
              },
              {
                id: 'knowledge-base' as TopTab,
                label: 'Knowledge Base',
                icon: <BookOpen size={12} />,
                to: '/knowledge-base',
              },
            ].map((tab) => {
              const isActive =
                tab.id === 'knowledge-base'
                  ? isKnowledgeBase
                  : !isKnowledgeBase && topTab === tab.id;
              return tab.id === 'knowledge-base' ? (
                <Link
                  key={tab.id}
                  to={tab.to}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                    isActive
                      ? 'bg-loom-accent/20 text-loom-accent'
                      : 'text-loom-muted hover:text-loom-text'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              ) : (
                <button
                  key={tab.id}
                  onClick={() => setTopTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1 text-xs rounded-md transition-all duration-200 ${
                    isActive
                      ? 'bg-loom-accent/20 text-loom-accent'
                      : 'text-loom-muted hover:text-loom-text'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
          {hasData && topTab === 'narrative' && (
            <div className="flex gap-4 text-xs text-loom-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-loom-accent" />
                <span className="text-loom-accent font-semibold">{entities.length}</span>
                characters
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-loom-calm" />
                <span className="text-loom-calm font-semibold">{events.length}</span>
                events
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-loom-tension" />
                <span className="text-loom-tension font-semibold">{tensions.length}</span>
                tensions
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-loom-glow" />
                <span className="text-loom-glow font-semibold">{arcs.length}</span>
                arcs
              </span>
            </div>
          )}
          <div className={`flex items-center gap-1.5 text-xs ${connected ? 'status-live' : ''}`}>
            {connected ? (
              <>
                <Wifi size={12} className="text-green-400" />
                <span className="text-green-400">Live</span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-red-400" />
                <span className="text-red-400">Offline</span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Knowledge Base routes (full-width, no sidebar) */}
        {isKnowledgeBase ? (
          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route path="/knowledge-base" element={<KnowledgeBaseLanding />} />
              <Route path="/knowledge-base/sources" element={<SourcesPage />} />
              <Route path="/knowledge-base/sources/:id" element={<SourceDetailPage />} />
              <Route path="/knowledge-base/entities" element={<EntitiesPage />} />
              <Route path="/knowledge-base/methodology" element={<MethodologyPage />} />
            </Routes>
          </main>
        ) : (
          <>
            {/* Left panel */}
            <aside className="w-80 border-r border-loom-border/80 flex flex-col overflow-hidden bg-loom-surface/20">
              <div className="p-4">
                <InputPanel onDataLoaded={refreshData} />
              </div>

              {/* Arcs panel */}
              {arcs.length > 0 && (
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  <h3 className="text-xs text-loom-muted uppercase tracking-wider mb-2 flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-loom-glow" />
                    Narrative Arcs
                  </h3>
                  <div className="space-y-2 list-stagger">
                    {arcs.map((arc) => {
                      const phaseColors: Record<string, string> = {
                        setup: 'border-blue-500/30 text-blue-400',
                        rising_action: 'border-yellow-500/30 text-yellow-400',
                        climax: 'border-red-500/30 text-red-400',
                        falling_action: 'border-orange-500/30 text-orange-400',
                        resolution: 'border-green-500/30 text-green-400',
                      };
                      const phaseGlow: Record<string, string> = {
                        climax: 'shadow-sm shadow-red-500/10',
                        rising_action: 'shadow-sm shadow-yellow-500/10',
                      };
                      return (
                        <div
                          key={arc.id}
                          className={`arc-card border rounded-lg p-2.5 bg-loom-bg/30 transition-all duration-300 hover:bg-loom-bg/50 ${phaseColors[arc.phase] || 'border-loom-border'} ${phaseGlow[arc.phase] || ''}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-serif font-semibold text-xs">{arc.name}</span>
                            <span className="text-[10px] uppercase opacity-60 font-mono tracking-wider">
                              {arc.phase.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-[11px] text-loom-muted font-serif italic leading-relaxed">
                            {arc.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </aside>

            {/* Main view */}
            <main className="flex-1 flex flex-col overflow-hidden">
              {/* Tabs */}
              <div className="flex items-center gap-1 px-4 pt-3 pb-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-loom-surface/60 text-loom-accent border border-loom-border/80 border-b-loom-surface/60 shadow-sm shadow-loom-accent/5'
                        : 'text-loom-muted hover:text-loom-text hover:bg-loom-surface/20'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* View content with smooth transitions */}
              {topTab === 'sentiment' ? (
                <div className="flex-1 m-4 mt-0 overflow-hidden tab-content-enter" key="sentiment">
                  <SentimentDashboard />
                </div>
              ) : !hasData ? (
                <div
                  className="flex-1 glass-panel m-4 mt-0 rounded-tl-none overflow-hidden flex items-center justify-center tab-content-enter"
                  key="empty"
                >
                  <div className="text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-loom-accent/10 flex items-center justify-center">
                      <Layers size={28} className="text-loom-accent/50" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-loom-text mb-1">
                        No narrative loaded
                      </h3>
                      <p className="text-xs text-loom-muted leading-relaxed">
                        Paste text to extract a narrative, or load a demo scenario from the left
                        panel.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  className="flex-1 glass-panel m-4 mt-0 rounded-tl-none overflow-hidden tab-content-enter"
                  key={`${activeTab}-${tabTransitionKey}`}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-3">
                        <div className="w-8 h-8 mx-auto loading-spinner" />
                        <p className="text-xs text-loom-muted">Analyzing narrative…</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {activeTab === 'timeline' && <Timeline events={events} entities={entities} />}
                      {activeTab === 'network' && (
                        <NetworkGraph entities={entities} tensions={tensions} />
                      )}
                      {activeTab === 'tapestry' && (
                        <Tapestry entities={entities} events={events} tensions={tensions} />
                      )}
                      {activeTab === 'tension' && (
                        <TensionRadar tensions={tensions} entities={entities} />
                      )}
                      {activeTab === 'dream' && <DreamTree hasData={hasData} />}
                    </>
                  )}
                </div>
              )}
            </main>
          </>
        )}
      </div>
    </div>
  );
}
