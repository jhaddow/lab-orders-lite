import Link from "next/link";
import { PatientForm } from "@/components/patient-form";

export default function NewPatientPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          href="/patients"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span aria-hidden className="mr-1.5">←</span> Back to patients
        </Link>
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            New record
          </p>
          <h1 className="font-display text-4xl tracking-tight">Add a patient</h1>
        </div>
      </header>
      <PatientForm />
    </div>
  );
}
