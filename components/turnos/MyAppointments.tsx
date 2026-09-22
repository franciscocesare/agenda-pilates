"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX, Sparkles } from "lucide-react";
import { palette, btnPrimary, btnSecondary, btnGhost, card, fmtLarga } from "../ui";
import { buildWaLink } from "@/lib/whatsapp";
import type { Credito } from "@/lib/types";
import ErrorBanner from "../ErrorBanner";
import { WhatsAppIcon } from "../Icons/WhatsAppIcon";

type Turno = { id: string; fecha: string; hora: string; estado: string; recurringReservationId: string | null };

export default function MyAppointments() {
  const router = useRouter();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Turno | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const cargar = async () => {
    setLoading(true);
    const [resTurnos, resPagos] = await Promise.all([
      fetch("/api/appointments"),
      fetch("/api/payments/mine"),
    ]);
    setTurnos(await resTurnos.json());
    const pagos: Credito[] = await resPagos.json();
    setCreditos(pagos.filter((p) => p.esCredito && p.clasesDisponibles > 0));
    setLoading(false);
  };

  // "Clases a recuperar": suma de créditos generados por cancelaciones
  // a tiempo, cada uno vence a los 30 días de haberse generado.
  const clasesARecuperar = creditos.reduce((acc, c) => acc + c.clasesDisponibles, 0);
  const proximoVencimiento = creditos
    .map((c) => new Date(c.vencimiento))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  useEffect(() => { cargar(); }, []);

  const confirmarCancelacion = async () => {
    if (!cancelTarget) return;
    setCancelando(true);
    setError(null);
    const res = await fetch(`/api/appointments/${cancelTarget.id}/cancel`, { method: "POST" });
    const data = await res.json();
    setCancelando(false);
    if (!res.ok) { setError(data.error); return; }
    setCancelTarget(null);
    cargar();
  };

  if (loading) return <p className="p-10 text-center text-ink-soft">Cargando…</p>;

  if (cancelTarget) {
    return (
      <div className="py-5 text-center">
        <div className="mx-auto mb-[18px] flex h-14 w-14 items-center justify-center rounded-full bg-danger-soft">
          <CalendarX size={26} color={palette.danger} />
        </div>
        <h1 className="mb-4 font-display text-[22px] font-semibold text-moss">¿Querés cancelar este turno?</h1>
        <ErrorBanner message={error} />
        <div className={`${card} mb-6 text-left`}>
          <div className="flex justify-between py-2">
            <span className="text-sm font-semibold text-ink-soft">Fecha</span>
            <span className="text-sm font-bold capitalize">{fmtLarga(new Date(cancelTarget.fecha))}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-sm font-semibold text-ink-soft">Horario</span>
            <span className="text-sm font-bold">{cancelTarget.hora} hs</span>
          </div>
          {cancelTarget.recurringReservationId && (
            <p className="m-0 mt-2.5 text-xs text-ink-soft">
              Solo se cancela esta clase puntual; tu día fijo sigue reservado el resto del mes.
            </p>
          )}
        </div>
        <p className="m-0 mb-5 text-[13px] leading-relaxed text-ink-soft">
          Si cancelás con más de 3 horas de anticipación, no perdés el crédito de esta clase: queda disponible para que la profesora te asigne otro día.
        </p>
        <button className={`${btnPrimary} mb-3 !bg-danger ${cancelando ? "opacity-70" : ""}`} disabled={cancelando} onClick={confirmarCancelacion}>
          {cancelando ? "Cancelando…" : "Sí, cancelar turno"}
        </button>
        <button className={btnSecondary} onClick={() => setCancelTarget(null)}>No, mantener turno</button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-5 mt-2 font-display text-2xl font-semibold text-moss">Mis clases</h1>
      {clasesARecuperar > 0 && (
        <div className={`${card} mb-4 flex items-center gap-3 !bg-clay-soft !border-clay`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
            <Sparkles size={19} color={palette.clayDark} />
          </div>
          <div>
            <p className="m-0 mb-0.5 text-[15px] font-extrabold text-clay-dark">
              {clasesARecuperar === 1 ? "Tenés 1 clase a recuperar" : `Tenés ${clasesARecuperar} clases a recuperar`}
            </p>
            <p className="m-0 text-[12.5px] text-ink-soft">
              Pedile a administración un día por WhatsApp
              {proximoVencimiento ? ` · vence antes el ${fmtLarga(proximoVencimiento)}` : ""}
            </p>
          </div>
        </div>
      )}
      {turnos.length === 0 ? (
        <div className={`${card} p-8 text-center`}>
          <p className="mb-2 font-bold">Todavía no tenés ninguna clase asignada.</p>
          <p className="m-0 mb-5 text-sm text-ink-soft">
            Mirá en la Agenda qué días hay lugar y pedile el turno a administración por WhatsApp.
          </p>
          <button className={`${btnPrimary} mb-3`} onClick={() => router.push("/agenda")}>Ver la agenda</button>
          <a
            href={buildWaLink()}
            target="_blank"
            rel="noopener noreferrer"
            className={`${btnSecondary} flex items-center justify-center gap-2 no-underline`}
          >
            <WhatsAppIcon size={16} color="#25D366" /> Escribir por WhatsApp
          </a>
        </div>
      ) : (
        turnos.map((t) => (
          <div key={t.id} className={`${card} mb-3.5`}>
            <div className="mb-3.5 flex items-start justify-between">
              <div>
                <p className="m-0 mb-1 text-base font-extrabold capitalize">{fmtLarga(new Date(t.fecha))}</p>
                <p className="m-0 text-sm font-semibold text-ink-soft">{t.hora} hs</p>
              </div>
              <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ${
                t.recurringReservationId ? "bg-clay-soft text-clay-dark" : "bg-moss-soft text-moss"
              }`}>
                {t.recurringReservationId ? "Plan mensual" : "Confirmado"}
              </span>
            </div>
            <button className={`${btnGhost} w-full !border-danger !text-danger`} onClick={() => setCancelTarget(t)}>Cancelar turno</button>
          </div>
        ))
      )}
    </div>
  );
}
