"use client";
import { Wallet, Repeat, Gift } from "lucide-react";
import { Field } from "../../Field";
import type { Modo } from "./types";

function ModoBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Wallet;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-md2 border-[1.5px] px-1 py-2.5 text-xs font-bold cursor-pointer ${
        active ? "border-moss bg-moss-soft text-moss" : "border-line bg-white text-ink-soft"
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

export default function ModeSelector({
  modo,
  onChange,
  totalCreditosPorCancelacion,
  tieneClaseSueltaDisponible,
}: {
  modo: Modo;
  onChange: (modo: Modo) => void;
  /** Créditos generados por una cancelación a tiempo (no un bono pagado). */
  totalCreditosPorCancelacion: number;
  /** Si ya tiene un bono de clases sueltas cargado con lugar disponible. */
  tieneClaseSueltaDisponible: boolean;
}) {
  return (
    <Field label="¿De dónde sale la clase?">
      <div className="grid grid-cols-3 gap-2">
        <ModoBtn
          active={modo === "credito"}
          onClick={() => onChange("credito")}
          icon={Wallet}
          label={totalCreditosPorCancelacion > 0 ? "Usar crédito" : "Clase suelta"}
        />
        <ModoBtn active={modo === "mensual"} onClick={() => onChange("mensual")} icon={Repeat} label="Día fijo mensual" />
        <ModoBtn active={modo === "cortesia"} onClick={() => onChange("cortesia")} icon={Gift} label="Cortesía" />
      </div>
      {modo === "credito" && (
        <p className="m-0 mt-2.5 text-xs text-ink-soft">
          {totalCreditosPorCancelacion > 0
            ? "Descuenta 1 de sus créditos por cancelación disponibles. No se genera ningún pago nuevo."
            : tieneClaseSueltaDisponible
              ? "Descuenta 1 clase de su bono disponible. Te vamos a pedir confirmar el pago antes de guardar."
              : "Este alumno no tiene clases sueltas cargadas todavía: al confirmar el pago, se le crea la clase suelta en el momento (no hace falta que compre un plan antes)."}
        </p>
      )}
      {modo === "cortesia" && (
        <p className="m-0 mt-2.5 text-xs text-ink-soft">No descuenta ningún crédito (clase de prueba, reposición, etc.).</p>
      )}
    </Field>
  );
}
