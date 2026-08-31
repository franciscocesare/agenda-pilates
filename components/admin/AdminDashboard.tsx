"use client";
import { useEffect, useState } from "react";
import { Calendar, CalendarCheck, Users, CalendarX } from "lucide-react";
import { FONT_DISPLAY, palette, card } from "../ui";
import SpringGauge from "../SpringGauge";

type Stats = { turnosHoy: number; turnosManana: number; reservasActivas: number; cancelados: number; usuarios: number; cupoHoy: number };

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setStats);
  }, []);

  if (!stats) return <p style={{ color: palette.inkSoft, textAlign: "center", padding: 40 }}>Cargando…</p>;

  const items = [
    { label: "Turnos hoy", value: stats.turnosHoy, icon: Calendar },
    { label: "Turnos mañana", value: stats.turnosManana, icon: CalendarCheck },
    { label: "Reservas activas", value: stats.reservasActivas, icon: Users },
    { label: "Cancelados", value: stats.cancelados, icon: CalendarX },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, margin: "8px 0 2px", color: palette.moss }}>Panel administrativo</h1>
        <p style={{ color: palette.inkSoft, fontSize: 14, margin: 0 }}>Resumen general de Monte Pilates</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
        {items.map((s) => (
          <div key={s.label} style={card}>
            <s.icon size={18} color={palette.moss} />
            <p style={{ fontSize: 26, fontWeight: 800, margin: "10px 0 2px" }}>{s.value}</p>
            <p style={{ fontSize: 13, color: palette.inkSoft, margin: 0, fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div style={card}>
        <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 14px", color: palette.inkSoft, textTransform: "uppercase", letterSpacing: 0.5 }}>Cupo de hoy</p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontWeight: 700 }}>{stats.turnosHoy} de {stats.cupoHoy} reservados</span>
          <span style={{ color: palette.inkSoft, fontSize: 13, fontWeight: 600 }}>{Math.max(0, stats.cupoHoy - stats.turnosHoy)} disponibles</span>
        </div>
        <SpringGauge used={stats.turnosHoy} total={stats.cupoHoy} />
      </div>
    </div>
  );
}
