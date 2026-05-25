import { Button } from "@/components/ui/button";
import { listUsers } from "@/features/users/repo";
import { getCurrentUserOptional } from "@/lib/auth";
import { signInAsAction } from "./actions";

export default async function SignInAsPage() {
  const [users, currentUser] = await Promise.all([listUsers(), getCurrentUserOptional()]);

  return (
    <div className="max-w-xl space-y-6">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Dev sign-in</p>
        <h1 className="font-display text-3xl tracking-tight">Sign in as…</h1>
        <p className="text-sm text-muted-foreground">
          No passwords — pick a seeded user to act as. This stub stands in for real auth
          (NextAuth/Lucia would slot in behind the same <code>getCurrentUser()</code> helper).
        </p>
      </header>

      <ul className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {users.map((u) => {
          const isCurrent = currentUser?.id === u.id;
          return (
            <li
              key={u.id}
              className="flex items-center justify-between gap-4 px-4 py-3.5"
              aria-current={isCurrent ? "true" : undefined}
            >
              <div className="min-w-0">
                <div className="font-medium text-[15px] text-foreground truncate">{u.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {u.email} · <span className="uppercase tracking-wider">{u.role}</span>
                </div>
              </div>
              <form action={signInAsAction}>
                <input type="hidden" name="userId" value={u.id} />
                <Button type="submit" variant={isCurrent ? "outline" : "default"} className="h-9">
                  {isCurrent ? "Current" : "Sign in"}
                </Button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
