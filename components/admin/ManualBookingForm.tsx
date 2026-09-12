"use client";
import { useEffect, useState } from "react";
import { Search, X, Wallet, Gift, Repeat, MessageCircle, Check, Sparkles } from "lucide-react";
import { palette, card, btnPrimary, inputStyle, HORARIOS_BASE, DIAS_LARGO } from "../ui";
import { Field } from "../Field";
import ErrorBanner from "../ErrorBanner";
import ProfilePanel from "../ProfilePanel";

type Usuario = { id: string; nombre: string; apellido: string; email: string; telefono: string };
type Credito = {
  id: string; nombre: string; tipo: "SUELTA" | "MENSUAL"; planTypeId: string;
  clasesDisponibles: number; clasesPorSemana: number | null;
  patrones: { diaSemana: number; hora: string }[];
  esCredito: boolean; vencimiento: string;
};
type PlanCatalogo = { id: string; nombre: string; tipo: "SUELTA" | "MENSUAL"; clasesPorSemana: number | null };
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
  const [fecha, setFecha] = useState(fechaInicial ?? "");
  const [hora, setHora] = useState(horaInicial ?? "");
  const [diasSeleccionados, setDiasSeleccionados] = useState<{ diaSemana: number | null; hora: string | null }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmandoPago, setConfirmandoPago] = useState(false);
  const [planes, setPlanes] = useState<PlanCatalogo[]>([]);
  const [vendiendo, setVendiendo] = useState(false);
  const [planTipoId, setPlanTipoId] = useState("");
  const [confirmandoPlanNuevo, setConfirmandoPlanNuevo] = useState(false);

  useEffect(() => {
    fetch("/api/plans").then((r) => r.json()).then(setPlanes);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) { setResultados([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/admin/users?q=${encodeURIComponent(q)}`).then((r) => r.json()).then(setResultados);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!usuario) { setCreditos([]); setPlanTipoId(""); return; }
    fetch(`/api/admin/payments?userId=${usuario.id}`).then((r) => r.json()).then((data: Credito[]) => {
      setCreditos(data);
      const conCredito = data.find((c) => c.tipo === "SUELTA" && c.clasesDisponibles > 0);
      const mensualDisponible = data.find((c) => c.tipo === "MENSUAL" && (c.clasesPorSemana ?? 0) > c.patrones.length);
      if (conCredito) { setModo("credito"); }
      else if (mensualDisponible) { setModo("mensual"); setPlanTipoId(mensualDisponible.planTypeId); }
      else { setModo("credito"); } // sin crédito cargado: al confirmar el pago se genera como venta de clase suelta
    });
  }, [usuario]);

  // El mismo tipo de plan que el elegido en el select, si el alumno ya
  // lo tiene cargado (con lugar libre o no).
  const mismoTipoExistente = creditos.find((c) => c.tipo === "MENSUAL" && c.planTypeId === planTipoId);
  const hayLugarEnMismoTipo = !!mismoTipoExistente && (mismoTipoExistente.clasesPorSemana ?? 0) > mismoTipoExistente.patrones.length;
  // Cualquier otro plan mensual que el alumno ya tenga (para el aviso).
  const otroMensualExistente = mismoTipoExistente ?? creditos.find((c) => c.tipo === "MENSUAL");
  const planElegidoNombre = planes.find((p) => p.id === planTipoId)?.nombre ?? "";

  // Cuántos días con horario hay que fijar TODAVÍA. Si vamos a
  // continuar un plan que el alumno ya tiene (con lugar libre), son
  // los que le faltan; si vamos a vender un plan nuevo (porque no
  // tiene este tipo, o porque ya lo completó), son todos los del plan
  // desde cero — coincide con lo que valida el servidor en cualquiera
  // de los dos casos.
  const diasFaltantes =
    hayLugarEnMismoTipo && mismoTipoExistente
      ? (mismoTipoExistente.clasesPorSemana ?? 0) - mismoTipoExistente.patrones.length
      : planes.find((p) => p.id === planTipoId)?.clasesPorSemana ?? 0;

  // Arma (o rearma) la lista de slots vacíos "Día N" cada vez que
  // cambia el plan elegido o cuántos días le faltan, para que el admin
  // tenga que completar todos antes de poder guardar.
  useEffect(() => {
    setDiasSeleccionados(Array.from({ length: diasFaltantes }, () => ({ diaSemana: null, hora: null })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planTipoId, diasFaltantes]);

  const actualizarSlot = (idx: number, cambios: Partial<{ diaSemana: number; hora: string }>) => {
    setDiasSeleccionados((prev) => prev.map((d, i) => (i === idx ? { ...d, ...cambios } : d)));
  };

  const todosLosDiasCompletos = diasFaltantes > 0 && diasSeleccionados.every((d) => d.diaSemana !== null && d.hora);

  // Un patrón mensual "activo" es el que ya tiene al menos un día/horario
  // fijado (si no tiene ninguno todavía, no hay nada que cancelar).
  const tienePlanMensualActivo = creditos.some((c) => c.tipo === "MENSUAL" && c.patrones.length > 0);

  // Créditos generados por una cancelación a tiempo (no un bono pagado):
  // se muestran aparte para que el admin sepa que ese lugar ya está
  // cubierto y no hay que cobrar nada.
  const creditosPorCancelacion = creditos.filter((c) => c.tipo === "SUELTA" && c.esCredito && c.clasesDisponibles > 0);
  const totalCreditosPorCancelacion = creditosPorCancelacion.reduce((acc, c) => acc + c.clasesDisponibles, 0);
  const vencimientoMasProximo = creditosPorCancelacion
    .map((c) => new Date(c.vencimiento))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const crear = async (pagoConfirmado?: boolean) => {
    if (!usuario) return;
    setLoading(true);
    setError(null);

    let body: Record<string, unknown> | null = null;
    if (modo === "credito" && fecha && hora) body = { modo: "credito", userId: usuario.id, fecha, hora, pagoConfirmado: !!pagoConfirmado };
    if (modo === "cortesia" && fecha && hora) body = { modo: "cortesia", userId: usuario.id, fecha, hora };
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

  // Fija TODOS los días/horarios elegidos sobre un plan mensual
  // (paymentId) que ya existe: puede ser uno que el alumno ya tenía, o
  // uno recién vendido en resolverYAsignarMensual. Se manda todo junto
  // en una sola llamada: el servidor rechaza el pedido si no viene
  // exactamente la cantidad de días que le faltan al plan.
  const crearDiasMensuales = async (paymentIdAUsar: string) => {
    if (!usuario) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modo: "mensual",
        userId: usuario.id,
        paymentId: paymentIdAUsar,
        dias: diasSeleccionados.map((d) => ({ diaSemana: d.diaSemana, hora: d.hora })),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setConfirmandoPlanNuevo(false);
    onCreated();
  };

  // Resuelve el select simple de "1/2/3 veces por semana": si el
  // alumno ya tiene exactamente ese plan con lugar libre, reusa ese
  // pago y fija los días directo. Si ya tiene ALGÚN plan mensual (el
  // mismo ya completo, u otro distinto) y todavía no confirmamos,
  // frena y avisa antes de venderle un plan nuevo. `forzar` es lo que
  // manda el botón "Sí, agregar igual" del aviso. No deja avanzar en
  // ningún caso si todavía faltan días/horarios por elegir.
  const resolverYAsignarMensual = async (forzar = false) => {
    if (!usuario || !planTipoId || !todosLosDiasCompletos) return;

    if (hayLugarEnMismoTipo && mismoTipoExistente) {
      await crearDiasMensuales(mismoTipoExistente.id);
      return;
    }

    if (otroMensualExistente && !forzar) {
      setConfirmandoPlanNuevo(true);
      return;
    }

    setVendiendo(true);
    setError(null);
    const res = await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: usuario.id, planTypeId: planTipoId }),
    });
    const data = await res.json();
    setVendiendo(false);
    if (!res.ok) { setError(data.error); return; }
    await crearDiasMensuales(data.id);
  };

  const intentarAsignar = () => {
    if (modo === "mensual") { resolverYAsignarMensual(); return; }
    // Si ya tiene un crédito por cancelación, no hay nada que cobrar:
    // se descuenta directo. Para "clase suelta" pagada sí pedimos
    // confirmar el cobro antes de guardar, para no descontarla sin cobrar.
    if (modo === "credito" && totalCreditosPorCancelacion > 0) { crear(true); return; }
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
    ((modo !== "mensual" && !!fecha && !!hora) || (modo === "mensual" && !!planTipoId && todosLosDiasCompletos));

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
              <button onClick={() => { setUsuario(null); setPlanTipoId(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: palette.moss, fontSize: 13, fontWeight: 700 }}>Cambiar</button>
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

      {usuario && totalCreditosPorCancelacion > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: palette.claySoft, marginBottom: 14 }}>
          <Sparkles size={16} color={palette.clayDark} style={{ flexShrink: 0 }} />
          <p style={{ fontSize: 12.5, color: palette.clayDark, margin: 0, fontWeight: 600 }}>
            {usuario.nombre} tiene {totalCreditosPorCancelacion === 1 ? "1 crédito disponible" : `${totalCreditosPorCancelacion} créditos disponibles`} por cancelación
            {vencimientoMasProximo ? ` (vence antes el ${vencimientoMasProximo.toLocaleDateString("es-AR", { day: "numeric", month: "long" })})` : ""}. No hace falta cobrarle esta clase.
          </p>
        </div>
      )}

      {usuario && (
        <Field label="¿De dónde sale la clase?">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <ModoBtn active={modo === "credito"} onClick={() => setModo("credito")} icon={Wallet} label={totalCreditosPorCancelacion > 0 ? "Usar crédito" : "Clase suelta"} />
            <ModoBtn active={modo === "mensual"} onClick={() => setModo("mensual")} icon={Repeat} label="Día fijo mensual" />
            <ModoBtn active={modo === "cortesia"} onClick={() => setModo("cortesia")} icon={Gift} label="Cortesía" />
          </div>
          {modo === "credito" && (
            <p style={{ fontSize: 12, color: palette.inkSoft, margin: "10px 0 0" }}>
              {totalCreditosPorCancelacion > 0
                ? "Descuenta 1 de sus créditos por cancelación disponibles. No se genera ningún pago nuevo."
                : creditos.some((c) => c.tipo === "SUELTA" && c.clasesDisponibles > 0)
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
          <select style={inputStyle} value={planTipoId} disabled={vendiendo} onChange={(e) => setPlanTipoId(e.target.value)}>
            <option value="">Elegí cuántas veces por semana…</option>
            {planes.filter((p) => p.tipo === "MENSUAL").map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
        </Field>
      )}

      {usuario && modo === "mensual" && planTipoId && diasFaltantes > 0 && (
        <div style={{ marginBottom: 4 }}>
          {hayLugarEnMismoTipo && mismoTipoExistente && mismoTipoExistente.patrones.length > 0 && (
            <p style={{ fontSize: 12.5, color: palette.mossDark, background: palette.mossSoft, borderRadius: 10, padding: "10px 12px", margin: "0 0 10px" }}>
              Ya tiene fijado: <strong>{mismoTipoExistente.patrones.map((p) => `${DIAS_LARGO[p.diaSemana]} ${p.hora}`).join(", ")}</strong>. Completá {diasFaltantes === 1 ? "el día que falta" : `los ${diasFaltantes} días que faltan`}:
            </p>
          )}
          {diasSeleccionados.map((slot, idx) => (
            <div key={idx} style={{ padding: 12, borderRadius: 10, background: palette.mossSoft, marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 800, color: palette.mossDark, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.4 }}>
                Día {idx + 1} de {diasFaltantes}
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
                {[1, 2, 3, 4, 5, 6].map((d) => (
                  <button
                    key={d}
                    onClick={() => actualizarSlot(idx, { diaSemana: d })}
                    style={{
                      padding: "9px 4px", borderRadius: 10, textAlign: "center", cursor: "pointer",
                      border: `1.5px solid ${slot.diaSemana === d ? palette.moss : palette.line}`,
                      background: slot.diaSemana === d ? "#fff" : "transparent", fontWeight: 700, fontSize: 13,
                    }}
                  >
                    {DIAS_LARGO[d]}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                {HORARIOS_BASE.map((h) => (
                  <button
                    key={h}
                    onClick={() => actualizarSlot(idx, { hora: h })}
                    style={{
                      padding: "9px 4px", borderRadius: 10, textAlign: "center", cursor: "pointer",
                      border: `1.5px solid ${slot.hora === h ? palette.moss : palette.line}`,
                      background: slot.hora === h ? "#fff" : "transparent", fontWeight: 700, fontSize: 13,
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {!todosLosDiasCompletos && (
            <p style={{ fontSize: 12, color: palette.inkSoft, margin: "0 0 10px" }}>Elegí día y horario en cada uno de los {diasFaltantes} bloques para poder guardar.</p>
          )}
        </div>
      )}

      {usuario && modo !== "mensual" && (
        <Field label="Fecha">
          <input style={inputStyle} type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
      )}

      {usuario && modo !== "mensual" && (
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


      <button style={{ ...btnPrimary, opacity: puedeCrear && !loading && !vendiendo ? 1 : 0.6 }} disabled={!puedeCrear || loading || vendiendo} onClick={intentarAsignar}>
        {vendiendo ? "Vendiendo el plan…" : loading ? "Asignando…" : "Asignar turno"}
      </button>

      {verPerfil && usuario && (
        <ProfilePanel
          sesion={usuario}
          contactoNumero={usuario.telefono}
          mostrarLogout={false}
          planMensualActivo={tienePlanMensualActivo}
          onClasesCanceladas={() => {
            setVerPerfil(false);
            fetch(`/api/admin/payments?userId=${usuario.id}`).then((r) => r.json()).then(setCreditos);
            onCreated();
          }}
          onActualizado={(datos) => setUsuario((prev) => (prev ? { ...prev, ...datos } : prev))}
          onClose={() => setVerPerfil(false)}
        />
      )}

      {confirmandoPlanNuevo && usuario && (
        <div role="dialog" style={{ position: "fixed", inset: 0, background: "rgba(60,42,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }} onClick={() => setConfirmandoPlanNuevo(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: palette.card, borderRadius: 20, padding: 24, width: "100%", maxWidth: 380 }}>
            <p style={{ fontWeight: 800, fontSize: 17, margin: "0 0 8px", color: palette.mossDark }}>Este alumno ya tiene un plan mensual</p>
            <p style={{ fontSize: 14, color: palette.inkSoft, margin: "0 0 22px", lineHeight: 1.5 }}>
              <strong>{usuario.nombre} {usuario.apellido}</strong> ya tiene cargado <strong>{otroMensualExistente?.nombre}</strong> ({otroMensualExistente?.patrones.length}/{otroMensualExistente?.clasesPorSemana} días fijados). ¿Querés venderle además el plan <strong>{planElegidoNombre}</strong> y agregarle este día igual?
            </p>
            <button
              onClick={() => resolverYAsignarMensual(true)}
              disabled={vendiendo || loading}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
                background: palette.moss, color: "#fff", fontWeight: 700, fontSize: 14, border: "none",
                padding: "13px 16px", borderRadius: 12, cursor: "pointer", marginBottom: 10, opacity: vendiendo || loading ? 0.7 : 1,
              }}
            >
              {vendiendo || loading ? "Guardando…" : "Sí, agregar igual"}
            </button>
            <button
              onClick={() => setConfirmandoPlanNuevo(false)}
              style={{ width: "100%", background: "none", border: "none", color: palette.inkSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "6px 0" }}
            >
              Cancelar
            </button>
          </div>
        </div>
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