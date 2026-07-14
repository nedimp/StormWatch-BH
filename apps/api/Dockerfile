FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/domain/package.json ./packages/domain/
COPY packages/application/package.json ./packages/application/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages/domain ./packages/domain
COPY packages/application ./packages/application
COPY apps/api ./apps/api
RUN pnpm --filter @stormwatch/domain build
RUN pnpm --filter @stormwatch/application build
RUN pnpm --filter @stormwatch/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/domain/dist ./packages/domain/dist
COPY --from=builder /app/packages/application/dist ./packages/application/dist
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
EXPOSE 3001
CMD ["node", "apps/api/dist/main.js"]
