"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Repeat } from "lucide-react";
import { FONT_DISPLAY, palette, btnGhost, btnSecondary, card } from "../ui";
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
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, margin: "8px 0 4px", color: palette.moss }}>Elegí tu plan</h1>
      <p style={{ color: palette.inkSoft, fontSize: 14, margin: "0 0 20px" }}>
        Comprás tus clases acá; el día y el horario te los asigna la profesora o administración según la disponibilidad de la Agenda.
      </p>

      <ErrorBanner message={error} />

      {loading && <p style={{ color: palette.inkSoft, textAlign: "center", padding: 20 }}>Cargando planes…</p>}

      {planes.map((p) => (
        <div key={p.id} style={{ ...card, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {p.tipo === "MENSUAL" ? <Repeat size={17} color={palette.moss} /> : <Wallet size={17} color={palette.moss} />}
              <p style={{ fontWeight: 800, fontSize: 16, margin: 0 }}>{p.nombre}</p>
            </div>
            <p style={{ fontWeight: 800, fontSize: 16, margin: 0, color: palette.clay }}>
              ${Number(p.precio).toLocaleString("es-AR")}
            </p>
          </div>
          <p style={{ fontSize: 14, color: palette.inkSoft, margin: "0 0 14px" }}>{desc(p)}</p>
          <button style={btnGhost} disabled={comprando === p.id} onClick={() => comprar(p)}>
            {comprando === p.id ? "Comprando…" : "Comprar este plan"}
          </button>
        </div>
      ))}

      <button style={btnSecondary} onClick={() => router.push("/")}>Volver</button>
    </div>
  );
}
