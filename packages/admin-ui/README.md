# Admin UI

This package contains the React based administration panel for SEN Dispatch. It
uses Vite, TailwindCSS and WebSockets to display live run data and
communicate with drivers and parents.

## Local Development

1. Install dependencies from the repository root:
   ```bash
   pnpm install
   ```
2. Start the development server:
   ```bash
   pnpm --filter admin-ui dev
   ```
   The app runs at `http://localhost:5173` by default.

## Build

To create a production build:

```bash
pnpm --filter admin-ui build
```

The compiled files are output to `packages/admin-ui/dist`.
