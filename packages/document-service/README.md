# Document Service

The Document Service handles secure document storage and processing for the SEND platform. It stores uploaded files in AWS S3, keeps document versions, performs OCR, evaluates compliance rules and publishes events through RabbitMQ.

## Features

- Upload and store documents in Amazon S3
- Document version history and metadata management
- Access control records for each document
- OCR processing via Tesseract.js
- Compliance evaluation and automatic expiration
- RabbitMQ events for document updates

## Installation

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate
```

## Development

```bash
pnpm dev
```

Run tests with:

```bash
pnpm test
```

## Environment Variables

- `PORT` – HTTP port to listen on (default: 3006)
- `DATABASE_URL` – PostgreSQL connection string for Prisma
- `AWS_S3_BUCKET` – S3 bucket for document storage
- `AWS_ACCESS_KEY_ID` – AWS access key
- `AWS_SECRET_ACCESS_KEY` – AWS secret access key
- `AWS_REGION` – AWS region for S3
- `RABBITMQ_URL` – RabbitMQ connection URL
- `LOG_LEVEL` – Log level (default: info)
- `LOG_FILE` – Optional log file path

## API Endpoints

### Documents

- `POST /api/documents` – Upload a document (`multipart/form-data` with a `file` field)
- `GET /api/documents` – List documents (`userId` and `type` query parameters)
- `GET /api/documents/:id` – Retrieve a document by ID
- `DELETE /api/documents/:id` – Delete a document
- `PATCH /api/documents/:id/access` – Update document access permissions
- `PATCH /api/documents/:id/metadata` – Update document metadata

### Health Check

- `GET /health` – Service health status

Example upload using `curl`:

```bash
curl -F file=@mydoc.pdf -F userId=123 -F type=ID \ 
  http://localhost:3006/api/documents
```

