import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSession } from "@/lib/auth";
import { AppError, logAndWrap } from "@/lib/errors";

const schema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  email: z.string().email(),
  telefono: z.string().min(6),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());

    const existente = await prisma.user.findUnique({ where: { email: body.email } });
    if (existente) throw new AppError("Ya existe una cuenta con ese email.", 409);

    const user = await prisma.user.create({
      data: {
        nombre: body.nombre,
        apellido: body.apellido,
        email: body.email,
        telefono: body.telefono,
        passwordHash: await hashPassword(body.password),
      },
    });

    await createSession({ userId: user.id, rol: user.rol });
    return NextResponse.json({ id: user.id, nombre: user.nombre, apellido: user.apellido });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos crear tu cuenta. Probá de nuevo.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
