import type { Metadata } from "next";
import Link from "next/link";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>
      <p className="text-muted text-sm">Todas las cuentas se revisan antes de poder alquilar.</p>
      <SignUpForm />
      <p className="text-muted text-sm">
        ¿Ya tienes cuenta? <Link href="/login">Entrar</Link>
      </p>
    </>
  );
}
