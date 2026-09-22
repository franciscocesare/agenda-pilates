export type { Alumno as Usuario, Credito } from "@/lib/types";

export type PlanCatalogo = {
  id: string;
  nombre: string;
  tipo: "SUELTA" | "MENSUAL";
  clasesPorSemana: number | null;
};

export type Modo = "credito" | "mensual" | "cortesia";
