import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role, User } from "@/lib/generated/prisma/client";
import { getUserById } from "@/features/users/repo";

const COOKIE_NAME = "lol_acting_user";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

/**
 * Returns the currently signed-in user, or redirects to /sign-in-as if no
 * cookie is set (or its referenced user no longer exists). Use this in
 * server actions and server components that mutate or display per-user data.
 *
 * This is a dev-mode stub: the cookie carries the user id directly with no
 * signing or expiry semantics. Production would swap NextAuth/Lucia in
 * behind the same helper without touching call sites.
 */
export async function getCurrentUser(): Promise<User> {
  const user = await getCurrentUserOptional();
  if (!user) redirect("/sign-in-as");
  return user;
}

export async function getCurrentUserOptional(): Promise<User | null> {
  const jar = await cookies();
  const userId = jar.get(COOKIE_NAME)?.value;
  if (!userId) return null;
  return getUserById(userId);
}

export function requireRole(user: User, role: Role): void {
  if (user.role !== role) {
    throw new AuthorizationError(`This action requires the ${role} role`);
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthorizationError";
    Error.captureStackTrace?.(this, AuthorizationError);
  }
}

export async function setActingUserCookie(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearActingUserCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}
