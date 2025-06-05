# API Gateway

The API Gateway exposes a single entry point for all client requests. It proxies
traffic to the underlying services and enforces authentication using the shared
`authenticate` middleware.

## Environment Variables

- `PORT` - Port to run the gateway (default: `8080`)
- `USER_SERVICE_URL` - URL of the user service (default: `http://localhost:3000`)
- `RUN_SERVICE_URL` - URL of the run service (default: `http://localhost:3002`)
- `STUDENT_SERVICE_URL` - URL of the student service (default: `http://localhost:3003`)
- `DRIVER_SERVICE_URL` - URL of the driver service (default: `http://localhost:3004`)
- `VEHICLE_SERVICE_URL` - URL of the vehicle service (default: `http://localhost:3005`)
- `DOCUMENT_SERVICE_URL` - URL of the document service (default: `http://localhost:3006`)
- `TRACKING_SERVICE_URL` - URL of the tracking service (default: `http://localhost:3007`)
- `INCIDENT_SERVICE_URL` - URL of the incident service (default: `http://localhost:3008`)
- `INVOICING_SERVICE_URL` - URL of the invoicing service (default: `http://localhost:3009`)
- `ADMIN_DASHBOARD_SERVICE_URL` - URL of the admin dashboard service (default: `http://localhost:3010`)

## Development

```bash
pnpm install
pnpm --filter api-gateway dev
```

## Build

```bash
pnpm --filter api-gateway build
```

## Start

```bash
pnpm --filter api-gateway start
```
