# Changelog

All notable changes to LOOM will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Social Media Intelligence module — platform tracking, audience segmentation, persona generation, engagement pattern analysis
- Audience persona system with AI-generated profiles and reaction prediction
- Social amplification tracking across Twitter/X, Instagram, TikTok, Facebook
- Comprehensive README overhaul — compelling hero section, intelligence stack documentation, API examples
- Updated CONTRIBUTING.md with social module guide, visual standards, and testing guidelines per module
- Real tension radar algorithms with duration-weighted scoring, escalation tracking, convergence detection, and cascade risk analysis
- Arc detector with phase transition detection, narrative pattern matching, and climax prediction
- Dream engine with branching probability scoring, character motivation modeling, and constraint satisfaction
- Robust extraction pipeline with retry logic, chunking, entity deduplication, and confidence scoring
- Graph engine performance optimizations with indexing and efficient queries
- Custom error classes with error codes
- Environment validation at startup
- Rate limiting on extraction and dream endpoints
- Input validation via Zod on all API routes
- Unit tests for all core modules (93%+ coverage, 780 tests)
- Integration tests for all API routes
- ESLint + Prettier configuration
- GitHub Actions CI/CD pipeline
- Docker + Docker Compose for one-command startup
- Pre-commit hooks via Husky + lint-staged
- LICENSE (MIT)
- CONTRIBUTING.md
- CLAUDE.md project standards
- .env.example with documented variables

### Changed

- Upgraded Three.js Tapestry with particle effects, post-processing bloom, and smooth animations
- Enhanced D3 visualizations with transitions and interactivity
- Visual polish pass across all components — refined dark theme, improved loading states, smoother transitions
- Refined dark theme across all components
- Improved API response format with pagination support
- Strengthened TypeScript strict mode — eliminated all `any` types

### Fixed

- Graph engine now handles 10,000+ entities efficiently
- Extraction pipeline handles long documents via chunking
- WebSocket reconnection is more robust
- Proper error responses on all API endpoints

## [0.1.0] - 2024-12-01

### Added

- Initial prototype
- Basic narrative extraction via OpenAI GPT-4o
- In-memory temporal causal graph
- Express API with WebSocket
- React client with Timeline, Network Graph, Tapestry (3D), Tension Radar, Dream Tree
- OpenAI Board Crisis demo dataset
