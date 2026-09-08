import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { cancelarPlanMensualDeAlumno } from "@/lib/booking";
import { logAndWrap } from "@/lib/errors";

// POST /api/admin/users/[id]/cancelar-mensual -> "Cancelar clases": da de
// baja el/los patrón(es) de plan mensual de este alumno (ej. no se
// detectó el pago del mes) y cancela lo que quedaba reservado de acá
// en adelante, para liberar esos lugares en la agenda.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const resultado = await cancelarPlanMensualDeAlumno(params.id);
    return NextResponse.json(resultado);
  } catch (err) {
    const e = logAndWrap(err, "No pudimos dar de baja el plan mensual.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
