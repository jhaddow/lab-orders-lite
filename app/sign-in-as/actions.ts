"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setActingUserCookie, clearActingUserCookie } from "@/lib/auth";

export async function signInAsAction(formData: FormData): Promise<void> {
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) {
    throw new Error("userId is required");
  }
  await setActingUserCookie(userId);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOutAction(): Promise<void> {
  await clearActingUserCookie();
  revalidatePath("/", "layout");
  redirect("/sign-in-as");
}
