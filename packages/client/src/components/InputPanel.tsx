import { useState } from 'react';
import { api } from '../hooks/useApi';
import { useStreamingExtraction } from '../hooks/useStreamingExtraction';
import { BookOpen, Sparkles, Trash2, Loader2, Zap } from 'lucide-react';

interface InputPanelProps {
  onDataLoaded: () => void;
}

const STAGE_LABELS: Record<string, string> = {
  entities: 'Extracting entities...',
  events: 'Extracting events...',
  tensions: 'Detecting tensions...',
  arcs: 'Mapping story arcs...',
};

export default function InputPanel({ onDataLoaded }: InputPanelProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [useStreaming, setUseStreaming] = useState(true);
  const streaming = useStreamingExtraction();

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

  const isLoading = loading || streaming.isStreaming;
  const currentStatus =
    streaming.isStreaming && streaming.progress
      ? STAGE_LABELS[streaming.progress] || 'Processing...'
      : status;

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
      onDataLoaded();
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-loom-accent uppercase tracking-wider">
          Narrative Input
        </h2>
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

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a news article, report, or any narrative text... LOOM will extract characters, events, tensions, and story arcs."
        className="w-full h-32 bg-loom-bg border border-loom-border rounded p-3 text-sm text-loom-text placeholder-loom-muted resize-none focus:outline-none focus:border-loom-accent/50 transition-colors"
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExtract}
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

        {currentStatus && (
          <span
            className={`text-xs ${currentStatus.startsWith('Error') ? 'text-red-400' : 'text-loom-muted'}`}
          >
            {currentStatus}
          </span>
        )}
      </div>
    </div>
  );
}
