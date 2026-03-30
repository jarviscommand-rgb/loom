# CLAUDE.md — LOOM Project Standards

## Project
LOOM — Causal Narrative Intelligence Engine
Monorepo: packages/server (TypeScript + Express) and packages/client (React + Vite + Three.js)

## Quality Bar

### TypeScript
- Strict mode enabled (`strict: true` in tsconfig)
- **Zero `any` types** — use `unknown` + type guards or proper generics
- All public functions have JSDoc comments
- All interfaces documented with field descriptions
- Files under 300 lines — split when larger

### Code Style
- ESLint + Prettier enforced via pre-commit hooks
- Conventional commits: `feat:`, `fix:`, `docs:`, `test:`, `chore:`, `refactor:`
- Functional style preferred — pure functions where possible
- Descriptive variable names — no single letters except loop indices
- No wrapper functions with zero logic (every function must add value)

### Error Handling
- Custom error classes with error codes (LoomError base class)
- All async routes wrapped with error handler
- Input validation via Zod on all API endpoints
- Environment validation at startup — fail fast if required vars missing
- Retry logic with exponential backoff for external API calls

### Testing
- Vitest for unit + integration tests
- Minimum 70% coverage target
- Every algorithm must have edge case tests
- Integration tests for all API routes
- Test files colocated: `*.test.ts` next to source files

### Security
- Rate limiting on extraction/dream endpoints (express-rate-limit)
- Input sanitization on all user-provided text
- No secrets in code — all via env vars
- CORS configured properly
- Request size limits enforced

### Performance
- Graph engine must handle 1000+ entities without degradation
- Pagination on all list endpoints
- Indexed lookups for entities, events, tensions
- No N+1 query patterns

### Documentation
- README with quick start, architecture diagram, API docs
- CONTRIBUTING.md with dev setup and PR guidelines
- CHANGELOG.md following Keep a Changelog format
- .env.example with all required/optional vars documented
- JSDoc on all exported functions and classes

### CI/CD
- GitHub Actions: lint → test → build on every push/PR
- Docker build must succeed
- All checks must pass before merge

### Visual Standards
- Dark theme throughout — no bright/white backgrounds
- Animations must be smooth (60fps target)
- Loading states on all async operations
- Empty states with helpful guidance
- The Tapestry (3D viz) must be visually stunning — glow effects, smooth motion, particle systems

## Commands
```bash
npm run dev          # Start both server + client
npm run build        # Build everything
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier format
npm run test         # Run all tests
npm run test:cov     # Tests with coverage report
docker compose up    # Full stack via Docker
```

## Architecture
```
packages/server/src/
├── analysis/         # Tension radar, arc detector, dream engine
├── extraction/       # LLM-powered narrative extraction pipeline
├── graph/            # Temporal causal graph engine
├── api/              # Express routes + middleware
├── errors/           # Custom error classes
├── middleware/        # Rate limiting, validation, error handling
├── config/           # Environment validation
└── index.ts          # Server entry point

packages/client/src/
├── components/       # React components (Tapestry, Timeline, etc.)
├── hooks/            # Custom hooks (useApi, useWebSocket)
├── styles/           # Global styles + Tailwind config
└── App.tsx           # Main app component
```
