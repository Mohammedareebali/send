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
- `POST /api/auth/refresh` - Refresh JWT using a refresh token
- `POST /api/users/password/reset-request` - Request password reset
- `POST /api/users/password/reset` - Reset password

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}/status` - Update user status
- `GET /api/users/drivers/available` - Get available drivers
- `PUT /api/users/drivers/{id}/availability` - Update driver availability
- `GET /docs` - API documentation

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

## Token Lifecycle

After a successful login the service returns both a short-lived JWT and a long lived refresh token.
The refresh token expires after seven days and should be stored in an HTTP only
cookie when used from a browser. Clients call `POST /api/auth/refresh` with the
refresh token to obtain a new JWT and rotated refresh token. The access token is
sent in the response body and can be used in the `Authorization` header.

## Event Bus

The service publishes the following events:

- `user.created` - When a new user is registered
- `user.updated` - When a user profile is updated
- `user.deleted` - When a user is deleted
- `user.status.changed` - When a user's status changes
- `user.login` - When a user successfully logs in

## License

MIT 