import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createLabTest,
  getLabTest,
  LabTestValidationError,
  setLabTestPrice,
} from "@/features/lab-tests/repo";

describe("lab-test admin", () => {
  describe("createLabTest", () => {
    it("creates a lab test with an initial price atomically", async () => {
      const created = await createLabTest({
        code: "VITD",
        name: "Vitamin D, 25-Hydroxy",
        turnaroundDays: 4,
        initialPriceCents: 8800,
      });

      expect(created.code).toBe("VITD");
      expect(created.prices).toHaveLength(1);
      expect(created.prices[0]?.priceCents).toBe(8800);
      expect(created.prices[0]?.currency).toBe("USD");

      const fetched = await getLabTest(created.id);
      expect(fetched?.name).toBe("Vitamin D, 25-Hydroxy");
      expect(fetched?.prices).toHaveLength(1);
    });

    it("rejects a duplicate code", async () => {
      await expect(
        createLabTest({
          code: "CBC", // seeded
          name: "Some Other Name",
          turnaroundDays: 1,
          initialPriceCents: 1000,
        }),
      ).rejects.toBeInstanceOf(LabTestValidationError);
    });

    it("rejects a duplicate name case-insensitively", async () => {
      await expect(
        createLabTest({
          code: "CBC2",
          name: "complete blood count", // seeded as "Complete Blood Count"
          turnaroundDays: 1,
          initialPriceCents: 1000,
        }),
      ).rejects.toBeInstanceOf(LabTestValidationError);
    });

    it("rejects a non-positive initial price", async () => {
      await expect(
        createLabTest({
          code: "FREE",
          name: "Free Test",
          turnaroundDays: 1,
          initialPriceCents: 0,
        }),
      ).rejects.toBeInstanceOf(LabTestValidationError);
    });

    it("trims whitespace from code and name", async () => {
      const created = await createLabTest({
        code: "  TRIM  ",
        name: "  Trimmed Test  ",
        turnaroundDays: 2,
        initialPriceCents: 2500,
      });
      expect(created.code).toBe("TRIM");
      expect(created.name).toBe("Trimmed Test");
    });
  });

  describe("setLabTestPrice", () => {
    it("appends a new Price record visible as the current catalog price", async () => {
      const cbc = await prisma.labTest.findUniqueOrThrow({
        where: { code: "CBC" },
      });

      await setLabTestPrice(cbc.id, 7700, "USD");

      const fetched = await getLabTest(cbc.id);
      expect(fetched?.prices).toHaveLength(2);
      expect(fetched?.prices[0]?.priceCents).toBe(7700);
      expect(fetched?.prices[1]?.priceCents).toBe(4500);
    });

    it("rejects a price equal to the current price", async () => {
      const cbc = await prisma.labTest.findUniqueOrThrow({
        where: { code: "CBC" },
      });

      await expect(setLabTestPrice(cbc.id, 4500, "USD")).rejects.toBeInstanceOf(
        LabTestValidationError,
      );

      const fetched = await getLabTest(cbc.id);
      expect(fetched?.prices).toHaveLength(1); // no noise added
    });

    it("rejects a non-positive price", async () => {
      const cbc = await prisma.labTest.findUniqueOrThrow({
        where: { code: "CBC" },
      });
      await expect(setLabTestPrice(cbc.id, 0, "USD")).rejects.toBeInstanceOf(
        LabTestValidationError,
      );
    });
  });
});
