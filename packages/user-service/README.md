# User Service

The User Service is a microservice responsible for user management in the SEND Transport Management System. It handles user authentication, registration, and profile management.

## Features

- User authentication (login/logout)
- User registration
- JWT-based authentication
- Role-based access control
- User profile management
- Event-driven architecture with RabbitMQ

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/users/password/reset-request` - Request password reset
- `POST /api/users/password/reset` - Reset password

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}/status` - Update user status
- `GET /api/users/drivers/available` - Get available drivers
- `PUT /api/users/drivers/{id}/availability` - Update driver availability

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- RabbitMQ

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy `.env.example` to `.env` and configure environment variables
4. Start the service:
   ```bash
   pnpm start
   ```

## Development

- Run in development mode:
  ```bash
  pnpm dev
  ```
- Run tests:
  ```bash
  pnpm test
  ```
- Lint code:
  ```bash
  pnpm lint
  ```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development/production)
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_USERNAME` - Database username
- `DB_PASSWORD` - Database password
- `DB_NAME` - Database name
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRES_IN` - JWT token expiration time
- `RABBITMQ_URL` - RabbitMQ connection URL
- `RABBITMQ_EXCHANGE` - RabbitMQ exchange name

## Event Bus

The service publishes the following events:

- `user.created` - When a new user is registered
- `user.updated` - When a user profile is updated
- `user.deleted` - When a user is deleted
- `user.status.changed` - When a user's status changes

## License

MIT 