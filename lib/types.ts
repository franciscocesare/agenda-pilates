/** Los datos básicos de una alumna, usados en varias partes del panel admin. */
export type Alumno = {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
};

/** Un plan comprado por una alumna (clases sueltas o un plan mensual), tal como lo devuelve /api/admin/payments. */
export type Credito = {
  id: string;
  nombre: string;
  tipo: "SUELTA" | "MENSUAL";
  planTypeId: string;
  clasesDisponibles: number;
  clasesPorSemana: number | null;
  patrones: { diaSemana: number; hora: string }[];
  esCredito: boolean;
  vencimiento: string;
};
