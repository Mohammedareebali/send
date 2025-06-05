# Invoicing Service

Generates invoices when runs are completed and allows administrators to view and update invoice records.

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

- `GET /api/invoices` - list invoices
- `GET /api/invoices/:id` - get invoice details
- `PUT /api/invoices/:id/status` - update invoice status

## Environment Variables

- `PORT` - server port (default: 3011)

