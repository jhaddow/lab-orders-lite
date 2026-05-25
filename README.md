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
pnpm db:seed         # seed users + lab-test catalog
pnpm dev             # http://localhost:3000
```

Then visit `/sign-in-as` and pick a user (no passwords — dev-mode auth, see below). Three users are seeded: **Alex Morgan** (ADMIN), **Jane Patel** (CLINICIAN), **Sam Rivera** (CLINICIAN). Then create a patient and an order.

### Tests

```bash
pnpm test            # all unit + integration tests
pnpm test:unit       # pure domain logic only
pnpm test:integration  # hits a real Postgres test database
```

The integration suite uses a separate database (`lab_orders_lite_test`) configured in `.env.test`. The first run auto-creates it and applies migrations. Each test resets state in a single transaction.

### Common scripts

| Command                        | What it does                              |
| ------------------------------ | ----------------------------------------- |
| `pnpm dev`                     | Next.js dev server (Turbopack)            |
| `pnpm build` / `pnpm start`    | Production build / serve                  |
| `pnpm typecheck`               | `tsc --noEmit`                            |
| `pnpm lint`                    | ESLint                                    |
| `pnpm format` / `format:check` | Prettier write / check                    |
| `pnpm db:up` / `pnpm db:down`  | Start / stop the local Postgres container |
| `pnpm db:migrate`              | Create a new migration in development     |
| `pnpm db:deploy`               | Apply existing migrations (no prompts)    |
| `pnpm db:seed`                 | Seed users + lab-test catalog             |
| `pnpm db:reset`                | Drop, migrate, reseed (dev DB)            |
| `pnpm db:generate`             | Regenerate the Prisma client              |

Husky runs `lint-staged` (prettier + eslint --fix) on pre-commit, and `typecheck + test:unit` on pre-push. CI (GitHub Actions) runs format check + lint + typecheck + the full test suite against a Postgres service container.

---

## Architecture

The codebase is organized in **clear horizontal layers** so each layer has a single concern and is independently testable.

```
app/                       # Next.js App Router — routing only
  sign-in-as/              # dev-mode user picker
features/                  # One folder per feature; everything for X lives in X/
  patients/                #   the simplest case
    repo.ts                #     Prisma queries
    actions.ts             #     server actions
    schema.ts              #     zod validation
    patient-form.tsx       #     client form
  orders/                  #   adds pure domain logic + colocated unit tests
    repo.ts, actions.ts, schema.ts
    domain.ts              #     calculations + canTransition state machine
    domain.test.ts         #     unit tests next to the code they cover
    order-form.tsx
  lab-tests/               #   same pattern; more forms (create + append-price)
  audit/                   #   appendAuditLog + listAuditEntriesForEntity
  users/                   #   getUserById, listUsers (used by /sign-in-as)
lib/                       # Cross-cutting only (Prisma singleton, money, auth, FormState, cn)
components/ui/             # Shadcn primitives
prisma/                    # schema.prisma, seed.ts, seed-users.ts, migrations/
tests/integration/         # Vitest integration tests against a real test DB
```

Every feature follows the same shape: `repo.ts` is the only place Prisma is imported, `actions.ts` is the server-action entry point, `schema.ts` holds zod validation, and the client form lives alongside. Pure business logic (no I/O) goes in `domain.ts` with colocated unit tests.

### Key design decisions

- **Money as Stripe-style integer minor units.** `Int priceCents` + explicit `currency` column. Avoids floating-point bugs and is multi-currency-ready without a migration.
- **Price versioning via an append-only `Price` table.** Changing a price inserts a new `Price` row — never updates in place. Each `OrderItem` carries a `priceId` FK to the exact `Price` that was current at order time, so historical totals never drift.
- **Order workflow as a pure state machine.** `canTransition(from, to)` is a pure function over an `ALLOWED_TRANSITIONS` map; unit tests cover the full 16-case truth table. Terminal states (COMPLETED, CANCELLED) reject all further transitions. The repo runs `load → assert → update → audit` inside one transaction so a failed audit rolls back the status change.
- **Append-only audit log written atomically with the mutation.** Every state-changing action passes a `tx` to `appendAuditLog(tx, …)`, so an audit row only exists when the underlying change committed. Per-action metadata (`from`/`to` status, cancellation reason, previous price) lives in a JSON column rather than schema sprawl.
- **Dev-mode auth, production-shaped helper.** `getCurrentUser()` reads a signed cookie; `/sign-in-as` is a no-password user picker. Real auth (NextAuth/Lucia) would slot in behind the same helper with no call-site changes. Role gating happens at the repo boundary (`requireRole(actor, "ADMIN")`), not in the UI — the UI hides admin-only affordances as UX polish.
- **Feature-first folders.** Everything for a feature lives in `features/<name>/`. `lib/` is reserved for genuinely cross-cutting helpers; `app/` is routing only.
- **Repos are the only place Prisma is imported.** Pages and server actions go through `features/*/repo.ts`.
- **Server actions + server-side zod.** No client-side fetch layer, no react-hook-form. Field errors surface back into the form via `useActionState`.

### Testing strategy

**Integration tests are the default.** They hit a real Postgres and exercise the repo + validation layer end-to-end, so they catch the things that actually break: schema mismatches, FK constraints, transaction semantics. Unit tests are reserved for pure logic with enough edge cases to be worth isolating (money formatting, total/ready-date calculations).

---

## Trade-offs (what I cut and why)

- **Auth is dev-mode only.** No passwords, no session expiry, no CSRF defenses beyond Next's defaults. The `getCurrentUser()` / `requireRole()` helpers and the `User`+`Role` schema are shaped so NextAuth/Lucia could slot in without changing call sites.
- **Audit log is append-only by convention, not WORM.** A determined operator with DB access could mutate or delete rows. Production would back it with append-only storage (or ship to a separate logging service) for tamper resistance.
- **Role policy is coarse.** Two roles (`CLINICIAN`, `ADMIN`); ADMIN gates lab-test creation and price changes (catalog mutations). Order workflow transitions are open to any signed-in user. Real RBAC would scope by patient/department/ordering provider.
- **Prod migration for price versioning + `createdByUserId` isn't implemented.** Both migrations drop or add required columns outright — fine for a take-home where reviewers reset the DB. A real cutover would backfill (a `Price` row per existing `LabTest`; a system `User` for legacy orders) before dropping or constraining anything.
- **No edit or delete on patients/orders.** Create-only. Deleting a lab test would also need a deprecation pattern since orders reference prices via FK.
- **Turnaround isn't versioned.** Mutable on `LabTest`, snapshotted on `OrderItem`. The same `Price`-style treatment would apply if SLAs ever changed.
- **No pagination/search, no optimistic UI.** Deliberately deferred — the seed data is small enough that none of these hurt the demo.
- **USD only.** Schema and formatter are multi-currency ready, but seeds are USD and the order form rejects mixed-currency selections.

## With more time I'd add

- Swap the cookie stub for real auth (NextAuth or Lucia) behind the existing `getCurrentUser()` helper. Tamper-resistant audit storage (append-only WORM or a separate logging service). Finer-grained RBAC scoped by patient/department.
- Patient edit + soft-delete (`deletedAt`) with a "show archived" toggle.
- Filter/search on the orders list (by patient, status, date range) — the `status` column is already indexed for this.
- A more deliberate cut of project-level agent skills in `.claude/skills/`. The current set was inherited from my personal config; a team-shared set should be curated to match the project's stack and conventions.
- Better empty/loading/error states; right now we lean on Next's defaults.
- A few Playwright happy-path E2E tests against the running app.

---

## AI assistance

Built with **Claude Code** (Claude Opus 4.7) for scaffolding and boilerplate. Every decision under "Key design decisions" and "Trade-offs" was mine — I directed Claude rather than accepting output wholesale. Notable cases I drove:

- Integer-cents money model instead of `Decimal`.
- Feature-first folders after an initial layered (`db`/`domain`/`actions`/`validation`) version proved hard to navigate.
- Append-only `Price` table for price versioning, instead of mutating `LabTest.priceCents` and relying on snapshot copies.
- Append-only `AuditLog` written in the same transaction as the mutation it records — an audit row only exists when the change committed.
- Order workflow modeled as a pure `canTransition(from, to)` state machine with a 16-case truth-table test, rather than scattering `if (status === ...)` checks across the repo.

The commit history is the process narrative — each commit records the specific principle the step was grounded in.
