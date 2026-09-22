"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, Plus } from "lucide-react";
import { palette } from "../ui";
import MonthGrid, { DiaCalendario } from "../agenda/MonthGrid";
import { HorarioRow, Referencia, HorarioDia } from "../agenda/HorarioRow";
import AlumnaChip from "../AlumnaChip";
import ManualBookingForm from "./ManualBookingForm";
import BlockedDatesPanel from "./BlockedDatesPanel";
import CancelSlotPanel from "./CancelSlotPanel";

export default function AdminAgenda() {
  const router = useRouter();
  const [diaSel, setDiaSel] = useState<DiaCalendario | null>(null);
  const [horarios, setHorarios] = useState<HorarioDia[] | null>(null);
  const [asignando, setAsignando] = useState<{
    fecha: string;
    hora: string;
  } | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const onToggleDay = async (d: DiaCalendario | null) => {
    setDiaSel(d);
    setHorarios(null);
    if (!d) return;
    const res = await fetch(`/api/admin/calendar-day?fecha=${d.fecha}`);
    const data = await res.json();
    setHorarios(data.horarios);
  };

  const elegirHorario = (fecha: string, hora: string) => {
    // Cerramos el panel del día para no perder de vista el flujo:
    // ahora lo que sigue es buscar/asignar el alumno.
    setDiaSel(null);
    setHorarios(null);
    setAsignando({ fecha, hora });
  };

  const onAsignado = () => {
    setAsignando(null);
    setRefreshKey((k) => k + 1);
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="mb-0.5 mt-2 font-display text-[22px] font-semibold text-moss">
          Agenda
        </h1>
        <p className="m-0 text-sm text-ink-soft">
          Tocá un día para ver quién va en cada horario y asignarle un turno a
          una alumna. Cada horario tiene 4 lugares propios.
        </p>
      </div>

      {asignando && (
        <ManualBookingForm
          titulo={`Asignar turno · ${new Date(asignando.fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long" })} a las ${asignando.hora}`}
          fechaInicial={asignando.fecha}
          horaInicial={asignando.hora}
          onClose={() => setAsignando(null)}
          onCreated={onAsignado}
        />
      )}

      <div className="mb-5">
        <MonthGrid
          diaExpandido={diaSel}
          onToggleDay={onToggleDay}
          permitirTodosLosEstados
          refreshKey={refreshKey}
          renderPanel={(dia) => (
            <div>
              <p className="m-0 mb-3 text-sm font-extrabold capitalize text-moss-dark">
                {new Date(dia.fecha + "T00:00:00").toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </p>

              <div className="flex flex-col gap-2">
                {!horarios && (
                  <p className="text-sm text-ink-soft">Cargando horarios…</p>
                )}
                {horarios?.length === 0 && (
                  <p className="text-sm text-ink-soft">
                    Día cerrado — no hay franja horaria configurada.
                  </p>
                )}
                {horarios?.map((h) => {
                  const quedan = h.total - h.used;
                  const disponible =
                    !h.cancelado && dia.status !== "bloqueado" && quedan > 0;
                  const alumnas = h.alumnas ?? [];
                  return (
                    <HorarioRow
                      key={h.hora}
                      hora={h.hora}
                      subrow={
                        alumnas.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {alumnas.map((a, i) => (
                              <AlumnaChip
                                key={i}
                                alumna={a}
                                onClick={() => router.push(`/admin/reservas?userId=${a.id}&nombre=${encodeURIComponent(a.nombreCompleto)}`)}
                                iconSize={14}
                              />
                            ))}
                          </div>
                        ) : (
                          <p className="m-0 text-xs text-ink-soft">
                            Sin alumnas anotadas todavía.
                          </p>
                        )
                      }
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`whitespace-nowrap text-xs font-bold ${disponible ? "text-moss" : "text-ink-soft"}`}>
                          {h.cancelado
                            ? "Cancelado"
                            : `${quedan} libre${quedan === 1 ? "" : "s"}`}
                        </span>
                        {disponible && (
                          <button
                            onClick={() => {
                              elegirHorario(dia.fecha, h.hora); // 1. Ejecuta tu lógica actual

                              window.scrollTo({
                                // 2. Sube la pantalla al inicio
                                top: 0,
                                behavior: "smooth", // Movimiento fluido y agradable
                              });
                            }}
                            aria-label={`Asignar alumna a las ${h.hora}`}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-none bg-moss text-white cursor-pointer"
                          >
                            <Plus size={16} />
                          </button>
                        )}
                      </div>
                    </HorarioRow>
                  );
                })}
              </div>
            </div>
          )}
        />
        <div className="mt-4 flex flex-wrap gap-4 text-xs font-semibold text-ink-soft">
          <Referencia color={palette.mossSoft} label="Hay lugar" />
          <Referencia color={palette.dangerSoft} label="Completo" />
          <Referencia color="#F0EDE3" label="Bloqueado / cerrado" />
        </div>
      </div>

      <div className="my-1 mb-3 flex items-center gap-2 text-ink-soft">
        <Clock size={14} />
        <p className="m-0 text-[13px] font-bold">
          Atención: lunes a sábado, 9 a 13 hs y 15 a 21 hs · 6 lugares por
          horario
        </p>
      </div>

      <CancelSlotPanel />
      <BlockedDatesPanel />
    </div>
  );
}
