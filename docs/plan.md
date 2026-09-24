# XeeseArchieve — Plan de desarrollo

> **Documento de arranque para el asistente de desarrollo.**
> Contiene el contexto del negocio, las decisiones ya tomadas, la arquitectura propuesta, las fases de desarrollo y las dudas pendientes.
> Léelo entero antes de empezar.

---

## 0. Instrucciones para el asistente

1. **No inventes requisitos de negocio.** Las decisiones cerradas están en la sección 2. Si una tarea depende de una duda abierta (secciones 8 y 9), **pregunta al usuario antes de implementarla**. No uses un valor supuesto sin avisar.
2. **Trabaja fase a fase y en orden** (sección 6).
   - Al empezar una fase, desglósala en tareas concretas y confírmalas con el usuario.
   - Al terminarla, comprueba sus criterios de "Terminada cuando" antes de pasar a la siguiente.
3. **El dinero es la parte crítica.**
   - Todo lo relacionado con Stripe se desarrolla y se prueba primero en modo test.
   - Los importes se guardan como enteros en céntimos.
   - Toda operación de cobro o retención debe poder repetirse sin duplicar el cargo (claves de idempotencia).
4. **Verifica la documentación actual de Stripe** antes de implementar pagos. Los datos de la sección 3 se consultaron en septiembre de 2026 y pueden cambiar.
5. Cuando se resuelva una duda, **añádela a la sección 2 (decisiones cerradas)** para mantener este documento actualizado.
6. El usuario escribe en español. Responde en español.

---

## 1. Contexto del negocio

**XeeseArchieve** es una tienda que **alquila prendas de lujo** a famosos y a clientes con alto poder adquisitivo durante un periodo determinado.

- Al reservar, el cliente deja una **fianza** como garantía.
- Al final del periodo, si la prenda se devuelve, se cobra **el precio del servicio**, y el resto de la fianza se libera.
- Si la prenda vuelve dañada o con retraso, el dueño la revisa y **descuenta manualmente** la cantidad que corresponda de la fianza.

Se trata de construir una **web full stack** con:

- Catálogo.
- Clientes verificados.
- Reservas con calendario.
- Pagos integrados y sistema de fianzas.
- Gestión de envíos y devoluciones.
- Panel de administración.

El desarrollador (el usuario) crea la web para un amigo, que es el dueño de la tienda.

---

## 2. Decisiones cerradas

| Tema                 | Decisión                                                                                                                                        |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Precio               | **Por día.** El cliente elige las fechas y el precio es la tarifa diaria de la prenda por el número de días.                                    |
| Duración habitual    | **Hasta 7 días.**                                                                                                                               |
| Acceso de clientes   | **Registro con verificación de identidad y aprobación manual.** El dueño aprueba cada cuenta antes de que pueda alquilar.                       |
| Inventario           | **Piezas únicas.** Cada prenda es un ejemplar con una sola talla. Una reserva la bloquea en esas fechas.                                        |
| Entrega y devolución | **Envío por mensajería**, tanto a la ida como a la vuelta.                                                                                      |
| Daños y retrasos     | **Se descuentan de la fianza.** El dueño revisa la prenda y fija el importe manualmente. De momento no hay penalización automática por retraso. |
| Tecnología           | **Next.js con TypeScript**, frontend y backend en el mismo proyecto.                                                                            |
| Pasarela de pago     | **Stripe.**                                                                                                                                     |
| Modelo de fianza     | **Retención extendida con captura parcial.** Plan B para las tarjetas no compatibles: cobro y reembolso. Detalle en la sección 3.               |
| Base de datos        | **PostgreSQL + Prisma 7.** En desarrollo, Postgres local. En el entorno de pruebas y en producción, un Postgres gestionado.                     |
| Autenticación        | **Better Auth**, con email y contraseña, verificación del email, recuperación de contraseña y roles `CLIENTE`/`ADMIN`.                          |
| Alojamiento y CI     | **GitHub** (repositorio y GitHub Actions) + **Vercel**.                                                                                         |
| Emails               | **Por consola en desarrollo.** Resend cuando haya dominio (P-8.4).                                                                              |

---

## 3. Sistema de fianza: diseño y justificación

### Por qué no basta una retención normal

- En Stripe, una autorización de pago online con tarjeta suele ser válida **7 días**.
- El ciclo completo de un alquiler es envío (unos 2 días) + uso (hasta 7) + devolución (unos 2–3) + revisión (unos 2). En total, **unos 12–15 días**.

### Solución elegida: retención extendida con captura parcial

- Stripe ofrece **retenciones extendidas de hasta unos 30 días** según la red de la tarjeta:
  - **Mastercard:** todas las categorías de comercio.
  - **Visa:** en categorías que no son hoteles ni alquiler de vehículos, con una **comisión extra del 0,08 %**. Esto aplica en España; la ampliación del plazo no se aplica a comercios de EE. UU. ni de Japón.
  - **American Express:** solo alojamiento y alquiler de vehículos, así que **no aplica** a esta tienda.
- **Hay que pedir acceso:** es una función de la tarifa IC+. Con la tarifa estándar hay que solicitarla a Stripe (tarea de la fase 0).
- **Captura parcial:** al cerrar el alquiler se cobra solo el precio del servicio más los descuentos. El resto se libera automáticamente.
- **Ventajas frente a cobrar y reembolsar:**
  - El dinero no sale de la cuenta del cliente.
  - **Stripe no devuelve sus comisiones al reembolsar**, lo que con fianzas de miles de euros supone una pérdida importante.
  - Cancelar una retención no cobrada no cuesta nada.

### Flujo

1. **Al reservar:** se guarda y verifica la tarjeta con un SetupIntent. **No se cobra nada.**
2. **Unos 2 días antes del envío** (configurable): una tarea programada crea un PaymentIntent con `capture_method: manual` y solicita la retención extendida por el importe de la fianza.
   - **Si falla:** la reserva pasa a `FIANZA_FALLIDA`, se avisa al cliente y tiene un plazo (por definir) para usar otra tarjeta. Si no lo hace, la reserva se cancela y las fechas se liberan.
3. **Al cerrar el alquiler:** captura parcial por el precio del servicio más los descuentos por daños. Se libera el resto.
4. **Vigilancia:** si una retención está a punto de caducar (por ejemplo, 3 días antes) y el alquiler no se ha cerrado, se avisa al dueño para que cobre antes de perderla.
5. **Plan B** para Amex, tarjetas no compatibles o si Stripe no concede la retención extendida: cobro real de la fianza y reembolso parcial al final.
   - Conviene decidir si se aceptan esas tarjetas (duda P-5.4).

### Reglas técnicas

- La **fuente de verdad del estado de los pagos son los webhooks** de Stripe, no la respuesta del navegador.
- Todos los eventos de pago se registran en una tabla de auditoría.
- Importes en céntimos (EUR). Claves de idempotencia en cada llamada que crea o captura un pago.

---

## 4. Arquitectura propuesta

| Capa                      | Elección                                          | Notas                                                                        |
| ------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| Framework                 | Next.js (App Router) + TypeScript                 | Server Actions o Route Handlers para la API                                  |
| Base de datos             | PostgreSQL + Prisma                               | Postgres permite impedir solapes de fechas en la propia base de datos        |
| Autenticación             | Auth.js u otra equivalente                        | Roles: `CLIENTE`, `ADMIN`                                                    |
| Pagos                     | Stripe                                            | SetupIntent, PaymentIntent con captura manual, retención extendida, webhooks |
| Verificación de identidad | Por decidir (P-3.1)                               | Stripe Identity o revisión manual de documentos                              |
| Imágenes                  | Almacenamiento compatible con S3 o Cloudinary     |                                                                              |
| Emails                    | Servicio transaccional, por ejemplo Resend        |                                                                              |
| Tareas programadas        | Cron del hosting o una cola de trabajos           | Para crear retenciones, vigilar caducidades y enviar recordatorios           |
| Alojamiento               | Vercel o similar, con Postgres gestionado         | Un entorno de pruebas y otro de producción                                   |
| Calidad                   | ESLint, Prettier, tests (Vitest o Playwright), CI |                                                                              |

---

## 5. Modelo de datos inicial (borrador)

Es un borrador. Ajústalo cuando se resuelvan las dudas.

- **User:** id, email, nombre, teléfono, rol, `accountStatus`, stripeCustomerId, fechas.
- **VerificationRecord:** userId, método, estado, referencia externa, revisadoPor, notas.
- **Address:** direcciones de envío del cliente.
- **Garment (prenda):** id, nombre, marca, descripción, talla, categoría, `dailyPriceCents`, `depositCents`, estado (`ACTIVA`, `OCULTA`, `EN_MANTENIMIENTO`, `RETIRADA`), notas internas.
- **GarmentImage:** garmentId, url, orden.
- **Booking (reserva):**
  - id, userId, garmentId.
  - `startDate` y `endDate`: fechas de uso del cliente.
  - `blockedFrom` y `blockedTo`: incluyen los días de envío y de margen.
  - días, `rentalPriceCents`, `depositCents`, estado.
  - Restricción en la base de datos para que no haya dos reservas activas de la misma prenda con fechas bloqueadas solapadas.
- **Payment:** bookingId, tipo (`SETUP`, `HOLD`, `CAPTURE`, `CHARGE_FALLBACK`, `REFUND`), stripeId, importe, estado, `holdExpiresAt`.
- **Shipment:** bookingId, dirección (ida o vuelta), transportista, seguimiento, estado, fechas.
- **Inspection:** bookingId, revisadoPor, fotos, resultado, notas.
- **Deduction:** bookingId o inspectionId, concepto, importe en céntimos, motivo.
- **AuditLog:** actor, acción, entidad, datos, fecha.
- **Setting:** parámetros configurables, como los días de margen, cuándo se crea la retención y el plazo para cambiar de tarjeta.

### Estados de la cuenta del cliente

`PENDIENTE_VERIFICACION` → `PENDIENTE_APROBACION` → `APROBADA`, `RECHAZADA` o `BLOQUEADA`

### Estados de la reserva

```
SOLICITADA → CONFIRMADA (tarjeta guardada)
          → FIANZA_RETENIDA  ──(fallo)──> FIANZA_FALLIDA → (nueva tarjeta) FIANZA_RETENIDA | CANCELADA
          → ENVIADA → ENTREGADA → EN_DEVOLUCION → RECIBIDA → EN_REVISION → CERRADA
Desde casi cualquier estado: CANCELADA (según la política) o INCIDENCIA (gestión manual)
```

Cada cambio de estado queda registrado en AuditLog y, si procede, envía un email.

---

## 6. Fases de desarrollo

### Fase 0 — Preparación

- [ ] El dueño crea la cuenta de Stripe del negocio y **solicita la retención extendida**.
- [ ] Repositorio, dominio y cuentas del hosting y de la base de datos.
- [ ] Resolver las dudas de la fase 0 (sección 8).

**Terminada cuando:** Stripe funciona en modo test y se sabe si hay acceso a la retención extendida.

### Fase 1 — Base del proyecto

- [ ] Proyecto Next.js con TypeScript, ESLint, Prettier y la estructura de carpetas.
- [ ] Postgres con Prisma, primera migración y datos de prueba.
- [ ] Autenticación: registro, inicio de sesión, recuperación de contraseña y roles.
- [ ] Integración continua y despliegue automático al entorno de pruebas.
- [ ] Layout base neutro. El diseño final se hace en la fase 8.

**Terminada cuando:** un usuario puede registrarse e iniciar sesión en el entorno de pruebas.

### Fase 2 — Catálogo

- [ ] Modelo Garment y sus imágenes.
- [ ] Panel de administración: crear, editar, ocultar y retirar prendas, y subir y ordenar fotos.
- [ ] Páginas públicas de catálogo (con filtros por talla, marca y categoría) y de ficha de prenda.
- [ ] La visibilidad del catálogo y de los precios depende de la duda P-2.1.

**Terminada cuando:** el dueño sube una prenda y aparece publicada correctamente.

### Fase 3 — Clientes y verificación

- [ ] Perfil del cliente y direcciones.
- [ ] Flujo de verificación de identidad según P-3.1.
- [ ] Cola de aprobación en el panel: aprobar o rechazar con un motivo.
- [ ] Bloqueo: solo las cuentas `APROBADA` pueden reservar.
- [ ] Emails de verificación pendiente, cuenta aprobada y cuenta rechazada.

**Terminada cuando:** un cliente nuevo no puede reservar hasta que el dueño lo aprueba.

### Fase 4 — Reservas y disponibilidad

- [ ] Calendario de disponibilidad por prenda.
- [ ] Cálculo del precio por días. Hay que definir cómo se cuentan los días (P-4.5).
- [ ] Bloqueo de fechas que incluya los días de envío y el margen de revisión (P-4.1).
- [ ] Protección en la base de datos contra reservas solapadas, que funcione aunque dos personas reserven a la vez.
- [ ] Validaciones de duración mínima y máxima y de antelación (P-4.2, P-4.3).
- [ ] "Mis reservas" en la cuenta del cliente.

**Terminada cuando:** es imposible crear dos reservas solapadas, incluso con peticiones simultáneas (con un test que lo compruebe).

### Fase 5 — Pagos y fianza (fase crítica)

- [ ] Cliente de Stripe por usuario y SetupIntent al reservar.
- [ ] Tarea programada que crea la retención extendida N días antes del envío.
- [ ] Gestión de `FIANZA_FALLIDA`: aviso, plazo para cambiar de tarjeta y cancelación automática.
- [ ] Webhooks firmados e idempotentes, que actualizan los estados.
- [ ] Captura parcial al cierre: precio del servicio más descuentos.
- [ ] Vigilancia de retenciones a punto de caducar y alertas al dueño.
- [ ] Plan B: cobro y reembolso para las tarjetas no compatibles, o bloquearlas (P-5.4).
- [ ] Tests con las tarjetas de prueba de Stripe: rechazo, 3-D Secure, fondos insuficientes, caducidad de la retención y captura parcial.

**Terminada cuando:** un alquiler simulado completo termina cobrando el importe exacto y liberando el resto, y los fallos se gestionan sin intervención manual.

### Fase 6 — Envíos, devoluciones e incidencias

- [ ] Registro de los envíos de ida y vuelta con número de seguimiento. Etiquetas automáticas o manuales según P-6.3.
- [ ] Transiciones de estado desde el panel: enviada, entregada, en devolución y recibida.
- [ ] Revisión de la prenda: fotos, resultado y descuentos con su motivo.
- [ ] Cierre del alquiler, que ejecuta la captura de la fase 5.
- [ ] Estado `INCIDENCIA` para los casos fuera del flujo normal (sección 9).

**Terminada cuando:** el dueño puede gestionar un alquiler de principio a fin desde el panel.

### Fase 7 — Panel de administración y notificaciones

- [ ] Resumen del día: envíos de hoy, devoluciones esperadas, retrasos, retenciones a punto de caducar, cuentas por aprobar e incidencias.
- [ ] Listados con filtros de reservas, clientes y pagos.
- [ ] Página de ajustes para los parámetros configurables.
- [ ] Emails automáticos en cada cambio de estado relevante y recordatorio de devolución al cliente.

**Terminada cuando:** el dueño puede llevar la tienda sin entrar al dashboard de Stripe salvo en casos excepcionales.

### Fase 8 — Diseño final, textos legales y lanzamiento

- [ ] Identidad visual (P-8.2) y diseño responsive de calidad, acorde con una marca de lujo.
- [ ] Idiomas (P-8.1).
- [ ] Textos legales: condiciones del alquiler, privacidad, cookies y aviso legal (P-8.3).
- [ ] SEO básico, rendimiento y accesibilidad.
- [ ] Pruebas completas con un alquiler real de bajo importe, paso de Stripe a modo real, copias de seguridad y monitorización de errores.
- [ ] Lanzamiento.

---

## 7. Parámetros configurables (valores por decidir)

| Parámetro                                                     | Valor                     |
| ------------------------------------------------------------- | ------------------------- |
| Días de envío de ida que se bloquean antes del uso            | ?                         |
| Días de devolución y revisión que se bloquean después del uso | ?                         |
| Días antes del envío en que se crea la retención              | ~2 (propuesta)            |
| Plazo para cambiar de tarjeta tras una retención fallida      | ?                         |
| Aviso de retención a punto de caducar                         | ~3 días antes (propuesta) |
| Duración mínima y máxima del alquiler                         | ? / 7 días                |
| Antelación máxima de reserva                                  | ?                         |

---

## 8. Dudas abiertas por fase

Hay que preguntarlas al usuario al llegar a cada fase.

**Fase 0**

- P-0.1 ¿El dueño ya tiene empresa o está dado de alta como autónomo? ¿Ya tiene cuenta de Stripe?
- P-0.2 ¿Stripe ha concedido la retención extendida?

**Fase 2**

- P-2.1 ¿El catálogo es público o solo lo ven los clientes aprobados? ¿Se muestran los precios públicamente?
- P-2.2 ¿Los precios incluyen IVA?
- P-2.3 ¿Qué categorías y filtros necesita el catálogo? ¿Hay prendas de hombre, de mujer o de ambos?

**Fase 3**

- P-3.1 ¿Cómo se verifica la identidad? Opciones: automáticamente con Stripe Identity (documento y selfie, con coste por verificación) o revisando documentos a mano.
- P-3.2 ¿Con qué criterios se aprueba o rechaza a un cliente?
- P-3.3 ¿Qué datos se piden en el registro?

**Fase 4**

- P-4.1 ¿Cuántos días de margen hacen falta entre alquileres para tintorería y revisión?
- P-4.2 ¿Hay una duración mínima de alquiler?
- P-4.3 ¿Con cuánta antelación se puede reservar, como mínimo y como máximo?
- P-4.4 ¿Cuál es la política de cancelación, y con qué plazos y penalizaciones?
- P-4.5 ¿Cómo se cuentan los días? Por ejemplo, si del 1 al 3 son 3 días o 2.
- P-4.6 ¿Una reserva puede incluir varias prendas (carrito) o es una prenda por reserva?

**Fase 5**

- P-5.1 ¿Cómo se fija la fianza: valor de la prenda, un porcentaje o un importe manual?
- P-5.2 ¿Entre qué importes se mueven las fianzas? Con importes muy altos, algunas tarjetas no tienen límite suficiente. ¿Qué se hace en ese caso: transferencia, varias tarjetas o rechazar la reserva?
- P-5.3 Si hay varias prendas por reserva, ¿la fianza es la suma de todas?
- P-5.4 ¿Se aceptan Amex y otras tarjetas sin retención extendida, usando cobro y reembolso, o solo Visa y Mastercard?
- P-5.5 ¿El cliente puede ampliar el alquiler una vez empezado? ¿Cómo se cobra?

**Fase 6**

- P-6.1 ¿Se envía solo en España, a toda la UE o a otros países?
- P-6.2 ¿Quién paga el envío? ¿Se cobra aparte o está incluido en el precio?
- P-6.3 ¿Qué empresa de mensajería se usa? ¿La web genera las etiquetas o se gestionan a mano?
- P-6.4 ¿Las prendas van aseguradas durante el transporte? ¿Quién responde si se pierden en tránsito?

**Fase 8**

- P-8.1 ¿En qué idiomas estará la web?
- P-8.2 ¿La tienda tiene logo, colores, tipografías y fotos profesionales?
- P-8.3 ¿Un abogado redactará las condiciones del alquiler?
- P-8.4 ¿Ya tiene dominio? ¿Qué email de contacto se usa?

---

## 9. Posibles dudas futuras durante el desarrollo

No bloquean el arranque, pero surgirán. Cuando aparezcan, pregunta en lugar de suponer.

**Dinero y fianza**

- ¿Qué pasa si los daños o la pérdida de la prenda **superan la fianza**? ¿Se cobra la diferencia a la tarjeta guardada? Eso requiere el consentimiento del cliente en las condiciones del alquiler.
- ¿Qué pasa si el retraso es tan largo que **la retención va a caducar** antes de que vuelva la prenda? ¿Se cobra toda la fianza, se cobra solo lo devengado o se vuelve a retener?
- ¿Cómo se gestionan las **disputas o chargebacks** de un cliente que no está de acuerdo con un descuento? Hará falta guardar pruebas: fotos del estado de la prenda antes y después, y la aceptación de las condiciones.
- Si se devuelve **antes de tiempo**, ¿se cobran los días reservados o solo los usados?
- Si la prenda **llega tarde o defectuosa** al cliente, ¿se descuenta o se anula el servicio?
- ¿Habrá **penalización automática por retraso** en el futuro? El modelo de datos debería permitirla.
- ¿Habrá **descuentos, códigos promocionales** o tarifas especiales para clientes VIP?

**Fiscalidad y facturación**

- ¿Hay que emitir **facturas** desde la web? ¿Con qué numeración y datos fiscales? Hay que comprobar la normativa española de facturación vigente, por ejemplo Verifactu, antes de implementarlo.
- ¿Cómo se tratan contablemente la fianza retenida y la parte capturada por daños? Consultar con la gestoría.

**Privacidad y seguridad (RGPD)**

- ¿Cuánto tiempo se guardan los **documentos de identidad** y dónde? Conviene no almacenarlos si lo hace Stripe Identity.
- Discreción con los **clientes famosos**: ¿hace falta anonimizar en el panel, restringir quién ve qué o firmar acuerdos de confidencialidad?
- Consentimiento de cookies, derecho de borrado y exportación de datos.
- Autenticación en dos pasos para las cuentas de administración.

**Operativa**

- ¿Habrá **varios administradores o empleados** con permisos distintos?
- ¿Se necesita una **lista de espera** o avisos cuando una prenda vuelve a estar disponible?
- ¿Favoritos o lista de deseos para el cliente?
- ¿Se podrán ver fotos del estado de la prenda en el momento de la entrega y de la devolución, para evitar conflictos?
- Gestión de **prendas en mantenimiento o tintorería** fuera de las reservas: bloquearlas manualmente en el calendario.
- ¿Zona horaria de referencia? Europe/Madrid para fechas y cortes.

**Técnico**

- Copias de seguridad de la base de datos y un plan de recuperación.
- Monitorización de errores (por ejemplo, Sentry) y alertas si fallan los webhooks o las tareas programadas.
- Estadísticas de uso y métricas de negocio: ocupación por prenda, ingresos y descuentos.

---

## 10. Referencias

- Stripe: retenciones sobre una tarjeta — https://docs.stripe.com/payments/place-a-hold-on-a-payment-method
- Stripe: retención extendida — https://docs.stripe.com/payments/extended-authorization
- Stripe: reembolsos y comisiones — https://docs.stripe.com/refunds
- Stripe: comisiones de los pagos reembolsados — https://support.stripe.com/questions/understanding-fees-for-refunded-payments
