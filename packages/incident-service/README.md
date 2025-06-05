# Incident Service

This microservice handles reporting and tracking of incidents that occur during runs.

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

- `POST /api/incidents` - create a new incident
- `GET /api/incidents` - list incidents
- `GET /api/incidents/:id` - get incident details
- `PUT /api/incidents/:id` - update an incident
- `DELETE /api/incidents/:id` - delete an incident

## Environment Variables

- `PORT` - server port (default: 3010)

