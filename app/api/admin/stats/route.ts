import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAndWrap } from "@/lib/errors";
import { CUPO_DEFAULT, HORARIOS_BASE } from "@/lib/constants";

export async function GET() {
  try {
    await requireAdmin();
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy); manana.setDate(manana.getDate() + 1);
    const pasadoManana = new Date(manana); pasadoManana.setDate(pasadoManana.getDate() + 1);

    const [turnosHoy, turnosManana, reservasActivas, cancelados, usuarios, schedulesHoy, canceladosHoy, bloqueoHoy] = await Promise.all([
      prisma.appointment.count({ where: { fecha: hoy, estado: "CONFIRMADO" } }),
      prisma.appointment.count({ where: { fecha: manana, estado: "CONFIRMADO" } }),
      prisma.appointment.count({ where: { estado: "CONFIRMADO", fecha: { gte: hoy } } }),
      prisma.appointment.count({ where: { estado: "CANCELADO" } }),
      prisma.user.count({ where: { rol: "CLIENTE" } }),
      prisma.schedule.findMany({ where: { diaSemana: hoy.getDay(), activo: true } }),
      prisma.blockedSlot.findMany({ where: { fecha: hoy } }),
      prisma.blockedDate.findUnique({ where: { fecha: hoy } }),
    ]);

    // Cupo real de hoy: la cantidad de horarios activos hoy (sin contar
    // los que la profesora canceló puntualmente), por los lugares fijos
    // de cada horario. Si el día entero está bloqueado, no hay cupo.
    const horariosDeHoy = HORARIOS_BASE.filter((h) => schedulesHoy.some((s: { horaInicio: string; horaFin: string }) => h >= s.horaInicio && h < s.horaFin));
    const canceladasHoySet = new Set(canceladosHoy.map((b: { hora: string }) => b.hora));
    const horariosActivosHoy = bloqueoHoy ? [] : horariosDeHoy.filter((h) => !canceladasHoySet.has(h));
    const cupoHoy = horariosActivosHoy.length * CUPO_DEFAULT;

    return NextResponse.json({
      turnosHoy, turnosManana, reservasActivas, cancelados, usuarios, cupoHoy,
    });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos cargar las estadísticas.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
