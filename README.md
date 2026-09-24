# XeeseArchieve

Web de alquiler de prendas de lujo. Next.js 16 (App Router) + TypeScript, PostgreSQL con Prisma 7 y Better Auth.

El plan de desarrollo, las decisiones tomadas y las dudas abiertas están en [docs/plan.md](docs/plan.md).

## Puesta en marcha

Requisitos: Node 24 y PostgreSQL 17 (o posterior).

1. Crea una base de datos vacía llamada `xeesearchieve` en tu Postgres local.
2. Copia `.env.example` a `.env` y rellena `DATABASE_URL` y `BETTER_AUTH_SECRET`.
3. Instala dependencias, aplica las migraciones y crea los usuarios de prueba:

   ```bash
   npm install
   npm run db:migrate
   SEED_PASSWORD="una-contraseña-de-pruebas" npm run db:seed
   npm run dev
   ```

   En PowerShell, la línea del seed es: `$env:SEED_PASSWORD="una-contraseña-de-pruebas"; npm run db:seed`

   El seed crea `admin@xeese.test` (ADMIN) y `cliente@xeese.test` (CLIENTE aprobado) con la contraseña indicada.

En desarrollo los emails (confirmación y recuperación de contraseña) no se envían: se muestran en la consola de `npm run dev` con su enlace.

## Scripts

| Script                     | Qué hace                                        |
| -------------------------- | ----------------------------------------------- |
| `npm run dev`              | Servidor de desarrollo                          |
| `npm run lint`             | ESLint                                          |
| `npm run typecheck`        | Genera los tipos de rutas y ejecuta `tsc`       |
| `npm run format`           | Formatea con Prettier                           |
| `npm test`                 | Tests unitarios (sin base de datos)             |
| `npm run test:integration` | Tests contra Postgres (necesita `DATABASE_URL`) |
| `npm run db:migrate`       | Crea y aplica migraciones en desarrollo         |
| `npm run db:studio`        | Explorador visual de la base de datos           |

## Estructura

```
prisma/            Esquema, migraciones y datos de prueba
src/app/           Rutas (App Router)
  (auth)/          Login, registro y recuperación de contraseña + sus Server Actions
  admin/           Panel de administración (solo ADMIN)
  cuenta/          Área del cliente
  api/auth/        Endpoints de Better Auth
src/components/    Componentes de interfaz compartidos
src/lib/           Código compartido: auth, base de datos, env, email, validación
src/server/        Código solo de servidor: sesión y permisos, auditoría
src/proxy.ts       Redirección previa a /login en rutas protegidas
```

Los permisos se comprueban en `src/server/session.ts` (`requireUser`, `requireAdmin`). `proxy.ts` solo hace una comprobación optimista de la cookie.
