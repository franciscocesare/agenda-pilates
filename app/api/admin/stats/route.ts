import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAndWrap } from "@/lib/errors";
import { toDateOnly } from "@/lib/booking";
import { CUPO_DEFAULT, HORARIOS_BASE } from "@/lib/constants";

// GET /api/admin/stats -> todo lo que necesita el inicio del admin en
// una sola llamada: pendientes de pago, la agenda de hoy (con
// nombres) y los horarios libres del resto de la semana en curso
// (lunes a sábado), para poder ofrecerlos por WhatsApp de un vistazo.
export async function GET() {
  try {
    await requireAdmin();
    const hoy = toDateOnly(new Date());

    // Resto de la semana en curso: de hoy al próximo sábado. Si hoy es
    // domingo (el estudio no abre), directamente miramos la semana que
    // arranca mañana.
    const diasHastaSabado = hoy.getUTCDay() === 0 ? 6 : 6 - hoy.getUTCDay();
    const fechasSemana: Date[] = [];
    for (let i = 0; i <= diasHastaSabado; i++) {
      const f = new Date(hoy);
      f.setUTCDate(f.getUTCDate() + i);
      fechasSemana.push(f);
    }
    const inicioSemana = fechasSemana[0];
    const finSemana = fechasSemana[fechasSemana.length - 1];

    // Mes en curso y mes pasado (calendario), para el conteo de alumnas.
    const inicioMesActual = new Date(
      Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 1),
    );
    const finMesActual = new Date(
      Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() + 1, 0),
    );
    const inicioMesPasado = new Date(
      Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - 1, 1),
    );
    const finMesPasado = new Date(
      Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth(), 0),
    );

    const [
      pendientes,
      schedules,
      blockedDatesSemana,
      blockedSlotsSemana,
      appointmentsSemana,
      appointmentsHoyConNombre,
      alumnasMesActual,
      alumnasMesPasado,
    ] = await Promise.all([
      prisma.appointment.findMany({
        where: { estado: "PENDIENTE_PAGO" },
        select: {
          id: true,
          fecha: true,
          hora: true,
          user: {
            select: { id: true, nombre: true, apellido: true, telefono: true },
          },
        },
        orderBy: [{ fecha: "asc" }, { hora: "asc" }],
        take: 30,
      }),
      prisma.schedule.findMany({
        where: { activo: true, diaSemana: { in: [1, 2, 3, 4, 5, 6] } },
      }),
      prisma.blockedDate.findMany({
        where: { fecha: { gte: inicioSemana, lte: finSemana } },
      }),
      prisma.blockedSlot.findMany({
        where: { fecha: { gte: inicioSemana, lte: finSemana } },
      }),
      prisma.appointment.findMany({
        where: {
          fecha: { gte: inicioSemana, lte: finSemana },
          estado: { in: ["CONFIRMADO", "PENDIENTE_PAGO"] },
        },
        select: { fecha: true, hora: true },
      }),
      prisma.appointment.findMany({
        where: { fecha: hoy, estado: { in: ["CONFIRMADO", "PENDIENTE_PAGO"] } },
        select: {
          hora: true,
          estado: true,
          user: { select: { id: true, nombre: true, apellido: true } },
        },
        orderBy: { user: { nombre: "asc" } },
      }),
      prisma.appointment.findMany({
        where: {
          fecha: { gte: inicioMesActual, lte: finMesActual },
          estado: { not: "CANCELADO" },
        },
        select: { userId: true },
        distinct: ["userId"],
      }),
      prisma.appointment.findMany({
        where: {
          fecha: { gte: inicioMesPasado, lte: finMesPasado },
          estado: { not: "CANCELADO" },
        },
        select: { userId: true },
        distinct: ["userId"],
      }),
    ]);

    const bloqueadasSet = new Set(
      blockedDatesSemana.map((b) => b.fecha.toISOString().slice(0, 10)),
    );
    const canceladasPorFecha = new Map<string, Set<string>>();
    for (const b of blockedSlotsSemana) {
      const key = b.fecha.toISOString().slice(0, 10);
      if (!canceladasPorFecha.has(key)) canceladasPorFecha.set(key, new Set());
      canceladasPorFecha.get(key)!.add(b.hora);
    }
    const usadosPorFechaHora = new Map<string, number>();
    for (const a of appointmentsSemana) {
      const key = `${a.fecha.toISOString().slice(0, 10)}_${a.hora}`;
      usadosPorFechaHora.set(key, (usadosPorFechaHora.get(key) ?? 0) + 1);
    }

    const semana = fechasSemana
      .map((f) => {
        const fechaStr = f.toISOString().slice(0, 10);
        const diaSemana = f.getUTCDay();
        const horariosDelDia = HORARIOS_BASE.filter((h) =>
          schedules.some(
            (s) =>
              s.diaSemana === diaSemana && h >= s.horaInicio && h < s.horaFin,
          ),
        );
        if (horariosDelDia.length === 0) return null; // no es día de estudio

        const bloqueado = bloqueadasSet.has(fechaStr);
        const canceladasHoy =
          canceladasPorFecha.get(fechaStr) ?? new Set<string>();
        const horariosLibres = bloqueado
          ? []
          : horariosDelDia
              .filter((h) => !canceladasHoy.has(h))
              .map((h) => ({
                hora: h,
                quedan:
                  CUPO_DEFAULT -
                  (usadosPorFechaHora.get(`${fechaStr}_${h}`) ?? 0),
              }))
              .filter((h) => h.quedan > 0);

        return { fecha: fechaStr, bloqueado, horariosLibres };
      })
      .filter(
        (
          d,
        ): d is {
          fecha: string;
          bloqueado: boolean;
          horariosLibres: { hora: string; quedan: number }[];
        } => d !== null,
      );

    const alumnasPorHora = new Map<
      string,
      {
        id: string;
        nombre: string;
        nombreCompleto: string;
        pendiente: boolean;
      }[]
    >();
    for (const r of appointmentsHoyConNombre) {
      const lista = alumnasPorHora.get(r.hora) ?? [];
      lista.push({
        id: r.user.id,
        nombre: `${r.user.nombre} ${r.user.apellido[0]}.`,
        nombreCompleto: `${r.user.nombre} ${r.user.apellido}`,
        pendiente: r.estado === "PENDIENTE_PAGO",
      });
      alumnasPorHora.set(r.hora, lista);
    }
    const horariosDeHoy = HORARIOS_BASE.filter((h) =>
      schedules.some(
        (s) =>
          s.diaSemana === hoy.getUTCDay() && h >= s.horaInicio && h < s.horaFin,
      ),
    );
    const canceladasHoySet =
      canceladasPorFecha.get(hoy.toISOString().slice(0, 10)) ??
      new Set<string>();
    const bloqueadoHoy = bloqueadasSet.has(hoy.toISOString().slice(0, 10));
    const agendaHoy = horariosDeHoy.map((hora) => ({
      hora,
      cancelado: canceladasHoySet.has(hora),
      alumnas: alumnasPorHora.get(hora) ?? [],
    }));

    return NextResponse.json({
      pendientesDePago: pendientes.map((p) => ({
        id: p.id,
        fecha: p.fecha.toISOString().slice(0, 10),
        hora: p.hora,
        user: p.user,
      })),
      hoy: {
        fecha: hoy.toISOString().slice(0, 10),
        bloqueado: bloqueadoHoy,
        horarios: agendaHoy,
      },
      semana,
      alumnosMes: {
        actual: alumnasMesActual.length,
        pasado: alumnasMesPasado.length,
      },
    });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos cargar el inicio.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
