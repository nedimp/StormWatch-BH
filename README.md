# ⛈️ StormWatch BH

> Real-time severe weather monitoring and alerting system for Bosnia and Herzegovina

[![CI](https://github.com/nedimp/StormWatch-BH/actions/workflows/ci.yml/badge.svg)](https://github.com/nedimp/StormWatch-BH/actions)

---

## Overview

StormWatch BH monitors weather conditions across all major BiH regions, detects severe weather (nevrijeme), and delivers real-time alerts via a live dashboard and WebSocket notifications.

Built as a production-ready monorepo demonstrating **DDD + Clean Architecture** applied to a real-world problem.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Presentation                          │
│   React Dashboard (Leaflet Map + WebSocket)                  │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP + WebSocket
┌────────────────────────────▼────────────────────────────────┐
│                     API Layer (Fastify)                       │
│   Routes → Use Cases → Domain → Infrastructure               │
└────────────────────────────┬────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
┌────────▼───────┐  ┌────────▼───────┐  ┌────────▼───────┐
│  @stormwatch/  │  │  @stormwatch/  │  │  @stormwatch/  │
│    domain      │  │  application   │  │  infrastructure│
│                │  │                │  │                │
│  Entities      │  │  Use Cases     │  │  Repositories  │
│  Value Objects │  │  Ports (ifaces)│  │  Event Bus     │
│  Domain Events │  │  DTOs          │  │  OWM Adapter   │
│  Domain Svc    │  │                │  │  Notifications │
└────────────────┘  └────────────────┘  └────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│               Weather Worker (node-cron)                      │
│   Polls OpenWeatherMap every 10 min → POST /observations     │
└─────────────────────────────────────────────────────────────┘
```

### Package structure

```
stormwatch-bh/
├── apps/
│   ├── api/                   # Fastify REST API + WebSocket
│   ├── web/                   # React + Vite dashboard (Leaflet, Zustand, TanStack Query)
│   └── weather-worker/        # node-cron poller → OpenWeatherMap → API
├── packages/
│   ├── domain/                # Pure domain model (zero infra deps)
│   └── application/           # Use cases, ports, DTOs
├── docker-compose.yml
├── pnpm-workspace.yaml
└── .github/workflows/ci.yml
```

---

## Domain Model

### Aggregates

| Aggregate | Responsibility |
|-----------|---------------|
| `WeatherAlert` | Core aggregate. Lifecycle: `ACTIVE → ESCALATED → RESOLVED/EXPIRED`. Owns domain events. |
| `WeatherObservation` | Single weather snapshot from a station. Triggers alert assessment on creation. |

### Value Objects

| VO | Invariants |
|----|-----------|
| `Coordinates` | Valid lat/lng; `isWithinBiH()` boundary check |
| `AlertSeverity` | `LOW < MEDIUM < HIGH < CRITICAL`; provides color + ordering |
| `WeatherMetrics` | All thresholds: heavy rain ≥10mm/h, extreme rain ≥30mm/h, strong wind ≥60km/h, etc. |
| `WeatherCondition` | Type + Bosnian localized name |

### Domain Events

```
alert.created       → WebSocket push → notification
alert.escalated     → WebSocket push → priority notification
alert.resolved      → WebSocket push
observation.recorded → triggers alert assessment
```

### Alert Severity Thresholds (FHMZ/RHMZ-based)

| Condition | MEDIUM | HIGH | CRITICAL |
|-----------|--------|------|---------|
| Rain | ≥ 10 mm/h | thunderstorm + rain | ≥ 30 mm/h |
| Wind | — | ≥ 60 km/h | ≥ 90 km/h |
| Temperature | — | ≥ 40°C | — |
| Visibility | < 200m fog | — | — |
| Frost | — | — | ≤ −5°C (LOW) |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm workspaces |
| Language | TypeScript 5.4, strict mode |
| API | Fastify 4 + Zod validation |
| Frontend | React 18 + Vite + Tailwind CSS |
| Map | Leaflet + react-leaflet |
| State | Zustand + TanStack Query |
| Real-time | WebSocket (native Fastify plugin) |
| DB (prod) | PostgreSQL 16 + DrizzleORM |
| Cache/Bus (prod) | Redis 7 |
| Weather Data | OpenWeatherMap API |
| Testing | Vitest + coverage |
| CI/CD | GitHub Actions |
| Container | Docker + docker-compose |

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- pnpm ≥ 9 (`npm i -g pnpm`)
- Docker (for Postgres + Redis, optional)

### Install

```bash
git clone https://github.com/your-org/stormwatch-bh
cd stormwatch-bh
pnpm install
```

### Run (dev — in-memory, no DB needed)

```bash
# Terminal 1 — API
pnpm dev:api

# Terminal 2 — Frontend
pnpm dev:web

# Terminal 3 — Weather worker (optional, needs OWM API key)
OPENWEATHERMAP_API_KEY=xxx pnpm --filter @stormwatch/weather-worker dev
```

Open http://localhost:5173 — API docs at http://localhost:3001/docs

### Run with Docker

```bash
cp apps/api/.env.example apps/api/.env
# Edit .env with your OPENWEATHERMAP_API_KEY
docker-compose up -d
```

### Run Tests

```bash
pnpm test              # all packages
pnpm test:coverage     # with coverage report
pnpm --filter @stormwatch/domain test  # domain only
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/alerts` | Active alerts (filter: `regionId`, `severity`, `limit`) |
| `GET` | `/api/v1/alerts/:id` | Alert by ID |
| `POST` | `/api/v1/alerts/:id/resolve` | Manually resolve an alert |
| `POST` | `/api/v1/observations` | Ingest weather observation |
| `GET` | `/api/v1/regions` | All BiH regions |
| `WS` | `/ws/alerts` | Live alert stream |
| `GET` | `/health` | Health check |
| `GET` | `/docs` | Swagger UI |

### Example — submit a storm observation

```bash
curl -X POST http://localhost:3001/api/v1/observations \
  -H 'Content-Type: application/json' \
  -d '{
    "stationId": "station-sarajevo-bjelave",
    "regionId": "sarajevo",
    "latitude": 43.8564,
    "longitude": 18.4131,
    "temperatureCelsius": 22,
    "windSpeedKmh": 95,
    "windGustKmh": 130,
    "precipitationMmPerHour": 35,
    "humidityPercent": 95,
    "visibilityKm": 0.5,
    "pressureHpa": 982,
    "source": "AUTOMATIC_STATION",
    "observedAt": "2024-07-14T14:00:00Z"
  }'
```

Response triggers a **CRITICAL** alert and broadcasts it via WebSocket.

---

## Design Decisions

### Why DDD?
Weather alerting is a domain where business rules are complex and change independently of infrastructure. DDD lets us encode the rules (thresholds, severity escalation, lifecycle) in the domain layer where they belong, making them testable without any database or HTTP dependency.

### Why Clean Architecture?
The domain and application packages have **zero infrastructure dependencies**. You can swap PostgreSQL for SQLite, OpenWeatherMap for FHMZ RSS, or Redis for an in-memory bus — without touching a single line of domain logic.

### Why pnpm workspaces?
Strict, fast, and enforces proper dependency declarations. Each package only sees what it explicitly lists as a dependency, preventing accidental coupling.

### Why Fastify over Express?
Schema-first validation, native TypeScript, built-in Swagger support, and significantly higher throughput.

---

## Roadmap

- [ ] PostgreSQL persistence (DrizzleORM schema + migrations)
- [ ] Redis event bus for multi-process deployment
- [ ] Email / SMS notifications (Twilio, SendGrid)
- [ ] FHMZ RSS feed adapter (official BiH meteorological data)
- [ ] Subscription management (users subscribe to regions)
- [ ] Historical alert charts
- [ ] Mobile PWA with push notifications
- [ ] Rate limiting per station for observation ingestion

---

## License

MIT
