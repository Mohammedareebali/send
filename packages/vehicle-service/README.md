# Vehicle Service

The Vehicle Service is responsible for managing vehicles in the school transportation system. It handles vehicle registration, status updates, and maintenance records.

## Features

- Vehicle registration and management
- Status tracking (Available, In Use, Maintenance, Out of Service)
- Maintenance record management
- Caching for improved performance
- Comprehensive testing and performance monitoring

## API Endpoints

### Create Vehicle
```http
POST /vehicles
```

Request body:
```json
{
  "make": "string",
  "model": "string",
  "year": "number",
  "licensePlate": "string",
  "capacity": "number"
}
```

### Update Vehicle
```http
PUT /vehicles/:id
```

Request body:
```json
{
  "make": "string",
  "model": "string",
  "year": "number",
  "licensePlate": "string",
  "status": "AVAILABLE | IN_USE | MAINTENANCE | OUT_OF_SERVICE",
  "capacity": "number"
}
```

### Get Vehicle
```http
GET /vehicles/:id
```

### List Vehicles
```http
GET /vehicles
```

Optional query parameters:
- `status`: Filter by vehicle status

### Delete Vehicle
```http
DELETE /vehicles/:id
```

## Performance Considerations

The service implements several performance optimizations:

1. **Caching**
   - Redis-based caching for frequently accessed data
   - Cache invalidation on data updates
   - 5-minute TTL for cached data

2. **Database Optimization**
   - Indexed queries for common operations
   - Efficient bulk operations
   - Connection pooling

3. **Concurrency**
   - Handles concurrent requests efficiently
   - Thread-safe operations
   - Rate limiting

## Testing

The service includes comprehensive test suites:

1. **Unit Tests**
   - Individual method testing
   - Error handling
   - Edge cases

2. **Integration Tests**
   - Database interactions
   - Cache operations
   - API endpoints

3. **Performance Tests**
   - Concurrent request handling
   - Cache effectiveness
   - Bulk operations
   - Load testing

## Monitoring

The service exposes metrics for monitoring:

1. **Request Rate**
   - Number of requests per second
   - Response time distribution

2. **Cache Performance**
   - Hit/miss ratio
   - Cache size
   - Eviction rate

3. **Database Performance**
   - Query execution time
   - Connection pool usage
   - Error rate

## Error Handling

The service implements comprehensive error handling:

1. **Validation Errors**
   - Invalid input data
   - Missing required fields
   - Duplicate license plates

2. **Business Logic Errors**
   - Vehicle not found
   - Invalid status transitions
   - Maintenance conflicts

3. **System Errors**
   - Database connection issues
   - Cache failures
   - Network problems

## Security

The service implements several security measures:

1. **Authentication**
   - JWT-based authentication
   - Role-based access control

2. **Input Validation**
   - Data sanitization
   - Type checking
   - Length validation

3. **Rate Limiting**
   - Request throttling
   - IP-based limits
   - User-based limits

## Deployment

The service is containerized and can be deployed using Docker:

```bash
docker build -t vehicle-service .
docker run -p 3000:3000 vehicle-service
```

Environment variables:
- `REDIS_HOST`: Redis server host
- `REDIS_PORT`: Redis server port
- `REDIS_PASSWORD`: Redis server password
- `CACHE_TTL`: Vehicle cache TTL in seconds (default: 300)
- `DATABASE_URL`: Database connection string
- `JWT_SECRET`: JWT signing secret
- `API_KEY`: API key for service authentication

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License. 