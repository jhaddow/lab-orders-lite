"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPatientAction } from "@/lib/actions/patients";
import { idleState } from "@/lib/actions/types";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-sm text-red-600 mt-1">{messages[0]}</p>;
}

export function PatientForm() {
  const [state, formAction, pending] = useActionState(
    createPatientAction,
    idleState,
  );
  const fieldErrors =
    state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      <div>
        <Label htmlFor="firstName">First name</Label>
        <Input id="firstName" name="firstName" required />
        <FieldError messages={fieldErrors.firstName} />
      </div>
      <div>
        <Label htmlFor="lastName">Last name</Label>
        <Input id="lastName" name="lastName" required />
        <FieldError messages={fieldErrors.lastName} />
      </div>
      <div>
        <Label htmlFor="dateOfBirth">Date of birth</Label>
        <Input id="dateOfBirth" name="dateOfBirth" type="date" required />
        <FieldError messages={fieldErrors.dateOfBirth} />
      </div>
      <div>
        <Label htmlFor="email">Email (optional)</Label>
        <Input id="email" name="email" type="email" />
        <FieldError messages={fieldErrors.email} />
      </div>
      <div>
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" name="phone" type="tel" />
        <FieldError messages={fieldErrors.phone} />
      </div>

      {state.status === "error" && !Object.keys(fieldErrors).length && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Create patient"}
      </Button>
    </form>
  );
}
