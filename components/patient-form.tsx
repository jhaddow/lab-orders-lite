"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPatientAction } from "@/lib/actions/patients";
import { idleState } from "@/lib/actions/types";

const inputCls =
  "h-10 px-3 text-[15px] bg-card";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-xs text-destructive">{messages[0]}</p>;
}

function Optional() {
  return (
    <span className="ml-1.5 text-xs font-normal text-muted-foreground/80">
      optional
    </span>
  );
}

export function PatientForm() {
  const [state, formAction, pending] = useActionState(
    createPatientAction,
    idleState,
  );
  const fieldErrors =
    state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form
      action={formAction}
      className="rounded-xl border border-border bg-card p-6 sm:p-8 max-w-xl space-y-7"
    >
      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
            required
            className={inputCls}
          />
          <FieldError messages={fieldErrors.firstName} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            name="lastName"
            autoComplete="family-name"
            required
            className={inputCls}
          />
          <FieldError messages={fieldErrors.lastName} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateOfBirth">Date of birth</Label>
        <Input
          id="dateOfBirth"
          name="dateOfBirth"
          type="date"
          required
          className={`${inputCls} sm:max-w-[14rem] tabular-nums`}
        />
        <FieldError messages={fieldErrors.dateOfBirth} />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label htmlFor="email">
            Email <Optional />
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            className={inputCls}
          />
          <FieldError messages={fieldErrors.email} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">
            Phone <Optional />
          </Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            placeholder="(555) 555-0123"
            className={inputCls}
          />
          <FieldError messages={fieldErrors.phone} />
        </div>
      </div>

      {state.status === "error" && !Object.keys(fieldErrors).length && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-border/70">
        <Button type="submit" disabled={pending} className="h-10 px-5">
          {pending ? "Saving…" : "Create patient"}
        </Button>
      </div>
    </form>
  );
}
