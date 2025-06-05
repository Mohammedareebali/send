# Admin Service

Exposes metrics and reporting endpoints for the admin dashboard.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Start the development server:
   ```bash
   pnpm dev
   ```

## API Endpoints

- `GET /api/admin/metrics` - return summary metrics
- `GET /api/admin/reports` - generate reports
- `GET /api/admin/userActivity` - view audit log

## Environment Variables

- `PORT` - server port (default: 3012)

