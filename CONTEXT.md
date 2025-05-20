# OpenCode.md - Zero-Git Project Guidelines

## Build/Test/Lint Commands
- Build: `bun run build`
- Dev: `bun run dev`
- Lint: `bun run lint`
- Format: `bun run format-and-lint:fix`
- Type check: `bun run check-types`
- Test all: `bun run test`
- Test single unit test: `cd apps/frontend && bun run test:unit <test-file-path>`
- E2E tests: `cd apps/frontend && bun run test:e2e`

## Code Style Guidelines
- Indentation: Tabs (not spaces)
- Quotes: Double quotes for JavaScript/TypeScript
- Line width: Standard (80-100 chars), except generated files (160)
- Imports: Use ES modules, organized automatically
- Component naming: Vue components should use PascalCase
- Error handling: Use proper try/catch blocks
- Types: Use TypeScript types/interfaces, avoid `any`
- Formatting: Biome for backend, Prettier for frontend
- Package manager: Bun (v1.2.8+)
- Node version: >=22