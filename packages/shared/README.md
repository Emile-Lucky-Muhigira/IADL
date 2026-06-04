# @iadl/shared

Shared TypeScript types and enums for IADL Center EMIS, consumable by both the
API and the web client.

## Contents

- `src/constants/roles.ts` — `UserRole` enum, `ROLE_HIERARCHY`, and role groups
  (`GLOBAL_ROLES`, `EDUCATOR_ROLES`, `FINANCIAL_ROLES`, `READ_ONLY_ROLES`, …).
- `src/types/index.ts` — shared domain types.
- `src/index.ts` — package entry point.

## Usage

The package entry (`main`/`types`) points at the TypeScript source, so consumers
import directly without a build step:

```ts
import { UserRole, ROLE_HIERARCHY } from '@iadl/shared';
```

## Notes

Keep this package free of runtime/framework dependencies — it should contain only
types, enums, and pure constants so it is safe to import from any workspace.
