FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/domain/package.json ./packages/domain/
COPY packages/application/package.json ./packages/application/
COPY apps/weather-worker/package.json ./apps/weather-worker/
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages/domain ./packages/domain
COPY packages/application ./packages/application
COPY apps/weather-worker ./apps/weather-worker
RUN pnpm --filter @stormwatch/domain build
RUN pnpm --filter @stormwatch/application build
RUN pnpm --filter @stormwatch/weather-worker build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/domain/dist ./packages/domain/dist
COPY --from=builder /app/packages/application/dist ./packages/application/dist
COPY --from=builder /app/apps/weather-worker/dist ./apps/weather-worker/dist
CMD ["node", "apps/weather-worker/dist/worker.js"]

# CI workflow was accidentally placed here — see .github/workflows/ci.yml

    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-typecheck:
    name: Lint & Typecheck
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm test:coverage

      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: packages/domain/coverage

  build:
    name: Build
    runs-on: ubuntu-latest
    needs: [lint-typecheck, test]
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v3
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm build
