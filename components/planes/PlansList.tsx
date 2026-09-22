"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Repeat } from "lucide-react";
import { palette, btnGhost, btnSecondary, card } from "../ui";
import ErrorBanner from "../ErrorBanner";

type PlanType = {
  id: string; nombre: string; tipo: "SUELTA" | "MENSUAL";
  clasesIncluidas: number | null; clasesPorSemana: number | null; precio: string;
};

export default function PlansList() {
  const router = useRouter();
  const [planes, setPlanes] = useState<PlanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [comprando, setComprando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plans").then((r) => r.json()).then((data) => { setPlanes(data); setLoading(false); });
  }, []);

  const comprar = async (plan: PlanType) => {
    setComprando(plan.id);
    setError(null);
    const res = await fetch("/api/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planTypeId: plan.id }),
    });
    const data = await res.json();
    setComprando(null);
    if (!res.ok) { setError(data.error); return; }
    router.push("/mis-turnos");
  };

  const desc = (p: PlanType) =>
    p.tipo === "SUELTA"
      ? `${p.clasesIncluidas} clase${p.clasesIncluidas === 1 ? "" : "s"} para que administración te asigne cuando haya lugar.`
      : `Le pedís a la profesora tus ${p.clasesPorSemana} día${p.clasesPorSemana === 1 ? "" : "s"} fijo${p.clasesPorSemana === 1 ? "" : "s"} por semana y quedan reservados todo el mes.`;

  return (
    <div>
      <h1 className="mb-1 mt-2 font-display text-2xl font-semibold text-moss">Elegí tu plan</h1>
      <p className="m-0 mb-5 text-sm text-ink-soft">
        Comprás tus clases acá; el día y el horario te los asigna la profesora o administración según la disponibilidad de la Agenda.
      </p>

      <ErrorBanner message={error} />

      {loading && <p className="p-5 text-center text-ink-soft">Cargando planes…</p>}

      {planes.map((p) => (
        <div key={p.id} className={`${card} mb-3.5`}>
          <div className="mb-2 flex items-start justify-between">
            <div className="flex items-center gap-2">
              {p.tipo === "MENSUAL" ? <Repeat size={17} color={palette.moss} /> : <Wallet size={17} color={palette.moss} />}
              <p className="m-0 text-base font-extrabold">{p.nombre}</p>
            </div>
            <p className="m-0 text-base font-extrabold text-clay">
              ${Number(p.precio).toLocaleString("es-AR")}
            </p>
          </div>
          <p className="m-0 mb-3.5 text-sm text-ink-soft">{desc(p)}</p>
          <button className={btnGhost} disabled={comprando === p.id} onClick={() => comprar(p)}>
            {comprando === p.id ? "Comprando…" : "Comprar este plan"}
          </button>
        </div>
      ))}

      <button className={btnSecondary} onClick={() => router.push("/")}>Volver</button>
    </div>
  );
}
