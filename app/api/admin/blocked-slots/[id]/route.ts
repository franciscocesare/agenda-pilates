import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { reabrirHorario } from "@/lib/booking";
import { logAndWrap } from "@/lib/errors";

// DELETE /api/admin/blocked-slots/[id] -> reabre un horario puntual que
// había sido cancelado (vuelve a ofrecerse para nuevas reservas; no
// reactiva los turnos que ya se habían cancelado por esto).
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await reabrirHorario(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos reabrir ese horario.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
