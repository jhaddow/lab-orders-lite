import Link from "next/link";

export default function OrderNotFound() {
  return (
    <div className="rounded-md border bg-white p-8 text-center space-y-3">
      <h1 className="text-xl font-semibold">Order not found</h1>
      <p className="text-sm text-zinc-600">
        We couldn&apos;t find an order with that ID. It may have been deleted, or the link is wrong.
      </p>
      <Link href="/orders" className="text-sm underline">
        ← Back to orders
      </Link>
    </div>
  );
}
