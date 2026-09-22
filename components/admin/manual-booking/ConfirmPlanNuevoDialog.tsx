"use client";
import ConfirmDialog from "../../ConfirmDialog";
import type { Credito, Usuario } from "./types";

export default function ConfirmPlanNuevoDialog({
  usuario,
  otroMensualExistente,
  planElegidoNombre,
  vendiendo,
  loading,
  onConfirm,
  onClose,
}: {
  usuario: Usuario;
  otroMensualExistente: Credito | undefined;
  planElegidoNombre: string;
  vendiendo: boolean;
  loading: boolean;
  /** El admin confirmó que quiere agregar el plan igual. */
  onConfirm: () => void;
  onClose: () => void;
}) {
  const enCurso = vendiendo || loading;
  return (
    <ConfirmDialog
      onClose={onClose}
      title="Este alumno ya tiene un plan mensual"
      description={
        <>
          <strong>{usuario.nombre} {usuario.apellido}</strong> ya tiene cargado{" "}
          <strong>{otroMensualExistente?.nombre}</strong> ({otroMensualExistente?.patrones.length}/
          {otroMensualExistente?.clasesPorSemana} días fijados). ¿Querés venderle además el plan{" "}
          <strong>{planElegidoNombre}</strong> y agregarle este día igual?
        </>
      }
    >
      <button
        onClick={onConfirm}
        disabled={enCurso}
        className={`mb-2.5 flex w-full items-center justify-center gap-2 rounded-xl2 border-none bg-moss px-4 py-3.5 text-sm font-bold text-white cursor-pointer ${
          enCurso ? "opacity-70" : "opacity-100"
        }`}
      >
        {enCurso ? "Guardando…" : "Sí, agregar igual"}
      </button>
      <button onClick={onClose} className="w-full border-none bg-transparent py-1.5 text-[13px] font-semibold text-ink-soft cursor-pointer">
        Cancelar
      </button>
    </ConfirmDialog>
  );
}
