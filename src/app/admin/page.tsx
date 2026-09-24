import type { Metadata } from "next";
import { requireAdmin } from "@/server/session";

export const metadata: Metadata = { title: "Panel" };

export default async function AdminPage() {
  // Se comprueba también aquí: el layout no se vuelve a ejecutar en cada navegación.
  const { user } = await requireAdmin();
  return (
    <section className="space-y-2">
      <h1 className="text-2xl font-semibold">Panel de administración</h1>
      <p className="text-muted text-sm">
        Hola, {user.name}. Las secciones del panel llegarán en las próximas fases.
      </p>
    </section>
  );
}
