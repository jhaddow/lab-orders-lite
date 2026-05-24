import Link from "next/link";
import { OrderForm } from "@/components/order-form";
import { getPatients } from "@/lib/db/patients";
import { getLabTests } from "@/lib/db/lab-tests";

export default async function NewOrderPage() {
  const [patients, labTests] = await Promise.all([getPatients(), getLabTests()]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/orders" className="text-sm text-zinc-600 hover:underline">
          ← Back to orders
        </Link>
        <h1 className="text-2xl font-semibold mt-2">New order</h1>
      </div>

      {patients.length === 0 ? (
        <div className="rounded-md border bg-white p-6 text-sm text-zinc-700">
          You need at least one patient before creating an order.{" "}
          <Link href="/patients/new" className="underline">
            Add a patient
          </Link>
          .
        </div>
      ) : (
        <OrderForm
          patients={patients.map((p) => ({
            id: p.id,
            firstName: p.firstName,
            lastName: p.lastName,
          }))}
          labTests={labTests.map((t) => ({
            id: t.id,
            code: t.code,
            name: t.name,
            priceCents: t.priceCents,
            currency: t.currency,
            turnaroundDays: t.turnaroundDays,
          }))}
        />
      )}
    </div>
  );
}
