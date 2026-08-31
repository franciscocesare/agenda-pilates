import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth";
import { logAndWrap } from "@/lib/errors";

// El alumno NUNCA reserva por su cuenta: solo la profesora/admin asigna
// días y horarios (ver /api/admin/reservations). Este endpoint es
// exclusivamente de lectura, para que el alumno vea sus propios turnos.

// GET /api/appointments -> mis próximos turnos
export async function GET() {
  try {
    const session = await requireSession();
    const turnos = await prisma.appointment.findMany({
      where: { userId: session.userId, estado: "CONFIRMADO", fecha: { gte: new Date() } },
      orderBy: [{ fecha: "asc" }, { hora: "asc" }],
    });
    return NextResponse.json(turnos);
  } catch (err) {
    const e = logAndWrap(err, "No pudimos traer tus turnos.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
