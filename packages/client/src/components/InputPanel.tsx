import { useState } from 'react';
import { api } from '../hooks/useApi';
import { BookOpen, Sparkles, Trash2, Loader2 } from 'lucide-react';

interface InputPanelProps {
  onDataLoaded: () => void;
}

export default function InputPanel({ onDataLoaded }: InputPanelProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!text.trim()) return;
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
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-loom-accent/20 text-loom-accent border border-loom-accent/30 rounded hover:bg-loom-accent/30 transition-colors disabled:opacity-50"
          >
            <BookOpen size={12} />
            Load Demo
          </button>
          <button
            onClick={handleReset}
            disabled={loading}
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
        <button
          onClick={handleExtract}
          disabled={loading || !text.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-loom-accent text-white rounded font-medium text-sm hover:bg-loom-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {loading ? 'Weaving...' : 'Extract Narrative'}
        </button>

        {status && (
          <span className={`text-xs ${status.startsWith('Error') ? 'text-red-400' : 'text-loom-muted'}`}>
            {status}
          </span>
        )}
      </div>
    </div>
  );
}
