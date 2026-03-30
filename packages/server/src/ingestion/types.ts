// ============================================================
// LOOM — Auto-Research Ingestion Types
//
// Type definitions for the auto-research topic ingestion
// pipeline. Covers search, scraping, progress tracking,
// and final research results.
// ============================================================

import type { ExtractionResult } from '../extraction/narrative-extractor.js';

/** Supported search providers. */
export type SearchProvider = 'serpapi' | 'google-news-rss' | 'manual';

/** Request payload for topic research. */
export interface ResearchRequest {
  /** Topic string to research (e.g., "Prabowo cooperative program"). */
  topic: string;
  /** Optional ISO country code for region-specific search (e.g., "ID", "US"). */
  country?: string;
  /** Maximum articles to scrape and analyze (default 10, max 20). */
  maxArticles?: number;
}

/** A discovered source from search results. */
export interface ResearchSource {
  /** Article URL. */
  url: string;
  /** Article title. */
  title: string;
  /** Short snippet or description. */
  snippet: string;
  /** Name of the publication or website. */
  sourceName: string;
  /** ISO date string of publication, if available. */
  publishedAt?: string;
  /** Which search provider discovered this source. */
  provider: SearchProvider;
}

/** A fully scraped article with extracted text. */
export interface ScrapedArticle {
  /** The source metadata for this article. */
  source: ResearchSource;
  /** Full article text content. */
  fullText: string;
  /** ISO date string when scraping occurred. */
  scrapedAt: string;
  /** Word count of the full text. */
  wordCount: number;
}

/** Stages of the research pipeline. */
export type ResearchStage = 'searching' | 'scraping' | 'extracting' | 'complete' | 'error';

/** Progress update emitted during research. */
export interface ResearchProgress {
  /** Current pipeline stage. */
  stage: ResearchStage;
  /** Human-readable progress message. */
  message: string;
  /** Number of sources discovered so far. */
  sourcesFound?: number;
  /** Number of articles scraped so far. */
  articlesScraped?: number;
  /** Total articles targeted for scraping. */
  totalArticles?: number;
  /** List of discovered sources. */
  sources?: ResearchSource[];
  /** Error message, if stage is 'error'. */
  error?: string;
}

/** Callback for receiving research progress updates. */
export type ResearchProgressCallback = (progress: ResearchProgress) => void;

/** Final result of a topic research operation. */
export interface ResearchResult {
  /** The researched topic. */
  topic: string;
  /** Country filter used, if any. */
  country?: string;
  /** All discovered sources across providers. */
  sources: ResearchSource[];
  /** Successfully scraped articles. */
  articles: ScrapedArticle[];
  /** Narrative extraction result from the combined article text. */
  narrative: ExtractionResult | null;
  /** ISO date string when research was performed. */
  researchedAt: string;
  /** Whether this result was served from cache. */
  cached: boolean;
}

/** Internal cache entry structure. */
export interface CacheEntry {
  /** Cached research result. */
  result: ResearchResult;
  /** Timestamp when entry was cached. */
  cachedAt: number;
}
