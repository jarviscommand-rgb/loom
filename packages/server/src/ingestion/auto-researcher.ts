// ============================================================
// LOOM — Auto-Research Topic Ingestion
//
// Takes a topic string → searches multiple sources in parallel
// → scrapes article text via Firecrawl → deduplicates →
// returns structured results for narrative extraction.
//
// Supported providers:
// - SerpAPI (Google search results)
// - Google News RSS (free, no key required)
// - Firecrawl (article text scraping)
// ============================================================

import { config } from '../config/env.js';
import { ResearchError } from '../errors/index.js';
import type {
  ResearchRequest,
  ResearchSource,
  ScrapedArticle,
  ResearchResult,
  ResearchProgressCallback,
  CacheEntry,
} from './types.js';

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CONCURRENT_SCRAPES = 2;
const SCRAPE_DELAY_MS = 500;
const MAX_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 1000;

/** In-memory research cache keyed by "topic:country". */
const researchCache = new Map<string, CacheEntry>();

// ============================================================
// Public API
// ============================================================

/**
 * Research a topic by searching multiple sources and scraping articles.
 * Emits progress updates via the optional callback.
 *
 * @param request - Research request with topic, optional country, and maxArticles
 * @param onProgress - Optional callback for progress updates
 * @returns Research result with sources, articles, and metadata
 */
export async function researchTopic(
  request: ResearchRequest,
  onProgress?: ResearchProgressCallback
): Promise<ResearchResult> {
  const { topic, country, maxArticles = 10 } = request;
  const cacheKey = buildCacheKey(topic, country);
  const cached = researchCache.get(cacheKey);

  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    onProgress?.({ stage: 'complete', message: 'Returning cached results' });
    return { ...cached.result, cached: true };
  }

  // Stage 1: Search multiple sources in parallel
  onProgress?.({ stage: 'searching', message: 'Searching for articles...' });

  const allSources = await searchAllProviders(topic, country);
  const deduplicated = deduplicateSources(allSources);

  onProgress?.({
    stage: 'searching',
    message: `Found ${deduplicated.length} unique sources`,
    sourcesFound: deduplicated.length,
    sources: deduplicated,
  });

  // Stage 2: Scrape top N articles
  const toScrape = deduplicated.slice(0, maxArticles);
  onProgress?.({
    stage: 'scraping',
    message: `Scraping ${toScrape.length} articles...`,
    totalArticles: toScrape.length,
    articlesScraped: 0,
  });

  const articles = await scrapeArticles(toScrape, (scraped, total) => {
    onProgress?.({
      stage: 'scraping',
      message: `Scraping articles... (${scraped}/${total})`,
      articlesScraped: scraped,
      totalArticles: total,
    });
  });

  onProgress?.({
    stage: 'extracting',
    message: 'Articles scraped, ready for narrative extraction',
    articlesScraped: articles.length,
    totalArticles: toScrape.length,
  });

  const result: ResearchResult = {
    topic,
    country,
    sources: deduplicated,
    articles,
    narrative: null,
    researchedAt: new Date().toISOString(),
    cached: false,
  };

  // Cache the result (narrative gets added later by the caller)
  researchCache.set(cacheKey, { result, cachedAt: Date.now() });

  onProgress?.({ stage: 'complete', message: 'Research complete' });
  return result;
}

/**
 * Get combined article text from research results.
 * Joins all scraped article texts into a single document
 * suitable for narrative extraction.
 */
export function combineArticleText(articles: ScrapedArticle[]): string {
  return articles
    .map((a) => `# ${a.source.title}\nSource: ${a.source.sourceName}\n\n${a.fullText}`)
    .join('\n\n---\n\n');
}

/** Clear the research cache. */
export function clearResearchCache(): void {
  researchCache.clear();
}

// ============================================================
// Search providers
// ============================================================

/** Search all available providers in parallel. */
async function searchAllProviders(topic: string, country?: string): Promise<ResearchSource[]> {
  const searches: Array<Promise<ResearchSource[]>> = [
    searchGoogleNewsRss(topic, country).catch(() => []),
  ];

  if (config.SERPAPI_KEY) {
    searches.push(searchSerpApi(topic, country).catch(() => []));
  }

  const results = await Promise.all(searches);
  return results.flat();
}

/** Search via SerpAPI Google search. */
async function searchSerpApi(topic: string, country?: string): Promise<ResearchSource[]> {
  const query = buildSearchQuery(topic, country);
  const params = new URLSearchParams({
    q: query,
    api_key: config.SERPAPI_KEY ?? '',
    engine: 'google',
    num: '10',
  });

  if (country) {
    params.set('gl', country.toLowerCase());
  }

  const response = await fetchWithRetry(`https://serpapi.com/search.json?${params.toString()}`);
  const data = (await response.json()) as SerpApiResponse;

  return (data.organic_results ?? []).map((r) => ({
    url: r.link,
    title: r.title,
    snippet: r.snippet ?? '',
    sourceName: r.source ?? extractDomain(r.link),
    publishedAt: r.date,
    provider: 'serpapi' as const,
  }));
}

/** Search via Google News RSS feed (free, no API key). */
async function searchGoogleNewsRss(topic: string, country?: string): Promise<ResearchSource[]> {
  const encodedTopic = encodeURIComponent(topic);
  const hl = country === 'ID' ? 'id' : 'en-US';
  const gl = country ?? 'US';
  const ceid = `${gl}:${hl.split('-')[0]}`;

  const url = `https://news.google.com/rss/search?q=${encodedTopic}&hl=${hl}&gl=${gl}&ceid=${ceid}`;

  const response = await fetchWithRetry(url);
  const xml = await response.text();

  return parseRssItems(xml).map((item) => ({
    url: item.link,
    title: item.title,
    snippet: item.description,
    sourceName: item.source,
    publishedAt: item.pubDate,
    provider: 'google-news-rss' as const,
  }));
}

// ============================================================
// Article scraping via Firecrawl
// ============================================================

/** Scrape multiple articles with concurrency control. */
async function scrapeArticles(
  sources: ResearchSource[],
  onProgress: (scraped: number, total: number) => void
): Promise<ScrapedArticle[]> {
  if (!config.FIRECRAWL_API_KEY) {
    return sources.map((source) => ({
      source,
      fullText: source.snippet,
      scrapedAt: new Date().toISOString(),
      wordCount: source.snippet.split(/\s+/).length,
    }));
  }

  const articles: ScrapedArticle[] = [];
  let scraped = 0;

  for (let i = 0; i < sources.length; i += MAX_CONCURRENT_SCRAPES) {
    const batch = sources.slice(i, i + MAX_CONCURRENT_SCRAPES);
    const results = await Promise.allSettled(batch.map((s) => scrapeWithFirecrawl(s)));

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value) {
        articles.push(result.value);
      }
    }

    scraped += batch.length;
    onProgress(scraped, sources.length);

    if (i + MAX_CONCURRENT_SCRAPES < sources.length) {
      await sleep(SCRAPE_DELAY_MS);
    }
  }

  return articles;
}

/** Scrape a single article URL via Firecrawl API. */
async function scrapeWithFirecrawl(source: ResearchSource): Promise<ScrapedArticle | null> {
  try {
    const response = await fetchWithRetry('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.FIRECRAWL_API_KEY ?? ''}`,
      },
      body: JSON.stringify({ url: source.url, formats: ['markdown'] }),
    });

    const data = (await response.json()) as FirecrawlResponse;
    const text = data.data?.markdown ?? data.data?.content ?? '';

    if (!text) return null;

    return {
      source,
      fullText: text,
      scrapedAt: new Date().toISOString(),
      wordCount: text.split(/\s+/).length,
    };
  } catch {
    return null;
  }
}

// ============================================================
// Utilities
// ============================================================

/** Build a search query with optional country context. */
export function buildSearchQuery(topic: string, country?: string): string {
  if (country === 'ID') {
    return `${topic} Indonesia`;
  }
  return topic;
}

/** Deduplicate sources by normalized URL. */
export function deduplicateSources(sources: ResearchSource[]): ResearchSource[] {
  const seen = new Map<string, ResearchSource>();
  for (const source of sources) {
    const key = normalizeUrl(source.url);
    if (!seen.has(key)) {
      seen.set(key, source);
    }
  }
  return Array.from(seen.values());
}

/** Build cache key from topic and country. */
function buildCacheKey(topic: string, country?: string): string {
  return `${topic.toLowerCase().trim()}:${country ?? 'global'}`;
}

/** Normalize a URL for deduplication (strip protocol, trailing slash, www). */
function normalizeUrl(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/+$/, '')
    .toLowerCase();
}

/** Extract domain name from a URL. */
function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

/** Parse RSS XML items using regex (no external dependencies). */
function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    items.push({
      title: extractXmlTag(content, 'title'),
      link: extractXmlTag(content, 'link'),
      description: extractXmlTag(content, 'description'),
      source: extractXmlTag(content, 'source'),
      pubDate: extractXmlTag(content, 'pubDate'),
    });
  }

  return items;
}

/** Extract text content from an XML tag using regex. */
function extractXmlTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?(.*?)(?:\\]\\]>)?<\\/${tag}>`, 's');
  const match = regex.exec(xml);
  return match?.[1]?.trim() ?? '';
}

/** Fetch with retry and exponential backoff. */
async function fetchWithRetry(url: string, options?: RequestInit): Promise<Response> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status === 429) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
      throw new ResearchError(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_RETRY_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }

  throw new ResearchError(
    `Request failed after ${MAX_RETRIES + 1} attempts: ${lastError?.message}`
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// External API response types
// ============================================================

interface SerpApiResponse {
  organic_results?: Array<{
    title: string;
    link: string;
    snippet?: string;
    source?: string;
    date?: string;
  }>;
}

interface FirecrawlResponse {
  data?: {
    markdown?: string;
    content?: string;
  };
}

interface RssItem {
  title: string;
  link: string;
  description: string;
  source: string;
  pubDate: string;
}
