"use client";
import { Fragment, ReactNode, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Star } from "lucide-react";
import { FONT_DISPLAY, palette, card, DIAS } from "../ui";
import Reveal from "../Reveal";

export type DiaCalendario = { fecha: string; weekday: number; status: string; used: number; total: number; motivo: string | null };

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function toKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

type Props = {
  /** Día actualmente expandido (controlado por quien usa MonthGrid). null = ninguno. */
  diaExpandido: DiaCalendario | null;
  /** Se llama al tocar un día: si ya estaba expandido, conviene pasar null para cerrarlo. */
  onToggleDay: (d: DiaCalendario | null) => void;
  /** Contenido que se despliega, a todo lo ancho, debajo de la semana del día expandido. */
  renderPanel: (dia: DiaCalendario) => ReactNode;
  /** Si es false, los días "completo"/"bloqueado"/"cerrado" no se pueden abrir. Por defecto se puede abrir cualquier día que no sea pasado. */
  permitirTodosLosEstados?: boolean;
  /** Fechas a marcar con una estrella (ej. "mis clases" del alumno logueado). */
  fechasDestacadas?: Set<string>;
  apiUrl?: string;
  /** Cambiar este valor fuerza un refetch (ej. después de asignar un turno). */
  refreshKey?: number;
};

export default function MonthGrid({
  diaExpandido, onToggleDay, renderPanel, permitirTodosLosEstados = true,
  fechasDestacadas, apiUrl = "/api/calendar", refreshKey,
}: Props) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [cursor, setCursor] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1));
  const [dias, setDias] = useState<Map<string, DiaCalendario>>(new Map());
  const [loading, setLoading] = useState(true);

  const primerDiaMes = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const inicioGrilla = new Date(primerDiaMes);
  inicioGrilla.setDate(inicioGrilla.getDate() - primerDiaMes.getDay());
  const diasEnGrilla = 42;

  useEffect(() => {
    setLoading(true);
    fetch(`${apiUrl}?desde=${toKey(inicioGrilla)}&dias=${diasEnGrilla}`)
      .then((r) => r.json())
      .then((data: DiaCalendario[]) => {
        setDias(new Map(data.map((d) => [d.fecha, d])));
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cursor, refreshKey]);

  // Al cambiar de mes, cerramos cualquier panel abierto (evita mostrar
  // el detalle de un día que ya no está a la vista).
  const cambiarMes = (delta: number) => {
    onToggleDay(null);
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));
  };

  const celdas = Array.from({ length: diasEnGrilla }, (_, i) => {
    const fecha = new Date(inicioGrilla);
    fecha.setDate(fecha.getDate() + i);
    const key = toKey(fecha);
    return { fecha, key, delMesActual: fecha.getMonth() === cursor.getMonth(), info: dias.get(key) };
  });

  const semanas = Array.from({ length: 6 }, (_, i) => celdas.slice(i * 7, i * 7 + 7));

  return (
    <div style={{ ...card, padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px", borderBottom: `1px solid ${palette.line}` }}>
        <button onClick={() => cambiarMes(-1)} style={iconBtn} aria-label="Mes anterior">
          <ChevronLeft size={20} />
        </button>
        <p style={{ fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: 600, margin: 0, color: palette.mossDark, textTransform: "capitalize" }}>
          {MESES[cursor.getMonth()]} {cursor.getFullYear()}
        </p>
        <button onClick={() => cambiarMes(1)} style={iconBtn} aria-label="Mes siguiente">
          <ChevronRight size={20} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", padding: "10px 6px 0" }}>
        {DIAS.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 800, color: palette.inkSoft, textTransform: "uppercase", padding: "4px 0" }}>{d}</div>
        ))}
      </div>

      <div style={{ padding: "4px 6px 10px" }}>
        {semanas.map((semana, i) => {
          const expandidoEnEstaSemana = diaExpandido && semana.some((c) => c.key === diaExpandido.fecha);
          return (
            <Fragment key={i}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4 }}>
                {semana.map(({ fecha, key, delMesActual, info }) => {
                  const esHoy = key === toKey(hoy);
                  const esPasado = fecha < hoy;
                  const esDestacado = fechasDestacadas?.has(key) ?? false;
                  const status = info?.status ?? (esPasado ? "pasado" : "cargando");
                  const esEstadoAbrible = permitirTodosLosEstados ? status !== "cargando" : status === "disponible" || status === "completo";
                  const expandible = delMesActual && !esPasado && esEstadoAbrible && !loading;
                  const estaExpandido = diaExpandido?.fecha === key;

                  let bg = "transparent", borderColor = "transparent", textColor: string = palette.inkSoft;
                  if (delMesActual && !esPasado) {
                    if (status === "disponible") { bg = palette.mossSoft; borderColor = palette.moss; textColor = palette.mossDark; }
                    else if (status === "completo") { bg = palette.dangerSoft; borderColor = palette.dangerSoft; textColor = palette.danger; }
                    else if (status === "bloqueado") { bg = "#F0EDE3"; borderColor = "#F0EDE3"; textColor = palette.inkSoft; }
                    else if (status === "cerrado") { bg = "transparent"; borderColor = palette.line; textColor = palette.inkSoft; }
                  }
                  if (estaExpandido) { borderColor = palette.clay; }

                  return (
                    <button
                      key={key}
                      disabled={!expandible}
                      className="day-cell"
                      onClick={() => info && expandible && onToggleDay(estaExpandido ? null : info)}
                      style={{
                        minWidth: 0, aspectRatio: "1 / 1", borderRadius: 10, padding: "2px 1px",
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1,
                        border: `1.5px solid ${esHoy && !estaExpandido ? palette.clay : borderColor}`,
                        background: bg, cursor: expandible ? "pointer" : "default",
                        opacity: delMesActual ? (esPasado ? 0.35 : 1) : 0.28,
                        position: "relative",
                      }}
                    >
                      {esDestacado && delMesActual && (
                        <Star size={9} color={palette.clay} fill={palette.clay} style={{ position: "absolute", top: 3, right: 3 }} />
                      )}
                      <span style={{ fontSize: "clamp(12px, 3.6vw, 15px)", fontWeight: esHoy ? 800 : 700, color: esHoy ? palette.clay : textColor }}>{fecha.getDate()}</span>
                      {expandible && (
                        <ChevronDown
                          size={12}
                          color={textColor}
                          strokeWidth={3}
                          style={{ transition: "transform 0.15s", transform: estaExpandido ? "rotate(180deg)" : "none" }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {expandidoEnEstaSemana && diaExpandido && (
                <Reveal>
                  <div style={{ margin: "8px 2px 12px", borderRadius: 14, background: palette.bg, border: `1px solid ${palette.line}`, padding: 14 }}>
                    {renderPanel(diaExpandido)}
                  </div>
                </Reveal>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

const iconBtn = {
  width: 34, height: 34, borderRadius: 10, border: "none", background: palette.mossSoft,
  color: palette.moss, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
} as const;
