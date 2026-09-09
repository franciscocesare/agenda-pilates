import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAndWrap } from "@/lib/errors";

type FeriadoArgentinaDatos = { fecha: string; tipo: string; nombre: string };

const schema = z.object({ anio: z.number().int().min(2016).max(2100).optional() });

// POST /api/admin/blocked-dates/importar-feriados -> trae el calendario
// oficial de feriados de Argentina (fuente pública: ArgentinaDatos, que
// a su vez toma los datos de La Nación) para un año y los carga como
// BlockedDate. Es un "upsert" por fecha: si ese día ya estaba bloqueado
// (por este mismo import de un año anterior o a mano), se actualiza el
// motivo y no se duplica. No borra nada — si el admin quiere reabrir
// alguno (ej. trabajar en un "puente" turístico igual), lo desbloquea
// después a mano con el botón de siempre.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { anio } = schema.parse(await req.json().catch(() => ({})));
    const anioConsulta = anio ?? new Date().getFullYear();

    const res = await fetch(`https://api.argentinadatos.com/v1/feriados/${anioConsulta}`);
    if (!res.ok) {
      return NextResponse.json({ error: "No pudimos consultar el calendario de feriados en este momento." }, { status: 502 });
    }
    const feriados: FeriadoArgentinaDatos[] = await res.json();

    const resultados = await Promise.all(
      feriados.map((f) =>
        prisma.blockedDate.upsert({
          where: { fecha: new Date(f.fecha) },
          create: { fecha: new Date(f.fecha), motivo: `Feriado: ${f.nombre}` },
          update: { motivo: `Feriado: ${f.nombre}` },
        })
      )
    );

    return NextResponse.json({ anio: anioConsulta, importados: resultados.length });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos importar los feriados.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}