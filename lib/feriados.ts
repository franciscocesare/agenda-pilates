import { prisma } from "./prisma";

type FeriadoArgentinaDatos = { fecha: string; tipo: string; nombre: string };

const CLAVE_CONFIG = "feriados_argentina_auto";

/** Trae el calendario oficial de feriados de Argentina para un año
 * (fuente pública: ArgentinaDatos, que a su vez toma los datos de La
 * Nación) y los carga como BlockedDate. Es un "upsert" por fecha: si
 * ese día ya estaba bloqueado (por este mismo import de un año
 * anterior o a mano), se actualiza el motivo y no se duplica. No borra
 * nada — si el admin quiere reabrir alguno (ej. trabajar en un
 * "puente" turístico igual), lo desbloquea después a mano. */
export async function importarFeriadosArgentina(anio: number) {
  const res = await fetch(`https://api.argentinadatos.com/v1/feriados/${anio}`);
  if (!res.ok) throw new Error(`No se pudo consultar el calendario de feriados de ${anio}.`);
  const feriados: FeriadoArgentinaDatos[] = await res.json();

  await Promise.all(
    feriados.map((f) =>
      prisma.blockedDate.upsert({
        where: { fecha: new Date(f.fecha) },
        create: { fecha: new Date(f.fecha), motivo: `Feriado: ${f.nombre}` },
        update: { motivo: `Feriado: ${f.nombre}` },
      })
    )
  );

  return feriados.length;
}

export async function leerFeriadosAutoActivo() {
  const config = await prisma.config.findUnique({ where: { clave: CLAVE_CONFIG } });
  return config?.valor === "true";
}

export async function guardarFeriadosAutoActivo(activo: boolean) {
  await prisma.config.upsert({
    where: { clave: CLAVE_CONFIG },
    create: { clave: CLAVE_CONFIG, valor: String(activo) },
    update: { valor: String(activo) },
  });
}

/**
 * Si el admin tiene activada la sincronización automática, importa el
 * año en curso y, sobre el final del año (noviembre/diciembre),
 * también el que viene — para que el calendario ya tenga cargados los
 * feriados del año siguiente antes de que empiece. Pensada para
 * llamarse desde el cron mensual: es idempotente (upsert), así que no
 * hay problema en correrla todos los meses aunque no haya cambiado nada.
 */
export async function sincronizarFeriadosSiCorresponde() {
  const activo = await leerFeriadosAutoActivo();
  if (!activo) return { sincronizado: false as const };

  const hoy = new Date();
  const anios = [hoy.getUTCFullYear()];
  if (hoy.getUTCMonth() >= 10) anios.push(hoy.getUTCFullYear() + 1); // 10 = noviembre (0-indexado)

  try {
    const resultados: Record<number, number> = {};
    for (const anio of anios) {
      resultados[anio] = await importarFeriadosArgentina(anio);
    }
    return { sincronizado: true as const, anios: resultados };
  } catch (err) {
    // Un fallo puntual de la API pública de feriados no debe tirar
    // abajo el resto del cron (ej. la renovación de planes mensuales);
    // el mes que viene se reintenta solo.
    console.error("Error sincronizando feriados:", err);
    return { sincronizado: false as const, error: true };
  }
}