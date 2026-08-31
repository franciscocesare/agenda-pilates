"use client";
import { useEffect, useState } from "react";
import { Ban, X } from "lucide-react";
import { palette, card, btnGhost, btnPrimary, inputStyle, fmtLarga } from "../ui";
import { Field } from "../Field";
import ErrorBanner from "../ErrorBanner";

type Bloqueo = { id: string; fecha: string; motivo: string };

export default function BlockedDatesPanel() {
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [fecha, setFecha] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const cargar = async () => {
    const res = await fetch("/api/admin/blocked-dates");
    setBloqueos(await res.json());
  };

  useEffect(() => { cargar(); }, []);

  const bloquear = async () => {
    if (!fecha || !motivo) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/blocked-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fecha, motivo }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setFecha(""); setMotivo("");
    cargar();
  };

  const desbloquear = async (id: string) => {
    await fetch(`/api/admin/blocked-dates/${id}`, { method: "DELETE" });
    cargar();
  };

  return (
    <div style={{ ...card, marginBottom: 20 }}>
      <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 14px", color: palette.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>Bloquear un día</p>
      <ErrorBanner message={error} />
      <Field label="Fecha">
        <input style={inputStyle} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
      </Field>
      <Field label="Motivo">
        <input style={inputStyle} placeholder="Feriado, mantenimiento, vacaciones…" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
      </Field>
      <button style={{ ...btnPrimary, marginBottom: bloqueos.length > 0 ? 18 : 0, opacity: fecha && motivo && !loading ? 1 : 0.6 }} disabled={!fecha || !motivo || loading} onClick={bloquear}>
        {loading ? "Bloqueando…" : "Bloquear día"}
      </button>

      {bloqueos.map((b) => (
        <div key={b.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderTop: `1px solid ${palette.line}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Ban size={14} color={palette.danger} />
            <span style={{ fontSize: 14, fontWeight: 600, textTransform: "capitalize" }}>{fmtLarga(new Date(b.fecha))}</span>
            <span style={{ fontSize: 13, color: palette.inkSoft }}>— {b.motivo}</span>
          </div>
          <button onClick={() => desbloquear(b.id)} style={{ background: "none", border: "none", cursor: "pointer", color: palette.inkSoft }} title="Desbloquear">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
