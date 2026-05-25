import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { statusBadgeClass, statusLabel } from "./status-style";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrders } from "@/features/orders/repo";
import { asCurrency, formatMoney } from "@/lib/money";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
}

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Activity</p>
          <h1 className="font-display text-4xl tracking-tight">Orders</h1>
        </div>
        <Link href="/orders/new" className={`${buttonVariants()} h-10 px-4`}>
          New order
        </Link>
      </header>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3">
          <p className="font-display text-xl text-foreground">No orders yet</p>
          <p className="text-sm text-muted-foreground">
            Create your first lab order for a patient.
          </p>
          <div className="pt-1">
            <Link
              href="/orders/new"
              className={`${buttonVariants({ variant: "outline" })} h-9 px-4`}
            >
              Create order
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-5 text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Patient
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Tests
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Total
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Ordered
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
                  Est. ready
                </TableHead>
                <TableHead className="pr-5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} className="hover:bg-muted/30 group">
                  <TableCell className="pl-5 py-4 font-medium text-foreground">
                    {o.patient.lastName}, {o.patient.firstName}
                  </TableCell>
                  <TableCell className="py-4 tabular-nums text-muted-foreground">
                    {o.items.length}
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge
                      variant="outline"
                      className={`rounded-full text-[10px] tracking-[0.12em] uppercase font-medium ${statusBadgeClass(o.status)}`}
                    >
                      <span className="size-1 rounded-full bg-current mr-1.5" />
                      {statusLabel(o.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-right font-medium tabular-nums text-foreground">
                    {formatMoney(o.totalCents, asCurrency(o.currency))}
                  </TableCell>
                  <TableCell className="py-4 text-muted-foreground tabular-nums">
                    {formatDate(o.createdAt)}
                  </TableCell>
                  <TableCell className="py-4 text-muted-foreground tabular-nums">
                    {formatDate(o.estimatedReadyDate)}
                  </TableCell>
                  <TableCell className="pr-5 py-4">
                    <Link
                      href={`/orders/${o.id}`}
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
