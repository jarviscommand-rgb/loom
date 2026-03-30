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
// Auto-Researcher — Edge Case & Extended Coverage Tests
// ============================================================

describe('Auto-Researcher Edge Cases', () => {
  beforeEach(() => {
    clearResearchCache();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  // --------------------------------------------------------
  // buildSearchQuery edge cases
  // --------------------------------------------------------

  describe('buildSearchQuery edge cases', () => {
    it('should handle empty topic string', () => {
      expect(buildSearchQuery('')).toBe('');
    });

    it('should handle topic with special characters', () => {
      expect(buildSearchQuery('AI & ML (2024)')).toBe('AI & ML (2024)');
    });

    it('should append Indonesia for ID country regardless of topic', () => {
      expect(buildSearchQuery('', 'ID')).toBe(' Indonesia');
    });

    it('should not modify query for unrecognized country codes', () => {
      expect(buildSearchQuery('crypto regulation', 'JP')).toBe('crypto regulation');
      expect(buildSearchQuery('crypto regulation', 'SG')).toBe('crypto regulation');
    });
  });

  // --------------------------------------------------------
  // deduplicateSources edge cases
  // --------------------------------------------------------

  describe('deduplicateSources edge cases', () => {
    it('should handle empty array', () => {
      expect(deduplicateSources([])).toEqual([]);
    });

    it('should handle single source', () => {
      const sources: ResearchSource[] = [
        {
          url: 'https://example.com/article',
          title: 'Solo',
          snippet: 'Test',
          sourceName: 'Example',
          provider: 'serpapi',
        },
      ];
      expect(deduplicateSources(sources)).toHaveLength(1);
    });

    it('should handle URLs with query parameters', () => {
      const sources: ResearchSource[] = [
        {
          url: 'https://example.com/article?ref=google',
          title: 'With param',
          snippet: 'Test',
          sourceName: 'Example',
          provider: 'serpapi',
        },
        {
          url: 'https://example.com/article?ref=twitter',
          title: 'Different param',
          snippet: 'Test',
          sourceName: 'Example',
          provider: 'serpapi',
        },
      ];
      // Different query params = different URLs
      const result = deduplicateSources(sources);
      expect(result).toHaveLength(2);
    });

    it('should normalize case in URLs', () => {
      const sources: ResearchSource[] = [
        {
          url: 'https://EXAMPLE.COM/Article',
          title: 'Upper',
          snippet: 'Test',
          sourceName: 'Example',
          provider: 'serpapi',
        },
        {
          url: 'https://example.com/article',
          title: 'Lower',
          snippet: 'Test',
          sourceName: 'Example',
          provider: 'serpapi',
        },
      ];
      expect(deduplicateSources(sources)).toHaveLength(1);
    });

    it('should keep first occurrence when duplicates exist', () => {
      const sources: ResearchSource[] = [
        {
          url: 'https://example.com/a',
          title: 'First',
          snippet: 'Test',
          sourceName: 'Example',
          provider: 'serpapi',
        },
        {
          url: 'https://example.com/a',
          title: 'Second',
          snippet: 'Test',
          sourceName: 'Example',
          provider: 'google-news-rss',
        },
      ];
      const result = deduplicateSources(sources);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('First');
    });
  });

  // --------------------------------------------------------
  // combineArticleText edge cases
  // --------------------------------------------------------

  describe('combineArticleText edge cases', () => {
    it('should handle single article', () => {
      const articles: ScrapedArticle[] = [
        {
          source: {
            url: 'https://example.com/1',
            title: 'Only Article',
            snippet: 'Test',
            sourceName: 'Example',
            provider: 'serpapi',
          },
          fullText: 'Article body.',
          scrapedAt: '2024-01-01T00:00:00Z',
          wordCount: 2,
        },
      ];
      const combined = combineArticleText(articles);
      expect(combined).toContain('# Only Article');
      expect(combined).toContain('Article body.');
      expect(combined).not.toContain('---');
    });

    it('should handle articles with empty text', () => {
      const articles: ScrapedArticle[] = [
        {
          source: {
            url: 'https://example.com/1',
            title: 'Empty',
            snippet: 'Test',
            sourceName: 'Example',
            provider: 'serpapi',
          },
          fullText: '',
          scrapedAt: '2024-01-01T00:00:00Z',
          wordCount: 0,
        },
      ];
      const combined = combineArticleText(articles);
      expect(combined).toContain('# Empty');
    });
  });

  // --------------------------------------------------------
  // researchTopic — error handling and edge cases
  // --------------------------------------------------------

  describe('researchTopic error handling', () => {
    it('should handle fetch throwing an error gracefully', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network failure')));

      // Google News RSS search catches errors internally, so it should
      // return an empty result rather than throwing
      const result = await researchTopic({ topic: 'error test', maxArticles: 5 });
      expect(result.articles).toHaveLength(0);
      expect(result.sources).toHaveLength(0);
    });

    it('should proceed with different progress stages', async () => {
      const stages: string[] = [];

      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          text: () =>
            Promise.resolve(
              '<rss><channel><item><title>Test</title><link>https://example.com/1</link><description>Snippet</description><source>Example</source><pubDate>2024-01-01</pubDate></item></channel></rss>'
            ),
          json: () => Promise.resolve({ organic_results: [] }),
        })
      );

      await researchTopic({ topic: 'stage test', maxArticles: 2 }, (progress: ResearchProgress) => {
        stages.push(progress.stage);
      });

      expect(stages).toContain('searching');
      expect(stages).toContain('scraping');
      expect(stages).toContain('complete');
    });

    it('should report source count in progress callback', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          text: () =>
            Promise.resolve(
              '<rss><channel>' +
                '<item><title>A</title><link>https://a.com/1</link><description>S</description><source>A</source><pubDate>2024-01-01</pubDate></item>' +
                '<item><title>B</title><link>https://b.com/1</link><description>S</description><source>B</source><pubDate>2024-01-01</pubDate></item>' +
                '</channel></rss>'
            ),
          json: () => Promise.resolve({ organic_results: [] }),
        })
      );

      let sourcesFoundReported = 0;
      await researchTopic({ topic: 'sources test' }, (progress: ResearchProgress) => {
        if (progress.sourcesFound !== undefined) {
          sourcesFoundReported = progress.sourcesFound;
        }
      });

      expect(sourcesFoundReported).toBeGreaterThan(0);
    });

    it('should handle RSS with no items', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('<rss><channel></channel></rss>'),
          json: () => Promise.resolve({ organic_results: [] }),
        })
      );

      const result = await researchTopic({ topic: 'empty rss' });
      expect(result.sources).toHaveLength(0);
      expect(result.articles).toHaveLength(0);
    });

    it('should set researchedAt timestamp', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('<rss></rss>'),
          json: () => Promise.resolve({ organic_results: [] }),
        })
      );

      const result = await researchTopic({ topic: 'timestamp test' });
      expect(result.researchedAt).toBeDefined();
      // Should be a valid ISO date
      expect(new Date(result.researchedAt).getTime()).not.toBeNaN();
    });

    it('should set cached to false on first call', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('<rss></rss>'),
          json: () => Promise.resolve({ organic_results: [] }),
        })
      );

      const result = await researchTopic({ topic: 'cache false test' });
      expect(result.cached).toBe(false);
    });

    it('should default maxArticles to 10 when not specified', async () => {
      const mockSources = Array.from({ length: 15 }, (_, i) => ({
        title: `Article ${i}`,
        link: `https://example.com/${i}`,
        snippet: 'Test',
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
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('<rss></rss>'),
          });
        })
      );

      const result = await researchTopic({ topic: 'default max articles' });
      expect(result.articles.length).toBeLessThanOrEqual(10);
    });
  });

  // --------------------------------------------------------
  // End-to-end pipeline with mocked APIs
  // --------------------------------------------------------

  describe('end-to-end research pipeline', () => {
    it('should complete full pipeline: search → scrape → result', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation((url: string) => {
          // Google News RSS
          if (typeof url === 'string' && url.includes('news.google.com')) {
            return Promise.resolve({
              ok: true,
              text: () =>
                Promise.resolve(
                  '<rss><channel>' +
                    '<item><title>Indonesia Policy Update</title>' +
                    '<link>https://kompas.com/policy-2024</link>' +
                    '<description>New fintech regulations announced</description>' +
                    '<source>Kompas</source>' +
                    '<pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate></item>' +
                    '</channel></rss>'
                ),
            });
          }
          // Default fallback
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(''),
            json: () => Promise.resolve({ organic_results: [] }),
          });
        })
      );

      const progressLog: ResearchProgress[] = [];
      const result = await researchTopic(
        { topic: 'Indonesia fintech regulation', country: 'ID', maxArticles: 5 },
        (progress) => progressLog.push({ ...progress })
      );

      expect(result.topic).toBe('Indonesia fintech regulation');
      expect(result.country).toBe('ID');
      expect(result.cached).toBe(false);
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.researchedAt).toBeDefined();

      // Should have gone through all stages
      const stageOrder = progressLog.map((p) => p.stage);
      expect(stageOrder[0]).toBe('searching');
      expect(stageOrder).toContain('scraping');
      expect(stageOrder[stageOrder.length - 1]).toBe('complete');
    });

    it('should return cached results on second call with same topic', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('<rss></rss>'),
          json: () => Promise.resolve({ organic_results: [] }),
        })
      );

      const result1 = await researchTopic({ topic: 'e2e cache test', country: 'ID' });
      expect(result1.cached).toBe(false);

      const progressLog: ResearchProgress[] = [];
      const result2 = await researchTopic({ topic: 'e2e cache test', country: 'ID' }, (progress) =>
        progressLog.push({ ...progress })
      );
      expect(result2.cached).toBe(true);
      expect(progressLog.some((p) => p.message.includes('cached'))).toBe(true);
    });

    it('should not return cached results after clearResearchCache', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          text: () => Promise.resolve('<rss></rss>'),
          json: () => Promise.resolve({ organic_results: [] }),
        })
      );

      await researchTopic({ topic: 'clear cache test' });
      clearResearchCache();
      const result = await researchTopic({ topic: 'clear cache test' });
      expect(result.cached).toBe(false);
    });
  });

  // --------------------------------------------------------
  // extractXmlTag — CDATA handling (lines 336-338)
  // --------------------------------------------------------

  describe('extractXmlTag via RSS parsing (CDATA content)', () => {
    it('should extract CDATA-wrapped content from RSS items', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          text: () =>
            Promise.resolve(
              '<rss><channel>' +
                '<item>' +
                '<title><![CDATA[Breaking: CDATA Title]]></title>' +
                '<link>https://example.com/cdata-article</link>' +
                '<description><![CDATA[A description with <b>HTML</b> inside CDATA]]></description>' +
                '<source>CDATA Source</source>' +
                '<pubDate>Tue, 15 Jan 2024 10:00:00 GMT</pubDate>' +
                '</item>' +
                '</channel></rss>'
            ),
          json: () => Promise.resolve({ organic_results: [] }),
        })
      );

      const result = await researchTopic({ topic: 'cdata test', maxArticles: 5 });
      expect(result.sources.length).toBeGreaterThan(0);
      expect(result.sources[0].title).toContain('CDATA Title');
    });

    it('should handle mixed CDATA and non-CDATA tags', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          text: () =>
            Promise.resolve(
              '<rss><channel>' +
                '<item>' +
                '<title>Plain Title</title>' +
                '<link>https://example.com/mixed</link>' +
                '<description><![CDATA[CDATA description]]></description>' +
                '<source>Mixed Source</source>' +
                '<pubDate>2024-01-15</pubDate>' +
                '</item>' +
                '</channel></rss>'
            ),
          json: () => Promise.resolve({ organic_results: [] }),
        })
      );

      const result = await researchTopic({ topic: 'mixed cdata test', maxArticles: 5 });
      expect(result.sources.length).toBe(1);
      expect(result.sources[0].title).toBe('Plain Title');
    });
  });

  // --------------------------------------------------------
  // fetchWithRetry — retry and error paths (lines 349-363)
  // --------------------------------------------------------

  describe('fetchWithRetry retry behavior', () => {
    it('should retry on 429 status and eventually succeed', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount <= 1) {
            return Promise.resolve({
              ok: false,
              status: 429,
              statusText: 'Too Many Requests',
              text: () => Promise.resolve(''),
              json: () => Promise.resolve({}),
            });
          }
          return Promise.resolve({
            ok: true,
            text: () =>
              Promise.resolve(
                '<rss><channel>' +
                  '<item><title>After Retry</title>' +
                  '<link>https://example.com/retry</link>' +
                  '<description>Retried</description>' +
                  '<source>Retry Source</source>' +
                  '<pubDate>2024-01-01</pubDate></item>' +
                  '</channel></rss>'
              ),
            json: () => Promise.resolve({ organic_results: [] }),
          });
        })
      );

      const result = await researchTopic({ topic: 'retry 429 test', maxArticles: 3 });
      expect(result.sources.length).toBeGreaterThan(0);
      expect(callCount).toBeGreaterThan(1);
    });

    it('should handle non-ok non-429 status as an error', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          text: () => Promise.resolve(''),
          json: () => Promise.resolve({}),
        })
      );

      // searchAllProviders catches errors, so we get empty results
      const result = await researchTopic({ topic: 'server error test', maxArticles: 3 });
      expect(result.sources).toHaveLength(0);
      expect(result.articles).toHaveLength(0);
    });

    it('should exhaust retries and return empty when all attempts fail', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(() => {
          callCount++;
          return Promise.reject(new Error(`Attempt ${callCount} failed`));
        })
      );

      const result = await researchTopic({ topic: 'exhaust retries test', maxArticles: 2 });
      expect(result.sources).toHaveLength(0);
      expect(result.articles).toHaveLength(0);
      // MAX_RETRIES is 2, so 3 total attempts per provider
      expect(callCount).toBeGreaterThanOrEqual(3);
    });

    it('should retry on network error then succeed on second attempt', async () => {
      let callCount = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(() => {
          callCount++;
          if (callCount === 1) {
            return Promise.reject(new Error('ECONNRESET'));
          }
          return Promise.resolve({
            ok: true,
            text: () =>
              Promise.resolve(
                '<rss><channel>' +
                  '<item><title>Recovered</title>' +
                  '<link>https://example.com/recovered</link>' +
                  '<description>After network error</description>' +
                  '<source>Recovery</source>' +
                  '<pubDate>2024-01-01</pubDate></item>' +
                  '</channel></rss>'
              ),
            json: () => Promise.resolve({ organic_results: [] }),
          });
        })
      );

      const result = await researchTopic({ topic: 'network recovery test', maxArticles: 3 });
      expect(result.sources.length).toBeGreaterThan(0);
    });
  });
});
