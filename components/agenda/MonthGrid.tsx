"use client";
import { Fragment, ReactNode, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Star } from "lucide-react";
import { palette, card, DIAS } from "../ui";
import Reveal from "../Reveal";

export type DiaCalendario = { fecha: string; weekday: number; status: string; used: number; total: number; motivo: string | null };

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function toKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Clases de fondo/borde/texto según el estado del día, y el color hex
// equivalente para los pocos casos (íconos de lucide-react) que no
// pueden tomar una className de Tailwind.
const ESTADO_CLASES: Record<string, { bg: string; border: string; text: string; hex: string }> = {
  disponible: { bg: "bg-moss-soft", border: "border-moss", text: "text-moss-dark", hex: palette.mossDark },
  completo: { bg: "bg-danger-soft", border: "border-danger-soft", text: "text-danger", hex: palette.danger },
  bloqueado: { bg: "bg-[#F0EDE3]", border: "border-[#F0EDE3]", text: "text-ink-soft", hex: palette.inkSoft },
  cerrado: { bg: "bg-transparent", border: "border-line", text: "text-ink-soft", hex: palette.inkSoft },
};
const ESTADO_DEFAULT = { bg: "bg-transparent", border: "border-transparent", text: "text-ink-soft", hex: palette.inkSoft };

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
    <div className={`${card} overflow-hidden p-0`}>
      <div className="flex items-center justify-between border-b border-line px-4 py-4">
        <button onClick={() => cambiarMes(-1)} className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md2 border-none bg-moss-soft text-moss cursor-pointer" aria-label="Mes anterior">
          <ChevronLeft size={20} />
        </button>
        <p className="m-0 font-display text-[19px] font-semibold capitalize text-moss-dark">
          {MESES[cursor.getMonth()]} {cursor.getFullYear()}
        </p>
        <button onClick={() => cambiarMes(1)} className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-md2 border-none bg-moss-soft text-moss cursor-pointer" aria-label="Mes siguiente">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 px-1.5 pt-2.5">
        {DIAS.map((d) => (
          <div key={d} className="py-1 text-center text-[11px] font-extrabold uppercase text-ink-soft">{d}</div>
        ))}
      </div>

      <div className="px-1.5 pb-2.5 pt-1">
        {semanas.map((semana, i) => {
          const expandidoEnEstaSemana = diaExpandido && semana.some((c) => c.key === diaExpandido.fecha);
          return (
            <Fragment key={i}>
              <div className="grid grid-cols-7 gap-1">
                {semana.map(({ fecha, key, delMesActual, info }) => {
                  const esHoy = key === toKey(hoy);
                  const esPasado = fecha < hoy;
                  const esDestacado = fechasDestacadas?.has(key) ?? false;
                  const status = info?.status ?? (esPasado ? "pasado" : "cargando");
                  const esEstadoAbrible = permitirTodosLosEstados ? status !== "cargando" : status === "disponible" || status === "completo";
                  const expandible = delMesActual && !esPasado && esEstadoAbrible && !loading;
                  const estaExpandido = diaExpandido?.fecha === key;

                  const estado = delMesActual && !esPasado ? ESTADO_CLASES[status] ?? ESTADO_DEFAULT : ESTADO_DEFAULT;
                  let borderClass = estado.border;
                  if (esHoy && !estaExpandido) borderClass = "border-clay";
                  if (estaExpandido) borderClass = "border-clay";

                  return (
                    <button
                      key={key}
                      disabled={!expandible}
                      className={`day-cell relative flex aspect-square min-w-0 flex-col items-center justify-center gap-px rounded-md2 border-[1.5px] px-px py-0.5 ${estado.bg} ${borderClass} ${
                        expandible ? "cursor-pointer" : "cursor-default"
                      } ${delMesActual ? (esPasado ? "opacity-35" : "opacity-100") : "opacity-[0.28]"}`}
                      onClick={() => info && expandible && onToggleDay(estaExpandido ? null : info)}
                    >
                      {esDestacado && delMesActual && (
                        <Star size={9} color={palette.clay} fill={palette.clay} className="absolute right-[3px] top-[3px]" />
                      )}
                      <span className={`text-[clamp(12px,3.6vw,15px)] ${esHoy ? "font-extrabold text-clay" : `font-bold ${estado.text}`}`}>{fecha.getDate()}</span>
                      {expandible && (
                        <ChevronDown
                          size={12}
                          color={estado.hex}
                          strokeWidth={3}
                          className={`transition-transform duration-150 ${estaExpandido ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {expandidoEnEstaSemana && diaExpandido && (
                <Reveal>
                  <div className="mx-0.5 my-2 rounded-xl2 border border-line bg-bg p-3.5">
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
