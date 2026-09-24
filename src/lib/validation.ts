import { z } from "zod";

export const MIN_PASSWORD_LENGTH = 10;

const emailField = z.string().trim().toLowerCase().email("Introduce un email válido.");
const passwordField = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`)
  .max(128, "La contraseña es demasiado larga.");

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Introduce tu nombre.").max(100),
    email: emailField,
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Introduce tu contraseña."),
});

export const requestResetSchema = z.object({ email: emailField });

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "El enlace no es válido."),
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Las contraseñas no coinciden.",
    path: ["confirmPassword"],
  });

// Solo se permite volver a rutas internas tras el login, para que un enlace
// como /login?next=https://sitio-malicioso.com no saque al usuario de la web.
export function safeRedirectPath(next: unknown, fallback = "/cuenta"): string {
  if (typeof next !== "string") return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Revisa los datos del formulario.";
}
