# Shared Package

The **shared** package provides common utilities used across the microservices in this monorepo. It centralises concerns like logging, authentication, metrics and messaging so that each service can remain lightweight and consistent.

## Exported Utilities

- **Logging** – Winston based loggers with optional Logstash support via `LoggerService` and a simple `logger` helper.
- **Authentication** – `authenticate` and `requireRole` middleware implement JWT and API key auth with role based access control.
- **Messaging** – `RabbitMQService` wraps connection management and publishing/consuming of messages.
- **Metrics** – Prometheus helpers (`prometheus`, histograms and counters) for service and HTTP metrics.
- **Database** – Re‑export of `PrismaClient` for database access.
- **Testing utilities** – `setupTestEnvironment` and related helpers for integration tests.
- **Type definitions** – Shared TypeScript types for entities like vehicles, runs and users.

These utilities are re‑exported from `src/index.ts` so they can be imported as:

```ts
import { logger, authenticate, RabbitMQService } from 'shared';
```

## Usage in Other Services

1. Add the package to a service:
   ```bash
   pnpm add shared --workspace
   ```
   This adds `"shared": "workspace:*"` to the service's `package.json`.
2. Import the utilities you need from `shared` in your service code.
3. Run `pnpm install` at the repository root to ensure all workspace links are up to date.

The package is built with TypeScript, so running `pnpm build` in the `shared` directory will compile it to `dist/` if you need a standalone build. In development the other services can import directly from the sources.
