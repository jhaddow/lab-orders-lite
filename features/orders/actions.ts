"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { AuthorizationError, getCurrentUser } from "@/lib/auth";
import { cancelOrder, completeOrder, createOrder, OrderValidationError, startOrder } from "./repo";
import { cancelOrderSchema, orderSchema } from "./schema";
import { InvalidTransitionError } from "./domain";
import type { FormState } from "@/lib/form-state";

type OrderFields = keyof z.infer<typeof orderSchema>;
type CancelFields = keyof z.infer<typeof cancelOrderSchema>;

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

function transitionErrorMessage(err: unknown): string | null {
  if (err instanceof OrderValidationError) return err.message;
  if (err instanceof InvalidTransitionError) return err.message;
  if (err instanceof AuthorizationError) return err.message;
  return null;
}

export async function startOrderAction(orderId: string): Promise<void> {
  const actor = await getCurrentUser();
  try {
    await startOrder(orderId, actor);
  } catch (err) {
    const msg = transitionErrorMessage(err);
    if (msg) throw new Error(msg);
    throw err;
  }
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
}

export async function completeOrderAction(orderId: string): Promise<void> {
  const actor = await getCurrentUser();
  try {
    await completeOrder(orderId, actor);
  } catch (err) {
    const msg = transitionErrorMessage(err);
    if (msg) throw new Error(msg);
    throw err;
  }
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
}

export async function cancelOrderAction(
  orderId: string,
  _prev: FormState<CancelFields>,
  formData: FormData,
): Promise<FormState<CancelFields>> {
  const actor = await getCurrentUser();

  const parsed = cancelOrderSchema.safeParse({ reason: formData.get("reason") });
  if (!parsed.success) {
    return {
      status: "error",
      message: "Please correct the errors below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await cancelOrder(orderId, actor, parsed.data.reason);
  } catch (err) {
    const msg = transitionErrorMessage(err);
    if (msg) return { status: "error", message: msg };
    throw err;
  }
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  return { status: "idle" };
}
