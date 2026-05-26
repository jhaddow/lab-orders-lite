import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createPatient } from "@/features/patients/repo";
import { getLabTests, setLabTestPrice } from "@/features/lab-tests/repo";
import {
  cancelOrder,
  completeOrder,
  createOrder,
  getOrder,
  getOrders,
  OrderValidationError,
  startOrder,
} from "@/features/orders/repo";
import { InvalidTransitionError } from "@/features/orders/domain";
import { getSeedAdmin, getSeedClinician } from "./setup";

async function setupPatient() {
  const actor = await getSeedClinician();
  return createPatient(
    {
      firstName: "Test",
      lastName: "Patient",
      dateOfBirth: new Date("1990-01-01"),
    },
    actor,
  );
}

async function getLabTestIdByCode(code: string) {
  const t = await prisma.labTest.findUniqueOrThrow({ where: { code } });
  return t.id;
}

describe("order repository", () => {
  describe("createOrder", () => {
    it("creates an order with total, currency, and PENDING status", async () => {
      const actor = await getSeedClinician();
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC"); // 4500c
      const lipidId = await getLabTestIdByCode("LIPID"); // 6800c

      const order = await createOrder(
        { patientId: patient.id, labTestIds: [cbcId, lipidId] },
        actor,
      );

      expect(order.totalCents).toBe(4500 + 6800);
      expect(order.currency).toBe("USD");
      expect(order.status).toBe("PENDING");
      expect(order.items).toHaveLength(2);
      expect(order.createdByUserId).toBe(actor.id);
    });

    it("links each line item to the current Price and snapshots turnaround", async () => {
      const actor = await getSeedClinician();
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC"); // 4500c / 1d
      const lipidId = await getLabTestIdByCode("LIPID"); // 6800c / 2d

      const order = await createOrder(
        { patientId: patient.id, labTestIds: [cbcId, lipidId] },
        actor,
      );

      const snapshotted = order.items.map((i) => ({
        priceCents: i.price.priceCents,
        turnaroundDaysAtOrder: i.turnaroundDaysAtOrder,
      }));
      expect(snapshotted).toContainEqual({ priceCents: 4500, turnaroundDaysAtOrder: 1 });
      expect(snapshotted).toContainEqual({ priceCents: 6800, turnaroundDaysAtOrder: 2 });
    });

    it("computes estimatedReadyDate from the slowest test's turnaround", async () => {
      const actor = await getSeedClinician();
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC"); // 1d
      const lipidId = await getLabTestIdByCode("LIPID"); // 2d
      const tshId = await getLabTestIdByCode("TSH"); // 3d (the slowest)

      const order = await createOrder(
        { patientId: patient.id, labTestIds: [cbcId, lipidId, tshId] },
        actor,
        { now: new Date("2026-05-25T12:00:00.000Z") },
      );

      // 2026-05-25 + 3 days = 2026-05-28 (DATE column drops time)
      expect(order.estimatedReadyDate.toISOString().slice(0, 10)).toBe("2026-05-28");
    });

    it("references the price that was current at order time, even after later price changes", async () => {
      const clinician = await getSeedClinician();
      const admin = await getSeedAdmin();
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC"); // seeded at 4500c

      const firstOrder = await createOrder(
        { patientId: patient.id, labTestIds: [cbcId] },
        clinician,
      );

      // Catalog price changes — a new Price record is appended.
      await setLabTestPrice(cbcId, 9900, admin);

      const secondOrder = await createOrder(
        { patientId: patient.id, labTestIds: [cbcId] },
        clinician,
      );

      const first = await getOrder(firstOrder.id);
      const second = await getOrder(secondOrder.id);

      expect(first?.items[0]?.price.priceCents).toBe(4500);
      expect(first?.totalCents).toBe(4500);
      expect(second?.items[0]?.price.priceCents).toBe(9900);
      expect(second?.totalCents).toBe(9900);
    });

    it("rejects an order with no lab tests", async () => {
      const actor = await getSeedClinician();
      const patient = await setupPatient();
      await expect(
        createOrder({ patientId: patient.id, labTestIds: [] }, actor),
      ).rejects.toBeInstanceOf(OrderValidationError);
    });

    it("rejects an unknown patient", async () => {
      const actor = await getSeedClinician();
      const cbcId = await getLabTestIdByCode("CBC");
      await expect(
        createOrder({ patientId: "does-not-exist", labTestIds: [cbcId] }, actor),
      ).rejects.toBeInstanceOf(OrderValidationError);
    });

    it("rejects an unknown lab test", async () => {
      const actor = await getSeedClinician();
      const patient = await setupPatient();
      await expect(
        createOrder({ patientId: patient.id, labTestIds: ["does-not-exist"] }, actor),
      ).rejects.toBeInstanceOf(OrderValidationError);
    });

    it("rejects an order whose lab tests have mixed currencies", async () => {
      const actor = await getSeedClinician();
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC"); // USD

      // Create a separate lab test priced in EUR.
      const eurTest = await prisma.labTest.create({
        data: {
          code: "EUR_TEST",
          name: "Euro Lab Test",
          turnaroundDays: 1,
          prices: { create: { priceCents: 1000, currency: "EUR" } },
        },
      });

      await expect(
        createOrder({ patientId: patient.id, labTestIds: [cbcId, eurTest.id] }, actor),
      ).rejects.toBeInstanceOf(OrderValidationError);
    });

    it("rejects an order for a lab test that has no current price", async () => {
      const actor = await getSeedClinician();
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC");

      // Strip every Price for CBC, violating the catalog invariant.
      await prisma.price.deleteMany({ where: { labTestId: cbcId } });

      await expect(
        createOrder({ patientId: patient.id, labTestIds: [cbcId] }, actor),
      ).rejects.toBeInstanceOf(OrderValidationError);
    });

    it("writes an ORDER_CREATED audit entry attributed to the actor", async () => {
      const actor = await getSeedClinician();
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC");

      const order = await createOrder({ patientId: patient.id, labTestIds: [cbcId] }, actor);

      const audit = await prisma.auditLog.findMany({
        where: { entityType: "Order", entityId: order.id },
      });
      expect(audit).toHaveLength(1);
      expect(audit[0]?.action).toBe("ORDER_CREATED");
      expect(audit[0]?.actorId).toBe(actor.id);
    });
  });

  describe("getOrders / getOrder", () => {
    it("returns orders newest first with patient and items hydrated", async () => {
      const actor = await getSeedClinician();
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC");
      const bmpId = await getLabTestIdByCode("BMP");

      const first = await createOrder({ patientId: patient.id, labTestIds: [cbcId] }, actor);
      await new Promise((r) => setTimeout(r, 10));
      const second = await createOrder({ patientId: patient.id, labTestIds: [bmpId] }, actor);

      const orders = await getOrders();
      expect(orders.map((o) => o.id)).toEqual([second.id, first.id]);
      expect(orders[0]?.patient.firstName).toBe("Test");
      expect(orders[0]?.items[0]?.labTest.code).toBe("BMP");
      expect(orders[0]?.items[0]?.price.priceCents).toBe(5200);
    });

    it("returns null for a missing order", async () => {
      expect(await getOrder("does-not-exist")).toBeNull();
    });
  });
});

describe("order workflow", () => {
  async function newOrder() {
    const actor = await getSeedClinician();
    const patient = await setupPatient();
    const cbcId = await getLabTestIdByCode("CBC");
    const order = await createOrder({ patientId: patient.id, labTestIds: [cbcId] }, actor);
    return { actor, order };
  }

  it("PENDING → IN_PROGRESS via startOrder, stamps startedAt and audits", async () => {
    const { actor, order } = await newOrder();
    const started = await startOrder(order.id, actor);
    expect(started.status).toBe("IN_PROGRESS");
    expect(started.startedAt).not.toBeNull();

    const audit = await prisma.auditLog.findMany({
      where: { entityType: "Order", entityId: order.id, action: "ORDER_STATUS_CHANGED" },
    });
    expect(audit).toHaveLength(1);
    expect(audit[0]?.metadata).toMatchObject({ from: "PENDING", to: "IN_PROGRESS" });
  });

  it("IN_PROGRESS → COMPLETED works for a clinician and stamps completedAt", async () => {
    const { actor, order } = await newOrder();
    await startOrder(order.id, actor);
    const completed = await completeOrder(order.id, actor);
    expect(completed.status).toBe("COMPLETED");
    expect(completed.completedAt).not.toBeNull();
  });

  it("cancel from PENDING records reason and stamps cancelledAt", async () => {
    const { actor, order } = await newOrder();
    const cancelled = await cancelOrder(order.id, actor, "wrong patient");
    expect(cancelled.status).toBe("CANCELLED");
    expect(cancelled.cancellationReason).toBe("wrong patient");
    expect(cancelled.cancelledAt).not.toBeNull();

    const audit = await prisma.auditLog.findMany({
      where: { entityType: "Order", entityId: order.id, action: "ORDER_STATUS_CHANGED" },
    });
    expect(audit[0]?.metadata).toMatchObject({
      from: "PENDING",
      to: "CANCELLED",
      reason: "wrong patient",
    });
  });

  it("rejects illegal transitions (PENDING → COMPLETED)", async () => {
    const { order } = await newOrder();
    const admin = await getSeedAdmin();
    await expect(completeOrder(order.id, admin)).rejects.toBeInstanceOf(InvalidTransitionError);
  });

  it("rejects transitions out of terminal states", async () => {
    const { actor, order } = await newOrder();
    await cancelOrder(order.id, actor, "duplicate");
    await expect(startOrder(order.id, actor)).rejects.toBeInstanceOf(InvalidTransitionError);
  });

  it("allows only one stale concurrent transition to win", async () => {
    const { actor, order } = await newOrder();

    let markLockAcquired!: () => void;
    const lockAcquired = new Promise<void>((resolve) => {
      markLockAcquired = resolve;
    });
    let releaseLock!: () => void;
    const lockReleased = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    const lock = prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Order" WHERE id = ${order.id} FOR UPDATE`;
        markLockAcquired();
        await lockReleased;
      },
      { timeout: 10_000 },
    );

    await lockAcquired;
    const competingTransitions = [
      startOrder(order.id, actor),
      cancelOrder(order.id, actor, "duplicate"),
    ];

    // Let both transactions read PENDING and block on their conditional update.
    await new Promise((resolve) => setTimeout(resolve, 100));
    releaseLock();

    const results = await Promise.allSettled(competingTransitions);
    await lock;

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toBeInstanceOf(OrderValidationError);

    const audit = await prisma.auditLog.findMany({
      where: { entityType: "Order", entityId: order.id, action: "ORDER_STATUS_CHANGED" },
    });
    expect(audit).toHaveLength(1);
    expect(audit[0]?.metadata).toMatchObject({ from: "PENDING" });
  });

  it("rejects a blank cancellation reason", async () => {
    const { actor, order } = await newOrder();
    await expect(cancelOrder(order.id, actor, "   ")).rejects.toBeInstanceOf(OrderValidationError);
  });
});

describe("lab test catalog", () => {
  it("returns only the latest price per lab test", async () => {
    const admin = await getSeedAdmin();
    const cbcId = await getLabTestIdByCode("CBC"); // seeded at 4500c

    await setLabTestPrice(cbcId, 7700, admin);

    const catalog = await getLabTests();
    const cbc = catalog.find((t) => t.code === "CBC");
    expect(cbc?.prices).toHaveLength(1);
    expect(cbc?.prices[0]?.priceCents).toBe(7700);
  });
});
