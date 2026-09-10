"use client";
import { useEffect, useState } from "react";
import { Ban, X, CalendarDays, Check } from "lucide-react";
import {
  palette,
  card,
  btnGhost,
  btnPrimary,
  inputStyle,
  fmtLarga,
} from "../ui";
import { Field } from "../Field";
import ErrorBanner from "../ErrorBanner";

type Bloqueo = { id: string; fecha: string; motivo: string };

export default function BlockedDatesPanel() {
  const [bloqueos, setBloqueos] = useState<Bloqueo[]>([]);
  const [fecha, setFecha] = useState("");
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feriadosAuto, setFeriadosAuto] = useState<boolean | null>(null);
  const [guardandoFeriados, setGuardandoFeriados] = useState(false);
  const [avisoFeriados, setAvisoFeriados] = useState<string | null>(null);

  const cargar = async () => {
    const res = await fetch("/api/admin/blocked-dates");
    setBloqueos(await res.json());
  };

  useEffect(() => {
    cargar();
    fetch("/api/admin/config/feriados-argentina")
      .then((r) => r.json())
      .then((d) => setFeriadosAuto(d.activo));
  }, []);

  const alternarFeriadosAuto = async () => {
    const nuevoValor = !feriadosAuto;
    setGuardandoFeriados(true);
    setError(null);
    setAvisoFeriados(null);
    const res = await fetch("/api/admin/config/feriados-argentina", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activo: nuevoValor }),
    });
    const data = await res.json();
    setGuardandoFeriados(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setFeriadosAuto(nuevoValor);
    if (nuevoValor) {
      setAvisoFeriados(
        data.sincronizado
          ? `Listo — se cargaron los feriados de ${Object.keys(data.anios).join(" y ")}.`
          : "Quedó activado. No pudimos consultar el calendario en este momento, pero se va a reintentar solo próximamente.",
      );
      cargar();
    }
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
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setFecha("");
    setMotivo("");
    cargar();
  };

  const desbloquear = async (id: string) => {
    await fetch(`/api/admin/blocked-dates/${id}`, { method: "DELETE" });
    cargar();
  };

  return (
    <div style={{ ...card, marginBottom: 20 }}>
      <p
        style={{
          fontWeight: 700,
          fontSize: 14,
          margin: "0 0 14px",
          color: palette.inkSoft,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        Bloquear un día
      </p>
      <ErrorBanner message={error} />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          padding: "12px 14px",
          borderRadius: 10,
          background: palette.mossSoft,
          marginBottom: 18,
        }}
      >
        {/* <CalendarDays size={17} color={palette.moss} style={{ flexShrink: 0, marginTop: 2 }} /> */}
        <div style={{ flex: 1 }}>
          <div
            onClick={() => {
              if (!guardandoFeriados && feriadosAuto !== null)
                alternarFeriadosAuto();
            }}
            role="checkbox"
            aria-checked={!!feriadosAuto}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor:
                guardandoFeriados || feriadosAuto === null
                  ? "default"
                  : "pointer",
            }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: 6,
                flexShrink: 0,
                border: `1.5px solid ${feriadosAuto ? palette.moss : palette.line}`,
                background: feriadosAuto ? palette.moss : "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: guardandoFeriados ? 0.6 : 1,
              }}
            >
              {feriadosAuto && <Check size={15} color="#fff" />}
            </span>
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 700,
                color: palette.mossDark,
              }}
            >
              Cargar automáticamente los feriados nacionales de Argentina
            </span>
          </div>
          {/* <p
            style={{
              fontSize: 11.5,
              color: palette.inkSoft,
              margin: "8px 0 0",
            }}
          >
            Sincroniza el calendario oficial de feriados y días no laborables
            una vez al mes (y ya mismo, al activarlo). No borra ni pisa los días
            que hayas bloqueado a mano por otro motivo. Si lo desactivás, deja
            de traer feriados nuevos, pero los que ya se cargaron quedan — los
            podés desbloquear vos abajo si hace falta.
          </p> */}
          {avisoFeriados && (
            <p
              style={{
                fontSize: 12.5,
                color: palette.mossDark,
                margin: "8px 0 0",
                fontWeight: 600,
              }}
            >
              {avisoFeriados}
            </p>
          )}
        </div>
      </div>

      <Field label="Fecha">
        <input
          style={inputStyle}
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </Field>
      <Field label="Motivo">
        <input
          style={inputStyle}
          placeholder="Feriado, mantenimiento, vacaciones…"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
      </Field>
      <button
        style={{
          ...btnPrimary,
          marginBottom: bloqueos.length > 0 ? 18 : 0,
          opacity: fecha && motivo && !loading ? 1 : 0.6,
        }}
        disabled={!fecha || !motivo || loading}
        onClick={bloquear}
      >
        {loading ? "Bloqueando…" : "Bloquear día"}
      </button>

      {bloqueos.map((b) => (
        <div
          key={b.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 0",
            borderTop: `1px solid ${palette.line}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Ban size={14} color={palette.danger} />
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {fmtLarga(new Date(b.fecha))}
            </span>
            <span style={{ fontSize: 13, color: palette.inkSoft }}>
              — {b.motivo}
            </span>
          </div>
          <button
            onClick={() => desbloquear(b.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: palette.inkSoft,
            }}
            title="Desbloquear"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
