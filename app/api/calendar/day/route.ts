import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logAndWrap } from "@/lib/errors";
import { toDateOnly } from "@/lib/booking";
import { HORARIOS_BASE, CUPO_DEFAULT } from "@/lib/constants";

// GET /api/calendar/day?fecha=YYYY-MM-DD
// Detalle público de un día puntual: qué horarios están habilitados,
// cuáles fueron cancelados puntualmente por la profesora/admin, y
// cuántos de los CUPO_DEFAULT lugares de cada horario ya están
// ocupados. El cupo es por horario, no por día: las 9:00 y las 10:00
// del mismo día tienen cada una sus propios lugares.
export async function GET(req: NextRequest) {
  try {
    const fechaStr = req.nextUrl.searchParams.get("fecha");
    if (!fechaStr) return NextResponse.json({ error: "Falta la fecha." }, { status: 400 });
    const fecha = toDateOnly(fechaStr);
    const diaSemana = fecha.getUTCDay();

    const [schedules, blockedSlots, reservasPorHora] = await Promise.all([
      prisma.schedule.findMany({ where: { diaSemana, activo: true } }),
      prisma.blockedSlot.findMany({ where: { fecha } }),
      prisma.appointment.groupBy({
        by: ["hora"],
        where: { fecha, estado: { in: ["CONFIRMADO", "PENDIENTE_PAGO"] } },
        _count: { _all: true },
      }),
    ]);

    const canceladas = new Set(blockedSlots.map((b: { hora: string }) => b.hora));
    const usadosPorHora = new Map(reservasPorHora.map((r: { hora: string; _count: { _all: number } }) => [r.hora, r._count._all]));

    const horarios = HORARIOS_BASE.filter((h) =>
      schedules.some((s: { horaInicio: string; horaFin: string }) => h >= s.horaInicio && h < s.horaFin)
    ).map((hora) => ({
      hora,
      cancelado: canceladas.has(hora),
      used: usadosPorHora.get(hora) ?? 0,
      total: CUPO_DEFAULT,
    }));

    return NextResponse.json({ fecha: fechaStr, horarios });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos cargar los horarios de ese día.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
