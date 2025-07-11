# Student Service

The Student Service manages student profiles, guardians and attendance within the SEND Dispatch platform. It exposes REST endpoints secured with JWT authentication and publishes student events to RabbitMQ.

## Features

- CRUD operations for students
- Add or remove guardians for a student
- Record attendance entries
- Retrieve students belonging to the authenticated parent
- Event publishing over RabbitMQ for student actions

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

## Environment Variables

- `PORT` – HTTP port for the service (default: 3003)
- `DATABASE_URL` – PostgreSQL connection string used by Prisma
- `JWT_SECRET` – secret key for verifying authentication tokens
- `RABBITMQ_URL` – RabbitMQ connection URL
- `FRONTEND_URL` - allowed origin for CORS requests

## Example API Routes

- `POST /api/students` – Create a new student
- `GET /api/students` – List students for the current parent
- `GET /api/students/:id` – Retrieve a student by ID
- `PUT /api/students/:id` – Update a student
- `DELETE /api/students/:id` – Remove a student
- `POST /api/students/:id/add-guardian` – Add a guardian to a student
- `DELETE /api/students/:id/remove-guardian` – Remove a guardian from a student
- `POST /api/students/:id/attendance` – Record attendance for a student
- `GET /docs` – API documentation

