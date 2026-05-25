"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createOrder, OrderValidationError } from "./repo";
import { orderSchema } from "./schema";
import type { FormState } from "@/lib/form-state";

export async function createOrderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = orderSchema.safeParse({
    patientId: formData.get("patientId"),
    labTestIds: formData.getAll("labTestIds"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  let orderId: string;
  try {
    const order = await createOrder(parsed.data);
    orderId = order.id;
  } catch (err) {
    if (err instanceof OrderValidationError) {
      return { status: "error", message: err.message };
    }
    throw err;
  }
  revalidatePath("/orders");
  redirect(`/orders/${orderId}`);
}
