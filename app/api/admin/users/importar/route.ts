import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { logAndWrap } from "@/lib/errors";
import { asegurarCodigoPais } from "@/lib/telefono";
import { capitalizarNombre } from "@/lib/texto";

const filaSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().optional().default(""),
  telefono: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")).or(z.undefined()),
});
// A propósito NO se valida el shape de cada fila acá: eso se hace fila
// por fila más abajo, así una sola fila rara (email mal escrito,
// teléfono corto, etc.) no tira abajo el lote entero.
const schema = z.object({ alumnas: z.array(z.unknown()).min(1).max(500) });

// POST /api/admin/users/importar -> carga de una sola vez la lista de
// alumnas existentes (nombre, apellido opcional, teléfono, email
// opcional) — pensado para el arranque, cuando hay que cargar a todo
// el mundo de golpe en vez de una por una. A cada una le queda como
// contraseña provisoria su propio teléfono (solo números), que van a
// tener que cambiar antes de poder editar su perfil. El teléfono puede
// repetirse entre alumnas distintas (familias que comparten uno
// solo) — se considera duplicado real solo si coincide el email, o si
// coinciden nombre+apellido+teléfono a la vez (probablemente la misma
// persona cargada dos veces). Se procesa fila por fila: si una tiene un
// dato inválido o ya existe, se informa y se sigue con el resto en vez
// de frenar todo el lote.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const { alumnas } = schema.parse(await req.json());

    let creadas = 0;
    const duplicadas: string[] = [];
    const fallidas: { fila: string; motivo: string }[] = [];
    const telefonosDudosos: string[] = [];

    for (const filaCruda of alumnas) {
      const parseo = filaSchema.safeParse(filaCruda);
      if (!parseo.success) {
        const pista = typeof filaCruda === "object" && filaCruda && "nombre" in filaCruda ? String((filaCruda as { nombre?: unknown }).nombre) : "(fila sin nombre)";
        fallidas.push({ fila: pista, motivo: parseo.error.issues[0]?.message ?? "Datos inválidos." });
        continue;
      }
      const fila = parseo.data;
      const nombre = capitalizarNombre(fila.nombre);
      const apellido = capitalizarNombre(fila.apellido);
      const nombreCompleto = `${nombre} ${apellido}`.trim();
      const email = fila.email?.trim() || undefined;
      const { telefono, valido: telefonoValido } = asegurarCodigoPais(fila.telefono);
      if (!telefonoValido) telefonosDudosos.push(nombreCompleto);
      try {
        const yaExiste = await prisma.user.findFirst({
          where: {
            OR: [
              ...(email ? [{ email }] : []),
              { telefono, nombre: { equals: nombre, mode: "insensitive" as const }, apellido: { equals: apellido, mode: "insensitive" as const } },
            ],
          },
        });
        if (yaExiste) {
          duplicadas.push(nombreCompleto);
          continue;
        }
        const passwordHash = await hashPassword(telefono.replace(/[^\d]/g, ""));
        await prisma.user.create({
          data: { nombre, apellido, telefono, email, passwordHash, passwordProvisoria: true },
        });
        creadas++;
      } catch {
        fallidas.push({ fila: nombreCompleto, motivo: "No se pudo cargar (dato inválido o repetido)." });
      }
    }

    return NextResponse.json({ creadas, duplicadas, fallidas, telefonosDudosos });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos importar la lista de alumnas.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}