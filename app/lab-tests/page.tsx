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
import { getLabTests } from "@/features/lab-tests/repo";
import { asCurrency, formatMoney } from "@/lib/money";

export default async function LabTestsPage() {
  const labTests = await getLabTests();

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Catalog</p>
          <h1 className="font-display text-4xl tracking-tight">Lab tests</h1>
        </div>
        <Link href="/lab-tests/new" className={`${buttonVariants()} h-10 px-4`}>
          New lab test
        </Link>
      </header>

      {labTests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <p className="font-display text-xl text-foreground">No lab tests yet</p>
          <p className="text-sm text-muted-foreground">
            Add your first lab test to start taking orders.
          </p>
          <div className="pt-1">
            <Link
              href="/lab-tests/new"
              className={`${buttonVariants({ variant: "outline" })} h-9 px-4`}
            >
              Add lab test
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Code
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Turnaround
                </TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Current price
                </TableHead>
                <TableHead className="pr-5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {labTests.map((t) => {
                const latest = t.prices[0];
                return (
                  <TableRow key={t.id} className="hover:bg-muted/30 group">
                    <TableCell className="pl-5 py-4 font-mono text-xs text-foreground/70 tabular-nums">
                      {t.code}
                    </TableCell>
                    <TableCell className="py-4 font-medium text-foreground">{t.name}</TableCell>
                    <TableCell className="py-4 text-muted-foreground tabular-nums">
                      {t.turnaroundDays}d
                    </TableCell>
                    <TableCell className="py-4 text-right font-medium tabular-nums text-foreground">
                      {latest ? (
                        formatMoney(latest.priceCents, asCurrency(latest.currency))
                      ) : (
                        <span className="text-border">—</span>
                      )}
                    </TableCell>
                    <TableCell className="pr-5 py-4">
                      <Link
                        href={`/lab-tests/${t.id}`}
                        className="inline-flex items-center text-sm text-foreground/70 group-hover:text-primary transition-colors"
                      >
                        View
                        <span
                          aria-hidden
                          className="ml-1 transition-transform group-hover:translate-x-0.5"
                        >
                          →
                        </span>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
