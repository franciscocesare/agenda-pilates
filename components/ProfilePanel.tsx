"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, LogOut, Mail, Phone, User, CalendarX, Pencil, CalendarDays, KeyRound, UserCircleIcon } from "lucide-react";
import { palette, inputStyle, DIAS_LARGO } from "./ui";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { buildWaLink } from "@/lib/whatsapp";
import { WhatsAppIcon } from "./Icons/WhatsAppIcon";
import ConfirmDialog from "./ConfirmDialog";
import { DiaHoraPicker } from "./DiaHoraPicker";

type Sesion = { id?: string; nombre: string; apellido: string; rol?: "CLIENTE" | "ADMIN"; email?: string | null; telefono?: string | null; passwordProvisoria?: boolean };
type PlanMensualInfo = {
  paymentId: string;
  nombre: string;
  clasesPorSemana: number;
  patrones: { diaSemana: number; hora: string }[];
};

// Botón de texto discreto, subrayado, usado varias veces en este panel
// (cambiar contraseña, editar datos).
const linkBtnClass = "mb-2.5 mt-2.5 flex w-full items-center justify-start gap-2 border-none bg-transparent p-0 pb-2.5 text-[13px] font-semibold text-ink-soft underline cursor-pointer";

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
      className="fixed inset-0 z-50 flex items-start justify-end bg-[rgba(60,42,32,0.4)]"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[100dvh] w-full overflow-y-auto rounded-b-[20px] bg-card p-[22px] shadow-[-8px_0_30px_rgba(0,0,0,0.12)]"
      >
        <div className="mb-[18px] flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-moss-soft text-[17px] font-extrabold text-moss">
              <UserCircleIcon size={38} strokeWidth={1.5} />
            </div>
            <div>
              <p className="m-0 font-display text-xl font-semibold text-moss-dark">{datos.nombre} {datos.apellido}</p>
              {datos.rol && (
                <p className="m-0 mt-0.5 text-xs font-bold uppercase tracking-wide text-moss">
                  {datos.rol === "ADMIN" ? "Administración" : ""}
                </p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="border-none bg-transparent text-ink-soft cursor-pointer"><X size={20} /></button>
        </div>

        <form
          className={`mb-5 ${editando ? "block" : "hidden"}`}
          onSubmit={(e) => { e.preventDefault(); guardarEdicion(); }}
        >
          <div className="mb-2 flex gap-2">
            <input name="nombre" id="perfil-nombre" autoComplete="given-name" className={inputStyle} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre" />
            <input name="apellido" id="perfil-apellido" autoComplete="family-name" className={inputStyle} value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} placeholder="Apellido" />
          </div>
          <input name="email" id="perfil-email" autoComplete="email" className={`${inputStyle} mb-2`} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
          <input name="telefono" id="perfil-telefono" autoComplete="tel" className={`${inputStyle} mb-2.5`} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} placeholder="Teléfono" />
          <button type="button" onClick={() => { onClose(); router.push("/cambiar-password"); }} className={linkBtnClass}>
            Cambiar contraseña
          </button>
          {errorEdicion && <p className="mb-2.5 text-[12.5px] text-danger">{errorEdicion}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={guardando}
              className={`flex-1 rounded-md2 border-none bg-moss py-2.5 text-[13.5px] font-bold text-white cursor-pointer ${guardando ? "opacity-70" : ""}`}
            >
              {guardando ? "Guardando…" : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={() => { setEditando(false); setErrorEdicion(null); setForm({ nombre: datos.nombre, apellido: datos.apellido, email: datos.email ?? "", telefono: datos.telefono ?? "" }); }}
              disabled={guardando}
              className="rounded-md2 border-[1.5px] border-line bg-transparent px-4 py-2.5 text-[13.5px] font-bold text-ink-soft cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </form>

        <div className={`mb-3.5 flex-col gap-2.5 ${editando ? "hidden" : "flex"}`}>
          {datos.email && (
            <div className="flex items-center gap-2.5 text-sm text-ink">
              <Mail size={15} color={palette.inkSoft} /> {datos.email}
            </div>
          )}
          {datos.telefono && (
            <div className="flex items-center gap-2.5 text-sm text-ink">
              <Phone size={15} color={palette.inkSoft} /> {datos.telefono}
            </div>
          )}
          {!datos.email && !datos.telefono && (
            <div className="flex items-center gap-2.5 text-[13px] text-ink-soft">
              <User size={15} /> Sin más datos cargados por ahora.
            </div>
          )}
        </div>

        {!editando && datos.id && (
          !escribiendoleAOtraPersona && datos.passwordProvisoria ? (
            <div className="mb-4 rounded-md2 bg-clay-soft px-3 py-2.5">
              <p className="m-0 mb-2 text-[12.5px] font-semibold text-clay-dark">
                Todavía tenés la contraseña provisoria (tu teléfono). Cambiala para poder editar tu perfil.
              </p>
              <button
                onClick={() => { onClose(); router.push("/cambiar-password"); }}
                className="border-none bg-transparent p-0 text-[12.5px] font-bold text-clay-dark underline cursor-pointer"
              >
                Cambiar contraseña
              </button>
            </div>
          ) : (
            <button onClick={() => setEditando(true)} className={linkBtnClass}>
              <Pencil size={13} /> Editar datos
            </button>
          )
        )}

        {datos.rol !== "ADMIN" && (numeroWa || !escribiendoleAOtraPersona) && (
          <a
            href={buildWaLink(numeroWa)}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-2.5 flex items-center justify-center gap-2 rounded-md2 bg-[#25D366] px-4 py-3 text-sm font-bold text-white no-underline"
          >
            <WhatsAppIcon size={16} color="#fff" /> {escribiendoleAOtraPersona ? `Escribirle a ${datos.nombre} por WhatsApp` : "Escribir a Monte"}
          </a>
        )}

        {planMensual && !modificandoDias && (
          <div className="mb-2.5 rounded-md2 bg-moss-soft px-3 py-2.5">
            <p className="m-0 mb-1 text-xs font-bold text-moss-dark">{planMensual.nombre}</p>
            <p className="m-0 mb-2.5 text-[13px] text-ink">
              {planMensual.patrones.length > 0
                ? planMensual.patrones.map((p) => `${DIAS_LARGO[p.diaSemana]} ${p.hora}`).join(" · ")
                : "Todavía no tiene ningún día fijado."}
            </p>
            <button onClick={abrirModificarDias} className="flex items-center gap-1.5 border-none bg-transparent text-[12.5px] font-bold text-moss cursor-pointer">
              <CalendarDays size={13} /> Modificar días
            </button>
          </div>
        )}

        {planMensual && modificandoDias && (
          <form className="mb-2.5" onSubmit={(e) => { e.preventDefault(); guardarDiasNuevos(); }}>
            {diasNuevos.map((slot, idx) => (
              <div key={idx} className="mb-2.5 rounded-md2 bg-moss-soft p-3">
                <p className="m-0 mb-2.5 text-xs font-extrabold uppercase tracking-wide text-moss-dark">
                  Día {idx + 1} de {diasNuevos.length}
                </p>
                <DiaHoraPicker value={slot} onChange={(cambios) => actualizarSlotDia(idx, cambios)} />
              </div>
            ))}
            {errorDias && <p className="mb-2.5 text-xs text-danger">{errorDias}</p>}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!todosLosDiasNuevosCompletos || guardandoDias}
                className={`flex-1 rounded-md2 border-none bg-moss py-2.5 text-[13.5px] font-bold text-white cursor-pointer ${
                  !todosLosDiasNuevosCompletos || guardandoDias ? "opacity-60" : ""
                }`}
              >
                {guardandoDias ? "Guardando…" : "Guardar días"}
              </button>
              <button
                type="button"
                onClick={() => setModificandoDias(false)}
                disabled={guardandoDias}
                className="rounded-md2 border-[1.5px] border-line bg-transparent px-4 py-2.5 text-[13.5px] font-bold text-ink-soft cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {planMensual && (
          <button
            onClick={() => setConfirmando(true)}
            className="btn-anim mb-2.5 flex w-full items-center justify-center gap-2 rounded-md2 border-[1.5px] border-danger bg-transparent px-4 py-3 text-sm font-bold text-danger cursor-pointer"
          >
            <CalendarX size={16} /> Cancelar clases
          </button>
        )}

        {editando && escribiendoleAOtraPersona && datos.id && (
          avisoReset ? (
            <p className="m-0 mb-2.5 rounded-md2 bg-moss-soft px-3 py-2.5 text-[12.5px] text-moss-dark">
              {avisoReset}
            </p>
          ) : (
            <button
              onClick={() => setConfirmandoReset(true)}
              className="btn-anim mb-2.5 flex w-full items-center justify-center gap-2 rounded-md2 border-[1.5px] border-danger bg-danger-soft px-4 py-3 text-sm font-bold text-danger cursor-pointer"
            >
              <KeyRound size={16} /> Restablecer contraseña
            </button>
          )
        )}

        {!editando && mostrarLogout && (
          <button
            onClick={logout}
            className="btn-anim flex w-full items-center justify-center gap-2 rounded-md2 border-[1.5px] border-danger bg-transparent px-4 py-3 text-sm font-bold text-danger cursor-pointer"
          >
            <LogOut size={16} /> Cerrar sesión
          </button>
        )}
      </div>

      {confirmando && (
        <ConfirmDialog
          zIndexClass="z-[60]"
          closable={!cancelando}
          onClose={() => setConfirmando(false)}
          title="¿Cancelar las clases mensuales?"
          description={
            <>
              Se da de baja el plan mensual de <strong>{datos.nombre} {datos.apellido}</strong>: se cancela lo que quede reservado de acá en adelante (este mes y los siguientes) y esos lugares quedan libres en la agenda. No se puede deshacer.
              {error && <p className="m-0 mt-3.5 text-[13px] text-danger">{error}</p>}
            </>
          }
        >
          <button
            onClick={cancelarClases}
            disabled={cancelando}
            className={`mb-2.5 flex w-full items-center justify-center gap-2 rounded-md2 border-none bg-danger px-4 py-3.5 text-sm font-bold text-white cursor-pointer ${cancelando ? "opacity-70" : ""}`}
          >
            {cancelando ? "Cancelando…" : "Sí, cancelar clases"}
          </button>
          <button
            onClick={() => setConfirmando(false)}
            disabled={cancelando}
            className="w-full border-none bg-transparent py-1.5 text-[13px] font-semibold text-ink-soft cursor-pointer"
          >
            Volver
          </button>
        </ConfirmDialog>
      )}

      {confirmandoReset && (
        <ConfirmDialog
          zIndexClass="z-[60]"
          closable={!reseteando}
          onClose={() => setConfirmandoReset(false)}
          title="¿Restablecer la contraseña?"
          description={
            <>
              La contraseña de <strong>{datos.nombre} {datos.apellido}</strong> vuelve a ser su teléfono (sin espacios ni guiones). Va a tener que cambiarla de nuevo antes de poder editar su perfil. Su contraseña actual deja de funcionar.
              {error && <p className="m-0 mt-3.5 text-[13px] text-danger">{error}</p>}
            </>
          }
        >
          <button
            onClick={restablecerPassword}
            disabled={reseteando}
            className={`mb-2.5 flex w-full items-center justify-center gap-2 rounded-md2 border-none bg-moss px-4 py-3.5 text-sm font-bold text-white cursor-pointer ${reseteando ? "opacity-70" : ""}`}
          >
            {reseteando ? "Restableciendo…" : "Sí, restablecer"}
          </button>
          <button
            onClick={() => setConfirmandoReset(false)}
            disabled={reseteando}
            className="w-full border-none bg-transparent py-1.5 text-[13px] font-semibold text-ink-soft cursor-pointer"
          >
            Volver
          </button>
        </ConfirmDialog>
      )}
    </div>
  );
}
