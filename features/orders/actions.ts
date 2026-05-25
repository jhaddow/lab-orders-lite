"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { createOrder, OrderValidationError } from "./repo";
import { orderSchema } from "./schema";
import type { FormState } from "@/lib/form-state";

type OrderFields = keyof z.infer<typeof orderSchema>;

export async function createOrderAction(
  _prev: FormState<OrderFields>,
  formData: FormData,
): Promise<FormState<OrderFields>> {
  const actor = await getCurrentUser();

  const parsed = orderSchema.safeParse({
    patientId: formData.get("patientId"),
    labTestIds: formData.getAll("labTestIds"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let orderId: string;
  try {
    const order = await createOrder(parsed.data, actor);
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
