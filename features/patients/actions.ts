"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createPatient } from "./repo";
import { patientSchema } from "./schema";
import type { FormState } from "@/lib/form-state";

export async function createPatientAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
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
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  await createPatient(parsed.data);
  revalidatePath("/patients");
  redirect("/patients");
}
