import type { Metadata } from "next";
import Link from "next/link";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default async function ResetPasswordPage({ searchParams }: PageProps<"/restablecer">) {
  const { token, error } = await searchParams;

  if (error || typeof token !== "string") {
    return (
      <>
        <h1 className="text-2xl font-semibold">Enlace no válido</h1>
        <p className="text-muted text-sm">El enlace ha caducado o ya se ha usado.</p>
        <Link href="/recuperar" className="text-sm underline">
          Pedir un enlace nuevo
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-semibold">Nueva contraseña</h1>
      <ResetPasswordForm token={token} />
    </>
  );
}
