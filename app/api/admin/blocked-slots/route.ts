import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { cancelarHorarioParaTodos } from "@/lib/booking";
import { logAndWrap } from "@/lib/errors";

// GET /api/admin/blocked-slots -> próximos horarios puntuales cancelados
export async function GET() {
  try {
    await requireAdmin();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const bloqueos = await prisma.blockedSlot.findMany({
      where: { fecha: { gte: hoy } },
      orderBy: [{ fecha: "asc" }, { hora: "asc" }],
    });
    return NextResponse.json(bloqueos);
  } catch (err) {
    const e = logAndWrap(err, "No pudimos cargar los horarios cancelados.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}

const schema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^\d{2}:\d{2}$/),
  motivo: z.string().min(1),
});

// POST /api/admin/blocked-slots -> cancela un horario puntual de un día
// (ej. por falta de alumnas). Deja de ofrecerse para nuevas reservas y
// cancela automáticamente las que ya estuvieran confirmadas en ese
// horario, devolviendo el crédito correspondiente a cada alumna.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { fecha, hora, motivo } = schema.parse(await req.json());
    const resultado = await cancelarHorarioParaTodos(fecha, hora, motivo);
    return NextResponse.json(resultado, { status: 201 });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos cancelar ese horario.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
