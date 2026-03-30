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
      { name: 'Social Intelligence', description: 'Social media tracking, audience analysis, engagement patterns, and amplification chains' },
      { name: 'Social Bridge', description: 'Narrative-social integration — linking announcements to events and impact analysis' },
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

        // ========== Social Intelligence Schemas ==========
        TrackAnnouncementRequest: {
          type: 'object',
          required: ['entityId', 'entityName', 'title', 'description', 'platforms'],
          properties: {
            entityId: { type: 'string', minLength: 1, description: 'Entity making the announcement' },
            entityName: { type: 'string', minLength: 1, maxLength: 500, description: 'Entity display name' },
            title: { type: 'string', minLength: 1, maxLength: 500, description: 'Announcement title' },
            description: { type: 'string', minLength: 1, maxLength: 5000, description: 'Announcement body' },
            platforms: {
              type: 'array',
              items: { type: 'string', enum: ['twitter', 'instagram', 'tiktok', 'facebook', 'reddit', 'youtube'] },
              minItems: 1,
            },
            tags: { type: 'array', items: { type: 'string' }, default: [] },
          },
          example: {
            entityId: 'minister-eko',
            entityName: 'Minister Eko Prasetyo',
            title: 'Labor Reform Press Conference',
            description: 'Minister announces new labor reform policy at press conference.',
            platforms: ['twitter', 'tiktok', 'instagram'],
            tags: ['labor', 'reform', 'controversy'],
          },
        },
        PredictReactionRequest: {
          type: 'object',
          required: ['announcement'],
          properties: {
            announcement: { type: 'string', minLength: 1, maxLength: 5000, description: 'Announcement text to predict reactions for' },
            tags: { type: 'array', items: { type: 'string' }, default: [] },
            platforms: {
              type: 'array',
              items: { type: 'string', enum: ['twitter', 'instagram', 'tiktok', 'facebook', 'reddit', 'youtube'] },
              default: ['twitter', 'instagram', 'tiktok'],
            },
          },
          example: {
            announcement: 'Workers need to stop being lazy and start competing globally.',
            tags: ['labor', 'controversy'],
            platforms: ['twitter', 'tiktok'],
          },
        },
        LinkAnnouncementRequest: {
          type: 'object',
          required: ['announcementId', 'narrativeEventId'],
          properties: {
            announcementId: { type: 'string', minLength: 1, description: 'Social announcement ID' },
            narrativeEventId: { type: 'string', minLength: 1, description: 'Narrative event ID to link to' },
          },
        },
        SocialAnnouncementTracking: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            entityId: { type: 'string' },
            entityName: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            announcedAt: { type: 'string', format: 'date-time' },
            platforms: { type: 'array', items: { type: 'string' } },
            platformResponses: { type: 'array', items: { $ref: '#/components/schemas/SocialPlatformResponse' } },
            engagementPattern: { $ref: '#/components/schemas/SocialEngagementPattern' },
            impactScore: { $ref: '#/components/schemas/SocialImpactScore' },
            amplificationChain: { $ref: '#/components/schemas/SocialAmplificationChain' },
            tags: { type: 'array', items: { type: 'string' } },
          },
        },
        SocialEngagementPattern: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['spike-decay', 'sustained', 'viral-loop', 'slow-burn'] },
            confidence: { type: 'number', description: 'Classification confidence (0-1)' },
            peakValue: { type: 'number' },
            peakTimestamp: { type: 'string', format: 'date-time' },
            decayRate: { type: 'number' },
            halfLifeHours: { type: 'number' },
            viralCoefficient: { type: 'number', description: '>1 means viral spread' },
          },
        },
        SocialPlatformResponse: {
          type: 'object',
          properties: {
            platform: { type: 'string' },
            totalEngagement: { type: 'object' },
            sentimentScore: { type: 'number', description: 'Dominant sentiment (-1 to 1)' },
            topHashtags: { type: 'array', items: { type: 'string' } },
            talkingPoints: { type: 'array', items: { type: 'string' } },
            quality: { $ref: '#/components/schemas/SocialEngagementQuality' },
          },
        },
        SocialEngagementQuality: {
          type: 'object',
          properties: {
            botScore: { type: 'number', description: 'Bot-driven engagement ratio (0-1)' },
            realScore: { type: 'number', description: 'Human engagement ratio (0-1)' },
            passiveToActiveRatio: { type: 'number' },
            qualityScore: { type: 'number', description: 'Overall quality (0-100)' },
          },
        },
        SocialImpactScore: {
          type: 'object',
          properties: {
            score: { type: 'number', description: 'Composite score (0-100)' },
            reachScore: { type: 'number' },
            engagementScore: { type: 'number' },
            sentimentScore: { type: 'number' },
            amplificationScore: { type: 'number' },
            crossPlatformScore: { type: 'number' },
            summary: { type: 'string' },
          },
        },
        SocialAmplificationChain: {
          type: 'object',
          properties: {
            source: { $ref: '#/components/schemas/SocialAmplificationNode' },
            influencers: { type: 'array', items: { $ref: '#/components/schemas/SocialAmplificationNode' } },
            massAudience: { type: 'array', items: { $ref: '#/components/schemas/SocialAmplificationNode' } },
            totalReach: { type: 'number' },
            velocityPerHour: { type: 'number' },
            timeToPeakHours: { type: 'number' },
            botAmplificationRate: { type: 'number' },
          },
        },
        SocialAmplificationNode: {
          type: 'object',
          properties: {
            nodeId: { type: 'string' },
            name: { type: 'string' },
            nodeType: { type: 'string', enum: ['source', 'influencer', 'mass-audience'] },
            platform: { type: 'string' },
            audienceSize: { type: 'number' },
            amplifiedAt: { type: 'string', format: 'date-time' },
            engagement: { type: 'number' },
          },
        },
        SocialAudiencePersona: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string', description: 'E.g. "Urban Jakarta Millennial"' },
            description: { type: 'string' },
            ageRange: { type: 'string' },
            platforms: { type: 'array', items: { type: 'string' } },
            interests: { type: 'array', items: { type: 'string' } },
            politicalLeaning: { type: 'string' },
            geography: { type: 'string' },
            keyConcerns: { type: 'array', items: { type: 'string' } },
          },
        },
        SocialPersonaReaction: {
          type: 'object',
          properties: {
            personaId: { type: 'string' },
            personaName: { type: 'string' },
            sentimentScore: { type: 'number', description: 'Reaction sentiment (-1 to 1)' },
            engagementLikelihood: { type: 'number', description: '0-1' },
            amplificationLikelihood: { type: 'number', description: '0-1' },
            dominantEmotion: { type: 'string' },
            likelyTalkingPoints: { type: 'array', items: { type: 'string' } },
            preferredPlatform: { type: 'string' },
            summary: { type: 'string' },
          },
        },
        SocialInfluencerProfile: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            platform: { type: 'string' },
            followerCount: { type: 'number' },
            engagementRate: { type: 'number' },
            amplificationScore: { type: 'number', description: '0-100' },
            contentCategories: { type: 'array', items: { type: 'string' } },
            verified: { type: 'boolean' },
            geography: { type: 'string' },
          },
        },
        SocialCrossPlatformAnalysis: {
          type: 'object',
          properties: {
            eventId: { type: 'string' },
            eventDescription: { type: 'string' },
            platformBreakdowns: { type: 'array', items: { $ref: '#/components/schemas/SocialPlatformResponse' } },
            dominantPlatform: { type: 'string' },
            sentimentDivergence: { type: 'number', description: '0-1, higher = more divergent' },
            framingDifferences: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' },
          },
        },
        SocialAudienceOverlap: {
          type: 'object',
          properties: {
            entityId1: { type: 'string' },
            entityId2: { type: 'string' },
            overlapCoefficient: { type: 'number', description: 'Jaccard similarity (0-1)' },
            sharedSegments: { type: 'array', items: { type: 'object' } },
            uniqueToEntity1: { type: 'array', items: { type: 'object' } },
            uniqueToEntity2: { type: 'array', items: { type: 'object' } },
            competitiveTension: { type: 'number', description: '0-100' },
            summary: { type: 'string' },
          },
        },
        SocialDashboard: {
          type: 'object',
          properties: {
            totalAnnouncements: { type: 'integer' },
            totalInfluencers: { type: 'integer' },
            totalPersonas: { type: 'integer' },
            averageImpactScore: { type: 'number' },
            mostActivePlatform: { type: 'string' },
            topAnnouncements: { type: 'array', items: { type: 'object' } },
            topInfluencers: { type: 'array', items: { type: 'object' } },
            platformDistribution: { type: 'object' },
            trendDirection: { type: 'string', enum: ['rising', 'falling', 'stable'] },
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
                enum: ['openai-crisis', 'us-china-tech-war', 'ai-bubble', 'indonesia-election'],
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

      // ========== Social Intelligence ==========
      '/api/social/dashboard': {
        get: {
          tags: ['Social Intelligence'],
          summary: 'Get social intelligence dashboard',
          description: 'Returns aggregated social intelligence metrics including top announcements, platform distribution, influencer rankings, and trend direction.',
          responses: {
            '200': {
              description: 'Social dashboard data',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SocialDashboard' } } },
            },
          },
        },
      },
      '/api/social/announcements': {
        get: {
          tags: ['Social Intelligence'],
          summary: 'List announcements',
          description: 'Returns a paginated list of tracked announcements sorted by impact score, optionally filtered by entity or tag.',
          parameters: [
            { name: 'entityId', in: 'query', schema: { type: 'string' }, description: 'Filter by entity ID' },
            { name: 'tag', in: 'query', schema: { type: 'string' }, description: 'Filter by tag (case-insensitive partial match)' },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, minimum: 1, maximum: 500 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0, minimum: 0 } },
          ],
          responses: {
            '200': {
              description: 'Paginated announcement list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      limit: { type: 'integer' },
                      offset: { type: 'integer' },
                      announcements: { type: 'array', items: { $ref: '#/components/schemas/SocialAnnouncementTracking' } },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Social Intelligence'],
          summary: 'Track a new announcement',
          description: 'Creates a new announcement tracking entry with simulated platform responses, engagement pattern, impact score, and amplification chain.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/TrackAnnouncementRequest' } } },
          },
          responses: {
            '201': {
              description: 'Announcement created',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SocialAnnouncementTracking' } } },
            },
            '400': {
              description: 'Validation error',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/api/social/announcements/{id}': {
        get: {
          tags: ['Social Intelligence'],
          summary: 'Get announcement detail',
          description: 'Returns full detail for a single tracked announcement.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Announcement ID' },
          ],
          responses: {
            '200': {
              description: 'Announcement detail',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SocialAnnouncementTracking' } } },
            },
            '404': {
              description: 'Announcement not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/api/social/announcements/{id}/engagement': {
        get: {
          tags: ['Social Intelligence'],
          summary: 'Get engagement pattern',
          description: 'Returns the classified engagement pattern (spike-decay, sustained, viral-loop, slow-burn) with decay rate, peak, and viral coefficient.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Announcement ID' },
          ],
          responses: {
            '200': {
              description: 'Engagement pattern analysis',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SocialEngagementPattern' } } },
            },
            '404': {
              description: 'Announcement not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/api/social/announcements/{id}/amplification': {
        get: {
          tags: ['Social Intelligence'],
          summary: 'Get amplification chain',
          description: 'Returns the amplification chain showing how the announcement spread from source through influencers to mass audience.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Announcement ID' },
          ],
          responses: {
            '200': {
              description: 'Amplification chain',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SocialAmplificationChain' } } },
            },
            '404': {
              description: 'Announcement not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/api/social/audiences/{entityId}': {
        get: {
          tags: ['Social Intelligence'],
          summary: 'Get audience segmentation',
          description: 'Returns audience segments for an entity, weighted by engagement patterns and demographics.',
          parameters: [
            { name: 'entityId', in: 'path', required: true, schema: { type: 'string' }, description: 'Entity ID' },
          ],
          responses: {
            '200': {
              description: 'Audience segmentation data',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      entityId: { type: 'string' },
                      segments: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/social/personas': {
        get: {
          tags: ['Social Intelligence'],
          summary: 'List all audience personas',
          description: 'Returns all audience persona profiles used for reaction prediction.',
          responses: {
            '200': {
              description: 'Persona list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      personas: { type: 'array', items: { $ref: '#/components/schemas/SocialAudiencePersona' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/social/personas/{id}': {
        get: {
          tags: ['Social Intelligence'],
          summary: 'Get persona detail',
          description: 'Returns full detail for a single audience persona.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Persona ID' },
          ],
          responses: {
            '200': {
              description: 'Persona detail',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SocialAudiencePersona' } } },
            },
            '404': {
              description: 'Persona not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/api/social/personas/{id}/predict': {
        post: {
          tags: ['Social Intelligence'],
          summary: 'Predict persona reaction',
          description: 'Predicts how a specific audience persona would react to an announcement, including sentiment, engagement likelihood, and likely talking points.',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' }, description: 'Persona ID' },
          ],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PredictReactionRequest' } } },
          },
          responses: {
            '200': {
              description: 'Predicted persona reaction',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SocialPersonaReaction' } } },
            },
            '400': {
              description: 'Validation error',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '404': {
              description: 'Persona not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/api/social/influencers': {
        get: {
          tags: ['Social Intelligence'],
          summary: 'List influencers',
          description: 'Returns a paginated list of tracked influencer profiles.',
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, minimum: 1, maximum: 500 } },
            { name: 'offset', in: 'query', schema: { type: 'integer', default: 0, minimum: 0 } },
          ],
          responses: {
            '200': {
              description: 'Paginated influencer list',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer' },
                      limit: { type: 'integer' },
                      offset: { type: 'integer' },
                      influencers: { type: 'array', items: { $ref: '#/components/schemas/SocialInfluencerProfile' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/social/influencers/{entityId}': {
        get: {
          tags: ['Social Intelligence'],
          summary: 'Get influencers for entity',
          description: 'Returns influencers associated with a specific entity/narrative.',
          parameters: [
            { name: 'entityId', in: 'path', required: true, schema: { type: 'string' }, description: 'Entity ID' },
          ],
          responses: {
            '200': {
              description: 'Influencer profiles for entity',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      entityId: { type: 'string' },
                      influencers: { type: 'array', items: { $ref: '#/components/schemas/SocialInfluencerProfile' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/social/cross-platform/{eventId}': {
        get: {
          tags: ['Social Intelligence'],
          summary: 'Cross-platform analysis',
          description: 'Analyzes how an event played across platforms — sentiment divergence, dominant platform, framing differences.',
          parameters: [
            { name: 'eventId', in: 'path', required: true, schema: { type: 'string' }, description: 'Event ID' },
          ],
          responses: {
            '200': {
              description: 'Cross-platform analysis',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SocialCrossPlatformAnalysis' } } },
            },
            '404': {
              description: 'Event not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/api/social/overlap': {
        get: {
          tags: ['Social Intelligence'],
          summary: 'Audience overlap analysis',
          description: 'Computes Jaccard similarity between two entities\' audiences — shared segments, unique segments, competitive tension.',
          parameters: [
            { name: 'entity1', in: 'query', required: true, schema: { type: 'string' }, description: 'First entity ID' },
            { name: 'entity2', in: 'query', required: true, schema: { type: 'string' }, description: 'Second entity ID' },
          ],
          responses: {
            '200': {
              description: 'Audience overlap analysis',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SocialAudienceOverlap' } } },
            },
            '400': {
              description: 'Missing entity1 or entity2 query parameter',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/api/social/demo/load': {
        post: {
          tags: ['Social Intelligence'],
          summary: 'Load social demo data',
          description: 'Loads Indonesian social media intelligence demo data (personas, influencers, segments, announcements).',
          responses: {
            '200': {
              description: 'Demo data loaded',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      loaded: { type: 'boolean' },
                      announcementCount: { type: 'integer' },
                      message: { type: 'string', example: 'Indonesian social media intelligence demo data loaded' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ========== Social Bridge ==========
      '/api/social/link': {
        post: {
          tags: ['Social Bridge'],
          summary: 'Link announcement to narrative event',
          description: 'Creates a bidirectional link between a social announcement and a narrative event for cross-domain impact analysis.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LinkAnnouncementRequest' } } },
          },
          responses: {
            '201': {
              description: 'Link created',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            '400': {
              description: 'Validation error',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
            '404': {
              description: 'Announcement or event not found',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/api/social/impact/{eventId}': {
        get: {
          tags: ['Social Bridge'],
          summary: 'Get social impact for narrative event',
          description: 'Returns the social impact score and platform breakdown for a narrative event with linked announcements.',
          parameters: [
            { name: 'eventId', in: 'path', required: true, schema: { type: 'string' }, description: 'Narrative event ID' },
          ],
          responses: {
            '200': {
              description: 'Social impact data',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/SocialImpactScore' } } },
            },
            '404': {
              description: 'No social impact data for event',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/api/social/correlation/{entityId}': {
        get: {
          tags: ['Social Bridge'],
          summary: 'Engagement-sentiment correlation',
          description: 'Analyzes correlation between social engagement patterns and narrative sentiment shifts for an entity.',
          parameters: [
            { name: 'entityId', in: 'path', required: true, schema: { type: 'string' }, description: 'Entity ID' },
          ],
          responses: {
            '200': {
              description: 'Correlation analysis',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            '404': {
              description: 'No correlation data',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
            },
          },
        },
      },
      '/api/social/impact-chain/{eventId}': {
        get: {
          tags: ['Social Bridge'],
          summary: 'Full impact chain',
          description: 'Traces the complete impact chain from narrative event through social announcements, amplification, and audience reactions.',
          parameters: [
            { name: 'eventId', in: 'path', required: true, schema: { type: 'string' }, description: 'Narrative event ID' },
          ],
          responses: {
            '200': {
              description: 'Full impact chain',
              content: { 'application/json': { schema: { type: 'object' } } },
            },
            '404': {
              description: 'No impact chain data',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
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
