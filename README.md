# ⛈️ StormWatch BH

> Real-time severe weather monitoring and alerting system for Bosnia and Herzegovina

**Live demo:** http://37.27.25.55:3001  
**API docs (Swagger):** http://37.27.25.55:3001/docs  
**GitHub:** https://github.com/nedimp/StormWatch-BH

---

## Overview

StormWatch BH polls 14 weather stations across BiH every 15 minutes via [Open-Meteo](https://open-meteo.com) (free, no API key), applies BiH-specific meteorological thresholds from FHMZ/RHMZ guidelines, and delivers real-time alerts to a live dashboard via WebSocket. Subscribers receive email notifications the moment an alert is issued.

Built as an interview task demonstrating **pnpm monorepo + DDD + Clean Architecture** on a real-world problem.

---

## Architecture

### Package graph

```
packages/shared        ← HTTP contract types (AlertDto, RegionDto, CurrentConditionDto)
      ↑                  No dependencies — pure TypeScript interfaces
packages/domain        ← Pure domain model (entities, value objects, domain events, domain service)
      ↑                  Zero infrastructure deps — only TypeScript
packages/application   ← Use cases + outbound ports (interfaces)
      ↑                  Depends on domain + shared
apps/api               ← Fastify REST + WebSocket + static frontend serving
      ↑                  Depends on domain, application, shared
apps/web               ← React 18 + Vite + Tailwind (imports types from shared only)
apps/weather-worker    ← node-cron polls Open-Meteo → POST /api/v1/observations
```

### Clean Architecture layers

```
┌──────────────────────────────────────────────────────────────┐
│  Presentation  │  React dashboard, Fastify routes, WebSocket │
├──────────────────────────────────────────────────────────────┤
│  Application   │  RecordObservationUseCase                   │
│                │  GetActiveAlertsUseCase                     │
│                │  ResolveAlertUseCase                        │
│                │  Ports: INotificationService, IEventBus...  │
├──────────────────────────────────────────────────────────────┤
│  Domain        │  WeatherAlert (aggregate root)              │
│                │  WeatherObservation (entity)                │
│                │  WeatherMetrics, AlertSeverity (value objs) │
│                │  WeatherAlertDomainService (thresholds)     │
│                │  Domain Events: alert.created/escalated...  │
├──────────────────────────────────────────────────────────────┤
│  Infrastructure│  DrizzleObservationRepository (PostgreSQL)  │
│                │  InMemoryAlertRepository                    │
│                │  GmailNotificationService                   │
│                │  InProcessEventBus                          │
│                │  OpenMeteoAdapter                           │
└──────────────────────────────────────────────────────────────┘
```

### Repository structure

```
stormwatch-bh/
├── apps/
│   ├── api/                   # Fastify 4 · REST + WebSocket + serves React build
│   ├── web/                   # React 18 · Vite · Tailwind CSS · Leaflet · Zustand
│   └── weather-worker/        # node-cron · Open-Meteo batch API → POST /observations
├── packages/
│   ├── domain/                # Pure domain model — zero deps
│   ├── application/           # Use cases + ports — depends on domain + shared
│   └── shared/                # HTTP API contract types — no deps
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

---

## Domain Model

### Alert lifecycle

```
ACTIVE → ESCALATED (severity rises) → RESOLVED (conditions clear) | EXPIRED (validUntil passed)
```

### Value Objects

| VO | Invariants |
|---|---|
| `Coordinates` | Valid lat/lng; `isWithinBiH()` bounding box check |
| `AlertSeverity` | `LOW < MEDIUM < HIGH < CRITICAL`; provides hex color |
| `WeatherMetrics` | All threshold helpers: `isHeavyRain()`, `isStrongWind()`, etc. |
| `WeatherCondition` | Immutable type + Bosnian description |

### Alert thresholds (based on FHMZ/RHMZ guidelines)

| Condition | LOW | MEDIUM | HIGH | CRITICAL |
|---|---|---|---|---|
| Rain | — | ≥ 10 mm/h | thunderstorm + rain | ≥ 30 mm/h |
| Wind speed | — | — | ≥ 60 km/h | ≥ 90 km/h |
| Wind gusts | — | — | ≥ 80 km/h | ≥ 120 km/h |
| Temperature | — | — | ≥ 40°C | — |
| Visibility | — | < 200 m (fog) | — | — |
| Frost | ≤ −5°C | — | — | — |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Language | TypeScript 5.9, `strict: true`, `exactOptionalPropertyTypes` |
| API | Fastify 4 + Zod validation + `@fastify/swagger` |
| Real-time | `@fastify/websocket` — heartbeat, domain event subscription, cleanup |
| Frontend | React 18 + Vite 5 + Tailwind CSS v3 |
| Map | Leaflet + react-leaflet + CartoDB Voyager tiles |
| State | Zustand (alerts) + TanStack Query (observations, regions) |
| Database | PostgreSQL 14 + DrizzleORM (observations + subscriptions) |
| Weather data | Open-Meteo (free, no API key, batch endpoint for 14 stations) |
| Email | Nodemailer + Gmail App Password |
| Testing | Vitest |
| Process manager | PM2 (production) |

---

## Features

| Feature | Status |
|---|---|
| 14 BiH weather stations polled every 15 min | ✅ |
| Automatic alert creation, escalation, resolution | ✅ |
| Real-time WebSocket push to dashboard | ✅ |
| Interactive Leaflet map with region markers | ✅ |
| Current conditions panel with city search | ✅ |
| Email subscription + welcome email | ✅ |
| Alert email notifications on new/escalated alerts | ✅ |
| One-click email unsubscribe | ✅ |
| Observations persisted in PostgreSQL (survive restarts) | ✅ |
| Swagger/OpenAPI docs | ✅ |
| Mobile responsive (safe-area, bottom nav, dvh) | ✅ |
| Rate limiting, Helmet, CORS | ✅ |
| Domain tests | ✅ 30/30 |
| Application / API / frontend tests | ❌ Not yet |
| HTTPS | ❌ HTTP only (DNS not configured for subdomain) |
| Alert persistence in PostgreSQL | ❌ In-memory (alerts are transient by design) |
| Authentication on POST /observations | ❌ Open endpoint |

---

## Test Coverage

```
packages/domain/src/__tests__/
  ValueObjects.test.ts             (9 tests)  — Coordinates, WeatherMetrics, AlertSeverity
  WeatherAlert.test.ts             (9 tests)  — lifecycle, escalation, domain events
  WeatherAlertDomainService.test.ts (12 tests) — threshold assessment for all conditions
```

**Coverage gaps:**
- `packages/application` — use case orchestration untested
- `apps/api` — no route/integration tests (Fastify `inject()`)
- `apps/weather-worker` — adapter fetch logic untested
- `apps/web` — no component/hook tests

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- pnpm ≥ 9 (`npm i -g pnpm`)
- PostgreSQL running locally (or use the connection string in `.env`)

### Install

```bash
git clone https://github.com/nedimp/StormWatch-BH
cd StormWatch-BH
pnpm install
```

### Configure environment

```bash
# apps/api/.env
PORT=3001
DATABASE_URL=postgresql://your_user@localhost:5432/stormwatch_bh
GMAIL_USER=your@gmail.com
GMAIL_APP_PASSWORD=your_app_password
DASHBOARD_URL=http://localhost:5173/dashboard
API_BASE_URL=http://localhost:3001
STATIC_PATH=           # leave empty for dev (Vite handles static in dev)
```

### Run (development)

```bash
# Terminal 1 — API (auto-runs DB migrations on startup)
pnpm --filter @stormwatch/api dev

# Terminal 2 — Frontend
pnpm --filter @stormwatch/web dev

# Terminal 3 — Weather worker (starts polling immediately)
pnpm --filter @stormwatch/weather-worker dev
```

Open http://localhost:5173 · API docs at http://localhost:3001/docs

### Run tests

```bash
pnpm --filter @stormwatch/domain test
```

---

## API Reference

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/v1/alerts` | Active alerts (`?regionId=`, `?severity=HIGH`, `?limit=`) |
| `GET` | `/api/v1/alerts/:id` | Alert by ID |
| `POST` | `/api/v1/alerts/:id/resolve` | Manually resolve an alert |
| `GET` | `/api/v1/observations/current` | Latest conditions per station |
| `POST` | `/api/v1/observations` | Ingest weather observation |
| `GET` | `/api/v1/regions` | All BiH regions with centroids |
| `POST` | `/api/v1/subscriptions` | Subscribe email to alerts |
| `GET` | `/api/v1/subscriptions/:email` | One-click unsubscribe (HTML page) |
| `DELETE` | `/api/v1/subscriptions/:email` | Programmatic unsubscribe |
| `GET` | `/api/v1/subscriptions/count` | Subscriber count |
| `WS` | `/ws/alerts` | Live alert stream (INITIAL_ALERTS, ALERT_CREATED, PING) |
| `GET` | `/docs` | Swagger UI |

### Trigger a CRITICAL alert (for demo)

```bash
curl -X POST http://localhost:3001/api/v1/observations \
  -H 'Content-Type: application/json' \
  -d '{
    "stationId": "station-sarajevo-bjelave",
    "regionId": "sarajevo",
    "latitude": 43.8564, "longitude": 18.4131,
    "temperatureCelsius": 22,
    "windSpeedKmh": 95, "windGustKmh": 130,
    "precipitationMmPerHour": 35,
    "humidityPercent": 95,
    "visibilityKm": 0.5,
    "pressureHpa": 982,
    "source": "AUTOMATIC_STATION",
    "observedAt": "2026-07-15T14:00:00Z"
  }'
```

This triggers a **CRITICAL – Olujni vjetar** alert and broadcasts it via WebSocket.

---

## Known Limitations & Red Flags

1. **No HTTPS** — Deployed on `http://IP:3001`. SSL + nginx reverse proxy config is ready (`/root/ineed/nginx.conf.https-ready`) but requires DNS `A` record for the subdomain.

2. **`@fastify/static@6` pin** — Must be re-pinned after `pnpm install` on the server because pnpm resolves v7+ which requires Fastify 5. Fix: upgrade to Fastify 5.

3. **Alerts are in-memory** — `InMemoryAlertRepository` means active alerts are lost on API restart. Acceptable for MVP; a `DrizzleAlertRepository` would be the natural next step.

4. **POST /observations is open** — No API key auth on the weather observation ingestion endpoint. Anyone can submit fake data. Fix: add `X-Worker-Token` header validation.

5. **Test coverage is domain-only** — Application use cases, API routes, and the frontend have zero automated tests.

6. **Summer thresholds won't trigger naturally** — Extreme heat threshold is 40°C (FHMZ standard). BiH summer temps (~30-34°C) won't trigger alerts. Use the `curl` above to demo.

---

## Design Decisions

**Why `packages/shared`?**  
Types at the HTTP boundary (`AlertDto`, `RegionDto`) are defined once in `@stormwatch/shared` and imported by both the API and the web client. A field rename is caught at compile time across the entire monorepo.

**Why in-memory alerts?**  
Alerts are intentionally transient — they auto-resolve when conditions clear. The meaningful persistent data is the observation history (PostgreSQL). Alerts represent the current state of the world, not a log.

**Why Open-Meteo over FHMZ?**  
FHMZ (the official BiH meteorological service) doesn't provide a public machine-readable API. Open-Meteo provides the same underlying ECMWF model data for free with a batch endpoint that fetches all 14 stations in a single HTTP call.

**Why Fastify over Express?**  
Schema-first validation with Zod, native TypeScript, built-in Swagger/OpenAPI generation, `@fastify/websocket` with proper cleanup lifecycle.
