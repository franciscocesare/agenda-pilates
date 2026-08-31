import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAndWrap } from "@/lib/errors";
import { toDateOnly } from "@/lib/booking";
import { CUPO_DEFAULT, HORARIOS_BASE } from "@/lib/constants";

// GET /api/calendar?desde=YYYY-MM-DD&dias=42
// Calendario público de la Agenda: por cada día, si está
// disponible/completo/bloqueado/cerrado y su cupo agregado. No
// requiere sesión: cualquier visitante de la web puede ver la
// disponibilidad, aunque solo un alumno logueado puede pedirle un
// turno a administración.
//
// El cupo real es por horario (CUPO_DEFAULT lugares en cada franja),
// no por día. Acá agregamos esos cupos por horario para mostrar un
// resumen del día: "disponible" si queda lugar en al menos un
// horario, "completo" si todos los horarios de ese día están llenos o
// cancelados.
export async function GET(req: NextRequest) {
  try {
    const desdeParam = req.nextUrl.searchParams.get("desde");
    const dias = Math.min(Number(req.nextUrl.searchParams.get("dias") ?? 42), 62);
    const desde = desdeParam ? toDateOnly(desdeParam) : toDateOnly(new Date());

    const hasta = new Date(desde);
    hasta.setUTCDate(hasta.getUTCDate() + dias);

    const [bloqueos, blockedSlots, schedules, reservasPorHorario] = await Promise.all([
      prisma.blockedDate.findMany({ where: { fecha: { gte: desde, lt: hasta } } }),
      prisma.blockedSlot.findMany({ where: { fecha: { gte: desde, lt: hasta } } }),
      prisma.schedule.findMany({ where: { activo: true } }),
      prisma.appointment.groupBy({
        by: ["fecha", "hora"],
        where: { fecha: { gte: desde, lt: hasta }, estado: { in: ["CONFIRMADO", "PENDIENTE_PAGO"] } },
        _count: { _all: true },
      }),
    ]);

    const bloqueoPorFecha = new Map(bloqueos.map((b: { fecha: Date; motivo: string }) => [b.fecha.toISOString().slice(0, 10), b.motivo]));

    const canceladosPorFecha = new Map<string, Set<string>>();
    for (const b of blockedSlots as { fecha: Date; hora: string }[]) {
      const key = b.fecha.toISOString().slice(0, 10);
      if (!canceladosPorFecha.has(key)) canceladosPorFecha.set(key, new Set());
      canceladosPorFecha.get(key)!.add(b.hora);
    }

    const usadosPorHorario = new Map<string, number>();
    for (const r of reservasPorHorario) {
      const key = `${r.fecha.toISOString().slice(0, 10)}|${r.hora}`;
      usadosPorHorario.set(key, r._count._all);
    }

    const schedulesPorDia = new Map<number, { horaInicio: string; horaFin: string }[]>();
    for (const s of schedules) {
      if (!schedulesPorDia.has(s.diaSemana)) schedulesPorDia.set(s.diaSemana, []);
      schedulesPorDia.get(s.diaSemana)!.push(s);
    }

    const resultado = [];
    for (let i = 0; i < dias; i++) {
      const fecha = new Date(desde);
      fecha.setUTCDate(fecha.getUTCDate() + i);
      const key = fecha.toISOString().slice(0, 10);
      const weekday = fecha.getUTCDay();

      const motivo = bloqueoPorFecha.get(key);
      const franjas = schedulesPorDia.get(weekday) ?? [];
      const horariosDelDia = HORARIOS_BASE.filter((h) => franjas.some((f) => h >= f.horaInicio && h < f.horaFin));
      const canceladas = canceladosPorFecha.get(key) ?? new Set<string>();
      const horariosActivos = horariosDelDia.filter((h) => !canceladas.has(h));

      let status: "disponible" | "completo" | "bloqueado" | "cerrado";
      const total = horariosActivos.length * CUPO_DEFAULT;
      const used = horariosActivos.reduce((acc, h) => acc + (usadosPorHorario.get(`${key}|${h}`) ?? 0), 0);

      if (motivo) status = "bloqueado";
      else if (horariosDelDia.length === 0) status = "cerrado";
      else if (horariosActivos.length === 0) status = "completo"; // todos los horarios de hoy están cancelados
      else status = used >= total ? "completo" : "disponible";

      resultado.push({ fecha: key, weekday, status, used, total, motivo: motivo ?? null });
    }

    return NextResponse.json(resultado);
  } catch (err) {
    const e = logAndWrap(err, "No pudimos cargar el calendario.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
