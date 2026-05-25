"use client";

import { useActionState, useState } from "react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cancelOrderAction,
  completeOrderAction,
  startOrderAction,
} from "@/features/orders/actions";
import type { cancelOrderSchema } from "@/features/orders/schema";
import { idleState, type FormState } from "@/lib/form-state";

type CancelFields = keyof z.infer<typeof cancelOrderSchema>;

type Props = {
  orderId: string;
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-destructive">{messages[0]}</p>;
}

export function OrderActions({ orderId, status }: Props) {
  const [showCancel, setShowCancel] = useState(false);
  const boundCancel = cancelOrderAction.bind(null, orderId);
  const [cancelState, cancelFormAction, cancelPending] = useActionState<
    FormState<CancelFields>,
    FormData
  >(boundCancel, idleState);
  const cancelErrors = cancelState.status === "error" ? cancelState.fieldErrors : undefined;

  if (status === "COMPLETED" || status === "CANCELLED") return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {status === "PENDING" && (
          <form action={startOrderAction.bind(null, orderId)}>
            <Button type="submit" className="h-9">
              Start
            </Button>
          </form>
        )}
        {status === "IN_PROGRESS" && (
          <form action={completeOrderAction.bind(null, orderId)}>
            <Button type="submit" className="h-9">
              Complete
            </Button>
          </form>
        )}
        {!showCancel && (
          <Button
            type="button"
            variant="outline"
            className="h-9"
            onClick={() => setShowCancel(true)}
          >
            Cancel order
          </Button>
        )}
      </div>

      {showCancel && (
        <form action={cancelFormAction} className="space-y-3 border-t border-border pt-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation reason</Label>
            <Input
              id="reason"
              name="reason"
              required
              placeholder="e.g. wrong patient, duplicate order"
              className="h-10 px-3 text-[15px]"
            />
            <FieldError messages={cancelErrors?.reason} />
          </div>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="destructive" disabled={cancelPending} className="h-9">
              {cancelPending ? "Cancelling…" : "Confirm cancellation"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9"
              onClick={() => setShowCancel(false)}
            >
              Back
            </Button>
          </div>
          {cancelState.status === "error" && !cancelErrors && (
            <p className="text-sm text-destructive">{cancelState.message}</p>
          )}
        </form>
      )}
    </div>
  );
}
