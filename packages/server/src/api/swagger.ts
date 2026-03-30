// ============================================================
// LOOM — OpenAPI / Swagger Specification
//
// Auto-generated API documentation for all LOOM endpoints.
// ============================================================

import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'LOOM — Causal Narrative Intelligence Engine',
      version: '0.1.0',
      description:
        'LOOM is a causal narrative intelligence engine that extracts entities, events, tensions, and story arcs from text, building a temporal causal graph. It also includes a country-level sentiment analysis engine.',
      license: {
        name: 'MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
    tags: [
      { name: 'Graph', description: 'Temporal causal graph state' },
      { name: 'Entities', description: 'Graph entity management' },
      { name: 'Events', description: 'Graph event queries' },
      { name: 'Tensions', description: 'Narrative tension tracking' },
      { name: 'Arcs', description: 'Story arc detection' },
      { name: 'Analysis', description: 'Pressure points and dream generation' },
      { name: 'Extraction', description: 'LLM-powered narrative extraction' },
      { name: 'Demo', description: 'Demo scenario management' },
      { name: 'Sentiment Articles', description: 'Sentiment article ingestion and listing' },
      { name: 'Sentiment Events', description: 'Sentiment event queries' },
      { name: 'Sentiment Timeline', description: 'Entity sentiment over time' },
      { name: 'Sentiment Categories', description: 'Category-level sentiment breakdown' },
      { name: 'Sentiment Sources', description: 'Source registry' },
      { name: 'Sentiment Prediction', description: 'NIS impact prediction' },
      { name: 'Sentiment Dashboard', description: 'Country-level dashboard' },
      { name: 'Sentiment Compare', description: 'Entity sentiment comparison' },
      { name: 'Sentiment Demo', description: 'Sentiment demo data' },
      { name: 'Health', description: 'Server health check' },
    ],
    components: {
      schemas: {
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: { type: 'array', items: { type: 'object' } },
            total: { type: 'integer', description: 'Total items available' },
            limit: { type: 'integer', description: 'Page size' },
            offset: { type: 'integer', description: 'Current offset' },
          },
        },
        Entity: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            firstSeen: { type: 'string', format: 'date-time' },
            lastSeen: { type: 'string', format: 'date-time' },
            metadata: { type: 'object' },
          },
        },
        Event: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            description: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            entities: { type: 'array', items: { type: 'string' } },
            causalLinks: { type: 'array', items: { type: 'object' } },
          },
        },
        Tension: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            description: { type: 'string' },
            severity: { type: 'number' },
            active: { type: 'boolean' },
            entities: { type: 'array', items: { type: 'string' } },
          },
        },
        Arc: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            events: { type: 'array', items: { type: 'string' } },
            status: { type: 'string' },
          },
        },
        GraphSnapshot: {
          type: 'object',
          properties: {
            entities: { type: 'array', items: { $ref: '#/components/schemas/Entity' } },
            events: { type: 'array', items: { $ref: '#/components/schemas/Event' } },
            tensions: { type: 'array', items: { $ref: '#/components/schemas/Tension' } },
            arcs: { type: 'array', items: { $ref: '#/components/schemas/Arc' } },
          },
        },
        ExtractionRequest: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string', minLength: 1, description: 'Text to extract narrative from' },
          },
        },
        DreamRequest: {
          type: 'object',
          properties: {
            strategies: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['conservative', 'wild_card', 'pattern_based'],
              },
              description: 'Dream generation strategies',
            },
          },
        },
        SentimentArticle: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            content: { type: 'string' },
            url: { type: 'string' },
            sourceId: { type: 'string' },
            publishedAt: { type: 'string', format: 'date-time' },
            language: { type: 'string' },
            category: { type: 'string' },
            entities: { type: 'array', items: { type: 'object' } },
            nis: {
              type: 'object',
              properties: {
                score: { type: 'number', description: 'Narrative Impact Score' },
              },
            },
          },
        },
        IngestRequest: {
          type: 'object',
          required: ['articles'],
          properties: {
            articles: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                required: ['title', 'content', 'sourceId'],
                properties: {
                  title: { type: 'string', minLength: 1 },
                  content: { type: 'string', minLength: 1 },
                  url: { type: 'string', format: 'uri' },
                  sourceId: { type: 'string', minLength: 1 },
                  publishedAt: { type: 'string' },
                  language: { type: 'string', default: 'id' },
                },
              },
            },
          },
        },
        PredictRequest: {
          type: 'object',
          required: ['description', 'category'],
          properties: {
            description: { type: 'string', minLength: 1 },
            category: { type: 'string', minLength: 1 },
            entities: { type: 'array', items: { type: 'string' }, default: [] },
            sourceType: {
              type: 'string',
              enum: ['pro-government', 'anti-government', 'neutral'],
            },
          },
        },
        Source: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            bias: { type: 'string' },
            credibility: { type: 'number' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
    paths: {
      // ========== Health ==========
      '/health': {
        get: {
          tags: ['Health'],
          summary: 'Server health check',
          description: 'Returns server status with entity and article counts.',
          responses: {
            '200': {
              description: 'Server is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      entities: { type: 'integer' },
                      sentimentArticles: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ========== Graph ==========
      '/api/graph': {
        get: {
          tags: ['Graph'],
          summary: 'Get current graph snapshot',
          description: 'Returns the full current state of the temporal causal graph.',
          responses: {
            '200': {
              description: 'Graph snapshot',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/GraphSnapshot' },
                },
              },
            },
          },
        },
      },
      '/api/graph/at/{timestamp}': {
        get: {
          tags: ['Graph'],
          summary: 'Get graph snapshot at timestamp',
          description: 'Returns the graph state as it existed at a specific point in time.',
          parameters: [
            {
              name: 'timestamp',
              in: 'path',
              required: true,
              schema: { type: 'string', format: 'date-time' },
              description: 'ISO 8601 timestamp',
            },
          ],
          responses: {
            '200': {
              description: 'Graph snapshot at timestamp',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/GraphSnapshot' },
                },
              },
            },
          },
        },
      },

      // ========== Entities ==========
      '/api/entities': {
        get: {
          tags: ['Entities'],
          summary: 'List all entities',
          description: 'Returns a paginated list of all entities in the graph.',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 100, minimum: 1, maximum: 1000 },
              description: 'Page size',
            },
            {
              name: 'offset',
              in: 'query',
              schema: { type: 'integer', default: 0, minimum: 0 },
              description: 'Offset for pagination',
            },
          ],
          responses: {
            '200': {
              description: 'Paginated entity list',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PaginatedResponse' },
                },
              },
            },
          },
        },
      },
      '/api/entities/{id}': {
        get: {
          tags: ['Entities'],
          summary: 'Get entity by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Entity details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Entity' },
                },
              },
            },
            '404': {
              description: 'Entity not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/entities/{id}/events': {
        get: {
          tags: ['Entities'],
          summary: 'Get events for an entity',
          description: 'Returns all events associated with a specific entity.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 100, minimum: 1, maximum: 1000 },
            },
            {
              name: 'offset',
              in: 'query',
              schema: { type: 'integer', default: 0, minimum: 0 },
            },
          ],
          responses: {
            '200': {
              description: 'Paginated event list for entity',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PaginatedResponse' },
                },
              },
            },
          },
        },
      },

      // ========== Events ==========
      '/api/events': {
        get: {
          tags: ['Events'],
          summary: 'List all events',
          description: 'Returns a paginated list of all events.',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 100, minimum: 1, maximum: 1000 },
            },
            {
              name: 'offset',
              in: 'query',
              schema: { type: 'integer', default: 0, minimum: 0 },
            },
          ],
          responses: {
            '200': {
              description: 'Paginated event list',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PaginatedResponse' },
                },
              },
            },
          },
        },
      },
      '/api/events/range': {
        get: {
          tags: ['Events'],
          summary: 'Get events in time range',
          description: 'Returns events within a specified time range.',
          parameters: [
            {
              name: 'from',
              in: 'query',
              required: true,
              schema: { type: 'string', format: 'date-time' },
              description: 'Start of time range (ISO 8601)',
            },
            {
              name: 'to',
              in: 'query',
              required: true,
              schema: { type: 'string', format: 'date-time' },
              description: 'End of time range (ISO 8601)',
            },
          ],
          responses: {
            '200': {
              description: 'Events in range',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Event' },
                  },
                },
              },
            },
            '400': {
              description: 'Missing from/to query params',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },

      // ========== Tensions ==========
      '/api/tensions': {
        get: {
          tags: ['Tensions'],
          summary: 'List all tensions',
          description: 'Returns a paginated list of all tensions in the graph.',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 100, minimum: 1, maximum: 1000 },
            },
            {
              name: 'offset',
              in: 'query',
              schema: { type: 'integer', default: 0, minimum: 0 },
            },
          ],
          responses: {
            '200': {
              description: 'Paginated tension list',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PaginatedResponse' },
                },
              },
            },
          },
        },
      },
      '/api/tensions/active': {
        get: {
          tags: ['Tensions'],
          summary: 'Get active tensions',
          description: 'Returns only currently active tensions.',
          responses: {
            '200': {
              description: 'Active tensions',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Tension' },
                  },
                },
              },
            },
          },
        },
      },

      // ========== Arcs ==========
      '/api/arcs': {
        get: {
          tags: ['Arcs'],
          summary: 'List all story arcs',
          description: 'Returns a paginated list of detected story arcs.',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 100, minimum: 1, maximum: 1000 },
            },
            {
              name: 'offset',
              in: 'query',
              schema: { type: 'integer', default: 0, minimum: 0 },
            },
          ],
          responses: {
            '200': {
              description: 'Paginated arc list',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PaginatedResponse' },
                },
              },
            },
          },
        },
      },

      // ========== Analysis ==========
      '/api/analysis/pressure-points': {
        get: {
          tags: ['Analysis'],
          summary: 'Scan for pressure points',
          description: 'Analyzes the tension graph and identifies pressure points.',
          responses: {
            '200': {
              description: 'Pressure point analysis',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },
      '/api/analysis/dream': {
        post: {
          tags: ['Analysis'],
          summary: 'Generate narrative dreams',
          description:
            'Uses AI to generate speculative future scenarios based on current graph state. Rate limited.',
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/DreamRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Generated dreams',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
            '429': {
              description: 'Rate limit exceeded',
            },
          },
        },
      },

      // ========== Extraction ==========
      '/api/extract': {
        post: {
          tags: ['Extraction'],
          summary: 'Extract narrative from text',
          description:
            'Uses LLM to extract entities, events, and tensions from text, adding them to the graph. Rate limited. Broadcasts WebSocket update.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ExtractionRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Extraction result with entities, events, tensions',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
            '429': {
              description: 'Rate limit exceeded',
            },
          },
        },
      },

      // ========== Demo ==========
      '/api/demo/list': {
        get: {
          tags: ['Demo'],
          summary: 'List demo scenarios',
          description: 'Returns available demo scenarios with entity/event/tension/arc counts.',
          responses: {
            '200': {
              description: 'Available scenarios',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      scenarios: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            name: { type: 'string' },
                            entities: { type: 'integer' },
                            events: { type: 'integer' },
                            tensions: { type: 'integer' },
                            arcs: { type: 'integer' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/demo/load': {
        post: {
          tags: ['Demo'],
          summary: 'Load demo scenario',
          description:
            'Loads a demo scenario into the graph. Clears existing data. Broadcasts WebSocket update.',
          parameters: [
            {
              name: 'scenario',
              in: 'query',
              schema: {
                type: 'string',
                enum: ['openai-crisis', 'us-china-tech-war', 'ai-bubble'],
                default: 'openai-crisis',
              },
              description: 'Scenario ID to load',
            },
          ],
          responses: {
            '200': {
              description: 'Loaded scenario with graph snapshot',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      scenario: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Unknown scenario',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/demo/reset': {
        post: {
          tags: ['Demo'],
          summary: 'Reset graph',
          description: 'Clears all data from the graph. Broadcasts WebSocket update.',
          responses: {
            '200': {
              description: 'Graph cleared',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: 'Graph cleared' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ========== Sentiment: Articles ==========
      '/api/sentiment/ingest': {
        post: {
          tags: ['Sentiment Articles'],
          summary: 'Ingest articles',
          description: 'Add articles to the sentiment engine for analysis.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/IngestRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Ingestion result',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ingested: { type: 'integer' },
                      articles: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/SentimentArticle' },
                      },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },
      '/api/sentiment/articles': {
        get: {
          tags: ['Sentiment Articles'],
          summary: 'List articles',
          description: 'Returns a paginated, filterable list of articles sorted by NIS descending.',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 50, minimum: 1, maximum: 500 },
            },
            {
              name: 'offset',
              in: 'query',
              schema: { type: 'integer', default: 0, minimum: 0 },
            },
            {
              name: 'category',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by category',
            },
            {
              name: 'sourceId',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by source ID',
            },
            {
              name: 'entity',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by entity name (case-insensitive)',
            },
            {
              name: 'minNIS',
              in: 'query',
              schema: { type: 'number' },
              description: 'Minimum NIS score filter',
            },
          ],
          responses: {
            '200': {
              description: 'Paginated article list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      limit: { type: 'integer' },
                      offset: { type: 'integer' },
                      articles: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/SentimentArticle' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/sentiment/articles/{id}': {
        get: {
          tags: ['Sentiment Articles'],
          summary: 'Get article by ID',
          description: 'Returns a single article with its source information.',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Article with source',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      article: { $ref: '#/components/schemas/SentimentArticle' },
                      source: { $ref: '#/components/schemas/Source' },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Article not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },

      // ========== Sentiment: Events ==========
      '/api/sentiment/events': {
        get: {
          tags: ['Sentiment Events'],
          summary: 'List sentiment events',
          description: 'Returns paginated sentiment events sorted by NIS descending.',
          parameters: [
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 50, minimum: 1, maximum: 500 },
            },
            {
              name: 'offset',
              in: 'query',
              schema: { type: 'integer', default: 0, minimum: 0 },
            },
            {
              name: 'category',
              in: 'query',
              schema: { type: 'string' },
              description: 'Filter by category',
            },
          ],
          responses: {
            '200': {
              description: 'Paginated sentiment events',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      limit: { type: 'integer' },
                      offset: { type: 'integer' },
                      events: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ========== Sentiment: Timeline ==========
      '/api/sentiment/timeline/{entity}': {
        get: {
          tags: ['Sentiment Timeline'],
          summary: 'Get sentiment timeline for entity',
          description: 'Returns time series sentiment data for a specific entity.',
          parameters: [
            {
              name: 'entity',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: 'Entity name (URL-encoded)',
            },
            {
              name: 'interval',
              in: 'query',
              schema: { type: 'integer', default: 1 },
              description: 'Aggregation interval in days',
            },
          ],
          responses: {
            '200': {
              description: 'Time series data',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },

      // ========== Sentiment: Categories ==========
      '/api/sentiment/categories': {
        get: {
          tags: ['Sentiment Categories'],
          summary: 'Get category breakdown',
          description: 'Returns sentiment distribution by category.',
          responses: {
            '200': {
              description: 'Category breakdown',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      categories: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ========== Sentiment: Sources ==========
      '/api/sentiment/sources': {
        get: {
          tags: ['Sentiment Sources'],
          summary: 'List all sources',
          description: 'Returns all available news sources.',
          responses: {
            '200': {
              description: 'Source list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      sources: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Source' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/sentiment/sources/{id}': {
        get: {
          tags: ['Sentiment Sources'],
          summary: 'Get source by ID',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: 'Source details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Source' },
                },
              },
            },
            '400': {
              description: 'Source not found',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },

      // ========== Sentiment: Predict ==========
      '/api/sentiment/predict': {
        post: {
          tags: ['Sentiment Prediction'],
          summary: 'Predict NIS impact',
          description: 'Predicts the Narrative Impact Score for a hypothetical article.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PredictRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: 'Predicted impact',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
            '400': {
              description: 'Validation error',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },

      // ========== Sentiment: Dashboard ==========
      '/api/sentiment/dashboard': {
        get: {
          tags: ['Sentiment Dashboard'],
          summary: 'Get country dashboard',
          description: 'Returns aggregated sentiment metrics for a country.',
          parameters: [
            {
              name: 'country',
              in: 'query',
              schema: { type: 'string', default: 'ID' },
              description: 'Country code (default: ID for Indonesia)',
            },
          ],
          responses: {
            '200': {
              description: 'Dashboard data',
              content: {
                'application/json': {
                  schema: { type: 'object' },
                },
              },
            },
          },
        },
      },

      // ========== Sentiment: Compare ==========
      '/api/sentiment/compare': {
        get: {
          tags: ['Sentiment Compare'],
          summary: 'Compare entity sentiments',
          description: 'Compare sentiment across multiple entities.',
          parameters: [
            {
              name: 'entities',
              in: 'query',
              required: true,
              schema: { type: 'string' },
              description: 'Comma-separated entity names',
            },
          ],
          responses: {
            '200': {
              description: 'Comparison results',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      comparisons: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
            '400': {
              description: 'Missing entities parameter',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Error' },
                },
              },
            },
          },
        },
      },

      // ========== Sentiment: Demo ==========
      '/api/sentiment/demo/load': {
        post: {
          tags: ['Sentiment Demo'],
          summary: 'Load sentiment demo data',
          description: 'Loads Indonesian sentiment demo data into the engine.',
          responses: {
            '200': {
              description: 'Demo data loaded',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      loaded: { type: 'boolean' },
                      articleCount: { type: 'integer' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

/** Generated OpenAPI 3.0 specification for all LOOM endpoints. */
export const swaggerSpec = swaggerJsdoc(options) as Record<string, unknown>;
