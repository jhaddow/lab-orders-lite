# Lab Orders Lite

A small clinic app for managing **patients**, a **lab test catalog**, and **orders** that compose multiple tests with a computed total cost and estimated ready date.

The tech stack is: **Next.js 16 (App Router) + TypeScript + Tailwind + Shadcn UI + Prisma 7 + PostgreSQL**.

---

## Setup

### Prerequisites

- **Node.js** and **pnpm** — pinned versions live in `.tool-versions`. [asdf](https://asdf-vm.com/) is recommended: run `asdf install` from the repo root and you'll get the exact versions used here (Node 26.2.0, pnpm 11.3.0). Otherwise install matching versions by hand.
- **Docker** — for the local Postgres container.

### First run

```bash
asdf install         # if using asdf
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

| Command                       | What it does                              |
| ----------------------------- | ----------------------------------------- |
| `pnpm dev`                    | Next.js dev server (Turbopack)            |
| `pnpm build` / `pnpm start`   | Production build / serve                  |
| `pnpm db:up` / `pnpm db:down` | Start / stop the local Postgres container |
| `pnpm db:migrate`             | Create a new migration in development     |
| `pnpm db:deploy`              | Apply existing migrations (no prompts)    |
| `pnpm db:seed`                | Seed the lab-test catalog                 |
| `pnpm db:reset`               | Drop, migrate, reseed (dev DB)            |
| `pnpm db:generate`            | Regenerate the Prisma client              |

---

## Architecture

The codebase is organized in **clear horizontal layers** so each layer has a single concern and is independently testable.

```
app/                       # Next.js App Router — routing only
features/                  # One folder per feature; everything for X lives in X/
  patients/                #   the simplest case
    repo.ts                #     Prisma queries
    actions.ts             #     server actions
    schema.ts              #     zod validation
    patient-form.tsx       #     client form
  orders/                  #   adds pure domain logic + colocated unit tests
    repo.ts, actions.ts, schema.ts
    domain.ts              #     calculateOrderTotalCents, calculateEstimatedReadyDate
    domain.test.ts         #     unit tests next to the code they cover
    order-form.tsx
  lab-tests/               #   same pattern; more forms (create + append-price)
lib/                       # Cross-cutting only (Prisma singleton, money, FormState, cn)
components/ui/             # Shadcn primitives
prisma/                    # schema.prisma, seed.ts, migrations/
tests/integration/         # Vitest integration tests against a real test DB
```

Every feature follows the same shape: `repo.ts` is the only place Prisma is imported, `actions.ts` is the server-action entry point, `schema.ts` holds zod validation, and the client form lives alongside. Pure business logic (no I/O) goes in `domain.ts` with colocated unit tests.

### Key design decisions

- **Money as Stripe-style integer minor units.** `Int priceCents` + explicit `currency` column. Avoids floating-point bugs and is multi-currency-ready without a migration.
- **Price versioning via an append-only `Price` table.** Changing a price inserts a new `Price` row — never updates in place. Each `OrderItem` carries a `priceId` FK to the exact `Price` that was current at order time, so historical totals never drift.
- **Feature-first folders.** Everything for a feature lives in `features/<name>/`. `lib/` is reserved for genuinely cross-cutting helpers; `app/` is routing only.
- **Repos are the only place Prisma is imported.** Pages and server actions go through `features/*/repo.ts`.
- **Server actions + server-side zod.** No client-side fetch layer, no react-hook-form. Field errors surface back into the form via `useActionState`.

### Testing strategy

**Integration tests are the default.** They hit a real Postgres and exercise the repo + validation layer end-to-end, so they catch the things that actually break: schema mismatches, FK constraints, transaction semantics. Unit tests are reserved for pure logic with enough edge cases to be worth isolating (money formatting, total/ready-date calculations).

---

## Trade-offs (what I cut and why)

- **Prod migration for price versioning isn't implemented.** The migration just drops the old `priceCents`/`currency` columns. A real cutover would backfill a `Price` row per `LabTest` and link existing `OrderItem`s before dropping anything.
- **Order workflow is a single `PENDING` status.** The enum is in place; the `IN_PROGRESS → COMPLETED → CANCELLED` transitions and audit log are the obvious next step.
- **No edit or delete on patients/orders.** Create-only. Deleting a lab test would also need a deprecation pattern since orders reference prices via FK.
- **Turnaround isn't versioned.** Mutable on `LabTest`, snapshotted on `OrderItem`. The same `Price`-style treatment would apply if SLAs ever changed.
- **No auth, no pagination/search, no optimistic UI.** Deliberately deferred to keep the focus on the data model and order flow; the seed data is small enough that none of these hurt the demo.
- **USD only.** Schema and formatter are multi-currency ready, but seeds are USD and the order form rejects mixed-currency selections.

## With more time I'd add

- Auth + per-user audit trail. Non-negotiable for anything touching PHI; would shape the audit log for order status changes too.
- Order status workflow (`IN_PROGRESS → COMPLETED → CANCELLED`) with an audit log of status changes.
- Dev tooling: ESLint + Prettier configured, a pre-commit hook (lint-staged + Husky) to run typecheck/lint/format on changed files, and CI on push (typecheck + tests against a Postgres service container).
- A more deliberate cut of project-level agent skills in `.claude/skills/`. The current set was inherited from my personal config; a team-shared set should be curated to match the project's stack and conventions (and reviewed alongside the code).
- Patient edit + soft-delete (`deletedAt`) with a "show archived" toggle.
- Filter/search on the orders list (by patient, status, date range).
- Better empty/loading/error states; right now we lean on Next's defaults.
- A few Playwright happy-path E2E tests against the running app.

---

## AI assistance

Built with **Claude Code** (Claude Opus 4.7) for scaffolding and boilerplate. Every decision under "Key design decisions" and "Trade-offs" was mine — I directed Claude rather than accepting output wholesale. Notable cases I drove:

- Integer-cents money model instead of `Decimal`.
- Feature-first folders after an initial layered (`db`/`domain`/`actions`/`validation`) version proved hard to navigate.
- Append-only `Price` table for price versioning, instead of mutating `LabTest.priceCents` and relying on snapshot copies.

The commit history is the process narrative — each commit records the specific principle the step was grounded in.
