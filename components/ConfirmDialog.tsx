"use client";
import { ReactNode } from "react";

/**
 * Esqueleto compartido de todos los modales de confirmación de la app
 * (overlay + tarjeta centrada + título + texto + botones). Antes este
 * mismo bloque de JSX estaba copiado y pegado 6 veces entre
 * ProfilePanel y ManualBookingForm — ahora cada lugar solo pasa su
 * título, su texto y sus propios botones de acción.
 */
export default function ConfirmDialog({
  onClose,
  title,
  description,
  children,
  closable = true,
  zIndexClass = "z-50",
}: {
  /** Se llama al tocar afuera de la tarjeta. */
  onClose: () => void;
  title: string;
  description: ReactNode;
  /** Los botones de acción (cada caller trae los suyos: colores, íconos y textos distintos). */
  children: ReactNode;
  /** false mientras hay una acción en curso, para no poder cerrar tocando afuera. */
  closable?: boolean;
  /** z-50 por defecto; subir a z-[60] cuando el diálogo se abre arriba de otro panel (ej. dentro de ProfilePanel). */
  zIndexClass?: string;
}) {
  return (
    <div
      role="dialog"
      className={`fixed inset-0 ${zIndexClass} flex items-center justify-center bg-[rgba(60,42,32,0.4)] p-5`}
      onClick={(e) => {
        e.stopPropagation();
        if (closable) onClose();
      }}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[380px] rounded-[20px] bg-card p-6">
        <p className="m-0 mb-2 text-[17px] font-extrabold text-moss-dark">{title}</p>
        <div className="m-0 mb-[22px] text-sm leading-relaxed text-ink-soft">{description}</div>
        {children}
      </div>
    </div>
  );
}
