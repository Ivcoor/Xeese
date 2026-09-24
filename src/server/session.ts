import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

// Capa de acceso a la sesión. Es la comprobación real de permisos: proxy.ts
// solo hace una redirección optimista mirando si existe la cookie.

export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (session.user.role !== "ADMIN") redirect("/");
  return session;
}
