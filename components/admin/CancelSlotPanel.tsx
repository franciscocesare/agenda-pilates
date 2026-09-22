"use client";
import { useEffect, useState } from "react";
import { CalendarOff, RotateCcw } from "lucide-react";
import { palette, card, btnPrimary, inputStyle, fmtLarga } from "../ui";
import { Field } from "../Field";
import ErrorBanner from "../ErrorBanner";
import { HoraPicker } from "../DiaHoraPicker";

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
    <div className={`${card} mb-5`}>
      <p className="m-0 mb-1.5 text-sm font-bold uppercase tracking-wide text-ink-soft">Cancelar un horario puntual</p>
      <p className="m-0 mb-3.5 text-[13px] text-ink-soft">
        Para cuando falta gente en un horario específico de un día, sin cerrar el día entero. Las alumnas con turno en ese horario (confirmado o pendiente de pago) se cancelan automáticamente; si ya se les había descontado el crédito, se les devuelve.
      </p>
      <ErrorBanner message={error} />
      {aviso && (
        <div className="mb-3.5 rounded-md2 bg-moss-soft px-3 py-2.5 text-[13px] font-semibold text-moss">
          {aviso}
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); cancelar(); }}>
        <Field label="Fecha">
          <input className={inputStyle} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>

        <Field label="Horario">
          <HoraPicker value={hora} onChange={setHora} activeClasses="border-danger bg-danger-soft" />
        </Field>

        <Field label="Motivo">
          <input className={inputStyle} placeholder="Falta de alumnas, imprevisto…" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Field>

        <button
          type="submit"
          className={`${btnPrimary} !bg-danger ${bloqueos.length > 0 ? "mb-[18px]" : "mb-0"} ${fecha && hora && motivo && !loading ? "opacity-100" : "opacity-60"}`}
          disabled={!fecha || !hora || !motivo || loading}
        >
          {loading ? "Cancelando…" : "Cancelar este horario"}
        </button>
      </form>

      {bloqueos.map((b) => (
        <div key={b.id} className="flex items-center justify-between border-t border-line py-2.5">
          <div className="flex items-center gap-2">
            <CalendarOff size={14} color={palette.danger} />
            <span className="text-sm font-semibold capitalize">{fmtLarga(new Date(b.fecha))} · {b.hora} hs</span>
            <span className="text-[13px] text-ink-soft">— {b.motivo}</span>
          </div>
          <button onClick={() => reabrir(b.id)} className="flex items-center gap-1 border-none bg-transparent text-ink-soft cursor-pointer" title="Reabrir horario">
            <RotateCcw size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
