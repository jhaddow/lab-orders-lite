import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPatients } from "@/lib/db/patients";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
}

export default async function PatientsPage() {
  const patients = await getPatients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Patients</h1>
        <Link href="/patients/new" className={buttonVariants()}>
          New patient
        </Link>
      </div>

      {patients.length === 0 ? (
        <div className="rounded-md border bg-white p-8 text-center text-sm text-zinc-600">
          No patients yet.{" "}
          <Link href="/patients/new" className="underline">
            Add your first patient
          </Link>
          .
        </div>
      ) : (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date of birth</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {p.lastName}, {p.firstName}
                  </TableCell>
                  <TableCell>{formatDate(p.dateOfBirth)}</TableCell>
                  <TableCell className="text-zinc-600">{p.email ?? "—"}</TableCell>
                  <TableCell className="text-zinc-600">{p.phone ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
