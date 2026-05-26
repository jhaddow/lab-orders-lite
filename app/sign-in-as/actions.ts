"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { setActingUserCookie } from "@/lib/auth";
import { getUserById } from "@/features/users/repo";

export async function signInAsAction(formData: FormData): Promise<void> {
  const userId = formData.get("userId");
  if (typeof userId !== "string" || !userId) {
    throw new Error("userId is required");
  }
  const user = await getUserById(userId);
  if (!user) {
    throw new Error("Unknown user");
  }
  await setActingUserCookie(userId);
  revalidatePath("/", "layout");
  redirect("/");
}
