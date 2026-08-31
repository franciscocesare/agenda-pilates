"use client";
import { useEffect, useState } from "react";
import { Search, X, Wallet, Gift, Repeat, MessageCircle, Check } from "lucide-react";
import { palette, card, btnPrimary, inputStyle, HORARIOS_BASE, DIAS_LARGO } from "../ui";
import { Field } from "../Field";
import ErrorBanner from "../ErrorBanner";
import ProfilePanel from "../ProfilePanel";

type Usuario = { id: string; nombre: string; apellido: string; email: string; telefono: string };
type Credito = {
  id: string; nombre: string; tipo: "SUELTA" | "MENSUAL";
  clasesDisponibles: number; clasesPorSemana: number | null;
  patrones: { diaSemana: number; hora: string }[];
};
type Modo = "credito" | "mensual" | "cortesia";

export default function ManualBookingForm({
  onClose, onCreated, fechaInicial, horaInicial, titulo = "Asignar turno a un alumno",
}: {
  onClose: () => void;
  onCreated: () => void;
  /** Precarga fecha/hora, por ejemplo cuando viene de tocar un horario puntual en la Agenda. */
  fechaInicial?: string;
  horaInicial?: string;
  titulo?: string;
}) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<Usuario[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verPerfil, setVerPerfil] = useState(false);
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [modo, setModo] = useState<Modo>("credito");
  const [paymentId, setPaymentId] = useState("");
  const [fecha, setFecha] = useState(fechaInicial ?? "");
  const [diaSemana, setDiaSemana] = useState(fechaInicial ? new Date(fechaInicial + "T00:00:00").getDay() || 1 : 1);
  const [hora, setHora] = useState(horaInicial ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmandoPago, setConfirmandoPago] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) { setResultados([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/admin/users?q=${encodeURIComponent(q)}`).then((r) => r.json()).then(setResultados);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!usuario) { setCreditos([]); return; }
    fetch(`/api/admin/payments?userId=${usuario.id}`).then((r) => r.json()).then((data: Credito[]) => {
      setCreditos(data);
      const conCredito = data.find((c) => c.tipo === "SUELTA" && c.clasesDisponibles > 0);
      const mensualDisponible = data.find((c) => c.tipo === "MENSUAL" && (c.clasesPorSemana ?? 0) > c.patrones.length);
      if (conCredito) { setModo("credito"); }
      else if (mensualDisponible) { setModo("mensual"); setPaymentId(mensualDisponible.id); }
      else { setModo("credito"); } // sin crédito cargado: al confirmar el pago se genera como venta de clase suelta
    });
  }, [usuario]);

  const mensualElegido = creditos.find((c) => c.id === paymentId);

  const crear = async (pagoConfirmado?: boolean) => {
    if (!usuario) return;
    setLoading(true);
    setError(null);

    let body: Record<string, unknown> | null = null;
    if (modo === "credito" && fecha && hora) body = { modo: "credito", userId: usuario.id, fecha, hora, pagoConfirmado: !!pagoConfirmado };
    if (modo === "cortesia" && fecha && hora) body = { modo: "cortesia", userId: usuario.id, fecha, hora };
    if (modo === "mensual" && paymentId && hora) body = { modo: "mensual", userId: usuario.id, paymentId, diaSemana, hora };
    if (!body) { setLoading(false); return; }

    const res = await fetch("/api/admin/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setConfirmandoPago(false);
    onCreated();
  };

  const intentarAsignar = () => {
    // Para "clase suelta" pedimos confirmar el pago antes de guardar,
    // para no descontar el crédito sin haber cobrado.
    if (modo === "credito") { setConfirmandoPago(true); return; }
    crear();
  };

  const avisarPorWhatsapp = () => {
    if (!usuario || !fecha || !hora) return;
    const fechaFmt = new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
    const texto = `¡Hola ${usuario.nombre}! Te estoy apartando la clase del ${fechaFmt} a las ${hora} hs. Cuando puedas pasame el pago de la clase suelta para confirmarla 🌿`;
    window.open(`https://wa.me/${usuario.telefono.replace(/[^\d]/g, "")}?text=${encodeURIComponent(texto)}`, "_blank");
    // No confirmamos el pago: el lugar queda apartado como "pendiente
    // de pago" y el crédito recién se descuenta cuando el admin
    // confirme el cobro desde el panel de Reservas.
    crear(false);
  };


  const puedeCrear =
    !!usuario &&
    ((modo !== "mensual" && !!fecha && !!hora) || (modo === "mensual" && !!paymentId && !!hora));

  return (
    <div style={{ ...card, marginBottom: 16, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <p style={{ fontWeight: 800, margin: 0 }}>{titulo}</p>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: palette.inkSoft }}><X size={18} /></button>
      </div>

      <ErrorBanner message={error} />

      <Field label="Alumno">
        {usuario ? (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, background: palette.mossSoft }}>
            <span style={{ fontSize: 14, fontWeight: 700 }}>{usuario.nombre} {usuario.apellido}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <button onClick={() => setVerPerfil(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "#1ea952", display: "flex", alignItems: "center" }} title="Ver perfil / escribirle por WhatsApp">
                <MessageCircle size={17} />
              </button>
              <button onClick={() => { setUsuario(null); setPaymentId(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: palette.moss, fontSize: 13, fontWeight: 700 }}>Cambiar</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ position: "relative" }}>
              <Search size={16} color={palette.inkSoft} style={{ position: "absolute", left: 12, top: 13 }} />
              <input style={{ ...inputStyle, paddingLeft: 36 }} placeholder="Buscar por nombre, email o teléfono" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            {resultados.length > 0 && (
              <div style={{ marginTop: 8, border: `1px solid ${palette.line}`, borderRadius: 10, overflow: "hidden" }}>
                {resultados.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setUsuario(u); setResultados([]); setQ(""); }}
                    style={{ display: "block", width: "100%", textAlign: "left", padding: "10px 12px", background: "#fff", border: "none", borderBottom: `1px solid ${palette.line}`, cursor: "pointer", fontSize: 14 }}
                  >
                    <strong>{u.nombre} {u.apellido}</strong> — {u.email}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </Field>

      {usuario && (
        <Field label="¿De dónde sale la clase?">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <ModoBtn active={modo === "credito"} onClick={() => setModo("credito")} icon={Wallet} label="Clase suelta" />
            <ModoBtn active={modo === "mensual"} onClick={() => setModo("mensual")} icon={Repeat} label="Día fijo mensual" />
            <ModoBtn active={modo === "cortesia"} onClick={() => setModo("cortesia")} icon={Gift} label="Cortesía" />
          </div>
          {modo === "credito" && (
            <p style={{ fontSize: 12, color: palette.inkSoft, margin: "10px 0 0" }}>
              {creditos.some((c) => c.tipo === "SUELTA" && c.clasesDisponibles > 0)
                ? "Descuenta 1 clase de su bono disponible. Te vamos a pedir confirmar el pago antes de guardar."
                : "Este alumno no tiene clases sueltas cargadas todavía: al confirmar el pago, se le crea la clase suelta en el momento (no hace falta que compre un plan antes)."}
            </p>
          )}
          {modo === "cortesia" && (
            <p style={{ fontSize: 12, color: palette.inkSoft, margin: "10px 0 0" }}>No descuenta ningún crédito (clase de prueba, reposición, etc.).</p>
          )}
        </Field>
      )}

      {usuario && modo === "mensual" && (
        <Field label="Plan mensual">
          {creditos.filter((c) => c.tipo === "MENSUAL").length === 0 ? (
            <p style={{ fontSize: 13, color: palette.inkSoft, margin: 0 }}>Este alumno no tiene un plan mensual vigente.</p>
          ) : (
            <select style={inputStyle} value={paymentId} onChange={(e) => setPaymentId(e.target.value)}>
              <option value="">Elegí un plan…</option>
              {creditos.filter((c) => c.tipo === "MENSUAL").map((c) => (
                <option key={c.id} value={c.id}>{c.nombre} · {c.patrones.length}/{c.clasesPorSemana} días ya fijados</option>
              ))}
            </select>
          )}
          {mensualElegido && (mensualElegido.clasesPorSemana ?? 0) <= mensualElegido.patrones.length && (
            <p style={{ fontSize: 12, color: palette.danger, margin: "10px 0 0" }}>Ya se fijaron todos los días de este plan.</p>
          )}
        </Field>
      )}

      {usuario && modo === "mensual" ? (
        <Field label="Día de la semana">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {[1, 2, 3, 4, 5, 6].map((d) => (
              <button
                key={d}
                onClick={() => setDiaSemana(d)}
                style={{
                  padding: "9px 4px", borderRadius: 10, textAlign: "center", cursor: "pointer",
                  border: `1.5px solid ${diaSemana === d ? palette.moss : palette.line}`,
                  background: diaSemana === d ? palette.mossSoft : "#fff", fontWeight: 700, fontSize: 13,
                }}
              >
                {DIAS_LARGO[d]}
              </button>
            ))}
          </div>
        </Field>
      ) : usuario && (
        <Field label="Fecha">
          <input style={inputStyle} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
      )}

      {usuario && (
        <Field label="Horario">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {HORARIOS_BASE.map((h) => (
              <button
                key={h}
                onClick={() => setHora(h)}
                style={{
                  padding: "9px 4px", borderRadius: 10, textAlign: "center", cursor: "pointer",
                  border: `1.5px solid ${hora === h ? palette.moss : palette.line}`,
                  background: hora === h ? palette.mossSoft : "#fff", fontWeight: 700, fontSize: 13,
                }}
              >
                {h}
              </button>
            ))}
          </div>
        </Field>
      )}

      <button style={{ ...btnPrimary, opacity: puedeCrear && !loading ? 1 : 0.6 }} disabled={!puedeCrear || loading} onClick={intentarAsignar}>
        {loading ? "Asignando…" : "Asignar turno"}
      </button>

      {verPerfil && usuario && (
        <ProfilePanel
          sesion={usuario}
          contactoNumero={usuario.telefono}
          mostrarLogout={false}
          onClose={() => setVerPerfil(false)}
        />
      )}

      {confirmandoPago && usuario && (
        <div role="dialog" style={{ position: "fixed", inset: 0, background: "rgba(60,42,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }} onClick={() => setConfirmandoPago(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: palette.card, borderRadius: 20, padding: 24, width: "100%", maxWidth: 380 }}>
            <p style={{ fontWeight: 800, fontSize: 17, margin: "0 0 8px", color: palette.mossDark }}>¿Ya está pago?</p>
            <p style={{ fontSize: 14, color: palette.inkSoft, margin: "0 0 22px", lineHeight: 1.5 }}>
              Le vas a apartar a <strong>{usuario.nombre} {usuario.apellido}</strong> el lugar del{" "}
              {fecha && new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long" })} a las {hora} hs. Si ya pagó, se le descuenta 1 crédito ahora. Si todavía no, el lugar queda apartado y el crédito recién se descuenta cuando confirmes el cobro.
            </p>

            <button
              onClick={() => crear(true)}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
                background: palette.moss, color: "#fff", fontWeight: 700, fontSize: 14, border: "none",
                padding: "13px 16px", borderRadius: 12, cursor: "pointer", marginBottom: 10, opacity: loading ? 0.7 : 1,
              }}
            >
              <Check size={17} /> {loading ? "Guardando…" : "Sí, está pago"}
            </button>

            <button
              onClick={avisarPorWhatsapp}
              disabled={loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
                background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 14, border: "none",
                padding: "13px 16px", borderRadius: 12, cursor: "pointer", marginBottom: 10, opacity: loading ? 0.7 : 1,
              }}
            >
              <MessageCircle size={17} /> Avisarle y apartar el lugar
            </button>

            <button
              onClick={() => setConfirmandoPago(false)}
              style={{ width: "100%", background: "none", border: "none", color: palette.inkSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "6px 0" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ModoBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Wallet; label: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "10px 4px",
        borderRadius: 10, cursor: "pointer", border: `1.5px solid ${active ? palette.moss : palette.line}`,
        background: active ? palette.mossSoft : "#fff", fontWeight: 700, fontSize: 12, color: active ? palette.moss : palette.inkSoft,
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
