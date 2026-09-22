"use client";
import { useEffect, useState } from "react";
import { Ban, X, Check } from "lucide-react";
import { card, btnPrimary, inputStyle, fmtLarga, palette } from "../ui";
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
    <div className={`${card} mb-5`}>
      <p className="m-0 mb-3.5 text-sm font-bold uppercase tracking-wide text-ink-soft">
        Bloquear un día
      </p>
      <ErrorBanner message={error} />

      <div className="mb-[18px] flex items-start gap-3 rounded-md2 bg-moss-soft px-3.5 py-3">
        <div className="flex-1">
          <div
            onClick={() => {
              if (!guardandoFeriados && feriadosAuto !== null)
                alternarFeriadosAuto();
            }}
            role="checkbox"
            aria-checked={!!feriadosAuto}
            className={`flex items-center gap-2.5 ${
              guardandoFeriados || feriadosAuto === null ? "cursor-default" : "cursor-pointer"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md2 border-[1.5px] ${
                feriadosAuto ? "border-moss bg-moss" : "border-line bg-white"
              } ${guardandoFeriados ? "opacity-60" : "opacity-100"}`}
            >
              {feriadosAuto && <Check size={15} color="#fff" />}
            </span>
            <span className="text-[13.5px] font-bold text-moss-dark">
              Cargar automáticamente los feriados nacionales de Argentina
            </span>
          </div>
          {avisoFeriados && (
            <p className="m-0 mt-2 text-[12.5px] font-semibold text-moss-dark">
              {avisoFeriados}
            </p>
          )}
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); bloquear(); }}>
        <Field label="Fecha">
          <input className={inputStyle} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
        <Field label="Motivo">
          <input
            className={inputStyle}
            placeholder="Feriado, mantenimiento, vacaciones…"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </Field>
        <button
          type="submit"
          className={`${btnPrimary} ${bloqueos.length > 0 ? "mb-[18px]" : "mb-0"} ${fecha && motivo && !loading ? "opacity-100" : "opacity-60"}`}
          disabled={!fecha || !motivo || loading}
        >
          {loading ? "Bloqueando…" : "Bloquear día"}
        </button>
      </form>

      {bloqueos.map((b) => (
        <div key={b.id} className="flex items-center justify-between border-t border-line py-2.5">
          <div className="flex items-center gap-2">
            <Ban size={14} color={palette.danger} />
            <span className="text-sm font-semibold capitalize">{fmtLarga(new Date(b.fecha))}</span>
            <span className="text-[13px] text-ink-soft">— {b.motivo}</span>
          </div>
          <button
            onClick={() => desbloquear(b.id)}
            className="border-none bg-transparent text-ink-soft cursor-pointer"
            title="Desbloquear"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
