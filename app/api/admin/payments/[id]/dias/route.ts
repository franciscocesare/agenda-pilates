import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { modificarDiasPlanMensual } from "@/lib/booking";
import { logAndWrap } from "@/lib/errors";

const schema = z.object({
  userId: z.string(),
  dias: z
    .array(z.object({ diaSemana: z.number().int().min(0).max(6), hora: z.string().regex(/^\d{2}:\d{2}$/) }))
    .min(1),
});

// PUT /api/admin/payments/[id]/dias -> cambia los días/horarios fijos
// de un plan mensual que ya existe (params.id es el paymentId). Da de
// baja los días actuales (cancela lo que quedaba reservado de hoy en
// adelante) y fija los nuevos para lo que resta del mes en curso.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const { userId, dias } = schema.parse(await req.json());
    const resultado = await modificarDiasPlanMensual(userId, params.id, dias);
    return NextResponse.json(resultado);
  } catch (err) {
    const e = logAndWrap(err, "No pudimos modificar los días del plan.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}