import { z } from "zod";
import { parseDollars } from "@/lib/money";

const dollarsField = z
  .string()
  .trim()
  .min(1, "Price is required")
  .superRefine((val, ctx) => {
    try {
      parseDollars(val);
    } catch {
      ctx.addIssue({
        code: "custom",
        message: "Enter an amount like 45 or 45.50",
      });
    }
  })
  .transform((val) => parseDollars(val));

export const createLabTestSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2, "Code is required")
    .max(20, "Code must be 20 characters or fewer")
    .regex(/^[A-Z0-9_-]+$/, "Code can use A–Z, 0–9, _ and - only"),
  name: z
    .string()
    .trim()
    .min(2, "Name is required")
    .max(120, "Name must be 120 characters or fewer"),
  turnaroundDays: z.coerce
    .number({ error: "Turnaround is required" })
    .int("Turnaround must be a whole number")
    .min(1, "Turnaround must be at least 1 day")
    .max(365, "Turnaround must be 365 days or fewer"),
  initialPriceCents: dollarsField,
});

export type CreateLabTestSchemaInput = z.infer<typeof createLabTestSchema>;

export const setPriceSchema = z.object({
  priceCents: dollarsField,
});

export type SetPriceSchemaInput = z.infer<typeof setPriceSchema>;
