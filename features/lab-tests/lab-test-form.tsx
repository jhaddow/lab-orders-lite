"use client";

import { useActionState } from "react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createLabTestAction } from "./actions";
import type { createLabTestSchema } from "./schema";
import { idleState, type FormState } from "@/lib/form-state";

type CreateFields = keyof z.infer<typeof createLabTestSchema>;

const inputCls = "h-10 px-3 text-[15px] bg-card";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-destructive">{messages[0]}</p>;
}

export function LabTestForm() {
  const [state, formAction, pending] = useActionState<
    FormState<CreateFields>,
    FormData
  >(createLabTestAction, idleState);
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form
      action={formAction}
      className="rounded-xl border border-border bg-card p-6 sm:p-8 max-w-xl space-y-7"
    >
      <div className="grid sm:grid-cols-[10rem_1fr] gap-5">
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input
            id="code"
            name="code"
            required
            autoComplete="off"
            placeholder="CBC"
            className={`${inputCls} font-mono uppercase`}
          />
          <FieldError messages={fieldErrors?.code} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            required
            autoComplete="off"
            placeholder="Complete Blood Count"
            className={inputCls}
          />
          <FieldError messages={fieldErrors?.name} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="turnaroundDays">Turnaround (days)</Label>
          <Input
            id="turnaroundDays"
            name="turnaroundDays"
            type="number"
            min={1}
            max={365}
            step={1}
            required
            className={`${inputCls} tabular-nums`}
            placeholder="1"
          />
          <FieldError messages={fieldErrors?.turnaroundDays} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="initialPriceCents">Initial price (USD)</Label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="initialPriceCents"
              name="initialPriceCents"
              inputMode="decimal"
              required
              placeholder="0.00"
              className={`${inputCls} pl-7 tabular-nums`}
            />
          </div>
          <FieldError messages={fieldErrors?.initialPriceCents} />
        </div>
      </div>

      {state.status === "error" && !fieldErrors && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/70">
        <Button type="submit" disabled={pending} className="h-10 px-5">
          {pending ? "Saving…" : "Create lab test"}
        </Button>
      </div>
    </form>
  );
}
