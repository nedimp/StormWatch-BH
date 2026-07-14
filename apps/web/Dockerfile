FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS builder
WORKDIR /app
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY packages/domain/package.json ./packages/domain/
COPY packages/application/package.json ./packages/application/
COPY apps/web/package.json ./apps/web/
RUN pnpm install --frozen-lockfile

COPY tsconfig.base.json ./
COPY packages/domain ./packages/domain
COPY packages/application ./packages/application
COPY apps/web ./apps/web
RUN pnpm --filter @stormwatch/web build

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
