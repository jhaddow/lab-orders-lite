import Link from "next/link";
import { LabTestForm } from "@/features/lab-tests/lab-test-form";

export default function NewLabTestPage() {
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
      <LabTestForm />
    </div>
  );
}
