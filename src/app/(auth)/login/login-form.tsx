"use client";

import { useActionState } from "react";
import { signInAction } from "../actions";
import { Field, FormMessage, SubmitButton } from "@/components/form";

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signInAction, undefined);
  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Contraseña" name="password" type="password" autoComplete="current-password" />
      <FormMessage state={state} />
      <SubmitButton>Entrar</SubmitButton>
    </form>
  );
}
