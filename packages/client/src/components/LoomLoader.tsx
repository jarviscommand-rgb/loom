import { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';

const MESSAGES = [
  'Weaving narratives…',
  'Tracing causal threads…',
  'Mapping influence networks…',
  'Analyzing tensions…',
  'Rendering tapestry…',
];

/** Premium loading animation used as Suspense fallback. */
export default function LoomLoader() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center h-full w-full bg-loom-bg/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        {/* Pulsing logo with thread-weave ring */}
        <div className="relative">
          <div className="loom-loader-ring" />
          <div className="loom-loader-ring loom-loader-ring-delayed" />
          <div className="w-14 h-14 rounded-xl logo-gradient flex items-center justify-center shadow-lg shadow-loom-accent/30 relative z-10 loom-loader-pulse">
            <Layers size={24} className="text-white" />
          </div>
        </div>

        {/* Thread-weaving lines */}
        <div className="loom-threads">
          <div className="loom-thread loom-thread-1" />
          <div className="loom-thread loom-thread-2" />
          <div className="loom-thread loom-thread-3" />
        </div>

        {/* Cycling message */}
        <p className="text-xs text-loom-muted font-serif italic loom-loader-text" key={msgIndex}>
          {MESSAGES[msgIndex]}
        </p>
      </div>
    </div>
  );
}
