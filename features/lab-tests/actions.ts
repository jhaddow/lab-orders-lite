"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { createLabTest, LabTestValidationError, setLabTestPrice } from "./repo";
import { createLabTestSchema, setPriceSchema } from "./schema";
import type { FormState } from "@/lib/form-state";

type CreateFields = keyof z.infer<typeof createLabTestSchema>;
type SetPriceFields = keyof z.infer<typeof setPriceSchema>;

export async function createLabTestAction(
  _prev: FormState<CreateFields>,
  formData: FormData,
): Promise<FormState<CreateFields>> {
  const parsed = createLabTestSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    turnaroundDays: formData.get("turnaroundDays"),
    initialPriceCents: formData.get("initialPriceCents"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let createdId: string;
  try {
    const created = await createLabTest(parsed.data);
    createdId = created.id;
  } catch (err) {
    if (err instanceof LabTestValidationError) {
      return { status: "error", message: err.message };
    }
    throw err;
  }
  revalidatePath("/lab-tests");
  revalidatePath("/orders/new");
  redirect(`/lab-tests/${createdId}`);
}

export async function setLabTestPriceAction(
  labTestId: string,
  _prev: FormState<SetPriceFields>,
  formData: FormData,
): Promise<FormState<SetPriceFields>> {
  const parsed = setPriceSchema.safeParse({
    priceCents: formData.get("priceCents"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await setLabTestPrice(labTestId, parsed.data.priceCents);
  } catch (err) {
    if (err instanceof LabTestValidationError) {
      return {
        status: "error",
        message: err.message,
        fieldErrors: { priceCents: [err.message] },
      };
    }
    throw err;
  }
  revalidatePath(`/lab-tests/${labTestId}`);
  revalidatePath("/lab-tests");
  revalidatePath("/orders/new");
  return { status: "idle" };
}
