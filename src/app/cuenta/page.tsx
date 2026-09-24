import type { Metadata } from "next";
import type { AccountStatus } from "@/lib/auth";
import { requireUser } from "@/server/session";

export const metadata: Metadata = { title: "Mi cuenta" };

const STATUS_TEXT: Record<AccountStatus, string> = {
  PENDIENTE_VERIFICACION: "Pendiente de verificar tu identidad.",
  PENDIENTE_APROBACION: "Estamos revisando tu cuenta.",
  APROBADA: "Cuenta aprobada. Ya puedes alquilar.",
  RECHAZADA: "Tu solicitud no ha sido aprobada.",
  BLOQUEADA: "Tu cuenta está bloqueada. Contacta con nosotros.",
};

export default async function AccountPage() {
  const { user } = await requireUser();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Mi cuenta</h1>
      <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-sm">
        <dt className="text-muted">Nombre</dt>
        <dd>{user.name}</dd>
        <dt className="text-muted">Email</dt>
        <dd>{user.email}</dd>
        <dt className="text-muted">Estado</dt>
        <dd>{STATUS_TEXT[user.accountStatus as AccountStatus]}</dd>
      </dl>
    </section>
  );
}
