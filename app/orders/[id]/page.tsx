import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrder } from "@/lib/db/orders";
import { formatMoney } from "@/lib/money";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="space-y-10">
      <header className="space-y-4">
        <Link
          href="/orders"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span aria-hidden className="mr-1.5">←</span> Back to orders
        </Link>
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Order detail
            </p>
            <h1 className="font-display text-4xl tracking-tight">
              {order.patient.lastName},{" "}
              <span className="text-foreground/80">{order.patient.firstName}</span>
            </h1>
            <p className="text-xs text-muted-foreground font-mono tabular-nums pt-1">
              {order.id}
            </p>
          </div>
          <Badge
            variant="outline"
            className="rounded-full border-primary/30 bg-primary/8 text-[10px] tracking-[0.14em] uppercase font-medium text-primary"
          >
            <span className="size-1 rounded-full bg-primary mr-1.5" />
            {order.status}
          </Badge>
        </div>
      </header>

      <section
        aria-label="Order summary"
        className="rounded-xl border border-border bg-card overflow-hidden"
      >
        <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
          <Stat
            label="Patient"
            value={`${order.patient.lastName}, ${order.patient.firstName}`}
            note={`DOB ${formatDate(order.patient.dateOfBirth)}`}
          />
          <Stat
            label="Total cost"
            value={formatMoney(order.totalCents, order.currency)}
            note={`Ordered ${formatDate(order.createdAt)}`}
            highlight
          />
          <Stat
            label="Estimated ready"
            value={formatDate(order.estimatedReadyDate)}
            note="Based on the slowest test"
          />
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-lg tracking-tight">Tests</h2>
          <span className="text-xs text-muted-foreground tabular-nums">
            {order.items.length}{" "}
            {order.items.length === 1 ? "item" : "items"}
          </span>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Code
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Test
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Turnaround
                </TableHead>
                <TableHead className="pr-5 text-right text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Price (at order)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  <TableCell className="pl-5 py-4 font-mono text-xs text-foreground/70 tabular-nums">
                    {item.labTest.code}
                  </TableCell>
                  <TableCell className="py-4 font-medium text-foreground">
                    {item.labTest.name}
                  </TableCell>
                  <TableCell className="py-4 text-muted-foreground tabular-nums">
                    {item.turnaroundDaysAtOrder}d
                  </TableCell>
                  <TableCell className="pr-5 py-4 text-right font-medium tabular-nums text-foreground">
                    {formatMoney(item.priceCentsAtOrder, order.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <tfoot className="border-t border-border bg-muted/30">
              <tr>
                <td colSpan={3} className="pl-5 py-3.5 text-right text-xs uppercase tracking-[0.12em] text-muted-foreground">
                  Total
                </td>
                <td className="pr-5 py-3.5 text-right font-display text-lg tabular-nums text-foreground">
                  {formatMoney(order.totalCents, order.currency)}
                </td>
              </tr>
            </tfoot>
          </Table>
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  note,
  highlight = false,
}: {
  label: string;
  value: string;
  note: string;
  highlight?: boolean;
}) {
  return (
    <div className={`px-5 py-5 ${highlight ? "bg-accent/30" : ""}`}>
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-1.5 font-display text-2xl tracking-tight tabular-nums text-foreground">
        {value}
      </div>
      <div className="mt-1 text-xs text-muted-foreground tabular-nums">
        {note}
      </div>
    </div>
  );
}
