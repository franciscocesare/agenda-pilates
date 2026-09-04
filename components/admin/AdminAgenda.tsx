"use client";
import { useState } from "react";
import { Clock, Plus, User } from "lucide-react";
import { FONT_DISPLAY, palette } from "../ui";
import MonthGrid, { DiaCalendario } from "../agenda/MonthGrid";
import { HorarioRow, Referencia, HorarioDia } from "../agenda/HorarioRow";
import ManualBookingForm from "./ManualBookingForm";
import BlockedDatesPanel from "./BlockedDatesPanel";
import CancelSlotPanel from "./CancelSlotPanel";

export default function AdminAgenda() {
  const [diaSel, setDiaSel] = useState<DiaCalendario | null>(null);
  const [horarios, setHorarios] = useState<HorarioDia[] | null>(null);
  const [asignando, setAsignando] = useState<{ fecha: string; hora: string } | null>(null);
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
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, margin: "8px 0 2px", color: palette.moss }}>Agenda</h1>
        <p style={{ color: palette.inkSoft, fontSize: 14, margin: 0 }}>
          Tocá un día para ver quién va en cada horario y asignarle un turno a una alumna. Cada horario tiene 6 lugares propios.
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

      <div style={{ marginBottom: 20 }}>
        <MonthGrid
          diaExpandido={diaSel}
          onToggleDay={onToggleDay}
          permitirTodosLosEstados
          refreshKey={refreshKey}
          renderPanel={(dia) => (
            <div>
              <p style={{ fontWeight: 800, fontSize: 14, margin: "0 0 12px", color: palette.mossDark, textTransform: "capitalize" }}>
                {new Date(dia.fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {!horarios && <p style={{ color: palette.inkSoft, fontSize: 14 }}>Cargando horarios…</p>}
                {horarios?.length === 0 && <p style={{ color: palette.inkSoft, fontSize: 14 }}>Día cerrado — no hay franja horaria configurada.</p>}
                {horarios?.map((h) => {
                  const quedan = h.total - h.used;
                  const disponible = !h.cancelado && dia.status !== "bloqueado" && quedan > 0;
                  const alumnas = h.alumnas ?? [];
                  return (
                    <HorarioRow
                      key={h.hora}
                      hora={h.hora}
                      subrow={
                        alumnas.length > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                            {alumnas.map((a, i) => (
                              <span
                                key={i}
                                style={{
                                  display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600,
                                  color: a.pendiente ? palette.clayDark : palette.ink,
                                  background: a.pendiente ? palette.claySoft : palette.mossSoft,
                                  padding: "4px 9px", borderRadius: 999,
                                }}
                              >
                                <User size={11} /> {a.nombre}{a.pendiente ? " · pendiente" : ""}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: 12, color: palette.inkSoft, margin: 0 }}>Sin alumnas anotadas todavía.</p>
                        )
                      }
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: disponible ? palette.moss : palette.inkSoft, whiteSpace: "nowrap" }}>
                          {h.cancelado ? "Cancelado" : `${quedan} libre${quedan === 1 ? "" : "s"}`}
                        </span>
                        {disponible && (
                          <button
                            onClick={() => elegirHorario(dia.fecha, h.hora)}
                            aria-label={`Asignar alumna a las ${h.hora}`}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "center",
                              width: 28, height: 28, borderRadius: "50%", border: "none", cursor: "pointer",
                              background: palette.moss, color: "#fff", flexShrink: 0,
                            }}
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
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16, fontSize: 12, color: palette.inkSoft, fontWeight: 600 }}>
          <Referencia color={palette.mossSoft} label="Hay lugar" />
          <Referencia color={palette.dangerSoft} label="Completo" />
          <Referencia color="#F0EDE3" label="Bloqueado / cerrado" />
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 12px", color: palette.inkSoft }}>
        <Clock size={14} />
        <p style={{ fontSize: 13, fontWeight: 700, margin: 0 }}>Atención: lunes a sábado, 9 a 13 hs y 15 a 21 hs · 6 lugares por horario</p>
      </div>

      <CancelSlotPanel />
      <BlockedDatesPanel />
    </div>
  );
}
