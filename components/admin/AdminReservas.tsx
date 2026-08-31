"use client";
import { useEffect, useState } from "react";
import { Search, Plus, Check, UserX, X, Wallet, MessageCircle } from "lucide-react";
import { FONT_DISPLAY, palette, card, btnPrimary, btnGhost, inputStyle, fmtLarga } from "../ui";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import ManualBookingForm from "./ManualBookingForm";

type Reserva = {
  id: string; fecha: string; hora: string; estado: string; recurringReservationId: string | null;
  user: { nombre: string; apellido: string; telefono: string; email: string };
};

export default function AdminReservas() {
  const [q, setQ] = useState("");
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [buscado, setBuscado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendientes, setPendientes] = useState<Reserva[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [actualizando, setActualizando] = useState<string | null>(null);

  const cargarPendientes = async () => {
    const res = await fetch("/api/admin/reservations?estado=PENDIENTE_PAGO");
    setPendientes(await res.json());
  };

  useEffect(() => { cargarPendientes(); }, []);

  const cargar = async (query: string) => {
    if (query.trim().length < 2) { setReservas([]); setBuscado(false); return; }
    setLoading(true);
    setBuscado(true);
    const res = await fetch(`/api/admin/reservations?q=${encodeURIComponent(query)}`);
    setReservas(await res.json());
    setLoading(false);
  };

  const cambiarEstado = async (id: string, estado: string) => {
    setActualizando(id);
    await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    setActualizando(null);
    cargarPendientes();
    if (q) cargar(q);
  };

  const estadoStyle = (e: string) => {
    if (e === "CONFIRMADO") return { bg: palette.mossSoft, color: palette.moss, label: "Confirmado" };
    if (e === "PENDIENTE_PAGO") return { bg: palette.claySoft, color: palette.clayDark, label: "Pendiente de pago" };
    if (e === "CANCELADO") return { bg: palette.dangerSoft, color: palette.danger, label: "Cancelado" };
    if (e === "AUSENTE") return { bg: "#F0EDE3", color: palette.inkSoft, label: "Ausente" };
    return { bg: palette.claySoft, color: palette.clayDark, label: "Completado" };
  };

  const linkRecordatorio = (r: Reserva) => {
    const fechaFmt = new Date(r.fecha).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const texto = `¡Hola ${r.user.nombre}! Te recuerdo tu clase del ${fechaFmt} a las ${r.hora} hs — todavía me falta el pago de esa clase suelta para confirmártela 🌿`;
    return `https://wa.me/${r.user.telefono.replace(/[^\d]/g, "") || WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
  };

  const renderReserva = (r: Reserva) => {
    const es = estadoStyle(r.estado);
    const enCurso = actualizando === r.id;
    return (
      <div key={r.id} style={{ ...card, marginBottom: 10, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <p style={{ fontWeight: 800, margin: 0 }}>{r.user.nombre} {r.user.apellido}</p>
          <span style={{ background: es.bg, color: es.color, fontSize: 12, fontWeight: 700, padding: "4px 9px", borderRadius: 999 }}>{es.label}</span>
        </div>
        <p style={{ color: palette.inkSoft, fontSize: 13, margin: "0 0 12px", textTransform: "capitalize" }}>
          {fmtLarga(new Date(r.fecha))} · {r.hora} hs · {r.user.telefono} {r.recurringReservationId ? "· plan mensual" : "· clase suelta"}
        </p>

        {r.estado === "PENDIENTE_PAGO" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              style={{ ...btnGhost, opacity: enCurso ? 0.6 : 1, borderColor: palette.moss, color: palette.moss, display: "flex", alignItems: "center", gap: 6 }}
              disabled={enCurso}
              onClick={() => cambiarEstado(r.id, "CONFIRMAR_PAGO")}
            >
              <Wallet size={14} /> Confirmar pago
            </button>
            <a
              href={linkRecordatorio(r)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...btnGhost, textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}
            >
              <MessageCircle size={14} color="#25D366" /> Recordarle
            </a>
            <button
              style={{ ...btnGhost, opacity: enCurso ? 0.6 : 1, borderColor: palette.danger, color: palette.danger, display: "flex", alignItems: "center", gap: 6 }}
              disabled={enCurso}
              onClick={() => cambiarEstado(r.id, "CANCELADO")}
            >
              <X size={14} /> Cancelar
            </button>
          </div>
        )}

        {r.estado === "CONFIRMADO" && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={{ ...btnGhost, opacity: enCurso ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }} disabled={enCurso} onClick={() => cambiarEstado(r.id, "COMPLETADO")}>
              <Check size={14} /> Completado
            </button>
            <button style={{ ...btnGhost, opacity: enCurso ? 0.6 : 1, display: "flex", alignItems: "center", gap: 6 }} disabled={enCurso} onClick={() => cambiarEstado(r.id, "AUSENTE")}>
              <UserX size={14} /> Ausente
            </button>
            <button style={{ ...btnGhost, opacity: enCurso ? 0.6 : 1, borderColor: palette.danger, color: palette.danger, display: "flex", alignItems: "center", gap: 6 }} disabled={enCurso} onClick={() => cambiarEstado(r.id, "CANCELADO")}>
              <X size={14} /> Cancelar
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, margin: "8px 0 2px", color: palette.moss }}>Reservas</h1>
        <p style={{ color: palette.inkSoft, fontSize: 14, margin: 0 }}>Buscá a una alumna para revisar sus turnos, o asignale uno nuevo.</p>
      </div>

      {!mostrarForm && (
        <button style={{ ...btnPrimary, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }} onClick={() => setMostrarForm(true)}>
          <Plus size={18} /> Asignar turno a un alumno
        </button>
      )}

      {mostrarForm && (
        <ManualBookingForm onClose={() => setMostrarForm(false)} onCreated={() => { setMostrarForm(false); cargarPendientes(); if (q) cargar(q); }} />
      )}

      {pendientes.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.5, color: palette.clayDark, margin: "0 0 10px" }}>
            Pendientes de pago ({pendientes.length})
          </p>
          {pendientes.map(renderReserva)}
        </div>
      )}

      <div style={{ position: "relative", marginBottom: 16 }}>
        <Search size={17} color={palette.inkSoft} style={{ position: "absolute", left: 13, top: 14 }} />
        <input
          style={{ ...inputStyle, paddingLeft: 40 }}
          placeholder="Buscar alumna por nombre o teléfono…"
          value={q}
          onChange={(e) => { setQ(e.target.value); cargar(e.target.value); }}
        />
      </div>

      {!buscado && !mostrarForm && (
        <p style={{ color: palette.inkSoft, fontSize: 13, textAlign: "center", padding: "20px 10px" }}>
          Escribí un nombre o teléfono para ver los turnos de una alumna.
        </p>
      )}

      {loading && <p style={{ color: palette.inkSoft, textAlign: "center", padding: 20 }}>Buscando…</p>}
      {buscado && !loading && reservas.length === 0 && <p style={{ color: palette.inkSoft, textAlign: "center", padding: 20 }}>No encontramos turnos para esa búsqueda.</p>}

      {reservas.map(renderReserva)}
    </div>
  );
}
