import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAndWrap } from "@/lib/errors";
import { toDateOnly } from "@/lib/booking";
import { HORARIOS_BASE, CUPO_DEFAULT } from "@/lib/constants";

// GET /api/admin/calendar-day?fecha=YYYY-MM-DD
// Igual que el /api/calendar/day público, pero con los nombres de las
// alumnas de cada horario — por eso es un endpoint aparte y separado,
// protegido con requireAdmin(): el público nunca debe filtrar nombres.
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const fechaStr = req.nextUrl.searchParams.get("fecha");
    if (!fechaStr) return NextResponse.json({ error: "Falta la fecha." }, { status: 400 });
    const fecha = toDateOnly(fechaStr);
    const diaSemana = fecha.getUTCDay();

    const [schedules, blockedSlots, reservas] = await Promise.all([
      prisma.schedule.findMany({ where: { diaSemana, activo: true } }),
      prisma.blockedSlot.findMany({ where: { fecha } }),
      prisma.appointment.findMany({
        where: { fecha, estado: { in: ["CONFIRMADO", "PENDIENTE_PAGO"] } },
        select: { hora: true, estado: true, user: { select: { nombre: true, apellido: true } } },
        orderBy: { user: { nombre: "asc" } },
      }),
    ]);

    const canceladas = new Set(blockedSlots.map((b: { hora: string }) => b.hora));
    const alumnasPorHora = new Map<string, { nombre: string; pendiente: boolean }[]>();
    for (const r of reservas) {
      const lista = alumnasPorHora.get(r.hora) ?? [];
      lista.push({ nombre: `${r.user.nombre} ${r.user.apellido[0]}.`, pendiente: r.estado === "PENDIENTE_PAGO" });
      alumnasPorHora.set(r.hora, lista);
    }

    const horarios = HORARIOS_BASE.filter((h) =>
      schedules.some((s: { horaInicio: string; horaFin: string }) => h >= s.horaInicio && h < s.horaFin)
    ).map((hora) => {
      const alumnas = alumnasPorHora.get(hora) ?? [];
      return { hora, cancelado: canceladas.has(hora), used: alumnas.length, total: CUPO_DEFAULT, alumnas };
    });

    return NextResponse.json({ fecha: fechaStr, horarios });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos cargar los horarios de ese día.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}