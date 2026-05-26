import { z } from "zod";

const today = () => {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

export const patientSchema = z.object({
  firstName: z.string().trim().min(1, "First name is required").max(100),
  lastName: z.string().trim().min(1, "Last name is required").max(100),
  dateOfBirth: z.coerce
    .date({ error: "Date of birth is required" })
    .max(today(), "Date of birth must be in the past"),
  email: z
    .string()
    .trim()
    .email("Invalid email")
    .or(z.literal(""))
    .optional()
    .transform((v) => (v ? v : undefined)),
  phone: z
    .string()
    .trim()
    .max(50)
    .or(z.literal(""))
    .optional()
    .transform((v) => (v ? v : undefined)),
});
