"use client";
import { useEffect, useState } from "react";
import { Star, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { palette, btnGhost } from "../ui";
import { buildWaLink } from "@/lib/whatsapp";
import MonthGrid, { DiaCalendario } from "./MonthGrid";
import { HorarioRow, Referencia, HorarioDia } from "./HorarioRow";

type Sesion = { id: string; nombre: string; apellido: string; rol: "CLIENTE" | "ADMIN" } | null;

export default function AgendaCalendar() {
  const router = useRouter();
  const [sesion, setSesion] = useState<Sesion>(null);
  const [misFechas, setMisFechas] = useState<Set<string>>(new Set());
  const [misHorarios, setMisHorarios] = useState<Set<string>>(new Set());
  const [diaSel, setDiaSel] = useState<DiaCalendario | null>(null);
  const [horarios, setHorarios] = useState<HorarioDia[] | null>(null);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((u) => {
      setSesion(u);
      if (u) {
        fetch("/api/appointments").then((r) => r.json()).then((turnos: { fecha: string; hora: string }[]) => {
          setMisFechas(new Set(turnos.map((t) => t.fecha.slice(0, 10))));
          setMisHorarios(new Set(turnos.map((t) => `${t.fecha.slice(0, 10)}|${t.hora}`)));
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
    return buildWaLink(undefined, texto);
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="mb-1.5 mt-2 font-display text-[26px] font-semibold text-moss">Agenda</h1>
        <p className="m-0 max-w-[560px] text-[15px] text-ink-soft">
          Mirá qué días tienen lugar. Tocá el día para ver los horarios — los turnos los asigna la profesora, así que si te sirve uno pedíselo por WhatsApp.
        </p>
        {!sesion && (
          <button onClick={() => router.push("/login")} className={`${btnGhost} mt-3.5 inline-flex items-center gap-2`}>
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
            <p className="m-0 mb-3 text-sm font-extrabold capitalize text-moss-dark">
              {new Date(dia.fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
            </p>

            <div className="flex flex-col gap-2">
              {!horarios && <p className="text-sm text-ink-soft">Cargando horarios…</p>}
              {horarios?.length === 0 && <p className="text-sm text-ink-soft">No hay horarios configurados para este día.</p>}
              {horarios?.map((h) => {
                const quedan = h.total - h.used;
                const disponible = !h.cancelado && quedan > 0;
                const esMiClase = misHorarios.has(`${dia.fecha}|${h.hora}`);
                return (
                  <HorarioRow key={h.hora} hora={h.hora}>
                    {esMiClase ? (
                      <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-moss-soft px-2.5 py-1.5 text-xs font-bold text-clay">
                        <Star size={13} color={palette.clay} fill={palette.clay} /> Tu clase
                      </span>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <span className={`whitespace-nowrap text-xs font-bold ${disponible ? "text-moss" : "text-ink-soft"}`}>
                          {h.cancelado ? "" : `Quedan ${quedan} lugar${quedan === 1 ? "" : "es"}`}
                        </span>
                        {disponible ? (
                          <a
                            href={linkSolicitud(dia.fecha, h.hora)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#25D366] px-3 py-2 text-[13px] font-bold text-white no-underline"
                          >
                            Pedí este lugar
                          </a>
                        ) : (
                          <span className="whitespace-nowrap rounded-full bg-danger-soft px-2.5 py-1.5 text-xs font-bold text-danger">
                            {h.cancelado ? "Cancelado" : "Sin lugar"}
                          </span>
                        )}
                      </div>
                    )}
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
        <Referencia color="#F0EDE3" label="No disponible" />
        <span className="flex items-center gap-1.5"><Star size={12} color={palette.clay} fill={palette.clay} /> Tu clase</span>
      </div>
    </div>
  );
}
