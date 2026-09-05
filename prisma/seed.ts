import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL no está definida");
}

const adapter = new PrismaPg({
  connectionString,
});

export const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Sembrando datos base...");

  // --- Configuración general ---
  await prisma.config.upsert({
    where: { clave: "horas_minimas_cancelacion" },
    create: { clave: "horas_minimas_cancelacion", valor: "3" },
    update: { valor: "3" },
  });

  // --- Horarios de atención: fijos, no editables desde el panel admin ---
  // Lunes a sábado, de 9 a 13 y de 15 a 21. Domingo cerrado.
  const franjas = [1, 2, 3, 4, 5, 6].flatMap((dia) => [
    { diaSemana: dia, horaInicio: "09:00", horaFin: "13:00" },
    { diaSemana: dia, horaInicio: "15:00", horaFin: "21:00" },
  ]);
  for (const f of franjas) {
    await prisma.schedule.create({ data: { ...f, activo: true } });
  }

  // --- Planes ---
  // NOTA: "precio" queda en 0 como placeholder. El negocio todavía no definió
  // valores finales; se puede editar a mano después sin que rompa nada, ya
  // que ningún flujo de reserva/cancelación depende de este número.
  await prisma.planType.create({
    data: {
      nombre: "Clase suelta",
      tipo: "SUELTA",
      clasesIncluidas: 1,
      precio: 0,
      duracionDias: 30,
      activo: true,
    },
  });
  await prisma.planType.create({
    data: {
      nombre: "Bono 4 clases sueltas",
      tipo: "SUELTA",
      clasesIncluidas: 4,
      precio: 0,
      duracionDias: 60,
      activo: true,
    },
  });
  await prisma.planType.create({
    data: {
      nombre: "Mensual 1 vez por semana",
      tipo: "MENSUAL",
      clasesPorSemana: 1,
      precio: 0,
      duracionDias: 30,
      activo: true,
    },
  });
  await prisma.planType.create({
    data: {
      nombre: "Mensual 2 veces por semana",
      tipo: "MENSUAL",
      clasesPorSemana: 2,
      precio: 0,
      duracionDias: 30,
      activo: true,
    },
  });
  await prisma.planType.create({
    data: {
      nombre: "Mensual 3 veces por semana",
      tipo: "MENSUAL",
      clasesPorSemana: 3,
      precio: 0,
      duracionDias: 30,
      activo: true,
    },
  });

  // --- Usuarios ---
  const passwordHash = await bcrypt.hash("Demo1234", 12);

  await prisma.user.create({
    data: {
      nombre: "Mariana",
      apellido: "Administradora",
      email: "admin@montepilates.demo",
      telefono: "1100000200",
      passwordHash,
      rol: "ADMIN",
    },
  });

  await prisma.user.create({
    data: {
      nombre: "Usuario",
      apellido: "Demo",
      email: "usuario@montepilates.demo",
      telefono: "1100000300",
      passwordHash,
      rol: "CLIENTE",
    },
  });

  console.log("Listo. Credenciales (NO usar en producción):");
  console.log("  Admin: admin@montepilates.demo   / Demo1234");
  console.log("  User:  usuario@montepilates.demo / Demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });