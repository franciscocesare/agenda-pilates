import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { AppError, logAndWrap } from "@/lib/errors";

const schema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  email: z.string().email().optional(),
  telefono: z.string().min(6).optional(),
});

// PATCH /api/users/[id] -> editar datos de perfil (nombre, apellido,
// email, teléfono). Cualquier persona puede editar SU PROPIO perfil;
// un admin puede editar el de cualquiera (ej. desde el buscador de
// alumnos). Queda guardado quién hizo la ÚLTIMA edición y cuándo
// (actualizadoPorNombre/actualizadoEn en el propio User) — no es un
// historial completo, solo el dato más reciente.
//
// Si la persona todavía tiene la contraseña PROVISORIA (la que le puso
// el admin al crear la ficha, su propio teléfono), no puede editar su
// perfil hasta que la cambie primero por una propia — eso NO aplica
// cuando quien edita es un admin editando el perfil de otra persona.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const esUnoMismo = session.userId === params.id;
    if (!esUnoMismo && session.rol !== "ADMIN") {
      throw new AppError("No podés editar el perfil de otra persona.", 403);
    }

    const cambios = schema.parse(await req.json());

    const [actual, quienEdita] = await Promise.all([
      prisma.user.findUnique({ where: { id: params.id } }),
      esUnoMismo ? null : prisma.user.findUnique({ where: { id: session.userId } }),
    ]);
    if (!actual) throw new AppError("No encontramos ese usuario.", 404);

    if (esUnoMismo && actual.passwordProvisoria) {
      throw new AppError("Antes de editar tu perfil, tenés que cambiar tu contraseña (la inicial es tu teléfono).", 403);
    }

    // email sigue siendo único: si el nuevo valor ya lo tiene otra
    // persona, se avisa en vez de que reviente por la restricción de
    // la base de datos. El teléfono YA NO es único (familias que
    // comparten uno solo), así que no se bloquea por eso.
    if (cambios.email && cambios.email !== actual.email) {
      const existente = await prisma.user.findUnique({ where: { email: cambios.email } });
      if (existente) throw new AppError("Ese email ya está en uso por otra cuenta.", 409);
    }

    const actualizado = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...cambios,
        actualizadoPorNombre: esUnoMismo ? `${actual.nombre} ${actual.apellido} (ella misma)` : `${quienEdita!.nombre} ${quienEdita!.apellido} (admin)`,
        actualizadoEn: new Date(),
      },
    });

    return NextResponse.json({
      id: actualizado.id,
      nombre: actualizado.nombre,
      apellido: actualizado.apellido,
      email: actualizado.email,
      telefono: actualizado.telefono,
    });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos guardar los cambios del perfil.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}