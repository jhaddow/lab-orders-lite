# Lab Orders Lite — Implementation Plan

## Context

This is a take-home coding challenge for an Enzo Health interview, to be discussed and extended together in person. The brief is to build "Lab Orders Lite" — a small system managing Patients, Lab Tests, and Orders — in 5–8 hours, with the in-person follow-up walking through code organization, testing, and live modifications.

Evaluation criteria from `CHALLENGE.md`: code organization, architecture decisions, testing discipline, README clarity, and articulating trade-offs. The brief explicitly favors **a polished core slice over unfinished breadth**.

Decided scope (per user):
- **Stack:** Match the team's stack exactly — Next.js (App Router) + TypeScript + Shadcn + Prisma + Postgres.
- **Database:** Postgres via `docker-compose` so reviewers run an identical environment.
- **Features:** Basic UI covering — add patient, list patients, create order, list orders, view order. Lab test catalog seeded read-only (no admin UI).
- **Testing:** Vitest unit tests on domain logic + integration tests on server actions against a real test Postgres.

---

## Data Model (`prisma/schema.prisma`)

```
Patient        id, firstName, lastName, dateOfBirth, email?, phone?, createdAt
LabTest        id, code (unique), name, priceCents (Int), currency (String, default "USD"),
               turnaroundDays, createdAt
Order          id, patientId, status (enum default PENDING),
               totalCents (Int), currency (String, default "USD"),
               estimatedReadyDate, createdAt
OrderItem      id, orderId, labTestId, priceCentsAtOrder (Int), turnaroundDaysAtOrder
```

**Money model — Stripe-style integer minor units + ISO currency code.** All prices stored as `Int` cents alongside a `currency` field (default `"USD"` for v1). Avoids floating-point and `Decimal` round-trip bugs, keeps arithmetic exact, and leaves the door open for multi-currency without a migration. A `lib/money.ts` helper handles `formatMoney(cents, currency)` for display. Order creation validates all selected tests share the order's currency.

**Key decision — snapshot price and turnaround onto `OrderItem`.** Lab test catalog can change; an order's totals must stay immutable. `totalCents` and `estimatedReadyDate` are persisted on `Order` (computed at creation) rather than derived on read, so list/sort/filter stay simple. This is worth a line in the README.

Status starts as a simple enum with one value (`PENDING`) — leaves room for the in-person extension exercise without over-building now.

---

## Architecture

```
/app
  layout.tsx, page.tsx (redirect to /orders)
  /patients         page.tsx       list
  /patients/new     page.tsx       create form
  /orders           page.tsx       list
  /orders/new       page.tsx       create form (pick patient + tests, preview totals)
  /orders/[id]      page.tsx       detail view

/components
  /ui               shadcn primitives
  patient-form.tsx, order-form.tsx, order-summary.tsx, nav.tsx

/lib
  /db
    client.ts       prisma singleton
    patients.ts     getPatients, getPatient, createPatient
    orders.ts       getOrders, getOrder, createOrder
    lab-tests.ts    getLabTests
  /domain
    orders.ts       calculateOrderTotal, calculateEstimatedReadyDate
    orders.test.ts  unit tests (pure functions)
  /actions
    patients.ts     server actions (createPatient)
    orders.ts       server actions (createOrder)
  /validation
    patient.ts      zod schema
    order.ts        zod schema

/prisma
  schema.prisma, seed.ts (seeds ~6 common lab tests), /migrations

/tests/integration
  patients.test.ts, orders.test.ts, setup.ts

docker-compose.yml, .env.example, vitest.config.ts, README.md
```

**Layering rationale:**
- `lib/domain/` — pure functions, no I/O. Easiest possible unit tests; core business rules live here.
- `lib/db/` — the only place Prisma is imported. Pages and actions call these, never Prisma directly. Keeps swap-ability and makes integration tests focused.
- `lib/actions/` — server actions are thin: validate (zod) → call db layer → `revalidatePath`.
- Pages are server components doing direct data loading via `lib/db/`; mutations via server actions. No client-side fetch layer needed.

---

## Domain Logic (testable, no I/O)

```ts
// lib/domain/orders.ts
calculateOrderTotalCents(items: { priceCentsAtOrder: number }[]): number
calculateEstimatedReadyDate(createdAt: Date, items: { turnaroundDaysAtOrder: number }[]): Date
  // = createdAt + max(turnaroundDaysAtOrder); throws if items empty

// lib/money.ts
formatMoney(cents: number, currency: string): string  // e.g. (1299, "USD") -> "$12.99"
```

These are the highest-leverage unit tests — they encode the actual business rules and are trivially testable.

---

## Testing Setup

- **Vitest** with two configs/projects:
  - `unit` — pattern `lib/**/*.test.ts`, no setup.
  - `integration` — pattern `tests/integration/**`, `globalSetup` that ensures a `labordrs_test` database exists and runs `prisma migrate deploy` against it.
- Test DB isolation: separate `DATABASE_URL` in `.env.test`; each test file truncates tables in `beforeEach` (simple, reliable, fast enough for this size).
- Suggested cases:
  - **Unit:** `calculateOrderTotalCents` (empty, single item, multiple items, large values stay exact as Int); `calculateEstimatedReadyDate` (max selection, single item); `formatMoney` (USD formatting, zero, large amounts).
  - **Integration:** `createPatient` happy path + invalid-input rejection; `createOrder` happy path persists snapshots correctly + rejects empty test list + rejects unknown patient; `getOrders`/`getOrder` return shape.

---

## Files to Create (no existing code to modify)

The repo is empty apart from `CHALLENGE.md`, `.gitignore`, `.tool-versions` (Node 26.2.0, pnpm 11.3.0). Everything above is greenfield.

---

## Execution Order

1. `pnpm create next-app` (TS, App Router, Tailwind, src/ off, import alias `@/*`).
2. `pnpm dlx shadcn@latest init`, add: button, input, label, card, table, select, checkbox, form, badge.
3. Add Prisma, `docker-compose.yml` (postgres:16-alpine), `.env.example`, `.env`, `.env.test`.
4. Write `schema.prisma`, run `prisma migrate dev --name init`, write `seed.ts`.
5. **Build domain layer first** (`lib/domain/orders.ts` + tests). Locks in the business rules.
6. Build `lib/db/` repositories + integration tests.
7. Build `lib/actions/` server actions + zod validation.
8. Build pages and forms. Keep UI deliberately plain — Shadcn defaults, no custom theming.
9. Write README (setup, architecture overview, trade-offs, what-I'd-do-next).
10. Manual smoke test the full flow; fix anything broken; commit history check.

---

## Trade-offs to Surface in README

- No auth (out of scope for the brief).
- No edit/delete for patients or orders.
- Lab test catalog seeded, no admin UI.
- No pagination, no search/filter (the brief lists these as optional; cut for time).
- Single-status workflow — `PENDING` only. Designed for the in-person extension.
- Money stored as integer cents + `currency` (Stripe-style); seeded data is USD only, but schema supports multi-currency. No i18n on display formatting beyond `Intl.NumberFormat`.
- No optimistic UI; server-rendered with `revalidatePath` after mutations.
- Used AI assistance (Claude Code) for scaffolding; will note this explicitly per the brief.

---

## Verification

End-to-end check that the deliverable works:

```bash
pnpm install
docker compose up -d
cp .env.example .env
pnpm prisma migrate deploy
pnpm prisma db seed
pnpm dev
# Open http://localhost:3000
# 1. Go to /patients/new, add a patient
# 2. Go to /orders/new, select that patient + 2-3 lab tests
# 3. Verify total cost and estimated ready date display correctly
# 4. Submit → land on /orders/[id] showing the saved order
# 5. /orders shows the new order in the list
pnpm test           # all unit + integration pass
pnpm test:unit      # subset
pnpm test:integration
```

A reviewer should be able to follow exactly these steps from a clean clone.
