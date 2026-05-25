# Lab Orders Lite

A small clinic app for managing **patients**, a **lab test catalog**, and **orders** that compose multiple tests with a computed total cost and estimated ready date.

Built for the Enzo Health take-home challenge. Stack matches the team's: **Next.js 16 (App Router) + TypeScript + Tailwind + Shadcn UI + Prisma 7 + PostgreSQL**.

---

## Setup

Prerequisites: **Node.js 22.12+ or 24+**, **pnpm**, **Docker** (for local Postgres).

```bash
pnpm install
cp .env.example .env
pnpm db:up           # start Postgres in Docker
pnpm db:deploy       # apply migrations
pnpm db:seed         # seed the lab-test catalog
pnpm dev             # http://localhost:3000
```

Then create a patient, then create an order for them.

### Tests

```bash
pnpm test            # all unit + integration tests
pnpm test:unit       # pure domain logic only
pnpm test:integration  # hits a real Postgres test database
```

The integration suite uses a separate database (`lab_orders_lite_test`) configured in `.env.test`. The first run auto-creates it and applies migrations. Each test resets state in a single transaction.

### Common scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Next.js dev server (Turbopack) |
| `pnpm build` / `pnpm start` | Production build / serve |
| `pnpm db:up` / `pnpm db:down` | Start / stop the local Postgres container |
| `pnpm db:migrate` | Create a new migration in development |
| `pnpm db:deploy` | Apply existing migrations (no prompts) |
| `pnpm db:seed` | Seed the lab-test catalog |
| `pnpm db:reset` | Drop, migrate, reseed (dev DB) |
| `pnpm db:generate` | Regenerate the Prisma client |

---

## Architecture

The codebase is organised in **clear horizontal layers** so each layer has a single concern and is independently testable.

```
app/                       # Next.js App Router — routing only
  patients/                #   /patients, /patients/new
  orders/                  #   /orders, /orders/new, /orders/[id]
features/                  # One folder per feature; everything for X lives in X/
  patients/
    repo.ts                #   Prisma queries
    actions.ts             #   server actions
    schema.ts              #   zod validation
    patient-form.tsx       #   client form
  orders/
    repo.ts, actions.ts, schema.ts
    domain.ts              #   pure business logic (no I/O)
    domain.test.ts         #   colocated unit tests
    order-form.tsx         #   client form w/ live total + ready-date preview
  lab-tests/
    repo.ts                #   getLabTests + setLabTestPrice
    seed-data.ts           #   canonical catalog (shared by seed + tests)
lib/                       # Cross-cutting only
  prisma.ts                #   Prisma singleton (PrismaPg adapter)
  money.ts                 #   formatMoney(cents, currency) + tests
  form-state.ts            #   shared FormState type for server actions
  utils.ts                 #   cn() class-merge for Shadcn
components/
  ui/                      #   Shadcn primitives (button, input, table, …)
  nav-link.tsx             #   genuinely cross-page nav helper
prisma/
  schema.prisma            #   Patient, LabTest, Price, Order, OrderItem
  seed.ts                  #   Creates each lab test + an initial Price
  migrations/              #   Tracked migration history
tests/integration/         # Vitest integration tests against a real test DB
docker-compose.yml         # Postgres 16
vitest.config.ts           # Two projects: `unit` and `integration`
```

### Key design decisions

- **Money as Stripe-style integer minor units.** Prices stored as `Int priceCents` plus an explicit `currency` column (default `"USD"`). Avoids floating-point and `Decimal` round-trip bugs; the schema is multi-currency ready without a migration. A `CurrencyCode` branded type narrows callers at the formatter boundary.
- **Price versioning via an append-only `Price` table.** Each `LabTest` has many `Price` records; the newest by `createdAt` is the catalog's current price. Changing a price means inserting a new `Price` row — never updating in place. Each `OrderItem` carries a `priceId` foreign key to the exact `Price` row that was current when the order was placed, so historical totals never drift. This is the data-modelling spine of the app: orders are *not* snapshots of price values, they're references to immutable price records. `Order.totalCents` and `estimatedReadyDate` are still persisted on the row for sort/filter performance. (Turnaround is still snapshotted on `OrderItem` — the same versioning treatment would be a natural follow-on if `LabTest.turnaroundDays` ever needed to change.)
- **Feature-first folder layout.** Everything for a feature — repo, server actions, zod schema, domain logic, and the client form — lives in `features/<name>/`. Opening `features/patients/` shows the whole concept at a glance, rather than tracing one feature across four architectural layers. `lib/` is reserved for truly cross-cutting helpers (Prisma singleton, money formatting, the `FormState` type, the `cn()` utility). `app/` stays purely about routing.
- **Repos are the only place Prisma is imported.** Pages and server actions go through `features/*/repo.ts`. Pure business rules (e.g. `calculateOrderTotalCents`, `calculateEstimatedReadyDate`) live in `features/orders/domain.ts` next to their unit tests.
- **Server-rendered with server actions** (`useActionState`). No client-side fetch layer, no react-hook-form. Validation runs server-side via zod; field errors surface back into the form.
- **Prisma 7 with the `@prisma/adapter-pg` driver adapter** (the new Prisma 7 default). Requires explicit `adapter` construction, hence the wrapper in `lib/prisma.ts`.

### Testing strategy

| Layer | What's tested | Tooling |
| --- | --- | --- |
| **Unit** | Pure domain logic: `calculateOrderTotalCents`, `calculateEstimatedReadyDate`, `formatMoney`. Covers happy paths, edge cases, large-integer exactness, mutation safety. | Vitest, no I/O |
| **Integration** | Repository layer end-to-end against a real Postgres: patient CRUD, order creation with snapshot persistence, validation failures, lookups. | Vitest + real `lab_orders_lite_test` database; each test resets state via `$transaction` |

29 tests total. The integration project runs in a single fork, sequentially, with module isolation off — needed because each test file otherwise gets its own Prisma client instance with a separate connection pool, which broke cross-instance visibility.

The headline integration test for price versioning: *create an order with a lab test, append a new `Price` for that lab test, create another order — assert the first order still shows the old price and the second shows the new one.* Lives at `tests/integration/orders.test.ts` ("references the price that was current at order time, even after later price changes").

---

## Trade-offs (what I cut and why)

- **No auth.** Out of scope for the brief.
- **No edit/delete flows.** Patients and orders are create-only. A real app would need both — easy to add later but not on the critical path for "show me a meaningful slice."
- **Lab test catalog is seeded, read-only from the UI.** No admin UI for adding tests or changing prices. Price changes happen via the `setLabTestPrice(labTestId, priceCents, currency)` repo function (used directly by tests and by the seed); a real product would surface this behind a Settings page.
- **Turnaround is not versioned.** `LabTest.turnaroundDays` is mutable and `OrderItem.turnaroundDaysAtOrder` is a snapshot. The same `Price`-style versioning would be a natural follow-on if SLAs ever needed to change without rewriting history.
- **Prod migration is not implemented.** The included migration drops `LabTest.priceCents`/`currency` and `OrderItem.priceCentsAtOrder` outright — fine for a take-home where reviewers reset the DB, but a real cutover would need a data migration: create a `Price` row per existing `LabTest`, backfill each `OrderItem.priceId` from the historical snapshot, *then* drop the old columns.
- **No pagination / search / status filtering.** The brief lists these as optional and the data is small enough to not need them yet.
- **Single status: `PENDING`.** Order status is a one-value enum, intentionally leaving the workflow (`IN_PROGRESS` → `COMPLETED` → `CANCELLED`) as an obvious extension target for the in-person follow-up.
- **No optimistic UI.** Pure server-rendered + `revalidatePath`.
- **Seed data is USD only.** Schema supports multi-currency, but every seeded test is USD, and the order form rejects mixed-currency selections.
- **Money display uses `Intl.NumberFormat` directly.** Fine for USD; would want a real i18n setup for multiple locales.

## With more time I'd add

- Patient edit + soft-delete (`deletedAt`) with a "show archived" toggle.
- Order status workflow + audit log of status changes.
- Filter/search on the orders list (by patient, status, date range).
- A few Playwright happy-path E2E tests against the running app.
- CI: lint + typecheck + tests on push, with a Postgres service container.
- Better empty/loading states and a real error page; right now we lean on Next's defaults.

---

## AI assistance

Per the brief, this was built with **Claude Code** (Claude Opus 4.7) assisting with scaffolding, schema design, and boilerplate (Shadcn components, repository layer, test setup). Every decision called out under "Key design decisions" and "Trade-offs" was made deliberately by me; I reviewed and adjusted everything Claude produced rather than accepting it wholesale. Notable cases where I directed the design:

- Switched the money model from `Decimal` to Stripe-style integer cents + currency code (more defensible, multi-currency-ready).
- Refactored to a feature-first folder layout after an initial layered (`db`/`domain`/`actions`/`validation`) version proved hard to navigate.
- Adopted server actions + server-side zod validation instead of pulling in react-hook-form.
- Replaced naive `LabTest.priceCents` mutation with an append-only `Price` table, so changing a price preserves order history at the database level rather than via copy-on-write snapshots.

The plan I worked from lives at `.claude/plan/PLAN.md`.
