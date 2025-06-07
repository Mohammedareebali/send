# Types Package

Common TypeScript definitions shared across services. Currently this folder provides:

- `DriverStatus` – enumerates driver lifecycle states.
- `Driver` – interface representing the driver record returned by services.

Other packages can import these definitions using a path alias or relative import. For example:

```ts
import { Driver, DriverStatus } from '@shared/types/driver';
// or
import { Driver, DriverStatus } from '../shared/src/types/driver';
```

Configure your `tsconfig.json` paths if you prefer the `@shared/types` alias.

