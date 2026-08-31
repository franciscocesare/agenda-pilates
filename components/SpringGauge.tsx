"use client";
import { palette } from "./ui";

/** Indicador de cupo en forma de resorte de reformer: cada eslabón es
 * un lugar del cupo diario. Elemento visual propio de la marca. */
export default function SpringGauge({ used, total, size = "md" }: { used: number; total: number; size?: "sm" | "md" }) {
  const links = Array.from({ length: total });
  const h = size === "sm" ? 8 : 12;
  const gap = size === "sm" ? 2 : 3;
  return (
    <div style={{ display: "flex", gap, alignItems: "center", flexWrap: "wrap" }} aria-hidden="true">
      {links.map((_, i) => (
        <div
          key={i}
          style={{
            width: h * 0.9,
            height: h,
            borderRadius: 3,
            background: i < used ? palette.clay : palette.line,
            transform: i % 2 === 0 ? "rotate(8deg)" : "rotate(-8deg)",
          }}
        />
      ))}
    </div>
  );
}
