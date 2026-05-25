"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { createPatient } from "./repo";
import { patientSchema } from "./schema";
import type { FormState } from "@/lib/form-state";

type PatientFields = keyof z.infer<typeof patientSchema>;

export async function createPatientAction(
  _prev: FormState<PatientFields>,
  formData: FormData,
): Promise<FormState<PatientFields>> {
  const parsed = patientSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    dateOfBirth: formData.get("dateOfBirth"),
    email: formData.get("email"),
    phone: formData.get("phone"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await createPatient(parsed.data);
  revalidatePath("/patients");
  redirect("/patients");
}
