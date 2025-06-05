# Admin Service

The Admin Service powers the administrative dashboard for SEND Dispatch, aggregating metrics and reports across the platform.

## Features

- Provide operational metrics (runs today, on-time percentage, open incidents)
- Generate summary reports for analysis
- Expose REST endpoints for dashboard widgets

## API Endpoints

- `GET /api/admin/metrics` - Get high level system metrics
- `GET /api/admin/reports` - Retrieve generated reports

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

## Environment Variables

- `PORT` - Server port (default: 3012)

## License

MIT
