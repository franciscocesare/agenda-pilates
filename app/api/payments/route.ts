import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAndWrap, Errores } from "@/lib/errors";
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
        esCredito: p.esCredito,
        vencimiento: p.periodoFin,
      }))
    );
  } catch (err) {
    const e = logAndWrap(err, "No pudimos cargar los créditos del alumno.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}

const ventaSchema = z.object({ userId: z.string(), planTypeId: z.string() });

// POST /api/admin/payments -> el admin registra la venta de un plan
// (mensual o bono de clases sueltas) a un alumno puntual, sin que el
// alumno tenga que pasar por /planes. Deja el pago CONFIRMADO directo,
// igual que la compra por autoservicio: acá es donde después se
// conecta una pasarela de pago real si hiciera falta.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { userId, planTypeId } = ventaSchema.parse(await req.json());

    const [alumno, plan] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.planType.findUnique({ where: { id: planTypeId } }),
    ]);
    if (!alumno) throw Errores.alumnoNoEncontrado();
    if (!plan || !plan.activo) return NextResponse.json({ error: "Ese plan ya no está disponible." }, { status: 404 });

    const inicio = toDateOnly(new Date());
    const fin = new Date(inicio);
    fin.setUTCDate(fin.getUTCDate() + plan.duracionDias);

    const payment = await prisma.payment.create({
      data: {
        userId,
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
    const e = logAndWrap(err, "No pudimos registrar el plan.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
