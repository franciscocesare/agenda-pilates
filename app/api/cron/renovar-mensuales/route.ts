import { NextRequest, NextResponse } from "next/server";
import { renovarPlanesMensuales } from "@/lib/booking";
import { sincronizarFeriadosSiCorresponde } from "@/lib/feriados";
import { logAndWrap } from "@/lib/errors";

// GET /api/cron/renovar-mensuales -> pensado para que lo llame Vercel
// Cron una vez al principio de cada mes (ver vercel.json). Genera los
// turnos del mes de todos los planes mensuales activos, y de paso
// sincroniza el calendario de feriados si el admin tiene esa opción
// activada (no hace nada si no la activó).
//
// Protegido con CRON_SECRET: Vercel Cron manda automáticamente el
// header "Authorization: Bearer <CRON_SECRET>" en cada invocación
// propia si esa variable de entorno está configurada en el proyecto,
// así que alcanza con compararlo acá para que nadie más pueda
// disparar la renovación pegándole a esta URL.
export async function GET(req: NextRequest) {
  try {
    const secreto = process.env.CRON_SECRET;
    if (secreto) {
      const auth = req.headers.get("authorization");
      if (auth !== `Bearer ${secreto}`) {
        return NextResponse.json({ error: "No autorizado." }, { status: 401 });
      }
    }

    const [planesMensuales, feriados] = await Promise.all([
      renovarPlanesMensuales(),
      sincronizarFeriadosSiCorresponde(),
    ]);
    return NextResponse.json({ planesMensuales, feriados });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos renovar los planes mensuales.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}