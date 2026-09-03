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
  console.log("Sembrando datos de prueba...");

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

  // --- Planes: clase suelta, bono de 4, y mensuales de 1x/2x/3x por semana ---
  const planSuelta = await prisma.planType.create({
    data: {
      nombre: "Clase suelta",
      tipo: "SUELTA",
      clasesIncluidas: 1,
      precio: 6500,
      duracionDias: 30,
      activo: true,
    },
  });
  await prisma.planType.create({
    data: {
      nombre: "Bono 4 clases sueltas",
      tipo: "SUELTA",
      clasesIncluidas: 4,
      precio: 23000,
      duracionDias: 60,
      activo: true,
    },
  });
  const planMensual2x = await prisma.planType.create({
    data: {
      nombre: "Mensual 2 veces por semana",
      tipo: "MENSUAL",
      clasesPorSemana: 2,
      precio: 42000,
      duracionDias: 30,
      activo: true,
    },
  });
  await prisma.planType.create({
    data: {
      nombre: "Mensual 3 veces por semana",
      tipo: "MENSUAL",
      clasesPorSemana: 3,
      precio: 56000,
      duracionDias: 30,
      activo: true,
    },
  });

  // --- Usuarios ---
  const passwordHash = await bcrypt.hash("Demo1234", 12);

  const admin = await prisma.user.create({
    data: {
      nombre: "Mariana",
      apellido: "Administradora",
      email: "admin@montepilates.demo",
      telefono: "1100000200",
      passwordHash,
      rol: "ADMIN",
    },
  });

  const julieta = await prisma.user.create({
    data: {
      nombre: "Julieta",
      apellido: "Gómez",
      email: "julieta@correo.demo",
      telefono: "1123456589",
      passwordHash,
      rol: "CLIENTE",
    },
  });

  const martin = await prisma.user.create({
    data: {
      nombre: "Martín",
      apellido: "Ríos",
      email: "martin@correo.demo",
      telefono: "1199886122",
      passwordHash,
      rol: "CLIENTE",
    },
  });

  // --- Julieta compra un plan mensual 2x por semana ---
  const inicio = new Date();
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 30);
  await prisma.payment.create({
    data: {
      userId: julieta.id,
      planTypeId: planMensual2x.id,
      monto: 42000,
      periodoInicio: inicio,
      periodoFin: fin,
      clasesDisponibles: 0,
      estado: "CONFIRMADO",
    },
  });

  // --- Martín compra una clase suelta y la reserva para mañana ---
  const pagoSuelta = await prisma.payment.create({
    data: {
      userId: martin.id,
      planTypeId: planSuelta.id,
      monto: 6500,
      periodoInicio: inicio,
      periodoFin: fin,
      clasesDisponibles: 0,
      estado: "CONFIRMADO",
    },
  });
  const manana = new Date(inicio);
  manana.setDate(manana.getDate() + 1);
  await prisma.appointment.create({
    data: {
      userId: martin.id,
      fecha: manana,
      hora: "10:00",
      paymentId: pagoSuelta.id,
      estado: "CONFIRMADO",
    },
  });

  // --- Un horario completo (6/6) y un día bloqueado, para probar esos casos ---
  const dentroDeTresDias = new Date(inicio);
  dentroDeTresDias.setDate(dentroDeTresDias.getDate() + 3);
  const alumnasDeRelleno = await Promise.all(
    Array.from({ length: 6 }, (_, i) =>
      prisma.user.create({
        data: {
          nombre: "Alumna",
          apellido: `Demo ${i + 1}`,
          email: `alumna.demo${i + 1}@correo.demo`,
          telefono: "11 0000 0000",
          passwordHash,
          rol: "CLIENTE",
        },
      }),
    ),
  );
  await Promise.all(
    alumnasDeRelleno.map((u) =>
      prisma.appointment.create({
        data: {
          userId: u.id,
          fecha: dentroDeTresDias,
          hora: "09:00",
          estado: "CONFIRMADO",
        },
      }),
    ),
  ); // las 09:00 de ese día quedan con 6/6 — "sin lugar" en ese horario puntual

  const dentroDeCincoDias = new Date(inicio);
  dentroDeCincoDias.setDate(dentroDeCincoDias.getDate() + 5);
  await prisma.blockedDate.create({
    data: { fecha: dentroDeCincoDias, motivo: "Feriado" },
  });

  console.log("Listo. Credenciales de prueba (NO usar en producción):");
  console.log("  Admin:   admin@montepilates.demo   / Demo1234");
  console.log(
    "  Cliente: julieta@correo.demo       / Demo1234  (plan mensual 2x/semana, sin día fijo elegido aún)",
  );
  console.log(
    "  Cliente: martin@correo.demo        / Demo1234  (1 clase suelta reservada para mañana 10:00)",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
