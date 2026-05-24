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
app/                       # Next.js App Router pages (server components)
  patients/                #   list, /new
  orders/                  #   list, /new, /[id]
components/                # React components (server + client)
  ui/                      #   Shadcn primitives (button, input, table, …)
  patient-form.tsx         #   client form using useActionState
  order-form.tsx           #   client form with live total + ready-date preview
lib/
  db/                      # Prisma repositories — the ONLY place importing the client
    client.ts              #   Prisma singleton (PrismaPg driver adapter)
    patients.ts, orders.ts, lab-tests.ts
  domain/                  # Pure business logic, no I/O
    orders.ts              #   calculateOrderTotalCents, calculateEstimatedReadyDate
  actions/                 # Server actions — thin: validate → call db layer → revalidate
    patients.ts, orders.ts, types.ts
  validation/              # Zod schemas (one per resource)
    patient.ts, order.ts
  money.ts                 # formatMoney(cents, currency) helper
  utils.ts                 # cn() class-merge helper for Shadcn
prisma/
  schema.prisma            # Patient, LabTest, Order, OrderItem
  seed.ts                  # Seeds ~6 common lab tests
  migrations/              # Tracked migration history
tests/integration/         # Vitest integration tests against a real test DB
docker-compose.yml         # Postgres 16
vitest.config.ts           # Two projects: `unit` and `integration`
```

### Key design decisions

- **Money as Stripe-style integer minor units.** Prices stored as `Int priceCents` plus an explicit `currency` column (default `"USD"`). Avoids floating-point and `Decimal` round-trip bugs; the schema is multi-currency ready without a migration.
- **Snapshotted prices on `OrderItem`.** `priceCentsAtOrder` and `turnaroundDaysAtOrder` are copied onto each order line at creation time, so an order's totals never change if the underlying catalog is later edited. `totalCents` and `estimatedReadyDate` are also persisted on `Order` for simple sorting/filtering and to keep the order as a stable contract.
- **Layered structure.** `lib/db/` is the only place Prisma is imported; pages and actions go through it. Pure business rules live in `lib/domain/` and are trivially unit-testable. Server actions in `lib/actions/` are thin: parse → call db layer → `revalidatePath` + `redirect`.
- **Server-rendered with server actions** (`useActionState`). No client-side fetch layer, no react-hook-form. Validation runs server-side via zod; field errors surface back into the form.
- **Prisma 7 with the `@prisma/adapter-pg` driver adapter** (the new Prisma 7 default). Requires explicit `adapter` construction, hence the wrapper in `lib/db/client.ts`.

### Testing strategy

| Layer | What's tested | Tooling |
| --- | --- | --- |
| **Unit** | Pure domain logic: `calculateOrderTotalCents`, `calculateEstimatedReadyDate`, `formatMoney`. Covers happy paths, edge cases, large-integer exactness, mutation safety. | Vitest, no I/O |
| **Integration** | Repository layer end-to-end against a real Postgres: patient CRUD, order creation with snapshot persistence, validation failures, lookups. | Vitest + real `lab_orders_lite_test` database; each test resets state via `$transaction` |

24 tests total. The integration project runs in a single fork, sequentially, with module isolation off — needed because each test file otherwise gets its own Prisma client instance with a separate connection pool, which broke cross-instance visibility.

---

## Trade-offs (what I cut and why)

- **No auth.** Out of scope for the brief.
- **No edit/delete flows.** Patients and orders are create-only. A real app would need both — easy to add later but not on the critical path for "show me a meaningful slice."
- **Lab test catalog is seeded, read-only.** No admin UI. The brief lists this as optional.
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
- Defined the layered structure (`db` / `domain` / `actions` / `validation`) up front rather than letting it evolve.
- Adopted server actions + server-side zod validation instead of pulling in react-hook-form.

The plan I worked from lives at `.claude/plan/PLAN.md`.
