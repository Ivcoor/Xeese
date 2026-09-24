import { describe, expect, it } from "vitest";
import { safeRedirectPath, signUpSchema } from "./validation";

describe("safeRedirectPath", () => {
  it("acepta rutas internas", () => {
    expect(safeRedirectPath("/admin")).toBe("/admin");
    expect(safeRedirectPath("/cuenta?tab=1")).toBe("/cuenta?tab=1");
  });

  it("rechaza destinos externos o raros y usa el valor por defecto", () => {
    for (const bad of [
      "https://evil.com",
      "//evil.com",
      String.raw`/\evil.com`,
      "evil",
      "",
      null,
      undefined,
      42,
    ]) {
      expect(safeRedirectPath(bad)).toBe("/cuenta");
    }
  });
});

describe("signUpSchema", () => {
  const valid = {
    name: "Ana",
    email: "  Ana@Example.COM ",
    password: "contraseña-larga",
    confirmPassword: "contraseña-larga",
  };

  it("normaliza el email", () => {
    expect(signUpSchema.parse(valid).email).toBe("ana@example.com");
  });

  it("exige contraseñas iguales", () => {
    const r = signUpSchema.safeParse({ ...valid, confirmPassword: "otra-distinta" });
    expect(r.success).toBe(false);
  });

  it("exige una longitud mínima de contraseña", () => {
    const r = signUpSchema.safeParse({ ...valid, password: "corta", confirmPassword: "corta" });
    expect(r.success).toBe(false);
  });
});
