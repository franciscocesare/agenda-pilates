import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, verifyPassword, hashPassword } from "@/lib/auth";
import { AppError, logAndWrap } from "@/lib/errors";

const schema = z.object({
  passwordActual: z.string().min(1),
  passwordNueva: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

// POST /api/auth/cambiar-password -> el propio usuario cambia su
// contraseña. Es el paso obligatorio para una alumna que arrancó con
// la contraseña provisoria (su teléfono) que le puso el admin: hasta
// que no la cambia acá, no puede editar su perfil (ver /api/users/[id]).
export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { passwordActual, passwordNueva } = schema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new AppError("No encontramos tu cuenta.", 404);

    const ok = await verifyPassword(passwordActual, user.passwordHash);
    if (!ok) throw new AppError("La contraseña actual no coincide.", 401);

    const soloNumeros = user.telefono.replace(/[^\d]/g, "");
    if (passwordNueva === soloNumeros) {
      throw new AppError("Elegí una contraseña distinta a tu número de teléfono.", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(passwordNueva), passwordProvisoria: false },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos cambiar la contraseña.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}