import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAndWrap } from "@/lib/errors";
import { toDateOnly, horarioYaPaso, marcarClasesPasadasComoCompletadas } from "@/lib/booking";
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

    // Antes de armar la respuesta, se ponen al día las clases de hoy o
    // antes que ya pasaron y seguían en CONFIRMADO — así lo que ve el
    // admin ya refleja quién quedó "presente" sin que nadie la haya
    // tocado a mano.
    await marcarClasesPasadasComoCompletadas();

    const [schedules, blockedSlots, reservas] = await Promise.all([
      prisma.schedule.findMany({ where: { diaSemana, activo: true } }),
      prisma.blockedSlot.findMany({ where: { fecha } }),
      prisma.appointment.findMany({
        where: { fecha, estado: { in: ["CONFIRMADO", "PENDIENTE_PAGO", "COMPLETADO", "AUSENTE", "CANCELADO"] } },
        select: { hora: true, estado: true, user: { select: { id: true, nombre: true, apellido: true } } },
        orderBy: { user: { nombre: "asc" } },
      }),
    ]);

    const canceladas = new Set(blockedSlots.map((b: { hora: string }) => b.hora));
    const alumnasPorHora = new Map<string, { id: string; nombre: string; nombreCompleto: string; pendiente: boolean; cancelado: boolean }[]>();
    for (const r of reservas) {
      const lista = alumnasPorHora.get(r.hora) ?? [];
      lista.push({
        id: r.user.id,
        nombre: `${r.user.nombre} ${r.user.apellido[0]}.`,
        nombreCompleto: `${r.user.nombre} ${r.user.apellido}`,
        pendiente: r.estado === "PENDIENTE_PAGO",
        cancelado: r.estado === "CANCELADO",
      });
      alumnasPorHora.set(r.hora, lista);
    }

    const horarios = HORARIOS_BASE.filter((h) =>
      schedules.some((s: { horaInicio: string; horaFin: string }) => h >= s.horaInicio && h < s.horaFin)
    ).map((hora) => {
      const alumnas = alumnasPorHora.get(hora) ?? [];
      // Una alumna cancelada se sigue mostrando (para que quede el
      // registro de que canceló), pero no cuenta como lugar ocupado:
      // por eso "used" se calcula aparte, sin las canceladas.
      const usadas = alumnas.filter((a) => !a.cancelado).length;
      // A diferencia de la agenda pública, acá NO se sacan las horas
      // pasadas de la lista (el admin necesita poder revisar una
      // clase de más temprano hoy) — solo se marcan, para que la
      // pantalla oculte el botón de asignar en esas.
      return { hora, cancelado: canceladas.has(hora), used: usadas, total: CUPO_DEFAULT, alumnas, pasado: horarioYaPaso(fecha, hora) };
    });

    return NextResponse.json({ fecha: fechaStr, horarios });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos cargar los horarios de ese día.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}