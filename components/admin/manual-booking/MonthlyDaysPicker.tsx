"use client";
import { Field } from "../../Field";
import { inputStyle, DIAS_LARGO } from "../../ui";
import { DiaHoraPicker } from "../../DiaHoraPicker";
import type { Credito, PlanCatalogo } from "./types";

type Slot = { diaSemana: number | null; hora: string | null };

export default function MonthlyDaysPicker({
  planes,
  planTipoId,
  onPlanTipoIdChange,
  vendiendo,
  mismoTipoExistente,
  diasFaltantes,
  diasSeleccionados,
  onActualizarSlot,
  todosLosDiasCompletos,
}: {
  planes: PlanCatalogo[];
  planTipoId: string;
  onPlanTipoIdChange: (id: string) => void;
  vendiendo: boolean;
  /** El plan mensual que el alumno ya tiene, si coincide con el tipo elegido (para mostrar "ya tiene fijado"). */
  mismoTipoExistente: Credito | undefined;
  diasFaltantes: number;
  diasSeleccionados: Slot[];
  onActualizarSlot: (idx: number, cambios: Partial<{ diaSemana: number; hora: string }>) => void;
  todosLosDiasCompletos: boolean;
}) {
  return (
    <>
      <Field label="Plan mensual">
        <select
          className={inputStyle}
          value={planTipoId}
          disabled={vendiendo}
          onChange={(e) => onPlanTipoIdChange(e.target.value)}
        >
          <option value="">Elegí cuántas veces por semana…</option>
          {planes
            .filter((p) => p.tipo === "MENSUAL")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
        </select>
      </Field>

      {planTipoId && diasFaltantes > 0 && (
        <div className="mb-1">
          {mismoTipoExistente && mismoTipoExistente.patrones.length > 0 && (
            <p className="m-0 mb-2.5 rounded-md2 bg-moss-soft px-3 py-2.5 text-[12.5px] text-moss-dark">
              Ya tiene fijado:{" "}
              <strong>
                {mismoTipoExistente.patrones.map((p) => `${DIAS_LARGO[p.diaSemana]} ${p.hora}`).join(", ")}
              </strong>
              . Completá {diasFaltantes === 1 ? "el día que falta" : `los ${diasFaltantes} días que faltan`}:
            </p>
          )}
          {diasSeleccionados.map((slot, idx) => (
            <div key={idx} className="mb-2.5 rounded-md2 bg-moss-soft p-3">
              <p className="m-0 mb-2.5 text-xs font-extrabold uppercase tracking-wide text-moss-dark">
                Día {idx + 1} de {diasFaltantes}
              </p>
              <DiaHoraPicker value={slot} onChange={(cambios) => onActualizarSlot(idx, cambios)} />
            </div>
          ))}
          {!todosLosDiasCompletos && (
            <p className="m-0 mb-2.5 text-xs text-ink-soft">
              Elegí día y horario en cada uno de los {diasFaltantes} bloques para poder guardar.
            </p>
          )}
        </div>
      )}
    </>
  );
}
