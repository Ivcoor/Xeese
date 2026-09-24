// Datos de prueba para desarrollo: un administrador y un cliente aprobado.
// Se crean con la API de Better Auth para que la contraseña se guarde con su hash.
// Uso: SEED_PASSWORD="..." npm run db:seed
import "dotenv/config";
import { auth } from "../src/lib/auth";
import { db } from "../src/lib/db";

const password = process.env.SEED_PASSWORD;
if (!password || password.length < 10) {
  throw new Error("Define SEED_PASSWORD (mínimo 10 caracteres) para crear los usuarios de prueba.");
}

const users = [
  { name: "Admin Pruebas", email: "admin@xeese.test", role: "ADMIN", accountStatus: "APROBADA" },
  { name: "Cliente Pruebas", email: "cliente@xeese.test", role: "CLIENTE", accountStatus: "APROBADA" },
] as const;

async function main() {
  for (const u of users) {
    const existing = await db.user.findUnique({ where: { email: u.email } });
    if (!existing) {
      await auth.api.signUpEmail({ body: { name: u.name, email: u.email, password: password! } });
    }
    await db.user.update({
      where: { email: u.email },
      data: { role: u.role, accountStatus: u.accountStatus, emailVerified: true },
    });
    console.info(`✔ ${u.email} (${u.role})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
