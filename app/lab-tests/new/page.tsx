import Link from "next/link";
import { LabTestForm } from "@/features/lab-tests/lab-test-form";
import { getCurrentUser } from "@/lib/auth";

export default async function NewLabTestPage() {
  const currentUser = await getCurrentUser();
  const canCreate = currentUser.role === "ADMIN";

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          href="/lab-tests"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span aria-hidden className="mr-1.5">
            ←
          </span>{" "}
          Back to lab tests
        </Link>
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">New entry</p>
          <h1 className="font-display text-4xl tracking-tight">Add a lab test</h1>
        </div>
      </header>
      {canCreate ? (
        <LabTestForm />
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-sm text-muted-foreground max-w-xl">
          Admin role required to add a lab test. Switch to an admin user from the header to
          continue.
        </div>
      )}
    </div>
  );
}
