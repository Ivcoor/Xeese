"use client";

import { useActionState } from "react";
import { requestResetAction } from "../actions";
import { Field, FormMessage, SubmitButton } from "@/components/form";

export function RequestResetForm() {
  const [state, action] = useActionState(requestResetAction, undefined);
  if (state?.success) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <FormMessage state={state} />
      <SubmitButton>Enviar enlace</SubmitButton>
    </form>
  );
}
