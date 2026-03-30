import { useState, useRef, useCallback } from 'react';

/** Stages of streaming extraction. */
export type ExtractionStage = 'entities' | 'events' | 'tensions' | 'arcs';

/** Result shape from streaming extraction. */
interface ExtractionResult {
  entities: unknown[];
  events: unknown[];
  tensions: unknown[];
  arcs: unknown[];
}

/** Progress update from the server. */
interface ProgressMessage {
  type: 'extraction-progress';
  stage: ExtractionStage;
  partial: Record<string, unknown>;
  done: boolean;
}

/** Completion message from the server. */
interface CompleteMessage {
  type: 'extraction-complete';
  result: ExtractionResult;
}

/** Error message from the server. */
interface ErrorMessage {
  type: 'extraction-error';
  error: string;
}

type ServerMessage = ProgressMessage | CompleteMessage | ErrorMessage;

/**
 * React hook for WebSocket-based streaming narrative extraction.
 * Manages connection, progress tracking, and result state.
 */
export function useStreamingExtraction() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [progress, setProgress] = useState<ExtractionStage | null>(null);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const extract = useCallback((text: string): Promise<ExtractionResult | null> => {
    return new Promise((resolve) => {
      setIsStreaming(true);
      setProgress(null);
      setResult(null);
      setError(null);

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = '3001';
      const ws = new WebSocket(`${protocol}//${host}:${port}`);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'extract-stream', text }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as ServerMessage;

          switch (msg.type) {
            case 'extraction-progress':
              setProgress(msg.stage);
              break;

            case 'extraction-complete':
              setResult(msg.result);
              setIsStreaming(false);
              setProgress(null);
              ws.close();
              resolve(msg.result);
              break;

            case 'extraction-error':
              setError(msg.error);
              setIsStreaming(false);
              setProgress(null);
              ws.close();
              resolve(null);
              break;
          }
        } catch {
          // Ignore non-extraction messages (e.g., graph-updated broadcasts)
        }
      };

      ws.onerror = () => {
        setError('WebSocket connection failed');
        setIsStreaming(false);
        ws.close();
        resolve(null);
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
    });
  }, []);

  const cancel = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsStreaming(false);
    setProgress(null);
  }, []);

  return { extract, cancel, isStreaming, progress, result, error };
}
