"use client";

import { useActionState } from "react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setLabTestPriceAction } from "./actions";
import type { setPriceSchema } from "./schema";
import { idleState, type FormState } from "@/lib/form-state";

type SetPriceFields = keyof z.infer<typeof setPriceSchema>;

const inputCls = "h-10 px-3 text-[15px] bg-card";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-destructive">{messages[0]}</p>;
}

export function PriceForm({ labTestId }: { labTestId: string }) {
  const boundAction = setLabTestPriceAction.bind(null, labTestId);
  const [state, formAction, pending] = useActionState<FormState<SetPriceFields>, FormData>(
    boundAction,
    idleState,
  );
  const fieldErrors = state.status === "error" ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-3">
      <Label htmlFor="priceCents" className="text-sm font-medium">
        Set new price (USD)
      </Label>
      <div className="flex items-start gap-3">
        <div className="flex-1 space-y-2">
          <div className="relative">
            <span className="absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
              $
            </span>
            <Input
              id="priceCents"
              name="priceCents"
              inputMode="decimal"
              required
              placeholder="0.00"
              className={`${inputCls} pl-7 tabular-nums`}
            />
          </div>
          <FieldError messages={fieldErrors?.priceCents} />
        </div>
        <Button type="submit" disabled={pending} className="h-10 px-5 shrink-0">
          {pending ? "Saving…" : "Update price"}
        </Button>
      </div>
      {state.status === "error" && !fieldErrors && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}
    </form>
  );
}
