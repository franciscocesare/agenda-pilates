"use client";
import { WhatsAppIcon } from "../../Icons/WhatsAppIcon";
import ConfirmDialog from "../../ConfirmDialog";
import type { Usuario } from "./types";

export default function ConfirmPagoMensualDialog({
  usuario,
  planElegidoNombre,
  vendiendo,
  error,
  onConfirm,
  onAvisarPorWhatsapp,
  onClose,
}: {
  usuario: Usuario;
  planElegidoNombre: string;
  vendiendo: boolean;
  error: string | null;
  /** El admin confirmó que ya recibió el pago: recién ahí se crea el plan. */
  onConfirm: () => void;
  /** Todavía no está pago: se le avisa por WhatsApp con los días y lo que resta abonar. */
  onAvisarPorWhatsapp: () => void;
  onClose: () => void;
}) {
  return (
    <ConfirmDialog
      closable={!vendiendo}
      onClose={onClose}
      title="¿Ya está pago el plan mensual?"
      description={
        <>
          Vas a venderle <strong>{planElegidoNombre}</strong> a{" "}
          <strong>{usuario.nombre} {usuario.apellido}</strong> y fijarle los días elegidos. Confirmá que ya recibiste el pago — todavía no se creó nada.
          {error && <p className="m-0 mt-3.5 text-sm text-danger">{error}</p>}
        </>
      }
    >
      <button
        onClick={onConfirm}
        disabled={vendiendo}
        className={`mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl2 border-none bg-moss px-4 py-3.5 text-sm font-bold text-white cursor-pointer ${
          vendiendo ? "opacity-70" : "opacity-100"
        }`}
      >
        {vendiendo ? "Guardando…" : "Sí, ya está pago"}
      </button>
      <button
        onClick={onAvisarPorWhatsapp}
        disabled={vendiendo}
        className="mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl2 border-none bg-[#25D366] px-4 py-3.5 text-sm font-bold text-white cursor-pointer"
      >
        <WhatsAppIcon size={16} /> Todavía no, avisarle primero
      </button>
      <button
        onClick={onClose}
        disabled={vendiendo}
        className="w-full border-none bg-transparent py-1.5 text-[13px] font-semibold text-ink-soft cursor-pointer"
      >
        Cancelar
      </button>
    </ConfirmDialog>
  );
}