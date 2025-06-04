# Tracking Service

The Tracking Service is responsible for real-time location tracking, geofencing, and ETA calculations for school transport runs.

## Features

- Real-time GPS location tracking
- Geofencing for pickup and dropoff locations
- Dynamic ETA calculations
- Journey recording and analytics
- WebSocket support for real-time updates
- Integration with RabbitMQ for event-driven architecture

## Architecture

The service is built with the following components:

- **Tracking Service**: Core service handling location tracking, geofencing, and ETA calculations
- **RabbitMQ Service**: Handles event publishing and subscription
- **WebSocket Server**: Provides real-time updates to connected clients
- **REST API**: HTTP endpoints for tracking management
- **Prisma ORM**: Database operations for storing tracking data

## API Endpoints

### Tracking Management

- `POST /api/tracking/start` - Start tracking a run
- `POST /api/tracking/:runId/location` - Update location for a run
- `POST /api/tracking/:runId/stop` - Stop tracking a run
- `GET /api/tracking/:runId/status` - Get tracking status for a run

### WebSocket Events

- `join-run` - Join a run's tracking session
- `tracking-update` - Receive real-time tracking updates

## Event Types

The service publishes the following events to RabbitMQ:

- `JOURNEY_START` - When tracking starts for a run
- `LOCATION_UPDATE` - When a new location is received
- `GEOFENCE_EVENT` - When a vehicle enters/exits a geofence
- `ETA_UPDATE` - When ETA is recalculated
- `JOURNEY_END` - When tracking stops for a run

## Integration with Frontend Applications

### Admin Web Portal
- Real-time tracking dashboard
- Geofence management
- Journey analytics
- ETA monitoring

### Driver Mobile App
- Real-time location updates
- Geofence notifications
- ETA information
- Journey recording

### Parent Mobile App
- Real-time vehicle tracking
- ETA updates
- Geofence notifications
- Journey history

## Setup

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Run database migrations:
```bash
pnpm prisma migrate dev
```

4. Start the service:
```bash
pnpm dev
```

## Testing

Run tests:
```bash
pnpm test
```

Run tests with coverage:
```bash
pnpm test:coverage
```

## Environment Variables

- `PORT` - Service port (default: 3003)
- `DATABASE_URL` - PostgreSQL connection string
- `RABBITMQ_URL` - RabbitMQ connection string
- `JWT_SECRET` - JWT secret for authentication

## Dependencies

- Express.js - Web framework
- Socket.IO - WebSocket server
- RabbitMQ - Message broker
- Prisma - ORM
- Geolib - Geospatial calculations
- Jest - Testing framework 