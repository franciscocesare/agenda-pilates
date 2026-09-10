import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { logAndWrap } from "@/lib/errors";
import { leerFeriadosAutoActivo, guardarFeriadosAutoActivo, sincronizarFeriadosSiCorresponde } from "@/lib/feriados";

// GET /api/admin/config/feriados-argentina -> el estado actual del
// checkbox "cargar feriados de Argentina automáticamente".
export async function GET() {
  try {
    await requireAdmin();
    const activo = await leerFeriadosAutoActivo();
    return NextResponse.json({ activo });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos leer la configuración de feriados.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}

const schema = z.object({ activo: z.boolean() });

// PUT /api/admin/config/feriados-argentina -> prende o apaga la
// sincronización automática. Al PRENDERLA, importa de una el
// calendario del año en curso (y el que viene, si ya estamos sobre
// fin de año) para que el efecto se vea al toque, sin esperar al
// próximo cron mensual. Al apagarla, solo deja de traer feriados
// nuevos — no desbloquea los días que ya se habían cargado.
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin();
    const { activo } = schema.parse(await req.json());
    await guardarFeriadosAutoActivo(activo);
    const resultado = activo ? await sincronizarFeriadosSiCorresponde() : { sincronizado: false as const };
    return NextResponse.json({ activo, ...resultado });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos guardar la configuración de feriados.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}