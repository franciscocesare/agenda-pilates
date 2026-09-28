"use client";
import { Sparkles } from "lucide-react";
import ConfirmDialog from "../../ConfirmDialog";
import type { Usuario } from "./types";

export default function ConfirmUsoCreditoDialog({
  usuario,
  fecha,
  hora,
  totalCreditos,
  loading,
  onConfirmar,
  onClose,
}: {
  usuario: Usuario;
  fecha: string;
  hora: string;
  /** Cuántos créditos por cancelación tiene disponibles en total (antes de gastar este). */
  totalCreditos: number;
  loading: boolean;
  onConfirmar: () => void;
  onClose: () => void;
}) {
  return (
    <ConfirmDialog
      closable={!loading}
      onClose={onClose}
      title={`Estás usando ${totalCreditos === 1 ? "el único crédito disponible" : "1 de sus créditos disponibles"}`}
      description={
        <>
          Le vas a asignar a <strong>{usuario.nombre} {usuario.apellido}</strong> el{" "}
          {fecha && new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", { day: "numeric", month: "long" })}{" "}
          a las {hora} hs usando un crédito que tiene por una cancelación anterior — no se le va a cobrar nada por esta clase.
        </>
      }
    >
      <button
        onClick={onConfirmar}
        disabled={loading}
        className={`mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl2 border-none bg-moss px-4 py-3.5 text-sm font-bold text-white cursor-pointer ${
          loading ? "opacity-70" : "opacity-100"
        }`}
      >
        <Sparkles size={16} /> {loading ? "Asignando…" : "Sí, usar el crédito"}
      </button>
      <button
        onClick={onClose}
        disabled={loading}
        className="w-full border-none bg-transparent py-1.5 text-[13px] font-semibold text-ink-soft cursor-pointer"
      >
        Cancelar
      </button>
    </ConfirmDialog>
  );
}