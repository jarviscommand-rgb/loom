import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  buildSearchQuery,
  deduplicateSources,
  researchTopic,
  clearResearchCache,
  combineArticleText,
} from './auto-researcher.js';
import type { ResearchSource, ScrapedArticle, ResearchProgress } from './types.js';

// ============================================================
// Auto-Researcher Tests
// ============================================================

describe('buildSearchQuery', () => {
  it('returns plain topic when no country specified', () => {
    expect(buildSearchQuery('OpenAI board crisis')).toBe('OpenAI board crisis');
  });

  it('appends Indonesia context for country ID', () => {
    expect(buildSearchQuery('fintech regulation', 'ID')).toBe('fintech regulation Indonesia');
  });

  it('returns plain topic for non-ID countries', () => {
    expect(buildSearchQuery('tech war', 'US')).toBe('tech war');
  });
});

describe('deduplicateSources', () => {
  it('removes duplicate URLs (same URL)', () => {
    const sources: ResearchSource[] = [
      {
        url: 'https://example.com/article-1',
        title: 'First',
        snippet: 'Test',
        sourceName: 'Example',
        provider: 'serpapi',
      },
      {
        url: 'https://example.com/article-1',
        title: 'Duplicate',
        snippet: 'Test',
        sourceName: 'Example',
        provider: 'google-news-rss',
      },
    ];
    const result = deduplicateSources(sources);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('First');
  });

  it('normalizes URLs by stripping protocol and www', () => {
    const sources: ResearchSource[] = [
      {
        url: 'https://www.example.com/article',
        title: 'HTTPS www',
        snippet: 'Test',
        sourceName: 'Example',
        provider: 'serpapi',
      },
      {
        url: 'http://example.com/article',
        title: 'HTTP no www',
        snippet: 'Test',
        sourceName: 'Example',
        provider: 'google-news-rss',
      },
    ];
    const result = deduplicateSources(sources);
    expect(result).toHaveLength(1);
  });

  it('normalizes trailing slashes', () => {
    const sources: ResearchSource[] = [
      {
        url: 'https://example.com/path/',
        title: 'With slash',
        snippet: 'Test',
        sourceName: 'Example',
        provider: 'serpapi',
      },
      {
        url: 'https://example.com/path',
        title: 'Without slash',
        snippet: 'Test',
        sourceName: 'Example',
        provider: 'serpapi',
      },
    ];
    const result = deduplicateSources(sources);
    expect(result).toHaveLength(1);
  });

  it('keeps different URLs separate', () => {
    const sources: ResearchSource[] = [
      {
        url: 'https://example.com/article-1',
        title: 'First',
        snippet: 'Test',
        sourceName: 'Example',
        provider: 'serpapi',
      },
      {
        url: 'https://example.com/article-2',
        title: 'Second',
        snippet: 'Test',
        sourceName: 'Example',
        provider: 'serpapi',
      },
    ];
    const result = deduplicateSources(sources);
    expect(result).toHaveLength(2);
  });
});

describe('combineArticleText', () => {
  it('combines articles with headers and separators', () => {
    const articles: ScrapedArticle[] = [
      {
        source: {
          url: 'https://example.com/1',
          title: 'Article One',
          snippet: 'Test',
          sourceName: 'Example',
          provider: 'serpapi',
        },
        fullText: 'Body of article one.',
        scrapedAt: '2024-01-01T00:00:00Z',
        wordCount: 4,
      },
      {
        source: {
          url: 'https://example.com/2',
          title: 'Article Two',
          snippet: 'Test',
          sourceName: 'Other',
          provider: 'google-news-rss',
        },
        fullText: 'Body of article two.',
        scrapedAt: '2024-01-01T00:00:00Z',
        wordCount: 4,
      },
    ];

    const combined = combineArticleText(articles);
    expect(combined).toContain('# Article One');
    expect(combined).toContain('Source: Example');
    expect(combined).toContain('# Article Two');
    expect(combined).toContain('---');
  });

  it('returns empty string for no articles', () => {
    expect(combineArticleText([])).toBe('');
  });
});

describe('researchTopic', () => {
  beforeEach(() => {
    clearResearchCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls progress callback with searching stage', async () => {
    const progressCalls: ResearchProgress[] = [];

    // Mock fetch to return empty results
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<rss></rss>'),
        json: () => Promise.resolve({ organic_results: [] }),
      })
    );

    await researchTopic({ topic: 'test topic', maxArticles: 5 }, (progress: ResearchProgress) => {
      progressCalls.push({ ...progress });
    });

    expect(progressCalls.length).toBeGreaterThan(0);
    expect(progressCalls[0].stage).toBe('searching');

    vi.unstubAllGlobals();
  });

  it('returns cached results on second call', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve('<rss></rss>'),
        json: () => Promise.resolve({ organic_results: [] }),
      })
    );

    const result1 = await researchTopic({ topic: 'cache test' });
    expect(result1.cached).toBe(false);

    const result2 = await researchTopic({ topic: 'cache test' });
    expect(result2.cached).toBe(true);

    vi.unstubAllGlobals();
  });

  it('respects maxArticles limit', async () => {
    const mockSources = Array.from({ length: 15 }, (_, i) => ({
      title: `Article ${i}`,
      link: `https://example.com/${i}`,
      snippet: 'Test snippet',
      source: 'Example',
    }));

    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (typeof url === 'string' && url.includes('serpapi.com')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                organic_results: mockSources.map((s) => ({
                  title: s.title,
                  link: s.link,
                  snippet: s.snippet,
                  source: s.source,
                })),
              }),
          });
        }
        // Google News RSS
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('<rss></rss>'),
        });
      })
    );

    const result = await researchTopic({ topic: 'many articles', maxArticles: 5 });
    // Should have scraped at most 5 articles
    expect(result.articles.length).toBeLessThanOrEqual(5);

    vi.unstubAllGlobals();
  });
});
