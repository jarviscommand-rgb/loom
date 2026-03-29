import { useState, useCallback } from 'react';
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
import {
  Clock,
  Network,
  Layers,
  Sparkles,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react';

type ViewTab = 'timeline' | 'network' | 'tapestry' | 'dream' | 'tension';

export default function App() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [events, setEvents] = useState<NarrativeEvent[]>([]);
  const [tensions, setTensions] = useState<Tension[]>([]);
  const [arcs, setArcs] = useState<NarrativeArc[]>([]);
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
      <header className="flex items-center justify-between px-6 py-3 border-b border-loom-border bg-loom-surface/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-loom-accent to-purple-800 flex items-center justify-center">
            <Layers size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold tracking-wide text-loom-text">
              LOOM
            </h1>
            <p className="text-[10px] text-loom-muted uppercase tracking-widest">
              Causal Narrative Intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {hasData && (
            <div className="flex gap-3 text-xs text-loom-muted">
              <span>
                <span className="text-loom-accent font-semibold">{entities.length}</span>{' '}
                characters
              </span>
              <span>
                <span className="text-loom-calm font-semibold">{events.length}</span>{' '}
                events
              </span>
              <span>
                <span className="text-loom-tension font-semibold">{tensions.length}</span>{' '}
                tensions
              </span>
              <span>
                <span className="text-loom-glow font-semibold">{arcs.length}</span> arcs
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs">
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
        {/* Left panel */}
        <aside className="w-80 border-r border-loom-border flex flex-col overflow-hidden">
          <div className="p-4">
            <InputPanel onDataLoaded={refreshData} />
          </div>

          {/* Arcs panel */}
          {arcs.length > 0 && (
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <h3 className="text-xs text-loom-muted uppercase tracking-wider mb-2">
                Narrative Arcs
              </h3>
              <div className="space-y-2">
                {arcs.map((arc) => {
                  const phaseColors: Record<string, string> = {
                    setup: 'border-blue-500/30 text-blue-400',
                    rising_action: 'border-yellow-500/30 text-yellow-400',
                    climax: 'border-red-500/30 text-red-400',
                    falling_action: 'border-orange-500/30 text-orange-400',
                    resolution: 'border-green-500/30 text-green-400',
                  };
                  return (
                    <div
                      key={arc.id}
                      className={`border rounded-lg p-2.5 bg-loom-bg/50 ${phaseColors[arc.phase] || 'border-loom-border'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-serif font-semibold text-xs">
                          {arc.name}
                        </span>
                        <span className="text-[10px] uppercase opacity-60">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t transition-colors ${
                  activeTab === tab.id
                    ? 'bg-loom-surface text-loom-accent border border-loom-border border-b-loom-surface'
                    : 'text-loom-muted hover:text-loom-text'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* View content */}
          <div className="flex-1 glass-panel m-4 mt-0 rounded-tl-none overflow-hidden">
            {activeTab === 'timeline' && (
              <Timeline events={events} entities={entities} />
            )}
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
          </div>
        </main>
      </div>
    </div>
  );
}
