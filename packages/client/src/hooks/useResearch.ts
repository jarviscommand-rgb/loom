import { useState, useRef, useCallback } from 'react';

/** Research pipeline stages. */
export type ResearchStage = 'searching' | 'scraping' | 'extracting' | 'complete' | 'error';

/** A discovered research source. */
export interface ResearchSource {
  url: string;
  title: string;
  snippet: string;
  sourceName: string;
  publishedAt?: string;
  provider: 'serpapi' | 'google-news-rss' | 'manual';
}

/** Progress update from the research pipeline. */
export interface ResearchProgress {
  stage: ResearchStage;
  message: string;
  sourcesFound?: number;
  articlesScraped?: number;
  totalArticles?: number;
  sources?: ResearchSource[];
  error?: string;
}

/** A scraped article. */
interface ScrapedArticle {
  source: ResearchSource;
  fullText: string;
  scrapedAt: string;
  wordCount: number;
}

/** Complete research result. */
export interface ResearchResult {
  topic: string;
  country?: string;
  sources: ResearchSource[];
  articles: ScrapedArticle[];
  narrative: unknown;
  researchedAt: string;
  cached: boolean;
}

/** Server message types for research WebSocket. */
type ResearchMessage =
  | ({ type: 'research-progress' } & ResearchProgress)
  | { type: 'research-complete'; result: ResearchResult }
  | { type: 'research-error'; error: string };

/**
 * React hook for WebSocket-based auto-research topic ingestion.
 * Manages connection, progress tracking, and result state.
 */
export function useResearch() {
  const [isResearching, setIsResearching] = useState(false);
  const [progress, setProgress] = useState<ResearchProgress | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const research = useCallback(
    (topic: string, country?: string, maxArticles?: number): Promise<ResearchResult | null> => {
      return new Promise((resolve) => {
        setIsResearching(true);
        setProgress(null);
        setResult(null);
        setError(null);

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = '3001';
        const ws = new WebSocket(`${protocol}//${host}:${port}`);
        wsRef.current = ws;

        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'research-topic', topic, country, maxArticles }));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data) as ResearchMessage;

            switch (msg.type) {
              case 'research-progress':
                setProgress(msg);
                break;

              case 'research-complete':
                setResult(msg.result);
                setIsResearching(false);
                setProgress(null);
                ws.close();
                resolve(msg.result);
                break;

              case 'research-error':
                setError(msg.error);
                setIsResearching(false);
                setProgress(null);
                ws.close();
                resolve(null);
                break;
            }
          } catch {
            // Ignore non-research messages (e.g., graph-updated broadcasts)
          }
        };

        ws.onerror = () => {
          setError('WebSocket connection failed');
          setIsResearching(false);
          ws.close();
          resolve(null);
        };

        ws.onclose = () => {
          wsRef.current = null;
        };
      });
    },
    []
  );

  const cancel = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsResearching(false);
    setProgress(null);
  }, []);

  return { research, cancel, isResearching, progress, result, error };
}
