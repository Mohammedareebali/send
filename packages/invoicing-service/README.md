# Invoicing Service

The Invoicing Service generates and tracks invoices for completed routes within the SEND Dispatch platform.

## Features

- Create invoices with amount, due date and status
- Retrieve a list of all invoices
- Get invoice details by ID
- Update invoice status (e.g. paid, overdue)

## API Endpoints

- `POST /api/invoices` - Create an invoice
- `GET /api/invoices` - List invoices
- `GET /api/invoices/:id` - Retrieve a single invoice
- `PUT /api/invoices/:id/status` - Update invoice status
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

- `PORT` - Server port (default: 3011)

## License

MIT
