import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { cancelarTurno, cambiarEstadoTurno, confirmarPagoTurno } from "@/lib/booking";
import { logAndWrap } from "@/lib/errors";

const schema = z.object({ estado: z.enum(["CANCELADO", "COMPLETADO", "AUSENTE", "CONFIRMAR_PAGO"]) });

// PATCH /api/admin/reservations/[id] -> cambiar el estado de una reserva
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const { estado } = schema.parse(await req.json());
    if (estado === "CANCELADO") {
      await cancelarTurno("", params.id, true);
    } else if (estado === "CONFIRMAR_PAGO") {
      await confirmarPagoTurno(params.id);
    } else {
      await cambiarEstadoTurno(params.id, estado);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos actualizar la reserva.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
