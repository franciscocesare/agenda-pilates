// Nombres de estilo compartidos por toda la interfaz.
// Los colores y tipografías reales viven en un solo lugar:
// tailwind.config.ts. Este archivo solo expone:
//   - `palette`: los mismos colores en hexadecimal, para los pocos
//     casos en que una librería (íconos de lucide-react, SVGs) pide
//     un color en vez de una className de Tailwind.
//   - clases de Tailwind con nombre para los patrones que se repiten
//     en muchos componentes (botones, tarjetas, inputs), para no
//     repetir la misma lista de utilities en cada archivo.
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

export const btnPrimary = "btn-primary";
export const btnLogin = "btn-login";
export const btnPrimaryDisabled = "btn-primary-disabled";
export const btnSecondary = "btn-secondary";
export const btnGhost = "btn-ghost";
export const card = "card-base";
export const inputStyle = "input-field";

export { DIAS, DIAS_LARGO, HORARIOS_BASE, WHATSAPP_NUMBER, CUPO_DEFAULT } from "@/lib/constants";

export function fmtLarga(date: Date) {
  // Las fechas que llegan de la API son "solo fecha" guardadas en UTC
  // medianoche (ver toDateOnly en lib/booking.ts). Si acá se mostraran
  // en la hora LOCAL del navegador, en Argentina (UTC-3) medianoche
  // UTC cae a las 21hs del día anterior — y el texto mostraría un día
  // de menos. Por eso se fuerza a mostrar en UTC: son fechas civiles,
  // no un instante real que dependa del huso horario de quien mira.
  return date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
}
