# Incident Service

The Incident Service handles reporting and management of service disruptions or safety issues within the SEND Dispatch system.

## Features

- Record new incidents with type, severity, and notes
- Retrieve a list of all incidents
- Get a specific incident by ID
- Update incident details and status
- Remove incidents that were created in error

## API Endpoints

- `POST /api/incidents` - Create an incident
- `GET /api/incidents` - List incidents
- `GET /api/incidents/:id` - Retrieve a single incident
- `PUT /api/incidents/:id` - Update an incident
- `DELETE /api/incidents/:id` - Delete an incident
- `GET /docs` - API documentation

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

## Environment Variables

- `PORT` - Server port (default: 3010)
- `FRONTEND_URL` - allowed origin for CORS requests

## License

MIT
