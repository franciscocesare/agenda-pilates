import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { reservarComoAdmin, reservarComoAdminConCredito, reservarComoAdminPendientePago, reservarPlanMensual } from "@/lib/booking";
import { logAndWrap } from "@/lib/errors";

// GET /api/admin/reservations?q=&fecha=&hora=&estado=
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const q = req.nextUrl.searchParams.get("q") ?? undefined;
    const fecha = req.nextUrl.searchParams.get("fecha") ?? undefined;
    const hora = req.nextUrl.searchParams.get("hora") ?? undefined;
    const estado = req.nextUrl.searchParams.get("estado") ?? undefined;

    const reservas = await prisma.appointment.findMany({
      where: {
        ...(fecha ? { fecha: new Date(fecha) } : {}),
        ...(hora ? { hora } : {}),
        ...(estado ? { estado: estado as "PENDIENTE_PAGO" | "CONFIRMADO" | "CANCELADO" | "COMPLETADO" | "AUSENTE" } : {}),
        ...(q
          ? {
              user: {
                OR: [
                  { nombre: { contains: q, mode: "insensitive" } },
                  { apellido: { contains: q, mode: "insensitive" } },
                  { telefono: { contains: q } },
                  { email: { contains: q, mode: "insensitive" } },
                ],
              },
            }
          : {}),
      },
      include: { user: { select: { nombre: true, apellido: true, telefono: true, email: true } } },
      orderBy: [{ fecha: "asc" }, { hora: "asc" }],
      take: 200,
    });

    return NextResponse.json(reservas);
  } catch (err) {
    const e = logAndWrap(err, "No pudimos cargar las reservas.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}

const manualSchema = z.discriminatedUnion("modo", [
  // Asigna un día puntual y consume un crédito de clase suelta del
  // alumno. `pagoConfirmado` decide si se descuenta el crédito ya
  // mismo (pago confirmado) o si el lugar queda apartado como
  // "pendiente de pago" hasta que el admin confirme el cobro.
  z.object({
    modo: z.literal("credito"),
    userId: z.string(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hora: z.string().regex(/^\d{2}:\d{2}$/),
    pagoConfirmado: z.boolean(),
  }),
  // Fija el día/horario semanal de un plan mensual del alumno; genera
  // automáticamente las clases de ese día para el resto del período pagado.
  z.object({
    modo: z.literal("mensual"),
    userId: z.string(),
    paymentId: z.string(),
    diaSemana: z.number().int().min(0).max(6),
    hora: z.string().regex(/^\d{2}:\d{2}$/),
  }),
  // Turno de cortesía: no descuenta ningún crédito (clase de prueba, reposición, etc).
  z.object({
    modo: z.literal("cortesia"),
    userId: z.string(),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    hora: z.string().regex(/^\d{2}:\d{2}$/),
  }),
]);

// POST /api/admin/reservations -> la profesora/admin le asigna un turno a
// un alumno. Es el único lugar del sistema donde se crean turnos: el
// alumno solo puede ver disponibilidad y pedir por WhatsApp, nunca
// reservar directamente.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = manualSchema.parse(await req.json());

    if (body.modo === "credito") {
      const cita = body.pagoConfirmado
        ? await reservarComoAdminConCredito(body.userId, body.fecha, body.hora)
        : await reservarComoAdminPendientePago(body.userId, body.fecha, body.hora);
      return NextResponse.json(cita, { status: 201 });
    }
    if (body.modo === "cortesia") {
      const cita = await reservarComoAdmin(body.userId, body.fecha, body.hora);
      return NextResponse.json(cita, { status: 201 });
    }
    const resultado = await reservarPlanMensual(body.userId, body.paymentId, body.diaSemana, body.hora);
    return NextResponse.json(resultado, { status: 201 });
  } catch (err) {
    const e = logAndWrap(err, "No pudimos crear la reserva.");
    return NextResponse.json({ error: e.userMessage }, { status: e.status });
  }
}
