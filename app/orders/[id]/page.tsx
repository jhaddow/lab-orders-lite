import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="text-sm text-zinc-600 hover:underline">
          ← Back to orders
        </Link>
        <div className="mt-2 flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Order</h1>
          <Badge variant="secondary">{order.status}</Badge>
        </div>
        <p className="text-xs text-zinc-500 mt-1 font-mono">{order.id}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Patient</CardDescription>
            <CardTitle className="text-lg">
              {order.patient.lastName}, {order.patient.firstName}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600">
            DOB {formatDate(order.patient.dateOfBirth)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total cost</CardDescription>
            <CardTitle className="text-lg">
              {formatMoney(order.totalCents, order.currency)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600">
            Ordered {formatDate(order.createdAt)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Estimated ready</CardDescription>
            <CardTitle className="text-lg">
              {formatDate(order.estimatedReadyDate)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-zinc-600">
            Based on the slowest test
          </CardContent>
        </Card>
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Test</TableHead>
              <TableHead>Turnaround</TableHead>
              <TableHead className="text-right">Price (at order)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-mono text-xs">
                  {item.labTest.code}
                </TableCell>
                <TableCell className="font-medium">{item.labTest.name}</TableCell>
                <TableCell>{item.turnaroundDaysAtOrder}d</TableCell>
                <TableCell className="text-right">
                  {formatMoney(item.priceCentsAtOrder, order.currency)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
