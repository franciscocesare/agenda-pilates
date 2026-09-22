"use client";
import { Check } from "lucide-react";
import ConfirmDialog from "../../ConfirmDialog";
import { WhatsAppIcon } from "../../Icons/WhatsAppIcon";
import type { Usuario } from "./types";

export default function ConfirmPagoDialog({
  usuario,
  fecha,
  hora,
  loading,
  onConfirmarPago,
  onAvisarPorWhatsapp,
  onClose,
}: {
  usuario: Usuario;
  fecha: string;
  hora: string;
  loading: boolean;
  /** Ya está pago: se descuenta el crédito ahora. */
  onConfirmarPago: () => void;
  /** Todavía no: se avisa por WhatsApp y el lugar queda apartado como pendiente de pago. */
  onAvisarPorWhatsapp: () => void;
  onClose: () => void;
}) {
  return (
    <ConfirmDialog
      onClose={onClose}
      title="¿Ya está pago?"
      description={
        <>
          Le vas a apartar a <strong>{usuario.nombre} {usuario.apellido}</strong> el lugar del{" "}
          {fecha &&
            new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long" })}{" "}
          a las {hora} hs. Si ya pagó, se le descuenta 1 crédito ahora. Si todavía no, el lugar queda apartado y el crédito recién se descuenta cuando confirmes el cobro.
        </>
      }
    >
      <button
        onClick={onConfirmarPago}
        disabled={loading}
        className={`mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl2 border-none bg-moss px-4 py-3.5 text-sm font-bold text-white cursor-pointer ${
          loading ? "opacity-70" : "opacity-100"
        }`}
      >
        <Check size={17} /> {loading ? "Guardando…" : "Sí, está pago"}
      </button>

      <button
        onClick={onAvisarPorWhatsapp}
        disabled={loading}
        className={`mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl2 border-none bg-[#25D366] px-4 py-3.5 text-sm font-bold text-white cursor-pointer ${
          loading ? "opacity-70" : "opacity-100"
        }`}
      >
        <WhatsAppIcon size={16} /> Avisarle y apartar el lugar
      </button>

      <button onClick={onClose} className="w-full border-none bg-transparent py-1.5 text-[13px] font-semibold text-ink-soft cursor-pointer">
        Cancelar
      </button>
    </ConfirmDialog>
  );
}
