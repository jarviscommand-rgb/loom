import { describe, it, expect, beforeEach } from 'vitest';
import { SentimentEngine } from './sentiment-engine.js';
import type { ArticleInput } from './sentiment-engine.js';

describe('SentimentEngine — Stress Tests', () => {
  let engine: SentimentEngine;

  beforeEach(() => {
    engine = new SentimentEngine();
  });

  it('should handle 500 articles without degradation', () => {
    const articles: ArticleInput[] = [];
    const sources = ['kompas', 'tempo', 'antara', 'detik', 'jakarta-post'];
    const categories = ['political', 'economic', 'social', 'technology', 'corruption'];

    for (let i = 0; i < 500; i++) {
      articles.push({
        title: `Article ${i}: ${categories[i % categories.length]} news update`,
        content:
          `This is article ${i} covering ${categories[i % categories.length]} topics. ` +
          'The government announced new policies for economic growth and investment. ' +
          'President Prabowo held meetings with cabinet ministers. ' +
          'Bank Indonesia maintained interest rates amid inflation concerns. ' +
          'DPR debated new regulatory frameworks for digital economy. ' +
          (i % 3 === 0 ? 'Crisis looms as corruption scandal threatens stability. ' : '') +
          (i % 5 === 0 ? 'Success and progress in infrastructure development bring hope. ' : ''),
        sourceId: sources[i % sources.length],
        publishedAt: new Date(2025, 0, 1 + Math.floor(i / 5)).toISOString(),
        language: 'id',
      });
    }

    const start = Date.now();
    const results = engine.ingestArticles(articles);
    const ingestTime = Date.now() - start;

    expect(results).toHaveLength(500);
    expect(ingestTime).toBeLessThan(5000); // Should process in < 5 seconds

    // Verify all articles have valid analysis
    for (const article of results) {
      expect(article.id).toBeDefined();
      expect(article.category).toBeDefined();
      expect(article.sentiment.overall).toBeGreaterThanOrEqual(-1);
      expect(article.sentiment.overall).toBeLessThanOrEqual(1);
      expect(article.nis.score).toBeGreaterThanOrEqual(0);
      expect(article.nis.score).toBeLessThanOrEqual(100);
    }
  });

  it('should retrieve and filter articles efficiently at scale', () => {
    // Load demo + extra
    engine.loadDemoData();
    const extraArticles: ArticleInput[] = Array.from({ length: 200 }, (_, i) => ({
      title: `Extra article ${i}`,
      content: `Content about economic growth and investment opportunity number ${i}.`,
      sourceId: i % 2 === 0 ? 'kompas' : 'tempo',
      publishedAt: new Date(2025, 0, 1 + i).toISOString(),
    }));
    engine.ingestArticles(extraArticles);

    const start = Date.now();
    const all = engine.getArticles();
    const retrieveTime = Date.now() - start;

    expect(all.length).toBeGreaterThan(200);
    expect(retrieveTime).toBeLessThan(100); // Retrieval should be <100ms
  });

  it('should build timelines at scale efficiently', () => {
    // Load 300 articles mentioning Prabowo
    const articles: ArticleInput[] = Array.from({ length: 300 }, (_, i) => ({
      title: `Prabowo policy update day ${i}`,
      content: `President Prabowo announced new measures on day ${i} of the administration.`,
      sourceId: ['kompas', 'tempo', 'detik'][i % 3],
      publishedAt: new Date(2025, 0, 1 + i).toISOString(),
    }));
    engine.ingestArticles(articles);

    const start = Date.now();
    const timeline = engine.getTimeline('Prabowo', 7); // weekly aggregation
    const timelineTime = Date.now() - start;

    expect(timeline.dataPoints.length).toBeGreaterThan(0);
    expect(timelineTime).toBeLessThan(500); // <500ms for timeline
  });

  it('should compute dashboard at scale', () => {
    engine.loadDemoData();
    const extra: ArticleInput[] = Array.from({ length: 100 }, (_, i) => ({
      title: `Dashboard test article ${i}`,
      content: `Economic growth and political reform content ${i}.`,
      sourceId: ['kompas', 'tempo', 'antara', 'detik', 'republika'][i % 5],
      publishedAt: new Date(Date.now() - i * 86400000).toISOString(),
    }));
    engine.ingestArticles(extra);

    const start = Date.now();
    const dashboard = engine.getDashboard('ID');
    const dashTime = Date.now() - start;

    expect(dashboard.totalArticles).toBeGreaterThan(100);
    expect(dashboard.categoryBreakdown.length).toBeGreaterThan(0);
    expect(dashTime).toBeLessThan(500);
  });

  it('should predict at scale with many historical articles', () => {
    // Load lots of economic articles for prediction
    const articles: ArticleInput[] = Array.from({ length: 200 }, (_, i) => ({
      title: `Economic policy article ${i}`,
      content: `GDP growth investment trade fiscal budget tax economy Bank Indonesia inflation.`,
      sourceId: ['kompas', 'tempo', 'jakarta-post'][i % 3],
      publishedAt: new Date(2025, 0, 1 + i).toISOString(),
    }));
    engine.ingestArticles(articles);

    const start = Date.now();
    const prediction = engine.predict({
      description: 'New economic stimulus announced',
      category: 'economic',
      entities: [],
    });
    const predictTime = Date.now() - start;

    // With empty entities, falls back to category-only match
    expect(typeof prediction.confidence).toBe('number');
    expect(typeof prediction.predictedDelta).toBe('number');
    expect(predictTime).toBeLessThan(200);
  });
});
