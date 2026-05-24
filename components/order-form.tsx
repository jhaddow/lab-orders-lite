"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculateEstimatedReadyDate,
  calculateOrderTotalCents,
} from "@/lib/domain/orders";
import { formatMoney } from "@/lib/money";
import { createOrderAction } from "@/lib/actions/orders";
import { idleState } from "@/lib/actions/types";

export type PatientOption = { id: string; firstName: string; lastName: string };
export type LabTestOption = {
  id: string;
  code: string;
  name: string;
  priceCents: number;
  currency: string;
  turnaroundDays: number;
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-sm text-red-600 mt-1">{messages[0]}</p>;
}

export function OrderForm({
  patients,
  labTests,
}: {
  patients: PatientOption[];
  labTests: LabTestOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createOrderAction,
    idleState,
  );
  const [patientId, setPatientId] = useState<string>("");
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const fieldErrors =
    state.status === "error" ? state.fieldErrors ?? {} : {};

  const selectedTests = useMemo(
    () => labTests.filter((t) => selectedTestIds.has(t.id)),
    [labTests, selectedTestIds],
  );

  const preview = useMemo(() => {
    if (selectedTests.length === 0) return null;
    const items = selectedTests.map((t) => ({
      priceCentsAtOrder: t.priceCents,
      turnaroundDaysAtOrder: t.turnaroundDays,
    }));
    const total = calculateOrderTotalCents(items);
    const ready = calculateEstimatedReadyDate(new Date(), items);
    return {
      total,
      currency: selectedTests[0].currency,
      readyDate: ready,
    };
  }, [selectedTests]);

  function toggleTest(id: string, checked: boolean) {
    setSelectedTestIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      <div>
        <Label htmlFor="patientId">Patient</Label>
        <Select
          name="patientId"
          value={patientId}
          onValueChange={(v) => setPatientId(v ?? "")}
        >
          <SelectTrigger id="patientId">
            <SelectValue placeholder="Select a patient" />
          </SelectTrigger>
          <SelectContent>
            {patients.length === 0 ? (
              <div className="p-2 text-sm text-zinc-600">
                No patients yet — create one first.
              </div>
            ) : (
              patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.lastName}, {p.firstName}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <FieldError messages={fieldErrors.patientId} />
      </div>

      <div>
        <Label>Lab tests</Label>
        <div className="mt-2 rounded-md border bg-white divide-y">
          {labTests.map((t) => {
            const checked = selectedTestIds.has(t.id);
            return (
              <label
                key={t.id}
                htmlFor={`test-${t.id}`}
                className="flex items-center gap-3 p-3 cursor-pointer hover:bg-zinc-50"
              >
                <Checkbox
                  id={`test-${t.id}`}
                  name="labTestIds"
                  value={t.id}
                  checked={checked}
                  onCheckedChange={(c) => toggleTest(t.id, c === true)}
                />
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{t.name}</div>
                    <div className="text-xs text-zinc-600">
                      {t.code} · {t.turnaroundDays}d turnaround
                    </div>
                  </div>
                  <div className="text-sm font-medium">
                    {formatMoney(t.priceCents, t.currency)}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        <FieldError messages={fieldErrors.labTestIds} />
      </div>

      {preview && (
        <div className="rounded-md border bg-white p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600">Total cost</span>
            <span className="font-medium">
              {formatMoney(preview.total, preview.currency)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-zinc-600">Estimated ready</span>
            <span className="font-medium">
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
              }).format(preview.readyDate)}
            </span>
          </div>
        </div>
      )}

      {state.status === "error" && !Object.keys(fieldErrors).length && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <Button
        type="submit"
        disabled={pending || !patientId || selectedTestIds.size === 0}
      >
        {pending ? "Creating…" : "Create order"}
      </Button>
    </form>
  );
}
