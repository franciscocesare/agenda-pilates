"use client";
import { ReactNode } from "react";
import { palette } from "../ui";

export type HorarioDia = { hora: string; cancelado: boolean; used: number; total: number };

/**
 * Fila de un horario dentro del panel desplegable de un día: la hora a
 * la izquierda y, a la derecha, lo que corresponda (botón de acción o
 * una etiqueta de estado) — lo decide quien use este componente.
 */
export function HorarioRow({ hora, children }: { hora: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
        padding: "10px 12px", borderRadius: 12, background: "#fff", border: `1px solid ${palette.line}`,
      }}
    >
      <span style={{ fontWeight: 800, fontSize: 15, color: palette.ink }}>{hora} hs</span>
      {children}
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
