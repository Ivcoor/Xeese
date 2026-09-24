import { z } from "zod";

// Variables de entorno del servidor, validadas al arrancar para fallar pronto
// si falta alguna en lugar de descubrirlo en mitad de una petición.
const schema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  EMAIL_FROM: z.string().default("XeeseArchieve <no-reply@localhost>"),
});

export const env = schema.parse(process.env);
