import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { OrderForm, type LabTestOption } from "@/features/orders/order-form";
import { getPatients } from "@/features/patients/repo";
import { getLabTests } from "@/features/lab-tests/repo";
import { getCurrentUser } from "@/lib/auth";

export default async function NewOrderPage() {
  await getCurrentUser();
  const [patients, labTests] = await Promise.all([getPatients(), getLabTests()]);

  // Skip any lab test that doesn't yet have a price (invariant violation
  // — shouldn't happen given the seed, but defends the form against bad data).
  const labTestOptions: LabTestOption[] = labTests.flatMap((t) => {
    const latest = t.prices[0];
    if (!latest) return [];
    return [
      {
        id: t.id,
        code: t.code,
        name: t.name,
        turnaroundDays: t.turnaroundDays,
        priceCents: latest.priceCents,
        currency: latest.currency,
      },
    ];
  });

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <Link
          href="/orders"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <span aria-hidden className="mr-1.5">
            ←
          </span>{" "}
          Back to orders
        </Link>
        <div className="space-y-1.5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">New order</p>
          <h1 className="font-display text-4xl tracking-tight">Create an order</h1>
        </div>
      </header>

      {patients.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center space-y-3 max-w-xl">
          <p className="font-display text-xl text-foreground">No patients on file</p>
          <p className="text-sm text-muted-foreground">
            You need at least one patient before creating an order.
          </p>
          <div className="pt-1">
            <Link
              href="/patients/new"
              className={`${buttonVariants({ variant: "outline" })} h-9 px-4`}
            >
              Add a patient
            </Link>
          </div>
        </div>
      ) : (
        <OrderForm
          patients={patients.map((p) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
          }))}
          labTests={labTestOptions}
        />
      )}
    </div>
  );
}
