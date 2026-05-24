import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/client";
import { createPatient } from "@/lib/db/patients";
import {
  createOrder,
  getOrder,
  getOrders,
  OrderValidationError,
} from "@/lib/db/orders";

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
    it("creates an order with snapshotted price and turnaround", async () => {
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC");      // 4500c / 1d
      const lipidId = await getLabTestIdByCode("LIPID");  // 6800c / 2d

      const order = await createOrder({
        patientId: patient.id,
        labTestIds: [cbcId, lipidId],
      });

      expect(order.totalCents).toBe(4500 + 6800);
      expect(order.currency).toBe("USD");
      expect(order.status).toBe("PENDING");
      expect(order.items).toHaveLength(2);

      const snapshotted = order.items.map((i) => ({
        priceCentsAtOrder: i.priceCentsAtOrder,
        turnaroundDaysAtOrder: i.turnaroundDaysAtOrder,
      }));
      expect(snapshotted).toContainEqual({
        priceCentsAtOrder: 4500,
        turnaroundDaysAtOrder: 1,
      });
      expect(snapshotted).toContainEqual({
        priceCentsAtOrder: 6800,
        turnaroundDaysAtOrder: 2,
      });

      // estimatedReadyDate = createdAt + max turnaround (2 days)
      const diffMs = order.estimatedReadyDate.getTime() - order.createdAt.getTime();
      // DATE column truncates time, so compare to start-of-day of expected
      const expected = new Date(order.createdAt);
      expected.setUTCDate(expected.getUTCDate() + 2);
      expected.setUTCHours(0, 0, 0, 0);
      expect(order.estimatedReadyDate.getTime()).toBe(expected.getTime());
      expect(diffMs).toBeGreaterThan(0);
    });

    it("preserves snapshot when underlying lab test price changes later", async () => {
      const patient = await setupPatient();
      const cbcId = await getLabTestIdByCode("CBC");
      const order = await createOrder({
        patientId: patient.id,
        labTestIds: [cbcId],
      });

      await prisma.labTest.update({
        where: { id: cbcId },
        data: { priceCents: 99999 },
      });

      const fetched = await getOrder(order.id);
      expect(fetched?.items[0].priceCentsAtOrder).toBe(4500);
      expect(fetched?.totalCents).toBe(4500);
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
      expect(orders[0].patient.firstName).toBe("Test");
      expect(orders[0].items[0].labTest.code).toBe("BMP");
    });

    it("returns null for a missing order", async () => {
      expect(await getOrder("does-not-exist")).toBeNull();
    });
  });
});
