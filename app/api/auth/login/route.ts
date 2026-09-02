import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { AppError, logAndWrap } from "@/lib/errors";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
//Login function
export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const user = await prisma.user.findUnique({ where: { email: body.email } });

    // Mensaje idéntico exista o no el email: no revela si una cuenta existe.
    const credencialesInvalidas = new AppError("Email o contraseña incorrectos.", 401);
    if (!user) throw credencialesInvalidas;

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) throw credencialesInvalidas;

    await createSession({ userId: user.id, rol: user.rol });
    return NextResponse.json({ id: user.id, nombre: user.nombre, rol: user.rol });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos iniciar sesión. Probá de nuevo.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
