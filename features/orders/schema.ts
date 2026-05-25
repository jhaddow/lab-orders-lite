import { z } from "zod";

export const orderSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  labTestIds: z.array(z.string().min(1)).min(1, "Select at least one lab test"),
});

export type OrderInput = z.infer<typeof orderSchema>;
