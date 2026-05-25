/**
 * Discriminated union shared by server actions backing useActionState forms.
 * Parametrize by the schema's field-name union so consumers get autocomplete
 * and typo-protection on `fieldErrors`.
 */
export type FormState<Fields extends string = string> =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<Fields, string[]>>;
    };

export const idleState = { status: "idle" } as const satisfies FormState;
