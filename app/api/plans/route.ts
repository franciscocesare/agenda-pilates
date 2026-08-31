import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAndWrap } from "@/lib/errors";

// GET /api/plans -> planes activos para mostrar en "elegir plan"
export async function GET() {
  const planes = await prisma.planType.findMany({ where: { activo: true } });
  return NextResponse.json(planes);
}

const compraSchema = z.object({ planTypeId: z.string() });

// POST /api/plans -> registra el pago y genera el crédito
// (acá es donde después se conecta una pasarela de pago real;
// por ahora el pago queda CONFIRMADO directamente, como en los datos
// de prueba, para poder probar el flujo de reserva de punta a punta).
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { planTypeId } = compraSchema.parse(await req.json());
    const plan = await prisma.planType.findUnique({ where: { id: planTypeId } });
    if (!plan || !plan.activo) {
      return NextResponse.json({ error: "Ese plan ya no está disponible." }, { status: 404 });
    }

    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(inicio);
    fin.setDate(fin.getDate() + plan.duracionDias);

    const payment = await prisma.payment.create({
      data: {
        userId: session.userId,
        planTypeId: plan.id,
        monto: plan.precio,
        periodoInicio: inicio,
        periodoFin: fin,
        clasesDisponibles: plan.tipo === "SUELTA" ? plan.clasesIncluidas ?? 1 : 0,
        estado: "CONFIRMADO",
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos registrar el pago. Probá de nuevo.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
