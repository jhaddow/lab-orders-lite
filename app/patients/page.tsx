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
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Records
          </p>
          <h1 className="font-display text-4xl tracking-tight">Patients</h1>
        </div>
        <Link
          href="/patients/new"
          className={`${buttonVariants()} h-10 px-4`}
        >
          New patient
        </Link>
      </header>

      {patients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <p className="font-display text-xl text-foreground">No patients yet</p>
          <p className="text-sm text-muted-foreground">
            Get started by adding your first patient.
          </p>
          <div className="pt-1">
            <Link
              href="/patients/new"
              className={`${buttonVariants({ variant: "outline" })} h-9 px-4`}
            >
              Add patient
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Date of birth
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Email
                </TableHead>
                <TableHead className="pr-5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Phone
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((p) => (
                <TableRow key={p.id} className="hover:bg-muted/30">
                  <TableCell className="pl-5 py-4 font-medium text-foreground">
                    {p.lastName}, {p.firstName}
                  </TableCell>
                  <TableCell className="py-4 tabular-nums text-foreground/80">
                    {formatDate(p.dateOfBirth)}
                  </TableCell>
                  <TableCell className="py-4 text-muted-foreground">
                    {p.email ?? <span className="text-border">—</span>}
                  </TableCell>
                  <TableCell className="pr-5 py-4 text-muted-foreground tabular-nums">
                    {p.phone ?? <span className="text-border">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
