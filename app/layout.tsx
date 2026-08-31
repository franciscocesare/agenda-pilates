import { ReactNode } from "react";
import Shell from "@/components/Shell";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import "./globals.css";

export const metadata = {
  title: "Monte Pilates — Pilates clásico en Villa Ciudad Parque, Calamuchita",
  description:
    "Estudio de Pilates clásico en Villa Ciudad Parque, Valle de Calamuchita, Córdoba. Método original de Joseph Pilates, aparatos originales y grupos reducidos.",
};

// Server component: lee la sesión real de la cookie una sola vez acá
// arriba, y se la pasa al Shell (cliente) para header/nav/logout.
export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.userId },
        select: { id: true, nombre: true, apellido: true, rol: true, email: true, telefono: true },
      })
    : null;

  return (
    <html lang="es">
      <body>
        <Shell session={user}>{children}</Shell>
      </body>
    </html>
  );
}
