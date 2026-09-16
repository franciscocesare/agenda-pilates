import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { AppError, logAndWrap } from "@/lib/errors";

// POST /api/admin/users/[id]/restablecer-password -> el admin
// resetea la contraseña de un alumno a la provisoria (su propio
// teléfono, sin espacios ni guiones) y la marca como provisoria de
// nuevo. Sirve tanto si alguien se olvidó la contraseña, como para
// destrabar el caso de dos cuentas que comparten teléfono y quedaron
// sin poder loguearse ninguna (se le resetea a UNA de las dos y esa
// ya puede entrar y elegir una contraseña distinta).
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAdmin();
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) throw new AppError("No encontramos ese usuario.", 404);

    const nuevaProvisoria = user.telefono.replace(/[^\d]/g, "");
    await prisma.user.update({
      where: { id: params.id },
      data: { passwordHash: await hashPassword(nuevaProvisoria), passwordProvisoria: true },
    });

    return NextResponse.json({ ok: true, nuevaProvisoria });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos restablecer la contraseña.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}