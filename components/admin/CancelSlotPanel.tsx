"use client";
import { useEffect, useState } from "react";
import { CalendarOff, RotateCcw } from "lucide-react";
import { palette, card, btnGhost, btnPrimary, inputStyle, fmtLarga, HORARIOS_BASE } from "../ui";
import { Field } from "../Field";
import ErrorBanner from "../ErrorBanner";

type Bloqueo = { id: string; fecha: string; hora: string; motivo: string };

export default function CancelSlotPanel() {
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    const res = await fetch("/api/admin/blocked-slots");
    setBloqueos(await res.json());
  };

  useEffect(() => { cargar(); }, []);

  const cancelar = async () => {
    if (!fecha || !hora || !motivo) return;
    setLoading(true);
    setError(null);
    setAviso(null);
    const res = await fetch("/api/admin/blocked-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha, hora, motivo }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setFecha(""); setHora(""); setMotivo("");
    setAviso(
      data.turnosAfectados > 0
        ? `Horario cancelado. Se avisó la baja de ${data.turnosAfectados} turno${data.turnosAfectados === 1 ? "" : "s"} y se devolvió el crédito correspondiente.`
        : "Horario cancelado. No había turnos pendientes en ese horario."
    );
    cargar();
  };

  const reabrir = async (id: string) => {
    await fetch(`/api/admin/blocked-slots/${id}`, { method: "DELETE" });
    cargar();
  };

  return (
    <div style={{ ...card, marginBottom: 20 }}>
      <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 6px", color: palette.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>Cancelar un horario puntual</p>
      <p style={{ fontSize: 13, color: palette.inkSoft, margin: "0 0 14px" }}>
        Para cuando falta gente en un horario específico de un día, sin cerrar el día entero. Las alumnas con turno en ese horario (confirmado o pendiente de pago) se cancelan automáticamente; si ya se les había descontado el crédito, se les devuelve.
      </p>
      <ErrorBanner message={error} />
      {aviso && (
        <div style={{ background: palette.mossSoft, color: palette.moss, padding: "10px 12px", borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
          {aviso}
        </div>
      )}

      <Field label="Fecha">
        <input style={inputStyle} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </Field>

      <Field label="Horario">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {HORARIOS_BASE.map((h) => (
            <button
              key={h}
              onClick={() => setHora(h)}
              style={{
                padding: "9px 4px", borderRadius: 10, textAlign: "center", cursor: "pointer",
                border: `1.5px solid ${hora === h ? palette.danger : palette.line}`,
                background: hora === h ? palette.dangerSoft : "#fff", fontWeight: 700, fontSize: 13,
              }}
            >
              {h}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Motivo">
        <input style={inputStyle} placeholder="Falta de alumnas, imprevisto…" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </Field>

      <button
        style={{ ...btnPrimary, background: palette.danger, marginBottom: bloqueos.length > 0 ? 18 : 0, opacity: fecha && hora && motivo && !loading ? 1 : 0.6 }}
        disabled={!fecha || !hora || !motivo || loading}
        onClick={cancelar}
      >
        {loading ? "Cancelando…" : "Cancelar este horario"}
      </button>

      {bloqueos.map((b) => (
        <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${palette.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CalendarOff size={14} color={palette.danger} />
            <span style={{ fontSize: 14, fontWeight: 600, textTransform: "capitalize" }}>{fmtLarga(new Date(b.fecha))} · {b.hora} hs</span>
            <span style={{ fontSize: 13, color: palette.inkSoft }}>— {b.motivo}</span>
          </div>
          <button onClick={() => reabrir(b.id)} style={{ background: "none", border: "none", cursor: "pointer", color: palette.inkSoft, display: "flex", alignItems: "center", gap: 4 }} title="Reabrir horario">
            <RotateCcw size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
