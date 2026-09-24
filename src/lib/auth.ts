import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { email } from "@/lib/email";
import { env } from "@/lib/env";

export const ROLES = ["CLIENTE", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ACCOUNT_STATUSES = [
  "PENDIENTE_VERIFICACION",
  "PENDIENTE_APROBACION",
  "APROBADA",
  "RECHAZADA",
  "BLOQUEADA",
] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    requireEmailVerification: true,
    revokeSessionsOnPasswordReset: true,
    async sendResetPassword({ user, url }) {
      await email.send({
        to: user.email,
        subject: "Restablece tu contraseña",
        text: `Hola ${user.name}:\n\nPara elegir una contraseña nueva abre este enlace (caduca en 1 hora):\n${url}\n\nSi no lo has pedido tú, ignora este mensaje.`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    async sendVerificationEmail({ user, url }) {
      await email.send({
        to: user.email,
        subject: "Confirma tu email",
        text: `Hola ${user.name}:\n\nConfirma tu dirección de email abriendo este enlace:\n${url}`,
      });
    },
  },
  user: {
    additionalFields: {
      // input: false impide que el cliente los fije al registrarse.
      role: { type: [...ROLES], required: true, defaultValue: "CLIENTE", input: false },
      accountStatus: {
        type: [...ACCOUNT_STATUSES],
        required: true,
        defaultValue: "PENDIENTE_VERIFICACION",
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        async after(user) {
          await db.auditLog.create({
            data: { actorId: user.id, action: "USER_REGISTERED", entityType: "User", entityId: user.id },
          });
        },
      },
    },
  },
  // nextCookies debe ir el último para poder fijar cookies desde Server Actions.
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
