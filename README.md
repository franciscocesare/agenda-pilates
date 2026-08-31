# Monte Pilates — landing + sistema de agenda

## Flujo del sistema (importante)

**El alumno nunca reserva por su cuenta.** El flujo es:

1. El alumno (o cualquier visitante) entra a `/agenda` — un calendario
   mensual público, sin login, que muestra qué días tienen lugar,
   cuáles están completos y cuáles no están disponibles.
2. Si le sirve un día, hace clic y aparece el detalle de horarios de
   ese día con un botón **"Solicitar"** que abre WhatsApp con un
   mensaje ya escrito (día, horario y, si está logueado, su nombre) al
   número del estudio.
3. La profesora o administración ve ese mensaje y, desde el panel
   admin (`/admin/reservas`), le asigna el turno al alumno: elige si
   sale de una clase suelta (descuenta 1 crédito), de un plan mensual
   (fija el día/horario fijo del mes) o es una cortesía (no descuenta
   nada).
4. El alumno, si inicia sesión, puede ver sus propias clases en
   `/mis-turnos` ("Mis clases") y cancelarlas — pero **solo puede
   cancelar, nunca crear ni mover un turno**. Cancelando con más de 3
   horas de anticipación no pierde el crédito: vuelve a su cuenta para
   que administración se lo asigne en otro día.
5. La profesora/admin puede cancelar un horario puntual de un día (por
   falta de alumnas, por ejemplo) desde `/admin/agenda` → "Cancelar un
   horario puntual". Esto no bloquea el día entero, solo ese horario;
   las alumnas que ya tenían turno ahí se cancelan automáticamente y
   recuperan el crédito.

El login (`/login`) y el registro (`/registro`) existen solo para que
el alumno pueda ver y cancelar **sus propias** clases — nunca para
reservar.

## Qué incluye este código

- Landing (`/`) moderna, con secciones de Quiénes somos, Beneficios
  del pilates clásico (vs. moderno), Cómo funciona, Agenda y
  Contacto/Ubicación (Villa Ciudad Parque, Valle de Calamuchita,
  Córdoba), con botón directo a WhatsApp.
- Agenda pública (`/agenda`): calendario mensual grande, con
  navegación entre meses, disponibilidad por día y detalle de
  horarios por día. No requiere sesión.
- Esquema de base de datos completo (`prisma/schema.prisma`): usuarios,
  planes, pagos/créditos, reservas puntuales y reservas mensuales
  recurrentes, horarios de atención, fechas bloqueadas y horarios
  puntuales cancelados (`BlockedSlot`).
- Lógica de reservas a prueba de condiciones de carrera
  (`lib/booking.ts`), usando transacciones serializables de PostgreSQL.
- Sistema de créditos con dos modalidades (ver más abajo), asignados
  siempre por administración.
- Endpoints de autenticación, calendario, planes y administración
  (`app/api/**`).
- Seed de datos de prueba con usuarios, planes, un día completo y un
  día bloqueado, para poder probar todos los casos.

## Cupo: es por horario, no por día

Cada horario (9:00, 10:00, etc.) tiene sus propios `CUPO_DEFAULT`
lugares (hoy, 6), fijos y **no editables** desde el panel admin — están
centralizados en `lib/constants.ts`. Las 9:00 y las 10:00 del mismo
día no comparten cupo entre sí: si las 9:00 están completas, las 10:00
pueden seguir teniendo lugar. Un día se muestra como "completo" en el
calendario solo cuando **todos** sus horarios activos están llenos o
cancelados.

Los horarios de atención también son fijos: lunes a sábado, de 9 a 13
y de 15 a 21 (`prisma/seed.ts`, tabla `Schedule`). Si en algún momento
necesitás cambiarlos, se edita directamente en la base de datos — ya
no hay panel para eso en el admin.

## Cómo funciona el sistema de créditos

Hay dos tipos de plan (`PlanType.tipo`):

- **`SUELTA`** (clase suelta, o un bono de varias clases sueltas): la
  persona compra N clases; administración las va asignando día a día
  según la disponibilidad — cada turno asignado consume 1 crédito
  (`clasesDisponibles`).
- **`MENSUAL`** (por ejemplo "2 veces por semana"): la persona paga el
  mes y administración fija **una sola vez** el día de la semana y el
  horario fijo (`POST /api/admin/reservations` con `modo: "mensual"`).
  El sistema genera automáticamente un turno para cada ocurrencia de
  ese día dentro del período pagado. Si algún día puntual ya está
  completo o bloqueado, esa fecha queda afuera y se informa
  (`noDisponibles`), sin afectar al resto del mes.

También existe el modo `cortesia`: administración le asigna un turno a
un alumno sin descontar ningún crédito (clase de prueba, reposición,
etc).

### "Clase suelta" pendiente de pago

Al asignar una clase suelta (`modo: "credito"`), el admin elige entre
dos caminos:

- **Ya está pago** → se crea el turno directamente `CONFIRMADO` y se
  descuenta el crédito en el momento (`reservarComoAdminConCredito`).
- **Avisarle por WhatsApp** → se apunta la reserva como
  `PENDIENTE_PAGO` (`reservarComoAdminPendientePago`): el lugar queda
  apartado (nadie más lo puede tomar, cuenta contra el cupo del
  horario) pero **todavía no se descuenta ningún crédito**. Se abre
  WhatsApp con un mensaje al alumno avisándole el día/hora reservado,
  para coordinar el cobro.

Estas reservas "pendientes de pago" aparecen siempre destacadas al
principio de `/admin/reservas` (no hace falta buscarlas), con dos
acciones:

- **Confirmar pago** (`estado: "CONFIRMAR_PAGO"` → `confirmarPagoTurno`)
  recién ahí descuenta el crédito y pasa el turno a `CONFIRMADO`.
- **Cancelar** libera el lugar sin devolver ningún crédito (porque
  nunca se llegó a descontar).

**El alumno no necesita tener ningún crédito cargado de antemano.**
Confirmar el pago (ya sea al toque o después desde "Confirmar pago")
ES la venta: si no había ningún crédito de clase suelta disponible, se
genera uno nuevo en el momento (`crearClaseSueltaWalkIn`) usando el
plan "clase suelta" configurado en `PlanType`, y se consume
inmediatamente. Por eso siempre tiene que existir al menos un
`PlanType` con `tipo: "SUELTA"` activo (el seed crea uno por defecto);
si se borran todos, la confirmación de pago va a fallar con un aviso
para crear uno en `/planes`.

## Cancelaciones

- El alumno puede cancelar su propia clase hasta **3 horas antes**
  sin perder el crédito (`Config.horas_minimas_cancelacion`, editable
  en la tabla `Config`). Si cancela dentro de esas 3 horas, el sistema
  rechaza la cancelación (`Errores.cancelacionFueraDePlazo`).
- La profesora/admin puede cancelar cualquier turno sin esa
  restricción horaria, desde `/admin/reservas`. Solo se devuelve el
  crédito si el turno estaba `CONFIRMADO` (ya se había descontado);
  cancelar un `PENDIENTE_PAGO` no regala ningún crédito.
- Si una alumna directamente no aparece a su clase, el admin la marca
  **Ausente**: libera el lugar pero **no** devuelve el crédito — es la
  vía para el caso de "avisó tarde o no avisó y pierde la clase".
- La profesora/admin puede cancelar un **horario puntual de un día**
  (sin bloquear el día entero) desde `/admin/agenda`; los turnos
  confirmados o pendientes de pago que hubiera en ese horario se
  cancelan automáticamente (con devolución de crédito solo para los
  que ya estaban confirmados).

## Requisitos

- Node.js 20+
- PostgreSQL 14+ (local, Docker, o un proveedor como Neon/Supabase/Railway)

## Instalación local

```bash
npm install
cp .env.example .env
# completar DATABASE_URL y SESSION_SECRET en .env

npm run db:migrate   # crea BlockedSlot y elimina la vieja DailyCapacity (cupo por día, ya no se usa)
npm run db:seed      # carga datos de prueba

npm run dev           # http://localhost:3000
```

> Si ya tenías la base de datos migrada de antes, esta migración
> agrega `BlockedSlot`, **elimina la tabla `DailyCapacity`** (el cupo
> ahora es fijo por horario, ver más abajo) y agrega `PENDIENTE_PAGO`
> al enum de estados del turno (`EstadoTurno`). No debería tocar
> usuarios, pagos ni turnos existentes, pero por las dudas hacé un
> backup antes si ya tenés datos reales cargados.

## Antes de publicar: revisá el número de WhatsApp

El número del estudio está centralizado en `lib/constants.ts`
(`WHATSAPP_NUMBER`). Hoy tiene `3546567378`, tal como se pasó. Para
que los links `wa.me` funcionen siempre, en Argentina normalmente hace
falta el formato internacional completo: código de país `54` + `9` +
código de área + número, sin el 0 ni el 15 (por ejemplo
`5493546567378`). Verificalo abriendo `https://wa.me/3546567378` desde
un celular antes de publicar; si no abre bien el chat, actualizá la
constante con el formato completo.

## Credenciales de desarrollo (datos de prueba, no reales)

| Rol      | Email                    | Contraseña |
|----------|--------------------------|------------|
| Admin    | admin@montepilates.demo  | Demo1234   |
| Cliente  | julieta@correo.demo      | Demo1234   |
| Cliente  | martin@correo.demo       | Demo1234   |

## Estructura

```
prisma/
  schema.prisma              Modelo de datos (incluye BlockedSlot)
  seed.ts                    Datos de prueba

lib/
  prisma.ts                  Cliente de base de datos
  auth.ts                    Login, sesión (cookie firmada), hashing
  booking.ts                 Reservas: cupo, transacciones, créditos, cancelaciones
  errors.ts                  Mensajes de error en lenguaje cotidiano
  constants.ts                DIAS, horarios base, número de WhatsApp

app/
  layout.tsx                 Layout raíz: lee la sesión y monta el Shell
  globals.css
  page.tsx                   /  (landing)
  agenda/page.tsx             /agenda (calendario público)
  login/page.tsx             /login
  registro/page.tsx          /registro
  planes/page.tsx            /planes (comprar créditos)
  mis-turnos/page.tsx        /mis-turnos ("Mis clases": ver y cancelar)
  admin/page.tsx             /admin (dashboard)
  admin/agenda/page.tsx      /admin/agenda (calendario, asignar turnos, bloqueos, cancelar horario puntual)
  admin/reservas/page.tsx    /admin/reservas (asignar turnos a alumnas, ver/cambiar estado)
  api/
    auth/register, login, logout, me
    plans                    listar y comprar planes
    calendar                 calendario público (día por día) — sin login
    calendar/day              detalle de horarios de un día — sin login
    payments/mine            mis créditos/planes activos
    appointments              (solo GET) mis turnos
    appointments/[id]/cancel  cancelar mi turno (hasta 3hs antes)
    admin/payments            créditos/planes de un alumno puntual (admin)
    admin/reservations         buscar reservas y asignar turno a un alumno (admin)
    admin/reservations/[id]    cambiar estado / cancelar una reserva (admin)
    admin/users                 buscar alumnas (para asignar turno)
    admin/blocked-dates         bloquear / desbloquear días enteros (admin)
    admin/blocked-slots          cancelar / reabrir un horario puntual de un día (admin)
    admin/stats                 estadísticas del dashboard (admin)

components/
  ui.ts                      Design tokens compartidos (paleta, fuentes, botones)
  Shell.tsx, Home.tsx, ProfilePanel.tsx, SpringGauge.tsx, ErrorBanner.tsx, Field.tsx
  agenda/     MonthGrid.tsx, HorarioRow.tsx, AgendaCalendar.tsx
  auth/       LoginForm.tsx, RegisterForm.tsx
  planes/     PlansList.tsx
  turnos/     MyAppointments.tsx
  admin/      AdminDashboard.tsx, AdminAgenda.tsx, AdminReservas.tsx, ManualBookingForm.tsx,
              BlockedDatesPanel.tsx, CancelSlotPanel.tsx
```

Cada página bajo `app/` es un archivo mínimo que solo importa y renderiza
su componente correspondiente de `components/` — así la lógica vive en
un solo lugar y las rutas quedan legibles.

## Lo que falta para producción

1. Rate limiting en `/api/auth/*` (login/registro).
2. Notificaciones (email/WhatsApp automático de confirmación cuando
   admin asigna un turno, o de cancelación) — el modelo ya está
   preparado para agregarlas sin cambiar el esquema.
3. Pasarela de pago real (`POST /api/plans` hoy confirma el pago
   directamente, para poder probar el flujo de punta a punta).
4. Migraciones aplicadas contra la base de producción y variables de
   entorno de producción (`SESSION_SECRET` propio, `DATABASE_URL` del
   proveedor elegido).
5. Confirmar el formato del número de WhatsApp (ver sección arriba).

## Despliegue

Cualquier proveedor que soporte Next.js (Vercel, Railway, Render, etc.)
más una base PostgreSQL administrada (Neon, Supabase, Railway). Pasos
generales:

1. Crear la base de datos y copiar su `DATABASE_URL`.
2. Configurar `DATABASE_URL` y `SESSION_SECRET` como variables de
   entorno en el proveedor de hosting.
3. `npm run db:migrate` (o `prisma migrate deploy`) contra esa base.
4. `npm run db:seed` solo si querés datos de ejemplo — nunca en una
   base con datos reales.
5. Deploy normal (`npm run build && npm run start`, o el flujo propio
   del proveedor).
