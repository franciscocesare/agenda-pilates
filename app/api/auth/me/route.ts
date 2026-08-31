import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json(null);
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, nombre: true, apellido: true, rol: true, email: true, telefono: true },
  });
  return NextResponse.json(user);
}
