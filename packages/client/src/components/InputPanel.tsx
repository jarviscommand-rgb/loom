import { useState } from 'react';
import { api } from '../hooks/useApi';
import { useStreamingExtraction } from '../hooks/useStreamingExtraction';
import { useResearch } from '../hooks/useResearch';
import type { ResearchSource } from '../hooks/useResearch';
import { BookOpen, Sparkles, Trash2, Loader2, Zap, Search, Globe, ChevronDown } from 'lucide-react';

interface InputPanelProps {
  onDataLoaded: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  entities: 'Extracting entities...',
  events: 'Extracting events...',
  tensions: 'Detecting tensions...',
  arcs: 'Mapping story arcs...',
};

const COUNTRIES = [
  { code: '', label: 'Auto' },
  { code: 'ID', label: 'Indonesia' },
  { code: 'US', label: 'US' },
];

/** Provider badge color mapping. */
function providerColor(provider: string): string {
  switch (provider) {
    case 'serpapi':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'google-news-rss':
      return 'bg-green-500/20 text-green-400 border-green-500/30';
    default:
      return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
}

/** Provider label mapping. */
function providerLabel(provider: string): string {
  switch (provider) {
    case 'serpapi':
      return 'Google';
    case 'google-news-rss':
      return 'News';
    default:
      return provider;
  }
}

export default function InputPanel({ onDataLoaded }: InputPanelProps) {
  const [mode, setMode] = useState<'research' | 'manual'>('research');
  const [topic, setTopic] = useState('');
  const [country, setCountry] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [useStreaming, setUseStreaming] = useState(true);
  const [showSources, setShowSources] = useState(false);
  const [discoveredSources, setDiscoveredSources] = useState<ResearchSource[]>([]);
  const streaming = useStreamingExtraction();
  const researchHook = useResearch();

  // --- Research mode ---

  const handleResearch = async () => {
    if (!topic.trim()) return;

    const result = await researchHook.research(topic.trim(), country || undefined, 10);

    if (result) {
      setDiscoveredSources(result.sources);
      setShowSources(true);
      setStatus(`Found ${result.articles.length} articles from ${result.sources.length} sources`);
      onDataLoaded();
    } else if (researchHook.error) {
      setStatus(`Error: ${researchHook.error}`);
    }
  };

  // --- Manual mode ---

  const handleExtract = async () => {
    if (!text.trim()) return;

    if (useStreaming) {
      const result = await streaming.extract(text);
      if (result) {
        setStatus('Narrative extracted successfully');
        setText('');
        onDataLoaded();
      } else if (streaming.error) {
        setStatus(`Error: ${streaming.error}`);
      }
      return;
    }

    setLoading(true);
    setStatus('Weaving narrative threads...');
    try {
      await api.extractNarrative(text);
      setStatus('Narrative extracted successfully');
      setText('');
      onDataLoaded();
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadDemo = async () => {
    setLoading(true);
    setStatus('Loading the OpenAI Crisis narrative...');
    try {
      await api.loadDemo();
      setStatus('Demo narrative loaded — explore the tapestry');
      onDataLoaded();
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await api.reset();
      setStatus('Narrative cleared');
      setDiscoveredSources([]);
      setShowSources(false);
      onDataLoaded();
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const isLoading = loading || streaming.isStreaming || researchHook.isResearching;

  const researchProgressMessage = researchHook.progress?.message;
  const currentStatus =
    researchHook.isResearching && researchProgressMessage
      ? researchProgressMessage
      : streaming.isStreaming && streaming.progress
        ? STAGE_LABELS[streaming.progress] || 'Processing...'
        : status;

  return (
    <div className="glass-panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-loom-accent uppercase tracking-wider">
            {mode === 'research' ? 'Topic Research' : 'Narrative Input'}
          </h2>
          <button
            onClick={() => setMode(mode === 'research' ? 'manual' : 'research')}
            disabled={isLoading}
            className="text-[10px] px-2 py-0.5 border border-loom-border rounded text-loom-muted hover:text-loom-accent hover:border-loom-accent/30 transition-colors disabled:opacity-50"
          >
            {mode === 'research' ? 'Manual mode' : 'Research mode'}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleLoadDemo}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-loom-accent/20 text-loom-accent border border-loom-accent/30 rounded hover:bg-loom-accent/30 transition-colors disabled:opacity-50"
          >
            <BookOpen size={12} />
            Load Demo
          </button>
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-500/10 text-red-400 border border-red-500/20 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
          >
            <Trash2 size={12} />
            Clear
          </button>
        </div>
      </div>

      {mode === 'research' ? (
        <ResearchInput
          topic={topic}
          setTopic={setTopic}
          country={country}
          setCountry={setCountry}
          isLoading={isLoading}
          onResearch={handleResearch}
          progress={researchHook.progress}
          showSources={showSources}
          discoveredSources={discoveredSources}
          onToggleSources={() => setShowSources(!showSources)}
          onSwitchToManual={() => setMode('manual')}
        />
      ) : (
        <ManualInput
          text={text}
          setText={setText}
          isLoading={isLoading}
          useStreaming={useStreaming}
          setUseStreaming={setUseStreaming}
          onExtract={handleExtract}
        />
      )}

      {currentStatus && (
        <div className="flex items-center justify-end">
          <span
            className={`text-xs ${currentStatus.startsWith('Error') ? 'text-red-400' : 'text-loom-muted'}`}
          >
            {currentStatus}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

interface ResearchInputProps {
  topic: string;
  setTopic: (t: string) => void;
  country: string;
  setCountry: (c: string) => void;
  isLoading: boolean;
  onResearch: () => void;
  progress: {
    stage: string;
    message: string;
    sourcesFound?: number;
    articlesScraped?: number;
    totalArticles?: number;
  } | null;
  showSources: boolean;
  discoveredSources: ResearchSource[];
  onToggleSources: () => void;
  onSwitchToManual: () => void;
}

function ResearchInput({
  topic,
  setTopic,
  country,
  setCountry,
  isLoading,
  onResearch,
  progress,
  showSources,
  discoveredSources,
  onToggleSources,
  onSwitchToManual,
}: ResearchInputProps) {
  return (
    <>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-loom-muted" />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && onResearch()}
            placeholder="Search a topic... e.g. Prabowo cooperative program"
            className="w-full bg-loom-bg border border-loom-border rounded pl-9 pr-3 py-2.5 text-sm text-loom-text placeholder-loom-muted focus:outline-none focus:border-loom-accent/50 transition-colors"
            disabled={isLoading}
          />
        </div>

        <div className="relative">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            disabled={isLoading}
            className="appearance-none bg-loom-bg border border-loom-border rounded px-3 py-2.5 pr-7 text-xs text-loom-text focus:outline-none focus:border-loom-accent/50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
          <Globe
            size={10}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-loom-muted pointer-events-none"
          />
        </div>

        <button
          onClick={onResearch}
          disabled={isLoading || !topic.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-loom-accent text-white rounded font-medium text-sm hover:bg-loom-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          {isLoading ? 'Researching...' : 'Research'}
        </button>
      </div>

      {/* Research progress indicator */}
      {isLoading && progress && (
        <div className="flex items-center gap-2 text-xs text-loom-muted">
          <Loader2 size={12} className="animate-spin text-loom-accent" />
          <span>{progress.message}</span>
        </div>
      )}

      {/* Discovered sources */}
      {discoveredSources.length > 0 && (
        <div>
          <button
            onClick={onToggleSources}
            className="flex items-center gap-1 text-xs text-loom-muted hover:text-loom-accent transition-colors"
          >
            <ChevronDown
              size={12}
              className={`transition-transform ${showSources ? 'rotate-0' : '-rotate-90'}`}
            />
            {discoveredSources.length} sources discovered
          </button>
          {showSources && (
            <div className="mt-2 max-h-32 overflow-y-auto flex flex-col gap-1">
              {discoveredSources.slice(0, 15).map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-loom-muted">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] border ${providerColor(s.provider)}`}
                  >
                    {providerLabel(s.provider)}
                  </span>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate hover:text-loom-accent transition-colors"
                    title={s.title}
                  >
                    {s.title}
                  </a>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={onSwitchToManual}
            className="mt-2 text-[10px] text-loom-muted hover:text-loom-accent transition-colors underline"
          >
            Add more sources manually
          </button>
        </div>
      )}
    </>
  );
}

interface ManualInputProps {
  text: string;
  setText: (t: string) => void;
  isLoading: boolean;
  useStreaming: boolean;
  setUseStreaming: (v: boolean) => void;
  onExtract: () => void;
}

function ManualInput({
  text,
  setText,
  isLoading,
  useStreaming,
  setUseStreaming,
  onExtract,
}: ManualInputProps) {
  return (
    <>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a news article, report, or any narrative text... LOOM will extract characters, events, tensions, and story arcs."
        className="w-full h-32 bg-loom-bg border border-loom-border rounded p-3 text-sm text-loom-text placeholder-loom-muted resize-none focus:outline-none focus:border-loom-accent/50 transition-colors"
      />

      <div className="flex items-center gap-3">
        <button
          onClick={onExtract}
          disabled={isLoading || !text.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-loom-accent text-white rounded font-medium text-sm hover:bg-loom-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {isLoading ? 'Weaving...' : 'Extract Narrative'}
        </button>

        <button
          onClick={() => setUseStreaming(!useStreaming)}
          disabled={isLoading}
          className={`flex items-center gap-1 px-2 py-1.5 text-xs border rounded transition-colors disabled:opacity-50 ${
            useStreaming
              ? 'bg-loom-accent/20 text-loom-accent border-loom-accent/30'
              : 'bg-transparent text-loom-muted border-loom-border hover:border-loom-accent/30'
          }`}
          title={useStreaming ? 'Streaming mode (live progress)' : 'Standard mode (REST API)'}
        >
          <Zap size={10} />
          {useStreaming ? 'Stream' : 'REST'}
        </button>
      </div>
    </>
  );
}
