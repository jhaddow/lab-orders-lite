import Link from "next/link";
import { PatientForm } from "@/components/patient-form";

export default function NewPatientPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/patients" className="text-sm text-zinc-600 hover:underline">
          ← Back to patients
        </Link>
        <h1 className="text-2xl font-semibold mt-2">New patient</h1>
      </div>
      <PatientForm />
    </div>
  );
}
