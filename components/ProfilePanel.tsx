"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, MessageCircle, LogOut, Mail, Phone, User, CalendarX } from "lucide-react";
import { FONT_DISPLAY, palette } from "./ui";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { WhatsAppIcon } from "./WhatsAppIcon";

type Sesion = { id?: string; nombre: string; apellido: string; rol?: "CLIENTE" | "ADMIN"; email?: string | null; telefono?: string | null };

export default function ProfilePanel({
  sesion, onClose, contactoNumero, mostrarLogout = true, planMensualActivo = false, onClasesCanceladas,
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
   * Si este alumno tiene un plan mensual activo, muestra el botón
   * "Cancelar clases" (solo tiene sentido cuando el admin mira el
   * perfil de otra persona, junto con `contactoNumero`/`sesion.id`).
   */
  planMensualActivo?: boolean;
  /** Se llama después de dar de baja el plan mensual con éxito. */
  onClasesCanceladas?: () => void;
}) {
  const router = useRouter();
  const initials = `${sesion.nombre[0]}${sesion.apellido[0]}`;
  const numeroWa = (contactoNumero || WHATSAPP_NUMBER).replace(/[^\d]/g, "");
  const escribiendoleAOtraPersona = !!contactoNumero;
  const [confirmando, setConfirmando] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    onClose();
    router.push("/");
    router.refresh();
  };

  const cancelarClases = async () => {
    if (!sesion.id) return;
    setCancelando(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${sesion.id}/cancelar-mensual`, { method: "POST" });
    setCancelando(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error);
      return;
    }
    setConfirmando(false);
    onClasesCanceladas?.();
  };

  return (
    <div
      role="dialog"
      style={{ position: "fixed", inset: 0, background: "rgba(60,42,32,0.4)", display: "flex", alignItems: "flex-start", justifyContent: "flex-end", zIndex: 50 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: palette.card, borderRadius: "0 0 20px 20px", padding: 22, width: "100%", boxShadow: "-8px 0 30px rgba(0,0,0,0.12)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: palette.mossSoft, display: "flex", alignItems: "center", justifyContent: "center", color: palette.moss, fontWeight: 800, fontSize: 17 }}>
              {initials}
            </div>
            <div>
              <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 600, fontSize: 20, margin: 0, color: palette.mossDark }}>{sesion.nombre} {sesion.apellido}</p>
              {sesion.rol && (
                <p style={{ fontSize: 12, fontWeight: 700, color: palette.moss, margin: "2px 0 0", textTransform: "uppercase", letterSpacing: 0.4 }}>
                  {sesion.rol === "ADMIN" ? "Administración" : ""}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: palette.inkSoft }}><X size={20} /></button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {sesion.email && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: palette.ink }}>
              <Mail size={15} color={palette.inkSoft} /> {sesion.email}
            </div>
          )}
          {sesion.telefono && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: palette.ink }}>
              <Phone size={15} color={palette.inkSoft} /> {sesion.telefono}
            </div>
          )}
          {!sesion.email && !sesion.telefono && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: palette.inkSoft }}>
              <User size={15} /> Sin más datos cargados por ahora.
            </div>
          )}
        </div>

        {(numeroWa || !escribiendoleAOtraPersona) && (
          <a
            href={`https://wa.me/${numeroWa}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8, textDecoration: "none",
              background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 14, padding: "12px 16px", borderRadius: 12, marginBottom: 10,
            }}
          >
            <WhatsAppIcon size={17} color="#fff" /> {escribiendoleAOtraPersona ? `Escribirle a ${sesion.nombre} por WhatsApp` : "Escribir a Monte"}
          </a>
        )}

        {planMensualActivo && (
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

        {mostrarLogout && (
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
              Se da de baja el plan mensual de <strong>{sesion.nombre} {sesion.apellido}</strong>: se cancela lo que quede reservado de acá en adelante (este mes y los siguientes) y esos lugares quedan libres en la agenda. No se puede deshacer.
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
    </div>
  );
}
