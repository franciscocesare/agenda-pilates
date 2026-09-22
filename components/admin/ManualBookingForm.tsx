"use client";
import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { palette, card, btnPrimary, inputStyle } from "../ui";
import { buildWaLink } from "@/lib/whatsapp";
import { fetchCreditosDeAlumno } from "@/lib/api/payments";
import { Field } from "../Field";
import ErrorBanner from "../ErrorBanner";
import ProfilePanel from "../ProfilePanel";
import { HoraPicker } from "../DiaHoraPicker";
import StudentPicker from "./manual-booking/StudentPicker";
import ModeSelector from "./manual-booking/ModeSelector";
import MonthlyDaysPicker from "./manual-booking/MonthlyDaysPicker";
import ConfirmPlanNuevoDialog from "./manual-booking/ConfirmPlanNuevoDialog";
import ConfirmPagoMensualDialog from "./manual-booking/ConfirmPagoMensualDialog";
import ConfirmPagoDialog from "./manual-booking/ConfirmPagoDialog";
import type { Usuario, Credito, PlanCatalogo, Modo } from "./manual-booking/types";

export default function ManualBookingForm({
  onClose,
  onCreated,
  fechaInicial,
  horaInicial,
  titulo = "Asignar turno a un alumno",
}: {
  onClose: () => void;
  onCreated: () => void;
  /** Precarga fecha/hora, por ejemplo cuando viene de tocar un horario puntual en la Agenda. */
  fechaInicial?: string;
  horaInicial?: string;
  titulo?: string;
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [verPerfil, setVerPerfil] = useState(false);
  const [creditos, setCreditos] = useState<Credito[]>([]);
  const [modo, setModo] = useState<Modo>("credito");
  const [fecha, setFecha] = useState(fechaInicial ?? "");
  const [hora, setHora] = useState(horaInicial ?? "");
  const [diasSeleccionados, setDiasSeleccionados] = useState<
    { diaSemana: number | null; hora: string | null }[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmandoPago, setConfirmandoPago] = useState(false);
  const [planes, setPlanes] = useState<PlanCatalogo[]>([]);
  const [vendiendo, setVendiendo] = useState(false);
  const [planTipoId, setPlanTipoId] = useState("");
  const [confirmandoPlanNuevo, setConfirmandoPlanNuevo] = useState(false);
  const [confirmandoPagoMensual, setConfirmandoPagoMensual] = useState(false);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then(setPlanes);
  }, []);

  useEffect(() => {
    if (!usuario) {
      setCreditos([]);
      setPlanTipoId("");
      return;
    }
    fetchCreditosDeAlumno(usuario.id).then((data: Credito[]) => {
        setCreditos(data);
        const conCredito = data.find(
          (c) => c.tipo === "SUELTA" && c.clasesDisponibles > 0,
        );
        const mensualDisponible = data.find(
          (c) =>
            c.tipo === "MENSUAL" &&
            (c.clasesPorSemana ?? 0) > c.patrones.length,
        );
        if (conCredito) {
          setModo("credito");
        } else if (mensualDisponible) {
          setModo("mensual");
          setPlanTipoId(mensualDisponible.planTypeId);
        } else {
          setModo("credito");
        } // sin crédito cargado: al confirmar el pago se genera como venta de clase suelta
      });
  }, [usuario]);

  // El mismo tipo de plan que el elegido en el select, si el alumno ya
  // lo tiene cargado (con lugar libre o no).
  const mismoTipoExistente = creditos.find(
    (c) => c.tipo === "MENSUAL" && c.planTypeId === planTipoId,
  );
  const hayLugarEnMismoTipo =
    !!mismoTipoExistente &&
    (mismoTipoExistente.clasesPorSemana ?? 0) >
      mismoTipoExistente.patrones.length;
  // Cualquier otro plan mensual que el alumno ya tenga (para el aviso).
  const otroMensualExistente =
    mismoTipoExistente ?? creditos.find((c) => c.tipo === "MENSUAL");
  const planElegidoNombre =
    planes.find((p) => p.id === planTipoId)?.nombre ?? "";

  // Cuántos días con horario hay que fijar TODAVÍA. Si vamos a
  // continuar un plan que el alumno ya tiene (con lugar libre), son
  // los que le faltan; si vamos a vender un plan nuevo (porque no
  // tiene este tipo, o porque ya lo completó), son todos los del plan
  // desde cero — coincide con lo que valida el servidor en cualquiera
  // de los dos casos.
  const diasFaltantes =
    hayLugarEnMismoTipo && mismoTipoExistente
      ? (mismoTipoExistente.clasesPorSemana ?? 0) -
        mismoTipoExistente.patrones.length
      : (planes.find((p) => p.id === planTipoId)?.clasesPorSemana ?? 0);

  // Arma (o rearma) la lista de slots vacíos "Día N" cada vez que
  // cambia el plan elegido o cuántos días le faltan, para que el admin
  // tenga que completar todos antes de poder guardar.
  useEffect(() => {
    setDiasSeleccionados(
      Array.from({ length: diasFaltantes }, () => ({
        diaSemana: null,
        hora: null,
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planTipoId, diasFaltantes]);

  const actualizarSlot = (
    idx: number,
    cambios: Partial<{ diaSemana: number; hora: string }>,
  ) => {
    setDiasSeleccionados((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, ...cambios } : d)),
    );
  };

  const todosLosDiasCompletos =
    diasFaltantes > 0 &&
    diasSeleccionados.every((d) => d.diaSemana !== null && d.hora);

  // Un patrón mensual "activo" es el que ya tiene al menos un día/horario
  // fijado (si no tiene ninguno todavía, no hay nada que cancelar/modificar).
  const planMensualDeAlumno = creditos.find(
    (c) => c.tipo === "MENSUAL" && c.patrones.length > 0,
  );

  // Créditos generados por una cancelación a tiempo (no un bono pagado):
  // se muestran aparte para que el admin sepa que ese lugar ya está
  // cubierto y no hay que cobrar nada.
  const creditosPorCancelacion = creditos.filter(
    (c) => c.tipo === "SUELTA" && c.esCredito && c.clasesDisponibles > 0,
  );
  const totalCreditosPorCancelacion = creditosPorCancelacion.reduce(
    (acc, c) => acc + c.clasesDisponibles,
    0,
  );
  const vencimientoMasProximo = creditosPorCancelacion
    .map((c) => new Date(c.vencimiento))
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const crear = async (pagoConfirmado?: boolean) => {
    if (!usuario) return;
    setLoading(true);
    setError(null);

    let body: Record<string, unknown> | null = null;
    if (modo === "credito" && fecha && hora)
      body = {
        modo: "credito",
        userId: usuario.id,
        fecha,
        hora,
        pagoConfirmado: !!pagoConfirmado,
      };
    if (modo === "cortesia" && fecha && hora)
      body = { modo: "cortesia", userId: usuario.id, fecha, hora };
    if (!body) {
      setLoading(false);
      return;
    }

    const res = await fetch("/api/admin/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setConfirmandoPago(false);
    onCreated();
  };

  // Fija TODOS los días/horarios elegidos sobre un plan mensual
  // (paymentId) que ya existe: puede ser uno que el alumno ya tenía, o
  // uno recién vendido en resolverYAsignarMensual. Se manda todo junto
  // en una sola llamada: el servidor rechaza el pedido si no viene
  // exactamente la cantidad de días que le faltan al plan.
  const crearDiasMensuales = async (paymentIdAUsar: string) => {
    if (!usuario) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/admin/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        modo: "mensual",
        userId: usuario.id,
        paymentId: paymentIdAUsar,
        dias: diasSeleccionados.map((d) => ({
          diaSemana: d.diaSemana,
          hora: d.hora,
        })),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setConfirmandoPlanNuevo(false);
    onCreated();
  };

  // Resuelve el select simple de "1/2/3 veces por semana": si el
  // alumno ya tiene exactamente ese plan con lugar libre, reusa ese
  // pago y fija los días directo (no hay nada que cobrar de nuevo). Si
  // ya tiene ALGÚN plan mensual (el mismo ya completo, u otro
  // distinto) y todavía no confirmamos, frena y avisa antes de
  // venderle un plan nuevo. `forzar` es lo que manda el botón "Sí,
  // agregar igual" del aviso. No deja avanzar en ningún caso si
  // todavía faltan días/horarios por elegir. Vender un plan NUEVO
  // (alumno sin este plan todavía, o agregándole otro a propósito)
  // siempre pasa antes por la confirmación de pago.
  const resolverYAsignarMensual = (forzar = false) => {
    if (!usuario || !planTipoId || !todosLosDiasCompletos) return;

    if (hayLugarEnMismoTipo && mismoTipoExistente) {
      crearDiasMensuales(mismoTipoExistente.id);
      return;
    }

    if (otroMensualExistente && !forzar) {
      setConfirmandoPlanNuevo(true);
      return;
    }

    setConfirmandoPlanNuevo(false);
    setConfirmandoPagoMensual(true);
  };

  // Se llama recién cuando el admin confirmó "sí, ya pagó" en el
  // diálogo de pago mensual — ahí sí se genera el pago y se fijan los
  // días. Si contesta que no, no se crea nada todavía: el admin puede
  // volver a intentarlo una vez que llegue el pago.
  const venderYAsignarMensualConfirmado = async () => {
    if (!usuario || !planTipoId) return;
    setVendiendo(true);
    setError(null);
    const res = await fetch("/api/admin/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: usuario.id, planTypeId: planTipoId }),
    });
    const data = await res.json();
    setVendiendo(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
    setConfirmandoPagoMensual(false);
    await crearDiasMensuales(data.id);
  };

  const intentarAsignar = () => {
    if (modo === "mensual") {
      resolverYAsignarMensual();
      return;
    }
    // Si ya tiene un crédito por cancelación, no hay nada que cobrar:
    // se descuenta directo. Para "clase suelta" pagada sí pedimos
    // confirmar el cobro antes de guardar, para no descontarla sin cobrar.
    if (modo === "credito" && totalCreditosPorCancelacion > 0) {
      crear(true);
      return;
    }
    if (modo === "credito") {
      setConfirmandoPago(true);
      return;
    }
    crear();
  };

  const avisarPorWhatsapp = () => {
    if (!usuario || !fecha || !hora) return;
    const fechaFmt = new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const texto = `¡Hola ${usuario.nombre}! Te estoy apartando la clase del ${fechaFmt} a las ${hora} hs. Cuando puedas pasame el pago de la clase suelta para confirmarla 🌿`;
    window.open(buildWaLink(usuario.telefono, texto), "_blank");
    // No confirmamos el pago: el lugar queda apartado como "pendiente
    // de pago" y el crédito recién se descuenta cuando el admin
    // confirme el cobro desde el panel de Reservas.
    crear(false);
  };

  const puedeCrear =
    !!usuario &&
    ((modo !== "mensual" && !!fecha && !!hora) ||
      (modo === "mensual" && !!planTipoId && todosLosDiasCompletos));

  return (
    <div className={`${card} relative mb-4`}>
      <div className="mb-3.5 flex items-center justify-between">
        <p className="m-0 font-extrabold">{titulo}</p>
        <button onClick={onClose} className="border-none bg-transparent text-ink-soft cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <ErrorBanner message={error} />

      <Field label="Alumno">
        <StudentPicker
          usuario={usuario}
          onSelect={setUsuario}
          onClear={() => { setUsuario(null); setPlanTipoId(""); }}
          onVerPerfil={() => setVerPerfil(true)}
        />
      </Field>

      <form onSubmit={(e) => { e.preventDefault(); intentarAsignar(); }}>
        {usuario && totalCreditosPorCancelacion > 0 && (
          <div className="mb-3.5 flex items-center gap-2.5 rounded-md2 bg-clay-soft px-3 py-2.5">
            <Sparkles size={16} color={palette.clayDark} className="shrink-0" />
            <p className="m-0 text-[12.5px] font-semibold text-clay-dark">
              {usuario.nombre} tiene{" "}
              {totalCreditosPorCancelacion === 1
                ? "1 crédito disponible"
                : `${totalCreditosPorCancelacion} créditos disponibles`}{" "}
              por cancelación
              {vencimientoMasProximo
                ? ` (vence antes el ${vencimientoMasProximo.toLocaleDateString("es-AR", { day: "numeric", month: "long", timeZone: "UTC" })})`
                : ""}
              . No hace falta cobrarle esta clase.
            </p>
          </div>
        )}

        {usuario && (
          <ModeSelector
            modo={modo}
            onChange={setModo}
            totalCreditosPorCancelacion={totalCreditosPorCancelacion}
            tieneClaseSueltaDisponible={creditos.some((c) => c.tipo === "SUELTA" && c.clasesDisponibles > 0)}
          />
        )}

        {usuario && modo === "mensual" && (
          <MonthlyDaysPicker
            planes={planes}
            planTipoId={planTipoId}
            onPlanTipoIdChange={setPlanTipoId}
            vendiendo={vendiendo}
            mismoTipoExistente={mismoTipoExistente}
            diasFaltantes={diasFaltantes}
            diasSeleccionados={diasSeleccionados}
            onActualizarSlot={actualizarSlot}
            todosLosDiasCompletos={todosLosDiasCompletos}
          />
        )}

        {usuario && modo !== "mensual" && (
          <Field label="Fecha">
            <input
              className={inputStyle}
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </Field>
        )}

        {usuario && modo !== "mensual" && (
          <Field label="Horario">
            <HoraPicker value={hora} onChange={setHora} activeClasses="border-moss bg-moss-soft" />
          </Field>
        )}

        <button
          type="submit"
          className={`${btnPrimary} ${puedeCrear && !loading && !vendiendo ? "opacity-100" : "opacity-60"}`}
          disabled={!puedeCrear || loading || vendiendo}
        >
          {vendiendo
            ? "Vendiendo el plan…"
            : loading
              ? "Asignando…"
              : "Asignar turno"}
        </button>
      </form>

      {verPerfil && usuario && (
        <ProfilePanel
          sesion={usuario}
          contactoNumero={usuario.telefono}
          mostrarLogout={false}
          planMensual={
            planMensualDeAlumno
              ? {
                  paymentId: planMensualDeAlumno.id,
                  nombre: planMensualDeAlumno.nombre,
                  clasesPorSemana: planMensualDeAlumno.clasesPorSemana ?? 1,
                  patrones: planMensualDeAlumno.patrones,
                }
              : undefined
          }
          onClasesCanceladas={() => {
            setVerPerfil(false);
            fetchCreditosDeAlumno(usuario.id).then(setCreditos);
            onCreated();
          }}
          onDiasModificados={() => {
            fetchCreditosDeAlumno(usuario.id).then(setCreditos);
          }}
          onActualizado={(datos) =>
            setUsuario((prev) => (prev ? { ...prev, ...datos } : prev))
          }
          onClose={() => setVerPerfil(false)}
        />
      )}

      {confirmandoPlanNuevo && usuario && (
        <ConfirmPlanNuevoDialog
          usuario={usuario}
          otroMensualExistente={otroMensualExistente}
          planElegidoNombre={planElegidoNombre}
          vendiendo={vendiendo}
          loading={loading}
          onConfirm={() => resolverYAsignarMensual(true)}
          onClose={() => setConfirmandoPlanNuevo(false)}
        />
      )}

      {confirmandoPagoMensual && usuario && (
        <ConfirmPagoMensualDialog
          usuario={usuario}
          planElegidoNombre={planElegidoNombre}
          vendiendo={vendiendo}
          error={error}
          onConfirm={venderYAsignarMensualConfirmado}
          onClose={() => setConfirmandoPagoMensual(false)}
        />
      )}

      {confirmandoPago && usuario && (
        <ConfirmPagoDialog
          usuario={usuario}
          fecha={fecha}
          hora={hora}
          loading={loading}
          onConfirmarPago={() => crear(true)}
          onAvisarPorWhatsapp={avisarPorWhatsapp}
          onClose={() => setConfirmandoPago(false)}
        />
      )}
    </div>
  );
}
