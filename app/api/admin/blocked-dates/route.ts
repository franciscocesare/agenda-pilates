import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAndWrap } from "@/lib/errors";
import { toDateOnly } from "@/lib/booking";

// GET /api/admin/blocked-dates -> próximas fechas bloqueadas
export async function GET() {
  try {
    await requireAdmin();
    const hoy = toDateOnly(new Date());
    const bloqueos = await prisma.blockedDate.findMany({
      where: { fecha: { gte: hoy } },
      orderBy: { fecha: "asc" },
    });
    return NextResponse.json(bloqueos);
  } catch (err) {
    const e = logAndWrap(err, "No pudimos cargar los días bloqueados.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}

const schema = z.object({ fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), motivo: z.string().min(1) });

// POST /api/admin/blocked-dates -> bloquear un día puntual (feriado, etc.)
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { fecha, motivo } = schema.parse(await req.json());
    const bloqueo = await prisma.blockedDate.upsert({
      where: { fecha: new Date(fecha) },
      create: { fecha: new Date(fecha), motivo },
      update: { motivo },
    });
    return NextResponse.json(bloqueo, { status: 201 });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos bloquear ese día.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
