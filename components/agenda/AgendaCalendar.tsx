"use client";
import { useEffect, useState } from "react";
import { Star, LogIn, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { FONT_DISPLAY, palette, btnGhost } from "../ui";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import MonthGrid, { DiaCalendario } from "./MonthGrid";
import { HorarioRow, Referencia, HorarioDia } from "./HorarioRow";

type Sesion = { id: string; nombre: string; apellido: string; rol: "CLIENTE" | "ADMIN" } | null;

export default function AgendaCalendar() {
  const router = useRouter();
  const [sesion, setSesion] = useState<Sesion>(null);
  const [misFechas, setMisFechas] = useState<Set<string>>(new Set());
  const [diaSel, setDiaSel] = useState<DiaCalendario | null>(null);
  const [horarios, setHorarios] = useState<HorarioDia[] | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((u) => {
      setSesion(u);
      if (u) {
        fetch("/api/appointments").then((r) => r.json()).then((turnos: { fecha: string }[]) => {
          setMisFechas(new Set(turnos.map((t) => t.fecha.slice(0, 10))));
        });
      }
    });
  }, []);

  const onToggleDay = async (d: DiaCalendario | null) => {
    setDiaSel(d);
    setHorarios(null);
    if (!d) return;
    const res = await fetch(`/api/calendar/day?fecha=${d.fecha}`);
    const data = await res.json();
    setHorarios(data.horarios);
  };

  const linkSolicitud = (fecha: string, hora: string) => {
    const fechaFmt = new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const nombre = sesion ? `${sesion.nombre} ${sesion.apellido}` : "";
    const texto = nombre
      ? `¡Hola! Soy ${nombre} y quiero pedir un turno para el ${fechaFmt} a las ${hora} hs 🌿`
      : `¡Hola! Quiero pedir un turno para el ${fechaFmt} a las ${hora} hs 🌿`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, margin: "8px 0 6px", color: palette.moss }}>Agenda</h1>
        <p style={{ color: palette.inkSoft, fontSize: 15, margin: 0, maxWidth: 560 }}>
          Mirá qué días tienen lugar. Tocá el día para ver los horarios — los turnos los asigna la profesora, así que si te sirve uno pedíselo por WhatsApp.
        </p>
        {!sesion && (
          <button onClick={() => router.push("/login")} style={{ ...btnGhost, display: "inline-flex", alignItems: "center", gap: 8, marginTop: 14 }}>
            <LogIn size={15} /> Ingresá para ver tus clases reservadas
          </button>
        )}
      </div>

      <MonthGrid
        diaExpandido={diaSel}
        onToggleDay={onToggleDay}
        permitirTodosLosEstados={false}
        fechasDestacadas={misFechas}
        renderPanel={(dia) => (
          <div>
            <p style={{ fontWeight: 800, fontSize: 14, margin: "0 0 12px", color: palette.mossDark, textTransform: "capitalize" }}>
              {new Date(dia.fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {!horarios && <p style={{ color: palette.inkSoft, fontSize: 14 }}>Cargando horarios…</p>}
              {horarios?.length === 0 && <p style={{ color: palette.inkSoft, fontSize: 14 }}>No hay horarios configurados para este día.</p>}
              {horarios?.map((h) => {
                const quedan = h.total - h.used;
                const disponible = !h.cancelado && quedan > 0;
                return (
                  <HorarioRow key={h.hora} hora={h.hora}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: disponible ? palette.moss : palette.inkSoft, whiteSpace: "nowrap" }}>
                        {h.cancelado ? "" : `Quedan ${quedan} lugar${quedan === 1 ? "" : "es"}`}
                      </span>
                      {disponible ? (
                        <a
                          href={linkSolicitud(dia.fecha, h.hora)}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "flex", alignItems: "center", gap: 6, textDecoration: "none",
                            background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 13,
                            padding: "8px 12px", borderRadius: 999, whiteSpace: "nowrap",
                          }}
                        >
                          Solicitar
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, fontWeight: 700, color: palette.danger, background: palette.dangerSoft, padding: "6px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
                          {h.cancelado ? "Cancelado" : "Sin lugar"}
                        </span>
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
        <Referencia color="#F0EDE3" label="No disponible" />
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><Star size={12} color={palette.clay} fill={palette.clay} /> Tu clase</span>
      </div>
    </div>
  );
}
