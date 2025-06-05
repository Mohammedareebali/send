# System Notification Service

Handles sending notifications via push, in-app, SMS and email.

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

The service uses the following environment variables for external providers:

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` – SMTP credentials for Nodemailer/SES.
- `EMAIL_FROM` – default sender address for outgoing emails.
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` – Twilio credentials for SMS.
- `FCM_SERVICE_ACCOUNT` – JSON service account credentials for Firebase Cloud Messaging.
- `NOTIFICATION_RETRIES` – number of attempts to send a notification before marking it as failed.
