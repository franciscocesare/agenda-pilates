"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, LogOut, Mail, Phone, User, CalendarX, Pencil, CalendarDays, KeyRound } from "lucide-react";
import { FONT_DISPLAY, palette, inputStyle, DIAS_LARGO, HORARIOS_BASE } from "./ui";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { WhatsAppIcon } from "./Icons/WhatsAppIcon";

type Sesion = { id?: string; nombre: string; apellido: string; rol?: "CLIENTE" | "ADMIN"; email?: string | null; telefono?: string | null; passwordProvisoria?: boolean };
type PlanMensualInfo = {
  paymentId: string;
  nombre: string;
  clasesPorSemana: number;
  patrones: { diaSemana: number; hora: string }[];
};

export default function ProfilePanel({
  sesion, onClose, contactoNumero, mostrarLogout = true, planMensual, onClasesCanceladas, onDiasModificados, onActualizado,
}: {
  sesion: Sesion;
  onClose: () => void;
  /**
   * Si se pasa (ej. el admin mirando el perfil de una alumna), el botón
   * de WhatsApp escribe A ESE número en vez de al del estudio. Se
   * calcula a partir del teléfono cargado de esa persona.
   */
  contactoNumero?: string | null;
  /** Ocultar "Cerrar sesión" cuando este panel muestra el perfil de OTRA persona (ej. admin viendo a una alumna). */
  mostrarLogout?: boolean;
  /**
   * Si este alumno tiene un plan mensual activo, muestra el resumen de
   * días, el botón "Modificar días" y "Cancelar clases" (solo tiene
   * sentido cuando el admin mira el perfil de otra persona).
   */
  planMensual?: PlanMensualInfo;
  /** Se llama después de dar de baja el plan mensual con éxito. */
  onClasesCanceladas?: () => void;
  /** Se llama después de guardar un cambio de días con éxito. */
  onDiasModificados?: () => void;
  /** Se llama con los datos nuevos después de guardar una edición de perfil. */
  onActualizado?: (datos: { nombre: string; apellido: string; email: string; telefono: string }) => void;
}) {
  const router = useRouter();
  // Copia local editable: así el panel puede mostrar los datos nuevos
  // al toque después de guardar, sin depender de que el padre vuelva a
  // pasar props actualizadas.
  const [datos, setDatos] = useState(sesion);
  const initials = `${datos.nombre[0]}${datos.apellido[0]}`;
  const numeroWa = (contactoNumero || WHATSAPP_NUMBER).replace(/[^\d]/g, "");
  const escribiendoleAOtraPersona = !!contactoNumero;
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmandoReset, setConfirmandoReset] = useState(false);
  const [reseteando, setReseteando] = useState(false);
  const [avisoReset, setAvisoReset] = useState<string | null>(null);

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nombre: datos.nombre, apellido: datos.apellido, email: datos.email ?? "", telefono: datos.telefono ?? "" });
  const [guardando, setGuardando] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);

  const [modificandoDias, setModificandoDias] = useState(false);
  const [diasNuevos, setDiasNuevos] = useState<{ diaSemana: number | null; hora: string | null }[]>([]);
  const [guardandoDias, setGuardandoDias] = useState(false);
  const [errorDias, setErrorDias] = useState<string | null>(null);

  const abrirModificarDias = () => {
    if (!planMensual) return;
    setDiasNuevos(
      Array.from({ length: planMensual.clasesPorSemana }, (_, i) => ({
        diaSemana: planMensual.patrones[i]?.diaSemana ?? null,
        hora: planMensual.patrones[i]?.hora ?? null,
      }))
    );
    setErrorDias(null);
    setModificandoDias(true);
  };

  const actualizarSlotDia = (idx: number, cambios: Partial<{ diaSemana: number; hora: string }>) => {
    setDiasNuevos((prev) => prev.map((d, i) => (i === idx ? { ...d, ...cambios } : d)));
  };

  const todosLosDiasNuevosCompletos = diasNuevos.length > 0 && diasNuevos.every((d) => d.diaSemana !== null && d.hora);

  const guardarDiasNuevos = async () => {
    if (!planMensual || !datos.id || !todosLosDiasNuevosCompletos) return;
    setGuardandoDias(true);
    setErrorDias(null);
    const res = await fetch(`/api/admin/payments/${planMensual.paymentId}/dias`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: datos.id, dias: diasNuevos }),
    });
    const data = await res.json();
    setGuardandoDias(false);
    if (!res.ok) { setErrorDias(data.error); return; }
    setModificandoDias(false);
    onDiasModificados?.();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onClose();
    router.push("/");
    router.refresh();
  };

  const guardarEdicion = async () => {
    if (!datos.id) return;
    setGuardando(true);
    setErrorEdicion(null);
    const res = await fetch(`/api/admin/users/${datos.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setGuardando(false);
    if (!res.ok) { setErrorEdicion(data.error); return; }
    setDatos((prev) => ({ ...prev, ...data }));
    setEditando(false);
    onActualizado?.(data);
    router.refresh();
  };

  const cancelarClases = async () => {
    if (!datos.id) return;
    setCancelando(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${datos.id}/cancelar-mensual`, { method: "POST" });
    setCancelando(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }
    setConfirmando(false);
    onClasesCanceladas?.();
  };

  const restablecerPassword = async () => {
    if (!datos.id) return;
    setReseteando(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${datos.id}/restablecer-password`, { method: "POST" });
    const data = await res.json();
    setReseteando(false);
    if (!res.ok) { setError(data.error); return; }
    setConfirmandoReset(false);
    setAvisoReset(`Listo. Su contraseña ahora es su teléfono sin espacios ni guiones: ${data.nuevaProvisoria}. Se la tiene que cambiar de nuevo la próxima vez que quiera editar su perfil.`);
  };

  return (
    <div
      role="dialog"
      style={{ position: "fixed", inset: 0, background: "rgba(60,42,32,0.4)", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", zIndex: 50 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: palette.card, borderRadius: "0 0 20px 20px", padding: 22, width: "100%", maxHeight: "100dvh", overflowY: "auto", boxShadow: "-8px 0 30px rgba(0,0,0,0.12)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: palette.mossSoft, display: "flex", alignItems: "center", justifyContent: "center", color: palette.moss, fontWeight: 800, fontSize: 17 }}>
              {initials}
            </div>
            <div>
              <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 20, margin: 0, color: palette.mossDark }}>{datos.nombre} {datos.apellido}</p>
              {datos.rol && (
                <p style={{ fontSize: 12, fontWeight: 700, color: palette.moss, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: 0.4 }}>
                  {datos.rol === "ADMIN" ? "Administración" : ""}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: palette.inkSoft }}><X size={20} /></button>
        </div>

        {editando ? (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input style={inputStyle} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" />
              <input style={inputStyle} value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} placeholder="Apellido" />
            </div>
            <input style={{ ...inputStyle, marginBottom: 8 }} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
            <input style={{ ...inputStyle, marginBottom: 10 }} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Teléfono" />
            {errorEdicion && <p style={{ fontSize: 12.5, color: palette.danger, margin: "0 0 10px" }}>{errorEdicion}</p>}
             <button
                onClick={() => { onClose(); router.push("/cambiar-password"); }}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: palette.mossDark, fontWeight: 700, fontSize: 14, cursor: "pointer", padding: "10px 0 16px" }}
              >
                Cambiar contraseña
              </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={guardarEdicion}
                disabled={guardando}
                style={{ flex: 1, maxWidth: "50%", background: palette.moss, color: "#fff", fontWeight: 700, fontSize: 13.5, border: "none", borderRadius: 10, padding: "10px 0", cursor: "pointer", opacity: guardando ? 0.7 : 1 }}
              >
                {guardando ? "Guardando…" : "Guardar cambios"}
              </button>
              <button
                onClick={() => { setEditando(false); setErrorEdicion(null); setForm({ nombre: datos.nombre, apellido: datos.apellido, email: datos.email ?? "", telefono: datos.telefono ?? "" }); }}
                disabled={guardando}
                style={{ background: "none", width: "50%", border: `1.5px solid ${palette.danger}`, color: palette.danger, fontWeight: 700, fontSize: 13.5, borderRadius: 10, padding: "10px 16px", cursor: "pointer" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            {datos.email && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: palette.ink }}>
                <Mail size={15} color={palette.inkSoft} /> {datos.email}
              </div>
            )}
            {datos.telefono && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: palette.ink }}>
                <Phone size={15} color={palette.inkSoft} /> {datos.telefono}
              </div>
            )}
            {!datos.email && !datos.telefono && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: palette.inkSoft }}>
                <User size={15} /> Sin más datos cargados por ahora.
              </div>
            )}
          </div>
        )}

        {datos.id && !editando &&(
          !escribiendoleAOtraPersona && datos.passwordProvisoria ? (
            <div style={{ padding: "10px 12px", borderRadius: 10, background: palette.claySoft, marginBottom: 16 }}>
              <p style={{ fontSize: 12.5, color: palette.clayDark, margin: "0 0 8px", fontWeight: 600 }}>
                Todavía tenés la contraseña provisoria (tu teléfono). Cambiala para poder editar tu perfil.
              </p>
              <button
                onClick={() => { onClose(); router.push("/cambiar-password"); }}
                style={{ background: "none", border: "none", color: palette.clayDark, fontWeight: 800, fontSize: 12.5, cursor: "pointer", textDecoration: "underline", padding: 0 }}
              >
                Cambiar contraseña
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditando(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: palette.moss, fontWeight: 700, fontSize: 12.5, cursor: "pointer", padding: "0 0 16px" }}
            >
              <Pencil size={13} /> Editar datos
            </button>
          )
        )}

        {datos.rol !== "ADMIN" && (numeroWa || !escribiendoleAOtraPersona) && (
          <a
            href={`https://wa.me/${numeroWa}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none",
              background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 14, padding: "12px 16px", borderRadius: 12, marginBottom: 10,
            }}
          >
            <WhatsAppIcon size={16} color="#fff" /> {escribiendoleAOtraPersona ? `Escribirle a ${datos.nombre} por WhatsApp` : "Escribir a Monte"}
          </a>
        )}

        {planMensual && !modificandoDias && (
          <div style={{ padding: "10px 12px", borderRadius: 10, background: palette.mossSoft, marginBottom: 10 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: palette.mossDark, margin: "0 0 4px" }}>{planMensual.nombre}</p>
            <p style={{ fontSize: 13, color: palette.ink, margin: "0 0 10px" }}>
              {planMensual.patrones.length > 0
                ? planMensual.patrones.map((p) => `${DIAS_LARGO[p.diaSemana]} ${p.hora}`).join(" · ")
                : "Todavía no tiene ningún día fijado."}
            </p>
            <button
              onClick={abrirModificarDias}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: palette.moss, fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}
            >
              <CalendarDays size={13} /> Modificar días
            </button>
          </div>
        )}

        {planMensual && modificandoDias && (
          <div style={{ marginBottom: 10 }}>
            {diasNuevos.map((slot, idx) => (
              <div key={idx} style={{ padding: 12, borderRadius: 10, background: palette.mossSoft, marginBottom: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 800, color: palette.mossDark, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 0.4 }}>
                  Día {idx + 1} de {diasNuevos.length}
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
                  {[1, 2, 3, 4, 5, 6].map((d) => (
                    <button
                      key={d}
                      onClick={() => actualizarSlotDia(idx, { diaSemana: d })}
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
                      onClick={() => actualizarSlotDia(idx, { hora: h })}
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
            {errorDias && <p style={{ fontSize: 12.5, color: palette.danger, margin: "0 0 10px" }}>{errorDias}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={guardarDiasNuevos}
                disabled={!todosLosDiasNuevosCompletos || guardandoDias}
                style={{ flex: 1, background: palette.moss, color: "#fff", fontWeight: 700, fontSize: 13.5, border: "none", borderRadius: 10, padding: "10px 0", cursor: "pointer", opacity: !todosLosDiasNuevosCompletos || guardandoDias ? 0.6 : 1 }}
              >
                {guardandoDias ? "Guardando…" : "Guardar días"}
              </button>
              <button
                onClick={() => setModificandoDias(false)}
                disabled={guardandoDias}
                style={{ background: "none", border: `1.5px solid ${palette.line}`, color: palette.inkSoft, fontWeight: 700, fontSize: 13.5, borderRadius: 10, padding: "10px 16px", cursor: "pointer" }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {planMensual && (
          <button
            className="btn-anim"
            onClick={() => setConfirmando(true)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
              background: "none", border: `1.5px solid ${palette.danger}`, color: palette.danger, fontWeight: 700, fontSize: 14,
              padding: "12px 16px", borderRadius: 12, cursor: "pointer", marginBottom: 10,
            }}
          >
            <CalendarX size={16} /> Cancelar clases
          </button>
        )}

        {escribiendoleAOtraPersona && datos.id && editando &&(
          avisoReset ? (
            <p style={{ fontSize: 12.5, color: palette.mossDark, background: palette.mossSoft, borderRadius: 10, padding: "10px 12px", margin: "0 0 10px" }}>
              {avisoReset}
            </p>
          ) : (
            <button
              className="btn-anim"
              onClick={() => setConfirmandoReset(true)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
                background: `${palette.dangerSoft}`, border: `1.5px solid ${palette.danger}`, color: palette.danger, fontWeight: 700, fontSize: 14,
                padding: "12px 16px", borderRadius: 12, cursor: "pointer", marginBottom: 10,
              }}
            >
              <KeyRound size={16} /> Restablecer contraseña
            </button>
          )
        )}

        {/* {mostrarLogout && (
          <button
            onClick={() => { onClose(); router.push("/cambiar-password"); }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
              background: "none", border: "none", color: palette.inkSoft, fontWeight: 600, fontSize: 13, cursor: "pointer", padding: "0 0 10px",
            }}
          >
            Cambiar contraseña
          </button>
        )} */}

        {mostrarLogout && !editando && (
          <button
            className="btn-anim"
            onClick={logout}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
              background: "none", border: `1.5px solid ${palette.line}`, color: palette.inkSoft, fontWeight: 700, fontSize: 14,
              padding: "12px 16px", borderRadius: 12, cursor: "pointer",
            }}
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        )}
      </div>

      {confirmando && (
        <div role="dialog" style={{ position: "fixed", inset: 0, background: "rgba(60,42,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }} onClick={(e) => { e.stopPropagation(); if (!cancelando) setConfirmando(false); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: palette.card, borderRadius: 20, padding: 24, width: "100%", maxWidth: 380 }}>
            <p style={{ fontWeight: 800, fontSize: 17, margin: "0 0 8px", color: palette.mossDark }}>¿Cancelar las clases mensuales?</p>
            <p style={{ fontSize: 14, color: palette.inkSoft, margin: "0 0 18px", lineHeight: 1.5 }}>
              Se da de baja el plan mensual de <strong>{datos.nombre} {datos.apellido}</strong>: se cancela lo que quede reservado de acá en adelante (este mes y los siguientes) y esos lugares quedan libres en la agenda. No se puede deshacer.
            </p>
            {error && <p style={{ fontSize: 13, color: palette.danger, margin: "0 0 14px" }}>{error}</p>}
            <button
              onClick={cancelarClases}
              disabled={cancelando}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
                background: palette.danger, color: "#fff", fontWeight: 700, fontSize: 14, border: "none",
                padding: "13px 16px", borderRadius: 12, cursor: "pointer", marginBottom: 10, opacity: cancelando ? 0.7 : 1,
              }}
            >
              {cancelando ? "Cancelando…" : "Sí, cancelar clases"}
            </button>
            <button
              onClick={() => setConfirmando(false)}
              disabled={cancelando}
              style={{ width: "100%", background: "none", border: "none", color: palette.inkSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "6px 0" }}
            >
              Volver
            </button>
          </div>
        </div>
      )}
      {confirmandoReset && (
        <div role="dialog" style={{ position: "fixed", inset: 0, background: "rgba(60,42,32,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 20 }} onClick={(e) => { e.stopPropagation(); if (!reseteando) setConfirmandoReset(false); }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: palette.card, borderRadius: 20, padding: 24, width: "100%", maxWidth: 380 }}>
            <p style={{ fontWeight: 800, fontSize: 17, margin: "0 0 8px", color: palette.mossDark }}>¿Restablecer la contraseña?</p>
            <p style={{ fontSize: 14, color: palette.inkSoft, margin: "0 0 18px", lineHeight: 1.5 }}>
              La contraseña de <strong>{datos.nombre} {datos.apellido}</strong> vuelve a ser su teléfono (sin espacios ni guiones). Va a tener que cambiarla de nuevo antes de poder editar su perfil. Su contraseña actual deja de funcionar.
            </p>
            {error && <p style={{ fontSize: 13, color: palette.danger, margin: "0 0 14px" }}>{error}</p>}
            <button
              onClick={restablecerPassword}
              disabled={reseteando}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
                background: palette.moss, color: "#fff", fontWeight: 700, fontSize: 14, border: "none",
                padding: "13px 16px", borderRadius: 12, cursor: "pointer", marginBottom: 10, opacity: reseteando ? 0.7 : 1,
              }}
            >
              {reseteando ? "Restableciendo…" : "Sí, restablecer"}
            </button>
            <button
              onClick={() => setConfirmandoReset(false)}
              disabled={reseteando}
              style={{ width: "100%", background: "none", border: "none", color: palette.inkSoft, fontSize: 13, fontWeight: 600, cursor: "pointer", padding: "6px 0" }}
            >
              Volver
            </button>
          </div>
        </div>
      )}
    </div>
  );
}