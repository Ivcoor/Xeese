"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth";
import {
  firstError,
  requestResetSchema,
  resetPasswordSchema,
  safeRedirectPath,
  signInSchema,
  signUpSchema,
} from "@/lib/validation";

export type FormState = { error?: string; success?: string } | undefined;

const AUTH_ERRORS: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email o contraseña incorrectos.",
  EMAIL_NOT_VERIFIED: "Confirma tu email antes de entrar. Te hemos enviado un nuevo enlace.",
  USER_ALREADY_EXISTS: "Ya existe una cuenta con ese email.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Ya existe una cuenta con ese email.",
  INVALID_TOKEN: "El enlace no es válido o ha caducado. Pide uno nuevo.",
  PASSWORD_TOO_SHORT: "La contraseña es demasiado corta.",
};

function authErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    const code = (error.body as { code?: string } | undefined)?.code;
    if (code && AUTH_ERRORS[code]) return AUTH_ERRORS[code];
    if (error.status === "TOO_MANY_REQUESTS") return "Demasiados intentos. Espera un momento.";
  }
  console.error("[auth] error inesperado", error);
  return "Ha ocurrido un error. Inténtalo de nuevo.";
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { name, email, password } = parsed.data;
  try {
    await auth.api.signUpEmail({
      body: { name, email, password, callbackURL: "/cuenta" },
      headers: await headers(),
    });
  } catch (error) {
    return { error: authErrorMessage(error) };
  }
  return { success: "Cuenta creada. Te hemos enviado un email para confirmar tu dirección." };
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  try {
    await auth.api.signInEmail({ body: parsed.data, headers: await headers() });
  } catch (error) {
    return { error: authErrorMessage(error) };
  }
  // redirect() lanza una excepción interna, así que va fuera del try.
  redirect(safeRedirectPath(formData.get("next")));
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}

export async function requestResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = requestResetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  try {
    await auth.api.requestPasswordReset({
      body: { email: parsed.data.email, redirectTo: "/restablecer" },
      headers: await headers(),
    });
  } catch (error) {
    return { error: authErrorMessage(error) };
  }
  // Mismo mensaje exista o no la cuenta, para no revelar qué emails están registrados.
  return {
    success: "Si hay una cuenta con ese email, te hemos enviado un enlace para restablecer la contraseña.",
  };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstError(parsed.error) };

  try {
    await auth.api.resetPassword({
      body: { token: parsed.data.token, newPassword: parsed.data.password },
      headers: await headers(),
    });
  } catch (error) {
    return { error: authErrorMessage(error) };
  }
  redirect("/login?reset=ok");
}
