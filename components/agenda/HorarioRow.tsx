"use client";
import { ReactNode } from "react";

export type HorarioDia = {
  hora: string; cancelado: boolean; used: number; total: number;
  /** Solo viene del endpoint de admin (/api/admin/calendar-day), nunca del público. */
  alumnas?: { id: string; nombre: string; nombreCompleto: string; pendiente: boolean }[];
};
/**
 * Fila de un horario dentro del panel desplegable de un día: la hora a
 * la izquierda y, a la derecha, lo que corresponda (botón de acción o
 * una etiqueta de estado) — lo decide quien use este componente. El
 * `subrow` opcional es una segunda línea debajo (ej. la lista de
 * alumnas anotadas), para no amontonar todo en una sola fila.
 */
export function HorarioRow({ hora, children, subrow }: { hora: string; children: ReactNode; subrow?: ReactNode }) {
  return (
    <div className="rounded-md2 border border-line bg-white px-3 py-2.5">
      <div className="flex items-center justify-between gap-2.5">
        <span className="text-[15px] font-extrabold text-ink">{hora} hs</span>
        {children}
      </div>
      {subrow && <div className="mt-2 border-t border-line pt-2">{subrow}</div>}
    </div>
  );
}

export function Referencia({ color, label }: { color: string; label: string }) {
  // `color` llega como un hex dinámico (según el estado del turno), así
  // que no puede resolverse a una className estática de Tailwind: acá sí
  // corresponde un estilo inline puntual.
  return (
    <span className="flex items-center gap-1.5">
      <span className="inline-block h-2.5 w-2.5 shrink-0 rounded" style={{ background: color }} />
      {label}
    </span>
  );
}
