import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrders } from "@/lib/db/orders";
import { formatMoney } from "@/lib/money";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
}

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <Link href="/orders/new" className={buttonVariants()}>
          New order
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-md border bg-white p-8 text-center text-sm text-zinc-600">
          No orders yet.{" "}
          <Link href="/orders/new" className="underline">
            Create your first order
          </Link>
          .
        </div>
      ) : (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Ordered</TableHead>
                <TableHead>Estimated ready</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="font-medium">
                    {o.patient.lastName}, {o.patient.firstName}
                  </TableCell>
                  <TableCell>{o.items.length}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{o.status}</Badge>
                  </TableCell>
                  <TableCell>{formatMoney(o.totalCents, o.currency)}</TableCell>
                  <TableCell className="text-zinc-600">
                    {formatDate(o.createdAt)}
                  </TableCell>
                  <TableCell className="text-zinc-600">
                    {formatDate(o.estimatedReadyDate)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/orders/${o.id}`} className="text-sm underline">
                      View
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
