import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Comprobación optimista: sin cookie de sesión no tiene sentido cargar la página
// protegida. La validación real (sesión válida y rol) se hace en src/server/session.ts.
export function proxy(request: NextRequest) {
  if (!getSessionCookie(request)) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/cuenta/:path*", "/admin/:path*"],
};
