# Run Management Service

The Run Management Service is responsible for managing transportation runs in the Send Transportation system. It handles run creation, updates, cancellations, and provides real-time notifications through RabbitMQ.

## Features

- Create, update, and cancel runs
- Assign drivers and PAs to runs
- Track run status and progress
- Real-time notifications for run events
- Role-based access control
- Integration with RabbitMQ for event-driven architecture

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- RabbitMQ
- pnpm (for workspace management)

## Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the database:
```bash
pnpm prisma:generate
pnpm prisma:migrate
```

## Development

Start the development server:
```bash
pnpm dev
```

## Testing

Run tests:
```bash
pnpm test
```

## API Endpoints

### Runs

- `POST /api/runs` - Create a new run (Admin/Coordinator only)
- `PUT /api/runs/:id` - Update a run (Admin/Coordinator only)
- `DELETE /api/runs/:id` - Cancel a run (Admin only)
- `GET /api/runs` - List all runs
- `GET /api/runs/:id` - Get a specific run
- `GET /api/runs/my-runs` - Get runs assigned to the current user (Driver/PA only)
- `PUT /api/runs/:id/complete` - Mark a run as completed (Driver only)

## Environment Variables

- `PORT` - Server port (default: 3002)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `RABBITMQ_URL` - RabbitMQ connection URL
- `RABBITMQ_EXCHANGE` - RabbitMQ exchange name
- `RABBITMQ_QUEUE` - RabbitMQ queue name

## Architecture

The service follows a microservices architecture with:

- Express.js for the API server
- Prisma for database operations
- RabbitMQ for event-driven communication
- JWT for authentication
- Role-based access control

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License. 