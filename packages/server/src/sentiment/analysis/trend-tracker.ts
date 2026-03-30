// ============================================================
// LOOM — Trend Tracker
//
// Time-series sentiment tracking with moving averages,
// trend detection, and before/after impact measurement.
// ============================================================

import type {
  SentimentTimeSeries,
  TimeSeriesPoint,
  TrendDirection,
  SentimentArticle,
} from '../types.js';

/**
 * Build a sentiment time series for a specific entity from articles.
 *
 * @param entityName - Name of the entity to track
 * @param articles - All ingested articles (will be filtered)
 * @param intervalDays - Aggregation interval in days (default: 1)
 * @returns Time series with trend analysis
 */
export function buildTimeSeries(
  entityName: string,
  articles: SentimentArticle[],
  intervalDays: number = 1
): SentimentTimeSeries {
  const entityLower = entityName.toLowerCase();

  // Filter articles mentioning this entity
  const relevant = articles.filter(
    (a) =>
      a.entities.some((e) => e.name.toLowerCase().includes(entityLower)) ||
      a.title.toLowerCase().includes(entityLower) ||
      a.content.toLowerCase().includes(entityLower)
  );

  if (relevant.length === 0) {
    return {
      entityId: entityLower.replace(/\s+/g, '-'),
      entityName,
      dataPoints: [],
      trend: 'stable',
      movingAverage7d: 0,
      movingAverage30d: 0,
    };
  }

  // Sort by publication date
  const sorted = [...relevant].sort(
    (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
  );

  // Group by interval
  const buckets = groupByInterval(sorted, intervalDays);

  // Compute data points
  const dataPoints: TimeSeriesPoint[] = buckets.map(({ timestamp, articles: bucketArticles }) => {
    const avgSentiment =
      bucketArticles.reduce((sum, a) => sum + a.sentiment.overall, 0) / bucketArticles.length;
    const avgWeighted =
      bucketArticles.reduce((sum, a) => sum + a.sentiment.weightedScore, 0) / bucketArticles.length;

    return {
      timestamp,
      sentiment: Math.round(avgSentiment * 1000) / 1000,
      articleCount: bucketArticles.length,
      weightedSentiment: Math.round(avgWeighted * 1000) / 1000,
      events: [], // populated later when events are linked
    };
  });

  // Compute moving averages
  const movingAverage7d = computeMovingAverage(dataPoints, 7);
  const movingAverage30d = computeMovingAverage(dataPoints, 30);

  // Detect trend
  const trend = detectTrend(dataPoints);

  return {
    entityId: entityLower.replace(/\s+/g, '-'),
    entityName,
    dataPoints,
    trend,
    movingAverage7d,
    movingAverage30d,
  };
}

/**
 * Measure the sentiment impact of a specific event.
 * Compares sentiment in a window before vs. after the event.
 *
 * @param eventTimestamp - When the event occurred
 * @param articles - All articles (will be windowed)
 * @param windowDays - Days before/after to measure (default: 3)
 * @returns Before, after, and delta sentiment
 */
export function measureImpact(
  eventTimestamp: string,
  articles: SentimentArticle[],
  windowDays: number = 3
): { before: number; after: number; delta: number; duration: number } {
  const eventTime = new Date(eventTimestamp).getTime();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;

  const beforeArticles = articles.filter((a) => {
    const t = new Date(a.publishedAt).getTime();
    return t >= eventTime - windowMs && t < eventTime;
  });

  const afterArticles = articles.filter((a) => {
    const t = new Date(a.publishedAt).getTime();
    return t >= eventTime && t <= eventTime + windowMs;
  });

  const before =
    beforeArticles.length > 0
      ? beforeArticles.reduce((s, a) => s + a.sentiment.weightedScore, 0) / beforeArticles.length
      : 0;

  const after =
    afterArticles.length > 0
      ? afterArticles.reduce((s, a) => s + a.sentiment.weightedScore, 0) / afterArticles.length
      : 0;

  // Estimate duration: how many days until sentiment returns to baseline
  const duration = estimateImpactDuration(eventTimestamp, articles, before);

  return {
    before: Math.round(before * 1000) / 1000,
    after: Math.round(after * 1000) / 1000,
    delta: Math.round((after - before) * 1000) / 1000,
    duration,
  };
}

// ============================================================
// Internal helpers
// ============================================================

interface ArticleBucket {
  timestamp: string;
  articles: SentimentArticle[];
}

/** Group articles into time-interval buckets. */
function groupByInterval(articles: SentimentArticle[], intervalDays: number): ArticleBucket[] {
  if (articles.length === 0) return [];

  const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
  const buckets: ArticleBucket[] = [];

  let currentStart = new Date(articles[0].publishedAt).getTime();
  let currentBucket: SentimentArticle[] = [];

  for (const article of articles) {
    const articleTime = new Date(article.publishedAt).getTime();

    if (articleTime >= currentStart + intervalMs) {
      if (currentBucket.length > 0) {
        buckets.push({
          timestamp: new Date(currentStart).toISOString(),
          articles: currentBucket,
        });
      }
      currentStart = articleTime - (articleTime % intervalMs);
      currentBucket = [article];
    } else {
      currentBucket.push(article);
    }
  }

  // Last bucket
  if (currentBucket.length > 0) {
    buckets.push({
      timestamp: new Date(currentStart).toISOString(),
      articles: currentBucket,
    });
  }

  return buckets;
}

/** Compute the moving average of the last N data points. */
function computeMovingAverage(points: TimeSeriesPoint[], windowSize: number): number {
  if (points.length === 0) return 0;

  const window = points.slice(-windowSize);
  const avg = window.reduce((sum, p) => sum + p.weightedSentiment, 0) / window.length;
  return Math.round(avg * 1000) / 1000;
}

/** Detect the overall trend direction from data points. */
function detectTrend(points: TimeSeriesPoint[]): TrendDirection {
  if (points.length < 3) return 'stable';

  // Use linear regression slope
  const n = points.length;
  const values = points.map((p) => p.weightedSentiment);

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

  // Check volatility (standard deviation)
  const mean = sumY / n;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  // If std dev is high relative to mean, it's volatile
  if (stdDev > 0.3) return 'volatile';

  // Otherwise, classify by slope
  if (slope > 0.02) return 'improving';
  if (slope < -0.02) return 'declining';
  return 'stable';
}

/**
 * Estimate how many days an event's impact lasts.
 * Looks at when sentiment returns to within 10% of baseline.
 */
function estimateImpactDuration(
  eventTimestamp: string,
  articles: SentimentArticle[],
  baseline: number
): number {
  const eventTime = new Date(eventTimestamp).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const threshold = Math.abs(baseline) * 0.1 + 0.05; // 10% of baseline + small constant

  // Check each day after the event
  for (let day = 1; day <= 30; day++) {
    const dayStart = eventTime + day * dayMs;
    const dayEnd = dayStart + dayMs;

    const dayArticles = articles.filter((a) => {
      const t = new Date(a.publishedAt).getTime();
      return t >= dayStart && t < dayEnd;
    });

    if (dayArticles.length === 0) continue;

    const avgSentiment =
      dayArticles.reduce((s, a) => s + a.sentiment.weightedScore, 0) / dayArticles.length;

    if (Math.abs(avgSentiment - baseline) <= threshold) {
      return day;
    }
  }

  return 30; // If no normalization found, cap at 30 days
}
