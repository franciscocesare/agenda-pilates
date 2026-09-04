"use client";
import { ReactNode } from "react";
import { palette } from "../ui";

export type HorarioDia = {
  hora: string; cancelado: boolean; used: number; total: number;
  /** Solo viene del endpoint de admin (/api/admin/calendar-day), nunca del público. */
  alumnas?: { nombre: string; pendiente: boolean }[];
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
    <div style={{ borderRadius: 12, background: "#fff", border: `1px solid ${palette.line}`, padding: "10px 12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: palette.ink }}>{hora} hs</span>
        {children}
      </div>
      {subrow && <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${palette.line}` }}>{subrow}</div>}
    </div>
  );
}

export function Referencia({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ width: 10, height: 10, borderRadius: 4, background: color, display: "inline-block", flexShrink: 0 }} />
      {label}
    </span>
  );
}
