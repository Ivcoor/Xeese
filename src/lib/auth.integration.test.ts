import { afterAll, describe, expect, it, vi } from "vitest";
import { APIError } from "better-auth/api";
import { auth } from "./auth";
import { db } from "./db";

// Los emails de verificación se envían a la consola; se silencian en los tests.
vi.spyOn(console, "info").mockImplementation(() => {});

const email = `test-${Date.now()}@xeese.test`;
const password = "contraseña-de-prueba-123";

afterAll(async () => {
  await db.user.deleteMany({ where: { email } });
  await db.$disconnect();
});

describe("registro e inicio de sesión", () => {
  it("crea la cuenta como CLIENTE pendiente de verificación aunque intente fijar su rol", async () => {
    // role y accountStatus tienen input: false. Better Auth puede rechazar la petición o
    // ignorar esos campos; ambas respuestas son válidas mientras no se guarden.
    const attempt = await auth.api
      .signUpEmail({
        body: { name: "Test", email, password, role: "ADMIN", accountStatus: "APROBADA" } as never,
      })
      .catch((e: unknown) => e);
    if (attempt instanceof APIError) {
      await auth.api.signUpEmail({ body: { name: "Test", email, password } });
    }

    const user = await db.user.findUniqueOrThrow({ where: { email } });
    expect(user.role).toBe("CLIENTE");
    expect(user.accountStatus).toBe("PENDIENTE_VERIFICACION");
    expect(user.emailVerified).toBe(false);

    const audit = await db.auditLog.findFirst({ where: { entityId: user.id, action: "USER_REGISTERED" } });
    expect(audit).not.toBeNull();
  });

  it("no deja entrar sin confirmar el email", async () => {
    const err = await auth.api.signInEmail({ body: { email, password } }).catch((e) => e);
    expect(err).toBeInstanceOf(APIError);
    expect(err.body?.code).toBe("EMAIL_NOT_VERIFIED");
  });

  it("deja entrar tras confirmar el email y rechaza una contraseña incorrecta", async () => {
    await db.user.update({ where: { email }, data: { emailVerified: true } });

    const ok = await auth.api.signInEmail({ body: { email, password } });
    expect(ok.user.email).toBe(email);
    expect(ok.token).toBeTruthy();

    const bad = await auth.api
      .signInEmail({ body: { email, password: "incorrecta-123456" } })
      .catch((e) => e);
    expect(bad.body?.code).toBe("INVALID_EMAIL_OR_PASSWORD");
  });
});
