import { Prisma, PrismaClient } from "@prisma/client";
import { prisma } from "./prisma";
import { Errores } from "./errors";
import { CUPO_DEFAULT } from "./constants";

type Tx = Prisma.TransactionClient;

// Opciones para las transacciones "interactivas" (las que hacen varias
// consultas encadenadas dentro de un mismo $transaction). El nombre
// correcto de la opción es `isolationLevel` (ojo: NO `isolation` — con
// el nombre mal escrito Prisma simplemente ignora el valor sin avisar,
// y la transacción corre en el nivel de aislamiento por defecto en vez
// de Serializable). El `timeout` de 5 segundos que trae Prisma por
// default se queda corto con una base remota (ej. Supabase): cada
// consulta dentro de la transacción viaja por internet, y esta
// transacción encadena varias. Lo subimos a 15s de margen.
const TX_OPTIONS = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  timeout: 15000,
  maxWait: 10000,
};

function toDateOnly(d: Date | string) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Cuántos lugares de un horario puntual ya están ocupados: cuenta tanto
 * los turnos confirmados como los "pendiente de pago" (ese lugar ya
 * está apartado para esa alumna, aunque todavía no se descontó el
 * crédito), así nadie más puede tomarlo mientras se coordina el cobro.
 */
async function contarReservasDelHorario(tx: Tx, fecha: Date, hora: string) {
  return tx.appointment.count({
    where: { fecha, hora, estado: { in: ["CONFIRMADO", "PENDIENTE_PAGO"] } },
  });
}

async function estaBloqueado(tx: Tx, fecha: Date) {
  const b = await tx.blockedDate.findUnique({ where: { fecha } });
  return !!b;
}

async function horarioHabilitado(tx: Tx, fecha: Date, hora: string) {
  const diaSemana = fecha.getDay();
  const schedules = await tx.schedule.findMany({ where: { diaSemana, activo: true } });
  if (schedules.length === 0) return false;
  const dentroDeAlgunaFranja = schedules.some((s) => hora >= s.horaInicio && hora < s.horaFin);
  if (!dentroDeAlgunaFranja) return false;

  const cancelado = await tx.blockedSlot.findUnique({ where: { fecha_hora: { fecha, hora } } });
  return !cancelado;
}

/**
 * Reserva un turno puntual (usado tanto por "clase suelta" como por cada
 * ocurrencia semanal de un plan mensual). Corre siempre dentro de una
 * transacción serializable: relee el cupo y recuenta las reservas DENTRO
 * de la misma transacción, así dos pedidos simultáneos por el mismo
 * horario no pueden pisarse — Postgres hace fallar a uno de los dos, que
 * se reintenta.
 */
async function reservarEnTransaccion(
  tx: Tx,
  params: { userId: string; fecha: Date; hora: string; paymentId?: string; recurringReservationId?: string; estado?: "CONFIRMADO" | "PENDIENTE_PAGO" }
) {
  const { userId, fecha, hora, paymentId, recurringReservationId, estado = "CONFIRMADO" } = params;
  const hoy = toDateOnly(new Date());

  if (fecha < hoy) throw Errores.fechaPasada();
  if (await estaBloqueado(tx, fecha)) throw Errores.diaBloqueado();
  if (!(await horarioHabilitado(tx, fecha, hora))) throw Errores.fueraDeHorario();

  const yaTiene = await tx.appointment.findUnique({
    where: { fecha_hora_userId: { fecha, hora, userId } },
  });
  if (yaTiene && (yaTiene.estado === "CONFIRMADO" || yaTiene.estado === "PENDIENTE_PAGO")) throw Errores.turnoDuplicado();

  // El cupo es por horario, no por día: cada franja (9:00, 10:00, etc.)
  // tiene sus propios CUPO_DEFAULT lugares, sin compartirlos con otras
  // horas del mismo día.
  const reservados = await contarReservasDelHorario(tx, fecha, hora);
  if (reservados >= CUPO_DEFAULT) throw Errores.diaCompleto();

  return tx.appointment.create({
    data: { userId, fecha, hora, paymentId, recurringReservationId, estado },
  });
}

async function conReintentoDeSerializacion<T>(fn: () => Promise<T>, intentos = 3): Promise<T> {
  for (let i = 0; i < intentos; i++) {
    try {
      return await fn();
    } catch (err) {
      // P2034 = write conflict / deadlock bajo aislamiento serializable
      const esConflicto = (err as { code?: string })?.code === "P2034";
      if (!esConflicto || i === intentos - 1) throw err;
    }
  }
  throw new Error("No se pudo completar la reserva, intentá de nuevo.");
}

/**
 * Reserva de una sola clase suelta, consumiendo un crédito disponible del usuario.
 * NOTA: actualmente el alumno no puede reservar por su cuenta (ver
 * reservarComoAdminConCredito, que es la que usa el panel de admin);
 * esta función queda lista por si en el futuro se habilita la
 * autoreserva para el alumno.
 */
export async function reservarClaseSuelta(userId: string, fechaStr: string, hora: string) {
  const fecha = toDateOnly(fechaStr);

  return conReintentoDeSerializacion(() =>
    prisma.$transaction(
      async (tx) => {
        const payment = await tx.payment.findFirst({
          where: {
            userId,
            estado: "CONFIRMADO",
            clasesDisponibles: { gt: 0 },
            periodoInicio: { lte: fecha },
            periodoFin: { gte: fecha },
            planType: { tipo: "SUELTA" },
          },
          orderBy: { periodoFin: "asc" }, // gasta primero el crédito que vence antes
        });
        if (!payment) throw Errores.sinCreditos();

        const cita = await reservarEnTransaccion(tx, { userId, fecha, hora, paymentId: payment.id });

        await tx.payment.update({
          where: { id: payment.id },
          data: { clasesDisponibles: { decrement: 1 } },
        });

        return cita;
      },
      TX_OPTIONS
    )
  );
}

/**
 * Reserva mensual: el usuario elige el día de la semana y el horario UNA
 * sola vez. El sistema genera automáticamente un turno para cada
 * ocurrencia de ese día dentro del período pagado (p.ej. cada miércoles
 * del mes). Si algún día puntual ya está completo o bloqueado, esa fecha
 * queda afuera y se informa — el resto de las fechas sí quedan reservadas.
 */
export async function reservarPlanMensual(
  userId: string,
  paymentId: string,
  diaSemana: number,
  hora: string
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { planType: true },
  });
  if (!payment || payment.userId !== userId) throw Errores.sinCreditos();
  if (payment.planType.tipo !== "MENSUAL") throw Errores.planNoMensual();

  const patronesActuales = await prisma.recurringReservation.count({
    where: { paymentId, activo: true },
  });
  const maximo = payment.planType.clasesPorSemana ?? 1;
  if (patronesActuales >= maximo) throw Errores.diasFijosSuperados();

  const fechas: Date[] = [];
  const cursor = toDateOnly(payment.periodoInicio);
  const fin = toDateOnly(payment.periodoFin);
  while (cursor.getDay() !== diaSemana) cursor.setDate(cursor.getDate() + 1);
  while (cursor <= fin) {
    fechas.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }

  const recurrente = await prisma.recurringReservation.create({
    data: { userId, paymentId, diaSemana, hora },
  });

  const reservados: string[] = [];
  const noDisponibles: string[] = [];

  for (const fecha of fechas) {
    try {
      await conReintentoDeSerializacion(() =>
        prisma.$transaction(
          async (tx) =>
            reservarEnTransaccion(tx, {
              userId,
              fecha,
              hora,
              paymentId,
              recurringReservationId: recurrente.id,
            }),
          TX_OPTIONS
        )
      );
      reservados.push(fecha.toISOString().slice(0, 10));
    } catch {
      // Ese día puntual no se pudo (completo/bloqueado): se informa y se sigue
      // con el resto del mes en vez de abortar toda la reserva.
      noDisponibles.push(fecha.toISOString().slice(0, 10));
    }
  }

  return { recurringReservationId: recurrente.id, reservados, noDisponibles };
}

export async function cancelarTurno(userId: string, appointmentId: string, esAdmin = false) {
  return prisma.$transaction(async (tx) => {
    const turno = await tx.appointment.findUnique({ where: { id: appointmentId } });
    if (!turno || (!esAdmin && turno.userId !== userId)) throw Errores.turnoNoEncontrado();

    if (!esAdmin) {
      const horasMinimasCfg = await tx.config.findUnique({ where: { clave: "horas_minimas_cancelacion" } });
      const horasMinimas = horasMinimasCfg ? Number(horasMinimasCfg.valor) : 3;
      const inicioTurno = new Date(`${turno.fecha.toISOString().slice(0, 10)}T${turno.hora}:00`);
      const horasRestantes = (inicioTurno.getTime() - Date.now()) / 3_600_000;
      if (horasRestantes < horasMinimas) throw Errores.cancelacionFueraDePlazo(horasMinimas);
    }

    await tx.appointment.update({ where: { id: appointmentId }, data: { estado: "CANCELADO" } });

    // Solo se devuelve el crédito si realmente se había descontado (el
    // turno estaba CONFIRMADO). Un turno "pendiente de pago" nunca llegó
    // a consumir el crédito, así que cancelarlo no debe regalar uno.
    if (turno.estado === "CONFIRMADO" && turno.paymentId && !turno.recurringReservationId) {
      await tx.payment.update({
        where: { id: turno.paymentId },
        data: { clasesDisponibles: { increment: 1 } },
      });
    }
  }, { timeout: 15000, maxWait: 10000 });
}

/**
 * El admin asigna un turno "de cortesía" a un usuario, sin descontar
 * ningún crédito (ej. clase de prueba, reposición, etc.). Pasa por las
 * mismas validaciones de cupo/bloqueo/horario que cualquier reserva.
 */
export async function reservarComoAdmin(userId: string, fechaStr: string, hora: string) {
  const fecha = toDateOnly(fechaStr);
  const usuario = await prisma.user.findUnique({ where: { id: userId } });
  if (!usuario) throw Errores.turnoNoEncontrado();

  return conReintentoDeSerializacion(() =>
    prisma.$transaction(
      async (tx) => reservarEnTransaccion(tx, { userId, fecha, hora }),
      TX_OPTIONS
    )
  );
}

/** Busca el crédito de clase suelta que correspondería gastar (el que vence antes). */
async function buscarCreditoDisponible(tx: Tx, userId: string, fecha: Date) {
  return tx.payment.findFirst({
    where: {
      userId,
      estado: "CONFIRMADO",
      clasesDisponibles: { gt: 0 },
      periodoInicio: { lte: fecha },
      periodoFin: { gte: fecha },
      planType: { tipo: "SUELTA" },
    },
    orderBy: { periodoFin: "asc" },
  });
}

/**
 * Cuando el admin confirma el pago de una clase suelta y el alumno no
 * tenía ningún crédito cargado todavía, esa confirmación ES la venta:
 * se genera el registro de pago ahí mismo (por 1 clase, al precio del
 * plan "clase suelta" vigente) para no obligar a nadie a pasar antes
 * por /planes. El alumno solo ve el resultado como un crédito más en
 * su cuenta si llega a cancelar esa clase con anticipación.
 */
async function crearClaseSueltaWalkIn(tx: Tx, userId: string, fecha: Date) {
  const planSuelta = await tx.planType.findFirst({
    where: { tipo: "SUELTA", activo: true },
    orderBy: { clasesIncluidas: "asc" }, // preferimos el plan de 1 sola clase si existe
  });
  if (!planSuelta) throw Errores.sinCreditos();

  const periodoFin = new Date(fecha);
  periodoFin.setDate(periodoFin.getDate() + (planSuelta.duracionDias ?? 30));

  return tx.payment.create({
    data: {
      userId,
      planTypeId: planSuelta.id,
      monto: planSuelta.precio,
      periodoInicio: fecha,
      periodoFin,
      clasesDisponibles: 1,
      estado: "CONFIRMADO",
    },
  });
}

/**
 * Flujo normal de la app: el alumno NUNCA reserva por su cuenta. Es la
 * profesora/admin quien, desde el panel, le asigna un día y horario a un
 * alumno puntual, y ese turno consume un crédito de clase suelta del
 * alumno (el mismo criterio que usaría el propio alumno si pudiera
 * reservar: gasta primero el crédito que vence antes). Se usa cuando el
 * admin ya confirmó que la clase está paga. Si no tenía ningún crédito
 * cargado, esta confirmación genera uno (ver crearClaseSueltaWalkIn).
 */
export async function reservarComoAdminConCredito(userId: string, fechaStr: string, hora: string) {
  const fecha = toDateOnly(fechaStr);
  const usuario = await prisma.user.findUnique({ where: { id: userId } });
  if (!usuario) throw Errores.turnoNoEncontrado();

  return conReintentoDeSerializacion(() =>
    prisma.$transaction(
      async (tx) => {
        const payment = (await buscarCreditoDisponible(tx, userId, fecha)) ?? (await crearClaseSueltaWalkIn(tx, userId, fecha));

        const cita = await reservarEnTransaccion(tx, { userId, fecha, hora, paymentId: payment.id, estado: "CONFIRMADO" });

        await tx.payment.update({
          where: { id: payment.id },
          data: { clasesDisponibles: { decrement: 1 } },
        });

        return cita;
      },
      TX_OPTIONS
    )
  );
}

/**
 * Igual que reservarComoAdminConCredito, pero para cuando el pago
 * todavía no está confirmado: el lugar queda apartado (nadie más lo
 * puede tomar) con estado PENDIENTE_PAGO, sin descontar ni generar
 * ningún crédito todavía — eso se decide recién en confirmarPagoTurno,
 * cuando el admin confirma que cobró.
 */
export async function reservarComoAdminPendientePago(userId: string, fechaStr: string, hora: string) {
  const fecha = toDateOnly(fechaStr);
  const usuario = await prisma.user.findUnique({ where: { id: userId } });
  if (!usuario) throw Errores.turnoNoEncontrado();

  return conReintentoDeSerializacion(() =>
    prisma.$transaction(
      async (tx) => reservarEnTransaccion(tx, { userId, fecha, hora, estado: "PENDIENTE_PAGO" }),
      TX_OPTIONS
    )
  );
}

/**
 * El admin confirma que ya cobró una clase suelta que había quedado
 * "pendiente de pago": recién ahora se descuenta (o se genera, si el
 * alumno no tenía ningún crédito cargado) el crédito y el turno pasa a
 * CONFIRMADO.
 */
export async function confirmarPagoTurno(appointmentId: string) {
  return conReintentoDeSerializacion(() =>
    prisma.$transaction(
      async (tx) => {
        const turno = await tx.appointment.findUnique({ where: { id: appointmentId } });
        if (!turno) throw Errores.turnoNoEncontrado();
        if (turno.estado !== "PENDIENTE_PAGO") throw Errores.turnoNoEncontrado();

        let payment = turno.paymentId ? await tx.payment.findUnique({ where: { id: turno.paymentId } }) : null;
        if (!payment || payment.clasesDisponibles <= 0) {
          payment = await buscarCreditoDisponible(tx, turno.userId, turno.fecha);
        }
        if (!payment) {
          payment = await crearClaseSueltaWalkIn(tx, turno.userId, turno.fecha);
        }

        await tx.payment.update({
          where: { id: payment.id },
          data: { clasesDisponibles: { decrement: 1 } },
        });

        return tx.appointment.update({
          where: { id: appointmentId },
          data: { estado: "CONFIRMADO", paymentId: payment.id },
        });
      },
      TX_OPTIONS
    )
  );
}

/**
 * La profesora/admin cancela un horario puntual de un día (ej. "el
 * miércoles 10:00 se cancela por falta de alumnas"), sin bloquear el
 * resto del día. Deja de ofrecerse para nuevas reservas, y cualquier
 * turno que ya estuviera confirmado o pendiente de pago en ese horario
 * se cancela automáticamente. Si ya se había descontado el crédito
 * (turno CONFIRMADO), se devuelve; los "pendiente de pago" no
 * consumieron crédito, así que solo se liberan.
 */
export async function cancelarHorarioParaTodos(fechaStr: string, hora: string, motivo: string) {
  const fecha = toDateOnly(fechaStr);

  const bloqueo = await prisma.blockedSlot.upsert({
    where: { fecha_hora: { fecha, hora } },
    create: { fecha, hora, motivo },
    update: { motivo },
  });

  const afectados = await prisma.appointment.findMany({
    where: { fecha, hora, estado: { in: ["CONFIRMADO", "PENDIENTE_PAGO"] } },
  });

  for (const turno of afectados) {
    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({ where: { id: turno.id }, data: { estado: "CANCELADO" } });
      if (turno.estado === "CONFIRMADO" && turno.paymentId && !turno.recurringReservationId) {
        await tx.payment.update({
          where: { id: turno.paymentId },
          data: { clasesDisponibles: { increment: 1 } },
        });
      }
    }, { timeout: 15000, maxWait: 10000 });
  }

  return { bloqueo, turnosAfectados: afectados.length };
}

/** Reabre un horario puntual que la profesora/admin había cancelado. */
export async function reabrirHorario(blockedSlotId: string) {
  return prisma.blockedSlot.delete({ where: { id: blockedSlotId } });
}

/** Cambia el estado de un turno (ej. marcar Ausente o Completado desde
 * el panel admin). No toca créditos ni cupos — eso solo pasa al cancelar. */
export async function cambiarEstadoTurno(appointmentId: string, estado: "COMPLETADO" | "AUSENTE") {
  const turno = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!turno) throw Errores.turnoNoEncontrado();
  return prisma.appointment.update({ where: { id: appointmentId }, data: { estado } });
}
