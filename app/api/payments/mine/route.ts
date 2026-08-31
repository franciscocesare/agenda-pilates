import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAndWrap } from "@/lib/errors";

// GET /api/payments/mine -> mis créditos/planes activos, para decidir
// si el flujo de reserva ofrece "clase suelta", "día fijo del mes", o
// mandar a comprar un plan.
export async function GET() {
  try {
    const session = await requireSession();
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

    const payments = await prisma.payment.findMany({
      where: { userId: session.userId, estado: "CONFIRMADO", periodoFin: { gte: hoy } },
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
    const e = logAndWrap(err, "No pudimos cargar tus planes.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
