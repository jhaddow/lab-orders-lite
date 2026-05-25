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
import { calculateEstimatedReadyDate, calculateOrderTotalCents } from "./domain";
import { formatMoney } from "@/lib/money";
import { createOrderAction } from "./actions";
import { idleState } from "@/lib/form-state";

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
  return <p className="text-xs text-destructive">{messages[0]}</p>;
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
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
      count: selectedTests.length,
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
    <form action={formAction} className="space-y-8 max-w-3xl">
      <section className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="patientId">Patient</Label>
          <Select
            name="patientId"
            value={patientId}
            onValueChange={(v) => setPatientId(v ?? "")}
          >
            <SelectTrigger
              id="patientId"
              className="h-10 w-full sm:max-w-sm px-3 text-[15px] bg-card"
            >
              <SelectValue placeholder="Select a patient" />
            </SelectTrigger>
            <SelectContent>
              {patients.length === 0 ? (
                <div className="p-3 text-sm text-muted-foreground">
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
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <Label>Lab tests</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {selectedTestIds.size} selected
          </span>
        </div>
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {labTests.map((t) => {
            const checked = selectedTestIds.has(t.id);
            return (
              <label
                key={t.id}
                htmlFor={`test-${t.id}`}
                className={`flex items-center gap-4 px-4 py-3.5 cursor-pointer transition-colors ${
                  checked ? "bg-accent/40" : "hover:bg-muted/60"
                }`}
              >
                <Checkbox
                  id={`test-${t.id}`}
                  name="labTestIds"
                  value={t.id}
                  checked={checked}
                  onCheckedChange={(c) => toggleTest(t.id, c === true)}
                />
                <div className="flex-1 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium text-[15px] text-foreground truncate">
                      {t.name}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                      <span className="font-mono text-foreground/70">{t.code}</span>
                      <span className="mx-1.5 text-border">·</span>
                      {t.turnaroundDays}d turnaround
                    </div>
                  </div>
                  <div className="text-[15px] font-medium tabular-nums text-foreground">
                    {formatMoney(t.priceCents, t.currency)}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
        <FieldError messages={fieldErrors.labTestIds} />
      </section>

      {preview && (
        <section
          aria-label="Order summary"
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Total cost
              </div>
              <div className="mt-1 font-display text-3xl tabular-nums text-foreground">
                {formatMoney(preview.total, preview.currency)}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Across {preview.count} {preview.count === 1 ? "test" : "tests"}
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                Estimated ready
              </div>
              <div className="mt-1 font-display text-3xl tabular-nums text-foreground">
                {formatDate(preview.readyDate)}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Based on the slowest selected test
              </div>
            </div>
          </div>
        </section>
      )}

      {state.status === "error" && !Object.keys(fieldErrors).length && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/70">
        <Button
          type="submit"
          disabled={pending || !patientId || selectedTestIds.size === 0}
          className="h-10 px-5"
        >
          {pending ? "Creating…" : "Create order"}
        </Button>
      </div>
    </form>
  );
}
