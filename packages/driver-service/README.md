# Driver Service

This service manages driver data and publishes driver events.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Generate the Prisma client and run migrations:
   ```bash
   pnpm prisma:generate
   pnpm prisma:migrate
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```

## API Usage

- `GET /api/drivers/:id/availability` - Retrieve a driver's availability slots.
- `PUT /api/drivers/:id/availability` - Replace a driver's availability slots. Example body:
  ```json
  [
    { "startTime": "2024-05-01T08:00:00Z", "endTime": "2024-05-01T12:00:00Z" },
    { "startTime": "2024-05-02T13:00:00Z", "endTime": "2024-05-02T17:00:00Z" }
  ]
  ```
