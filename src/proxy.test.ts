import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

describe("proxy", () => {
  it("redirige a /login si no hay cookie de sesión y recuerda la ruta", () => {
    const res = proxy(new NextRequest("http://localhost:3000/admin"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fadmin");
  });

  it("deja pasar si hay cookie de sesión", () => {
    const req = new NextRequest("http://localhost:3000/cuenta", {
      headers: { cookie: "better-auth.session_token=abc" },
    });
    expect(proxy(req).headers.get("location")).toBeNull();
  });
});
