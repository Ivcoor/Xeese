"use client";

import { useActionState } from "react";
import { signUpAction } from "../actions";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation";

export function SignUpForm() {
  const [state, action] = useActionState(signUpAction, undefined);
  if (state?.success) return <FormMessage state={state} />;
  return (
    <form action={action} className="space-y-4">
      <Field label="Nombre" name="name" autoComplete="name" />
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field
        label={`Contraseña (mínimo ${MIN_PASSWORD_LENGTH} caracteres)`}
        name="password"
        type="password"
        autoComplete="new-password"
      />
      <Field
        label="Repite la contraseña"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
      />
      <FormMessage state={state} />
      <SubmitButton>Crear cuenta</SubmitButton>
    </form>
  );
}
