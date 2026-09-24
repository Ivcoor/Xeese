import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, reset } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-semibold">Entrar</h1>
      {reset === "ok" && (
        <p role="status" className="text-sm text-green-800">
          Contraseña cambiada. Ya puedes entrar.
        </p>
      )}
      <LoginForm next={typeof next === "string" ? next : undefined} />
      <div className="text-muted flex justify-between text-sm">
        <Link href="/recuperar">¿Has olvidado la contraseña?</Link>
        <Link href="/registro">Crear cuenta</Link>
      </div>
    </>
  );
}
