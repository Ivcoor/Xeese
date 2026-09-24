import type { Metadata } from "next";
import { RequestResetForm } from "./request-reset-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RequestResetPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Recuperar contraseña</h1>
      <p className="text-muted text-sm">Te enviaremos un enlace para elegir una contraseña nueva.</p>
      <RequestResetForm />
    </>
  );
}
