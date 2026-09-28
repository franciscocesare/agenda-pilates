"use client";
import { User } from "lucide-react";

type AlumnaEnHorario = { id: string; nombre: string; nombreCompleto: string; pendiente: boolean; cancelado?: boolean };

/** Chip clickeable de una alumna anotada en un horario: lleva a sus reservas. */
export default function AlumnaChip({
  alumna,
  onClick,
  iconSize = 13,
}: {
  alumna: AlumnaEnHorario;
  onClick: () => void;
  iconSize?: number;
}) {
  return (
    <button
      onClick={onClick}
      title={`Ver reservas de ${alumna.nombreCompleto}`}
      className={`flex items-center gap-1 rounded-full border-none px-2.5 py-1 text-xs font-semibold cursor-pointer ${
        alumna.cancelado ? "bg-danger-soft text-danger" : alumna.pendiente ? "bg-clay-soft text-clay-dark" : "bg-moss-soft text-ink"
      }`}
    >
      <User size={iconSize} /> {alumna.nombre}
      {alumna.cancelado ? " · canceló" : alumna.pendiente ? " · pendiente" : ""}
    </button>
  );
}