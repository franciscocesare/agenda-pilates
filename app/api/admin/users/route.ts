import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { logAndWrap } from "@/lib/errors";

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
