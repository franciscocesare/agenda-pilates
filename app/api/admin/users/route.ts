import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { AppError, logAndWrap } from "@/lib/errors";
import { asegurarCodigoPais } from "@/lib/telefono";
import { capitalizarNombre } from "@/lib/texto";

// GET /api/admin/users?q=  -> buscar clientes por nombre/apellido/email/teléfono
// (para el buscador de la reserva manual)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const q = req.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) return NextResponse.json([]);

    const usuarios = await prisma.user.findMany({
      where: {
        rol: "CLIENTE",
        OR: [
          { nombre: { contains: q, mode: "insensitive" } },
          { apellido: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
          { telefono: { contains: q } },
        ],
      },
      select: { id: true, nombre: true, apellido: true, email: true, telefono: true },
      take: 10,
    });
    return NextResponse.json(usuarios);
  } catch (err) {
    const e = logAndWrap(err, "No pudimos buscar usuarios.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}

const crearSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().optional().default(""),
  telefono: z.string().min(6),
  email: z.string().email().optional().or(z.literal("")),
});

// POST /api/admin/users -> el admin carga la ficha de una alumna
// nueva. La contraseña arranca siendo su propio teléfono (solo los
// números, sin espacios ni guiones) — la alumna la puede cambiar
// después desde /cambiar-password, y hasta que no lo haga no puede
// editar su perfil (ver /api/users/[id]). El teléfono puede repetirse
// entre cuentas (familias que comparten uno solo) — no se bloquea.
// Se le agrega el código de país (+54 9) si no lo traía, para que el
// link de WhatsApp siempre funcione.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const datos = crearSchema.parse(await req.json());
    const email = datos.email?.trim() || undefined;
    const nombre = capitalizarNombre(datos.nombre);
    const apellido = capitalizarNombre(datos.apellido);
    const { telefono, valido: telefonoValido } = asegurarCodigoPais(datos.telefono);

    const yaExiste = email ? await prisma.user.findUnique({ where: { email } }) : null;
    if (yaExiste) throw new AppError("Ya hay una alumna cargada con ese email.", 409);

    // El mismo teléfono en más de una cuenta es válido (familias que
    // comparten uno solo). Si además nombre y apellido coinciden
    // exactos, probablemente sea la misma persona por error — se avisa
    // pero no se bloquea, para no trabarle una carga legítima al admin.
    const posibleDuplicado = await prisma.user.findFirst({
      where: { telefono, nombre: { equals: nombre, mode: "insensitive" }, apellido: { equals: apellido, mode: "insensitive" } },
    });

    const passwordHash = await hashPassword(telefono.replace(/[^\d]/g, ""));
    const user = await prisma.user.create({
      data: { nombre, apellido, telefono, email, passwordHash, passwordProvisoria: true },
      select: { id: true, nombre: true, apellido: true, email: true, telefono: true },
    });
    return NextResponse.json({ ...user, posibleDuplicado: !!posibleDuplicado, telefonoValido }, { status: 201 });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos cargar la ficha de la alumna.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}