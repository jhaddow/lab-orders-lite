import Link from "next/link";

export default function OrderNotFound() {
  return (
    <div className="rounded-xl border border-border bg-card p-10 text-center space-y-3 max-w-lg mx-auto">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Not found</p>
      <h1 className="font-display text-2xl tracking-tight">Order not found</h1>
      <p className="text-sm text-muted-foreground">
        We couldn&apos;t find an order with that ID. It may have been deleted, or the link is wrong.
      </p>
      <div className="pt-2">
        <Link
          href="/orders"
          className="inline-flex items-center text-sm text-foreground/80 hover:text-primary transition-colors"
        >
          <span aria-hidden className="mr-1.5">
            ←
          </span>{" "}
          Back to orders
        </Link>
      </div>
    </div>
  );
}
