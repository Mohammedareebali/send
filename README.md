# SEN Dispatch Monorepo

This repository contains the microservices that make up the **SEN Dispatch** system. Each service is written in TypeScript and managed through a pnpm workspace with Lerna.

## Services

- **user-service** – authentication and user management
- **vehicle-service** – vehicle registration and status tracking
- **run-service** – management of transport runs
- **tracking-service** – real‑time GPS tracking and geofencing
- **driver-service** – driver related APIs
- **student-service** – student records and assignments
- **document-service** – secure document storage
- **system-notification-service** – delivery of notifications (email, SMS, push)
- **shared** – common utilities and TypeScript types

A monitoring stack (Prometheus, Grafana, Elasticsearch, Kibana, Jaeger) and an API Gateway are provided through the root `docker-compose.yml`.

## Prerequisites

- **Node.js** (>=18)
- **pnpm** – `npm i -g pnpm`
- **Docker** and **Docker Compose**
- All services use **pnpm**; Yarn is no longer needed

Install all workspace dependencies from the repository root:

```bash
pnpm install
```

## Running Services

Each service lives under `packages/` and exposes standard scripts. Below are the basics; consult each package's README for full details.

### run-service

```bash
cd packages/run-service
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev               # development
pnpm build             # compile to dist/
```

A sample `docker-compose.yml` is available in the service directory for running the service with PostgreSQL and RabbitMQ.

### user-service

```bash
cd packages/user-service
pnpm install
pnpm start            # run the service
pnpm dev              # development
```

### tracking-service

```bash
cd packages/tracking-service
pnpm install
pnpm prisma migrate dev
pnpm dev
```

### vehicle-service

```bash
cd packages/vehicle-service
pnpm install
pnpm build
pnpm start
```

This service also ships with Docker instructions:

```bash
docker build -t vehicle-service .
docker run -p 3000:3000 vehicle-service
```

### driver-service

```bash
cd packages/driver-service
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

### system-notification-service

```bash
cd packages/system-notification-service
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
pnpm dev
```

### Other Services

`student-service` and `document-service` follow the same basic pattern:

```bash
pnpm install
pnpm dev
```

## Docker Compose

The root `docker-compose.yml` starts the API Gateway and the monitoring/observability stack. Run everything with:

```bash
docker-compose up --build
```

## Local Environment Setup

Several services rely on PostgreSQL and RabbitMQ. You can spin up these
dependencies using the compose file included with `run-service`:

```bash
docker-compose -f packages/run-service/docker-compose.yml up -d postgres rabbitmq
```

This launches PostgreSQL on `localhost:5432` and RabbitMQ on `localhost:5672`
with the default credentials `user/password`. Configure your service
environment variables to use these values. Example for `run-service`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/send_runs?schema=public
RABBITMQ_URL=amqp://user:password@localhost:5672
```

Services that specify individual DB host or user variables can use the same
host (`localhost`), port (`5432`), username (`user`) and password (`password`).

## Environment Variables

Each service defines its own environment variables. Refer to the service READMEs for the exhaustive lists:

- `packages/run-service/README.md` lines 66‑73 for run management variables
- `packages/user-service/README.md` lines 63‑75 for user related variables
- `packages/tracking-service/README.md` lines 102‑107 for tracking variables
- `packages/vehicle-service/README.md` lines 169‑175 for vehicle service variables

Variables such as `JWT_SECRET`, database connection strings and RabbitMQ URLs must be set before starting the services.

## Workspace Commands

Lerna is configured for the workspace. From the root you can run:

```bash
pnpm run build      # build all packages
pnpm run dev        # start all services in dev mode
pnpm run test       # run tests across packages
```

## License

This project is licensed under the MIT License.
