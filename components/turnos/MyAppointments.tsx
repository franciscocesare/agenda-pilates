"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarX, MessageCircle } from "lucide-react";
import { FONT_DISPLAY, palette, btnPrimary, btnSecondary, btnGhost, card, fmtLarga } from "../ui";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import ErrorBanner from "../ErrorBanner";

type Turno = { id: string; fecha: string; hora: string; estado: string; recurringReservationId: string | null };

export default function MyAppointments() {
  const router = useRouter();
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<Turno | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const cargar = async () => {
    setLoading(true);
    const res = await fetch("/api/appointments");
    setTurnos(await res.json());
    setLoading(false);
  };

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

  if (loading) return <p style={{ color: palette.inkSoft, textAlign: "center", padding: 40 }}>Cargando…</p>;

  if (cancelTarget) {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: palette.dangerSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
          <CalendarX size={26} color={palette.danger} />
        </div>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, margin: "0 0 16px", color: palette.moss }}>¿Querés cancelar este turno?</h1>
        <ErrorBanner message={error} />
        <div style={{ ...card, marginBottom: 24, textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
            <span style={{ color: palette.inkSoft, fontWeight: 600, fontSize: 14 }}>Fecha</span>
            <span style={{ fontWeight: 700, fontSize: 14, textTransform: "capitalize" }}>{fmtLarga(new Date(cancelTarget.fecha))}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0" }}>
            <span style={{ color: palette.inkSoft, fontWeight: 600, fontSize: 14 }}>Horario</span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{cancelTarget.hora} hs</span>
          </div>
          {cancelTarget.recurringReservationId && (
            <p style={{ fontSize: 12, color: palette.inkSoft, margin: "10px 0 0" }}>
              Solo se cancela esta clase puntual; tu día fijo sigue reservado el resto del mes.
            </p>
          )}
        </div>
        <p style={{ fontSize: 13, color: palette.inkSoft, margin: "0 0 20px", lineHeight: 1.5 }}>
          Si cancelás con más de 3 horas de anticipación, no perdés el crédito de esta clase: queda disponible para que la profesora te asigne otro día.
        </p>
        <button style={{ ...btnPrimary, background: palette.danger, marginBottom: 12, opacity: cancelando ? 0.7 : 1 }} disabled={cancelando} onClick={confirmarCancelacion}>
          {cancelando ? "Cancelando…" : "Sí, cancelar turno"}
        </button>
        <button style={btnSecondary} onClick={() => setCancelTarget(null)}>No, mantener turno</button>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, margin: "8px 0 20px", color: palette.moss }}>Mis clases</h1>
      {turnos.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: 32 }}>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>Todavía no tenés ninguna clase asignada.</p>
          <p style={{ fontSize: 14, color: palette.inkSoft, margin: "0 0 20px" }}>
            Mirá en la Agenda qué días hay lugar y pedile el turno a administración por WhatsApp.
          </p>
          <button style={{ ...btnPrimary, marginBottom: 12 }} onClick={() => router.push("/agenda")}>Ver la agenda</button>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ ...btnSecondary, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <MessageCircle size={17} color="#25D366" /> Escribir por WhatsApp
          </a>
        </div>
      ) : (
        turnos.map((t) => (
          <div key={t.id} style={{ ...card, marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <p style={{ fontWeight: 800, fontSize: 16, margin: "0 0 4px", textTransform: "capitalize" }}>{fmtLarga(new Date(t.fecha))}</p>
                <p style={{ color: palette.inkSoft, fontWeight: 600, fontSize: 14, margin: 0 }}>{t.hora} hs</p>
              </div>
              <span style={{ background: t.recurringReservationId ? palette.claySoft : palette.mossSoft, color: t.recurringReservationId ? palette.clayDark : palette.moss, fontSize: 12, fontWeight: 700, padding: "5px 10px", borderRadius: 999, whiteSpace: "nowrap" }}>
                {t.recurringReservationId ? "Plan mensual" : "Confirmado"}
              </span>
            </div>
            <button style={{ ...btnGhost, width: "100%", borderColor: palette.danger, color: palette.danger }} onClick={() => setCancelTarget(t)}>Cancelar turno</button>
          </div>
        ))
      )}
    </div>
  );
}
