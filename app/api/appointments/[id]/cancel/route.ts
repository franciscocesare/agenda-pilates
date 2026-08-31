import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { cancelarTurno } from "@/lib/booking";
import { logAndWrap } from "@/lib/errors";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    await cancelarTurno(session.userId, params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos cancelar el turno. Probá de nuevo.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
