"use client";
import { DIAS_LARGO, HORARIOS_BASE } from "./ui";

const CHIP_BASE = "rounded-md2 border-[1.5px] px-1 py-2.5 text-center text-[13px] font-bold cursor-pointer";
const CHIP_ACTIVO_DEFAULT = "border-moss bg-white";

function chipClass(activo: boolean, activeClasses: string) {
  return `${CHIP_BASE} ${activo ? activeClasses : "border-line bg-transparent"}`;
}

/** Grilla de los 6 días hábiles (lunes a sábado). */
export function DiaPicker({
  value,
  onChange,
  activeClasses = CHIP_ACTIVO_DEFAULT,
}: {
  value: number | null;
  onChange: (diaSemana: number) => void;
  activeClasses?: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3, 4, 5, 6].map((d) => (
        <button key={d} type="button" onClick={() => onChange(d)} className={chipClass(value === d, activeClasses)}>
          {DIAS_LARGO[d]}
        </button>
      ))}
    </div>
  );
}

/** Grilla de los horarios base del estudio. */
export function HoraPicker({
  value,
  onChange,
  activeClasses = CHIP_ACTIVO_DEFAULT,
}: {
  value: string | null;
  onChange: (hora: string) => void;
  activeClasses?: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {HORARIOS_BASE.map((h) => (
        <button key={h} type="button" onClick={() => onChange(h)} className={chipClass(value === h, activeClasses)}>
          {h}
        </button>
      ))}
    </div>
  );
}

/**
 * Un slot completo "día de la semana + horario" (ej. un día de un plan
 * mensual), como los que se completan en ProfilePanel al modificar
 * días o en ManualBookingForm al vender un plan nuevo.
 */
export function DiaHoraPicker({
  value,
  onChange,
}: {
  value: { diaSemana: number | null; hora: string | null };
  onChange: (cambios: Partial<{ diaSemana: number; hora: string }>) => void;
}) {
  return (
    <>
      <div className="mb-2.5">
        <DiaPicker value={value.diaSemana} onChange={(diaSemana) => onChange({ diaSemana })} />
      </div>
      <HoraPicker value={value.hora} onChange={(hora) => onChange({ hora })} />
    </>
  );
}
