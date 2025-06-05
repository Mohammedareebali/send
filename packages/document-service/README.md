# Document Service

Handles secure storage of compliance documents and performs OCR checks.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Generate Prisma client and run migrations (if using the provided schema):
   ```bash
   pnpm prisma:generate
   pnpm prisma:migrate
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```

## API Endpoints

- `POST /api/documents` - upload a new document
- `GET /api/documents` - list documents
- `GET /api/documents/:id` - retrieve document metadata
- `DELETE /api/documents/:id` - delete a document

## Environment Variables

- `PORT` - server port (default: 3006)
- `AWS_S3_BUCKET` - S3 bucket for storage

