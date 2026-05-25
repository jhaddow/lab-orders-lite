import type { Role } from "../lib/generated/prisma/client";

export const SEED_USERS: Array<{ name: string; email: string; role: Role }> = [
  { name: "Alex Morgan", email: "alex@labs.test", role: "ADMIN" },
  { name: "Jane Patel", email: "jane@labs.test", role: "CLINICIAN" },
  { name: "Sam Rivera", email: "sam@labs.test", role: "CLINICIAN" },
];
