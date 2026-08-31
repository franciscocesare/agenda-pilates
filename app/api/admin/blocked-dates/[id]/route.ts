import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAndWrap } from "@/lib/errors";

// DELETE /api/admin/blocked-dates/[id] -> desbloquear un día
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    await prisma.blockedDate.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos desbloquear ese día.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
