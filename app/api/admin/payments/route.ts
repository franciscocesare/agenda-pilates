import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAndWrap } from "@/lib/errors";
import { toDateOnly } from "@/lib/booking";

// GET /api/admin/payments?userId=...
// Créditos/planes vigentes de un alumno puntual, para que la profesora
// o administración sepa de dónde descontar la clase al asignarle un
// turno (o si tiene un plan mensual con días fijos por elegir).
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const userId = req.nextUrl.searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Falta el alumno." }, { status: 400 });

    const hoy = toDateOnly(new Date());

    const payments = await prisma.payment.findMany({
      where: { userId, estado: "CONFIRMADO", periodoFin: { gte: hoy } },
      include: { planType: true, recurringReservations: { where: { activo: true } } },
      orderBy: { fechaPago: "desc" },
    });

    return NextResponse.json(
      payments.map((p) => ({
        id: p.id,
        nombre: p.planType.nombre,
        tipo: p.planType.tipo,
        clasesDisponibles: p.clasesDisponibles,
        clasesPorSemana: p.planType.clasesPorSemana,
        patrones: p.recurringReservations.map((r) => ({ diaSemana: r.diaSemana, hora: r.hora })),
      }))
    );
  } catch (err) {
    const e = logAndWrap(err, "No pudimos cargar los créditos del alumno.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
