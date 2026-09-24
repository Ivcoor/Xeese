import Link from "next/link";
import { Suspense } from "react";
import { signOutAction } from "@/app/(auth)/actions";
import { getSession } from "@/server/session";

export function SiteHeader() {
  return (
    <header className="border-border border-b">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          XeeseArchieve
        </Link>
        {/* La sesión se lee aparte para no retrasar el resto de la página. */}
        <Suspense fallback={null}>
          <UserMenu />
        </Suspense>
      </nav>
    </header>
  );
}

async function UserMenu() {
  const session = await getSession();

  if (!session) {
    return (
      <div className="flex gap-4 text-sm">
        <Link href="/login">Entrar</Link>
        <Link href="/registro">Crear cuenta</Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      {session.user.role === "ADMIN" && <Link href="/admin">Panel</Link>}
      <Link href="/cuenta">Mi cuenta</Link>
      <form action={signOutAction}>
        <button type="submit" className="text-muted hover:text-foreground cursor-pointer">
          Salir
        </button>
      </form>
    </div>
  );
}
