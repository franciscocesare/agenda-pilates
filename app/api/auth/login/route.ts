import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { AppError, logAndWrap } from "@/lib/errors";

// `identificador` acepta email O teléfono: como el admin puede cargar
// una ficha sin email, el teléfono es el único dato que siempre existe.
const schema = z.object({
  identificador: z.string().min(3),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    // email es único, pero teléfono NO (hay familias que comparten
    // uno solo) — puede haber más de una cuenta con el mismo teléfono.
    const candidatos = await prisma.user.findMany({
      where: { OR: [{ email: body.identificador }, { telefono: body.identificador }] },
    });

    // Mensaje idéntico exista o no la cuenta: no revela si existe.
    const credencialesInvalidas = new AppError("Email/teléfono o contraseña incorrectos.", 401);
    if (candidatos.length === 0) throw credencialesInvalidas;

    // Caso normal: una sola cuenta con ese dato.
    if (candidatos.length === 1) {
      const ok = await verifyPassword(body.password, candidatos[0].passwordHash);
      if (!ok) throw credencialesInvalidas;
      await createSession({ userId: candidatos[0].id, rol: candidatos[0].rol });
      return NextResponse.json({ id: candidatos[0].id, nombre: candidatos[0].nombre, rol: candidatos[0].rol });
    }

    // Teléfono compartido por varias cuentas: se intenta desambiguar
    // por la contraseña. En cuanto UNA de las hermanas/compañeras
    // cambie la suya, deja de ser ambiguo — el problema real es solo
    // mientras las dos sigan con la provisoria (su mismo teléfono).
    const coinciden = [];
    for (const candidato of candidatos) {
      if (await verifyPassword(body.password, candidato.passwordHash)) coinciden.push(candidato);
    }
    if (coinciden.length === 0) throw credencialesInvalidas;
    if (coinciden.length > 1) {
      throw new AppError(
        "Ese teléfono está cargado en más de una cuenta y todavía no cambiaron la contraseña, así que no podemos saber a cuál entrar. Pedile a tu profesora que te ayude, o iniciá sesión con tu email si tenés uno cargado.",
        409
      );
    }

    await createSession({ userId: coinciden[0].id, rol: coinciden[0].rol });
    return NextResponse.json({ id: coinciden[0].id, nombre: coinciden[0].nombre, rol: coinciden[0].rol });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos iniciar sesión. Probá de nuevo.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}