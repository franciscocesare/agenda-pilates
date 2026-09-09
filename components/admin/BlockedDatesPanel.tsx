"use client";
import { useEffect, useState } from "react";
import { Ban, X, CalendarDays } from "lucide-react";
import { palette, card, btnGhost, btnPrimary, inputStyle, fmtLarga } from "../ui";
import { Field } from "../Field";
import ErrorBanner from "../ErrorBanner";

type Bloqueo = { id: string; fecha: string; motivo: string };

const ANIO_ACTUAL = new Date().getFullYear();

export default function BlockedDatesPanel() {
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [fecha, setFecha] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [anioImportar, setAnioImportar] = useState(ANIO_ACTUAL);
  const [importando, setImportando] = useState(false);
  const [avisoImport, setAvisoImport] = useState<string | null>(null);

  const cargar = async () => {
    const res = await fetch("/api/admin/blocked-dates");
    setBloqueos(await res.json());
  };

  useEffect(() => { cargar(); }, []);

  const importarFeriados = async () => {
    setImportando(true);
    setError(null);
    setAvisoImport(null);
    const res = await fetch("/api/admin/blocked-dates/importar-feriados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anio: anioImportar }),
    });
    const data = await res.json();
    setImportando(false);
    if (!res.ok) { setError(data.error); return; }
    setAvisoImport(`Se cargaron ${data.importados} feriados de ${data.anio}.`);
    cargar();
  };

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

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 10, background: palette.mossSoft, marginBottom: 18 }}>
        <CalendarDays size={17} color={palette.moss} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: palette.mossDark, margin: "0 0 6px" }}>Feriados de Argentina</p>
          <div style={{ display: "flex", gap: 8 }}>
            <select style={{ ...inputStyle, padding: "8px 10px" }} value={anioImportar} onChange={(e) => setAnioImportar(Number(e.target.value))}>
              {[ANIO_ACTUAL - 1, ANIO_ACTUAL, ANIO_ACTUAL + 1].map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
            <button
              onClick={importarFeriados}
              disabled={importando}
              style={{ background: palette.moss, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", borderRadius: 8, padding: "0 14px", cursor: "pointer", opacity: importando ? 0.7 : 1, whiteSpace: "nowrap" }}
            >
              {importando ? "Importando…" : "Importar del calendario oficial"}
            </button>
          </div>
          {avisoImport && <p style={{ fontSize: 12.5, color: palette.mossDark, margin: "8px 0 0" }}>{avisoImport}</p>}
          <p style={{ fontSize: 11.5, color: palette.inkSoft, margin: "6px 0 0" }}>Carga automáticamente los feriados nacionales y días no laborables de ese año. No borra ni pisa los que hayas bloqueado a mano por otro motivo.</p>
        </div>
      </div>

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
