"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "../actions";
import { Field, FormMessage, SubmitButton } from "@/components/form";
import { MIN_PASSWORD_LENGTH } from "@/lib/validation";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <Field
        label={`Contraseña nueva (mínimo ${MIN_PASSWORD_LENGTH} caracteres)`}
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
      <SubmitButton>Guardar contraseña</SubmitButton>
    </form>
  );
}
