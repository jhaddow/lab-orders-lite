import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLabTest } from "@/features/lab-tests/repo";
import { PriceForm } from "@/features/lab-tests/price-form";
import { asCurrency, formatMoney } from "@/lib/money";

function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default async function LabTestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const labTest = await getLabTest(id);
  if (!labTest) notFound();
  const current = labTest.prices[0];

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <Link
          href="/lab-tests"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span aria-hidden className="mr-1.5">←</span> Back to lab tests
        </Link>
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Lab test
          </p>
          <h1 className="font-display text-4xl tracking-tight">{labTest.name}</h1>
          <p className="text-xs text-muted-foreground font-mono tabular-nums pt-1">
            {labTest.code} · {labTest.turnaroundDays}d turnaround
          </p>
        </div>
      </header>

      <section
        aria-label="Test summary"
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <div className="px-5 py-5 bg-accent/30">
            <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Current price
            </div>
            <div className="mt-1.5 font-display text-3xl tabular-nums text-foreground">
              {current ? (
                formatMoney(current.priceCents, asCurrency(current.currency))
              ) : (
                <span className="text-border">—</span>
              )}
            </div>
            <div className="mt-1 text-xs text-muted-foreground tabular-nums">
              {current
                ? `Set ${formatDateTime(current.createdAt)}`
                : "No price set"}
            </div>
          </div>
          <div className="px-5 py-5">
            <PriceForm labTestId={labTest.id} />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg tracking-tight">Price history</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {labTest.prices.length}{" "}
            {labTest.prices.length === 1 ? "record" : "records"}
          </span>
        </div>
        {labTest.prices.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">
            No price records yet.
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Set
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="pr-5 text-right text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                    Price
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labTest.prices.map((p, idx) => (
                  <TableRow key={p.id} className="hover:bg-muted/30">
                    <TableCell className="pl-5 py-4 text-muted-foreground tabular-nums">
                      {formatDateTime(p.createdAt)}
                    </TableCell>
                    <TableCell className="py-4">
                      {idx === 0 ? (
                        <span className="inline-flex items-center text-[10px] tracking-[0.12em] uppercase font-medium text-primary">
                          <span className="size-1 rounded-full bg-primary mr-1.5" />
                          Current
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Superseded
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="pr-5 py-4 text-right font-medium tabular-nums text-foreground">
                      {formatMoney(p.priceCents, asCurrency(p.currency))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
