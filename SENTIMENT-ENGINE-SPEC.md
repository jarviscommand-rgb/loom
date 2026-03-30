# LOOM — Country Sentiment Engine Specification

## Overview

A precision sentiment measurement instrument focused on country-level narrative analysis.
Starting with Indonesia, this module ingests real news feeds, categorizes events, measures
sentiment impact, tracks effectiveness, and enables predictive scenario analysis.

## Architecture

```
packages/server/src/
├── sentiment/
│   ├── types.ts                    # Core types for sentiment engine
│   ├── ingestion/
│   │   ├── news-ingester.ts        # RSS/API/scraping pipeline
│   │   ├── rss-parser.ts           # RSS feed parser
│   │   └── article-processor.ts    # Article text extraction & cleaning
│   ├── analysis/
│   │   ├── sentiment-scorer.ts     # Multi-strategy sentiment scoring
│   │   ├── impact-calculator.ts    # Before/after delta measurement
│   │   ├── category-classifier.ts  # Event categorization (political, economic, etc.)
│   │   └── trend-tracker.ts        # Time-series sentiment tracking
│   ├── sources/
│   │   ├── types.ts                # Source profile types
│   │   ├── source-registry.ts      # Configurable source registry
│   │   ├── source-weighting.ts     # Source-weighted sentiment calculation
│   │   └── profiles/
│   │       └── indonesia.ts        # Indonesian media profiles
│   ├── countries/
│   │   └── indonesia.ts            # Indonesia-specific config (feeds, entities)
│   └── api/
│       └── sentiment-routes.ts     # REST API endpoints
```

## Core Types

### MediaSource

```typescript
interface MediaSource {
  id: string;
  name: string;
  country: string;
  language: string[]; // ['id', 'en'] for bilingual
  url: string;
  feedUrls: string[]; // RSS/Atom feeds
  politicalLeaning: PoliticalLeaning;
  ownership: SourceOwnership;
  editorialGoal: string; // "pro-business reform", "investigative accountability"
  reliabilityScore: number; // 0-1
  audienceType: AudienceType[];
  biasDirection: BiasDirection; // pro-government, opposition, independent
  signalWeight: number; // computed: how much this source's sentiment matters
}

type PoliticalLeaning =
  | 'pro-government'
  | 'opposition'
  | 'independent'
  | 'military-aligned'
  | 'oligarch-owned'
  | 'state-media'
  | 'centrist'
  | 'islamic-conservative'
  | 'progressive';

type AudienceType =
  | 'elite-policy'
  | 'urban-middle'
  | 'rural-mass'
  | 'diaspora'
  | 'international'
  | 'youth-digital';

type BiasDirection = 'pro-government' | 'anti-government' | 'neutral';

interface SourceOwnership {
  owner: string;
  conglomerate?: string;
  politicalAffiliation?: string;
  notes: string;
}
```

### SentimentArticle

```typescript
interface SentimentArticle {
  id: string;
  sourceId: string;
  title: string;
  content: string;
  url: string;
  publishedAt: string; // ISO date
  ingestedAt: string;
  language: string;

  // Analysis results
  category: EventCategory;
  subcategory?: string;
  sentiment: SentimentScore;
  entities: ArticleEntity[]; // People, orgs, places mentioned
  topics: string[]; // Extracted topic tags

  // Graph integration
  narrativeEventId?: string; // Link to NarrativeEvent in main graph
}

type EventCategory =
  | 'political'
  | 'economic'
  | 'regulatory'
  | 'social'
  | 'technology'
  | 'military'
  | 'diplomatic'
  | 'environmental'
  | 'corruption'
  | 'infrastructure'
  | 'education'
  | 'health';

interface SentimentScore {
  overall: number; // -1 to 1
  magnitude: number; // 0 to 1 (strength of sentiment)
  confidence: number; // 0 to 1
  method: 'llm' | 'lexicon' | 'hybrid';
  // Source-weighted score (adjusted by source reliability & bias)
  weightedScore: number;
  sourceWeight: number;
}

interface ArticleEntity {
  name: string;
  type: 'person' | 'organization' | 'location' | 'topic';
  sentimentToward: number; // -1 to 1 (article's sentiment toward this entity)
  role: 'subject' | 'actor' | 'mentioned';
}
```

### SentimentEvent (Impact Measurement)

```typescript
interface SentimentEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  timestamp: string;

  // Impact measurement
  articleIds: string[];
  sentimentBefore: number; // baseline sentiment pre-event
  sentimentAfter: number; // measured sentiment post-event
  sentimentDelta: number; // after - before
  impactMagnitude: number; // abs(delta)
  impactDuration: number; // days until sentiment normalized

  // Source analysis
  sourceBreakdown: Array<{
    sourceId: string;
    articleCount: number;
    avgSentiment: number;
    // Key insight: same event, different framing
    framingType: 'positive' | 'negative' | 'neutral' | 'mixed';
  }>;

  // Pattern matching for predictions
  eventPattern: string; // normalized pattern key
  historicalSimilar: string[]; // IDs of similar past events
}
```

### SentimentTimeSeries

```typescript
interface SentimentTimeSeries {
  entityId: string; // person, topic, or country
  entityName: string;
  dataPoints: Array<{
    timestamp: string;
    sentiment: number;
    articleCount: number;
    weightedSentiment: number;
    events: string[]; // event IDs that influenced this point
  }>;
  trend: 'improving' | 'declining' | 'stable' | 'volatile';
  movingAverage7d: number;
  movingAverage30d: number;
}
```

## Source Weighting Algorithm

The key insight: **not all sources are equal**.

```
weightedSentiment = Σ(article.sentiment × sourceWeight) / Σ(sourceWeight)

sourceWeight = reliabilityScore × biasMultiplier × audienceReach

biasMultiplier:
  - If source.bias == event.expectedBias: weight × 0.5 (expected, less signal)
  - If source.bias == opposite: weight × 2.0 (unexpected, HIGH signal)
  - If source.bias == neutral: weight × 1.0 (baseline)

Example:
  Tempo (opposition) reporting Prabowo positively → weight × 2.0 (SIGNAL)
  Antara (state) reporting Prabowo positively → weight × 0.5 (noise)
```

## API Endpoints

```
POST   /api/sentiment/ingest          # Trigger news ingestion
GET    /api/sentiment/articles         # List ingested articles (paginated, filterable)
GET    /api/sentiment/articles/:id     # Single article with full analysis
GET    /api/sentiment/events           # Sentiment events (impact measurements)
GET    /api/sentiment/timeline/:entity # Sentiment time series for entity
GET    /api/sentiment/categories       # Category breakdown with avg sentiment
GET    /api/sentiment/sources          # Source registry with profiles
GET    /api/sentiment/sources/:id      # Single source profile
POST   /api/sentiment/predict          # Predict impact of hypothetical event
GET    /api/sentiment/dashboard        # Aggregated dashboard data
GET    /api/sentiment/compare          # Compare entity sentiments side-by-side
```

## Indonesian Media Source Profiles

See source-profiles section in implementation.

## Integration with Main Graph

- SentimentArticles create NarrativeEvents in the main graph
- ArticleEntities link to Entities in the main graph
- Sentiment scores feed into Tension intensity calculations
- Category classifications map to narrative arc phases
- Source-weighted sentiment becomes the authoritative sentiment score

## Demo Data

Pre-loaded Indonesian sentiment data:

- Recent Prabowo administration events (first 100 days)
- IKN (new capital) sentiment tracking
- Economic policy announcements and market reactions
- Regional geopolitical events (ASEAN, South China Sea)
