import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createPatient } from "@/features/patients/repo";
import {
  getLabTests,
  setLabTestPrice,
} from "@/features/lab-tests/repo";
import {
  createOrder,
  getOrder,
  getOrders,
  OrderValidationError,
} from "@/features/orders/repo";

async function setupPatient() {
  return createPatient({
    firstName: "Test",
    lastName: "Patient",
    dateOfBirth: new Date("1990-01-01"),
  });
}

async function getLabTestIdByCode(code: string) {
  const t = await prisma.labTest.findUniqueOrThrow({ where: { code } });
  return t.id;
}

describe("order repository", () => {
  describe("createOrder", () => {
    it("creates an order with total, currency, and PENDING status", async () => {
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC");      // 4500c
      const lipidId = await getLabTestIdByCode("LIPID");  // 6800c

      const order = await createOrder({
        patientId: patient.id,
        labTestIds: [cbcId, lipidId],
      });

      expect(order.totalCents).toBe(4500 + 6800);
      expect(order.currency).toBe("USD");
      expect(order.status).toBe("PENDING");
      expect(order.items).toHaveLength(2);
    });

    it("links each line item to the current Price and snapshots turnaround", async () => {
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC");      // 4500c / 1d
      const lipidId = await getLabTestIdByCode("LIPID");  // 6800c / 2d

      const order = await createOrder({
        patientId: patient.id,
        labTestIds: [cbcId, lipidId],
      });

      const snapshotted = order.items.map((i) => ({
        priceCents: i.price.priceCents,
        turnaroundDaysAtOrder: i.turnaroundDaysAtOrder,
      }));
      expect(snapshotted).toContainEqual({
        priceCents: 4500,
        turnaroundDaysAtOrder: 1,
      });
      expect(snapshotted).toContainEqual({
        priceCents: 6800,
        turnaroundDaysAtOrder: 2,
      });
    });

    it("computes estimatedReadyDate from the slowest test's turnaround", async () => {
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC");      // 1d
      const lipidId = await getLabTestIdByCode("LIPID");  // 2d
      const tshId = await getLabTestIdByCode("TSH");      // 3d (the slowest)

      const order = await createOrder(
        {
          patientId: patient.id,
          labTestIds: [cbcId, lipidId, tshId],
        },
        { now: new Date("2026-05-25T12:00:00.000Z") },
      );

      // 2026-05-25 + 3 days = 2026-05-28 (DATE column drops time)
      expect(order.estimatedReadyDate.toISOString().slice(0, 10)).toBe(
        "2026-05-28",
      );
    });

    it("references the price that was current at order time, even after later price changes", async () => {
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC"); // seeded at 4500c

      const firstOrder = await createOrder({
        patientId: patient.id,
        labTestIds: [cbcId],
      });

      // Catalog price changes — a new Price record is appended.
      await setLabTestPrice(cbcId, 9900, "USD");

      const secondOrder = await createOrder({
        patientId: patient.id,
        labTestIds: [cbcId],
      });

      const first = await getOrder(firstOrder.id);
      const second = await getOrder(secondOrder.id);

      expect(first?.items[0]?.price.priceCents).toBe(4500);
      expect(first?.totalCents).toBe(4500);
      expect(second?.items[0]?.price.priceCents).toBe(9900);
      expect(second?.totalCents).toBe(9900);
    });

    it("rejects an order with no lab tests", async () => {
      const patient = await setupPatient();
      await expect(
        createOrder({ patientId: patient.id, labTestIds: [] }),
      ).rejects.toBeInstanceOf(OrderValidationError);
    });

    it("rejects an unknown patient", async () => {
      const cbcId = await getLabTestIdByCode("CBC");
      await expect(
        createOrder({ patientId: "does-not-exist", labTestIds: [cbcId] }),
      ).rejects.toBeInstanceOf(OrderValidationError);
    });

    it("rejects an unknown lab test", async () => {
      const patient = await setupPatient();
      await expect(
        createOrder({
          patientId: patient.id,
          labTestIds: ["does-not-exist"],
        }),
      ).rejects.toBeInstanceOf(OrderValidationError);
    });

    it("rejects an order whose lab tests have mixed currencies", async () => {
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC");  // USD

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
        createOrder({
          patientId: patient.id,
          labTestIds: [cbcId, eurTest.id],
        }),
      ).rejects.toBeInstanceOf(OrderValidationError);
    });

    it("rejects an order for a lab test that has no current price", async () => {
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC");

      // Strip every Price for CBC, violating the catalog invariant.
      await prisma.price.deleteMany({ where: { labTestId: cbcId } });

      await expect(
        createOrder({ patientId: patient.id, labTestIds: [cbcId] }),
      ).rejects.toBeInstanceOf(OrderValidationError);
    });
  });

  describe("getOrders / getOrder", () => {
    it("returns orders newest first with patient and items hydrated", async () => {
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC");
      const bmpId = await getLabTestIdByCode("BMP");

      const first = await createOrder({
        patientId: patient.id,
        labTestIds: [cbcId],
      });
      await new Promise((r) => setTimeout(r, 10));
      const second = await createOrder({
        patientId: patient.id,
        labTestIds: [bmpId],
      });

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

describe("lab test catalog", () => {
  it("returns only the latest price per lab test", async () => {
    const cbcId = await getLabTestIdByCode("CBC"); // seeded at 4500c

    await setLabTestPrice(cbcId, 7700, "USD");

    const catalog = await getLabTests();
    const cbc = catalog.find((t) => t.code === "CBC");
    expect(cbc?.prices).toHaveLength(1);
    expect(cbc?.prices[0]?.priceCents).toBe(7700);
  });
});
