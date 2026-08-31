// Design tokens compartidos por toda la interfaz.
// Paleta tomada del Instagram real del estudio (@monte.pilates).
import type { CSSProperties } from "react";

export const FONT = "'Manrope', ui-sans-serif, system-ui, sans-serif";
export const FONT_DISPLAY = "'Fraunces', 'Manrope', ui-serif, serif";

export const palette = {
  bg: "#F3E9DB",
  card: "#FFFBF4",
  ink: "#3C2A20",
  inkSoft: "#8C7A6B",
  line: "#E6D8C4",
  moss: "#6E4A38",
  mossDark: "#4E3325",
  mossSoft: "#EDE0D0",
  clay: "#C43E8E",
  clayDark: "#9C2E6E",
  claySoft: "#FAE1EF",
  danger: "#B5453A",
  dangerSoft: "#F6E2DE",
} as const;

export const btnPrimary: CSSProperties = {
  width: "100%", padding: "16px 20px", borderRadius: 14, border: "none",
  background: palette.clay, color: "#fff", fontWeight: 700, fontSize: 16,
  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
};
export const btnPrimaryDisabled: CSSProperties = { ...btnPrimary, background: "#D8CFC0", color: "#8C876F", cursor: "not-allowed" };
export const btnSecondary: CSSProperties = {
  width: "100%", padding: "16px 20px", borderRadius: 14, border: `1.5px solid ${palette.line}`,
  background: "#fff", color: palette.ink, fontWeight: 700, fontSize: 16, cursor: "pointer",
};
export const btnGhost: CSSProperties = {
  padding: "10px 16px", borderRadius: 10, border: `1.5px solid ${palette.moss}`,
  background: "transparent", color: palette.moss, fontWeight: 700, fontSize: 14, cursor: "pointer",
};
export const card: CSSProperties = { background: palette.card, borderRadius: 16, border: `1px solid ${palette.line}`, padding: 20 };
export const inputStyle: CSSProperties = {
  width: "100%", padding: "13px 14px", borderRadius: 12, border: `1.5px solid ${palette.line}`,
  fontSize: 15, fontFamily: FONT, color: palette.ink, background: "#fff", boxSizing: "border-box",
};

export { DIAS, DIAS_LARGO, HORARIOS_BASE, WHATSAPP_NUMBER, CUPO_DEFAULT } from "@/lib/constants";

export function fmtLarga(date: Date) {
  return date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
}
