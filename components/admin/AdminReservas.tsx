"use client";
import { useEffect, useState } from "react";
import { Search, Plus, Check, UserX, X, Wallet, UserCircle } from "lucide-react";
import { palette, card, btnPrimary, btnGhost, inputStyle, fmtLarga } from "../ui";
import { buildWaLink, mensajeRecordatorioPago } from "@/lib/whatsapp";
import { patchReservationEstado } from "@/lib/api/reservations";
import { fetchCreditosDeAlumno } from "@/lib/api/payments";
import ManualBookingForm from "./ManualBookingForm";
import ProfilePanel from "../ProfilePanel";
import { WhatsAppIcon } from "../Icons/WhatsAppIcon";

type Reserva = {
  id: string; fecha: string; hora: string; estado: string; recurringReservationId: string | null;
  user: { id: string; nombre: string; apellido: string; telefono: string; email: string };
};
type PlanMensualInfo = { paymentId: string; nombre: string; clasesPorSemana: number; patrones: { diaSemana: number; hora: string }[] };

export default function AdminReservas({ alumnoInicial }: { alumnoInicial?: { id: string; nombre: string } }) {
  const [q, setQ] = useState(alumnoInicial?.nombre ?? "");
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [buscado, setBuscado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendientes, setPendientes] = useState<Reserva[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [actualizando, setActualizando] = useState<string | null>(null);

  const cargarPendientes = async () => {
    const res = await fetch("/api/admin/reservations?estado=PENDIENTE_PAGO");
    setPendientes(await res.json());
  };

  useEffect(() => { cargarPendientes(); }, []);

  // Si venimos de tocar el nombre de una alumna en la Agenda, ya
  // sabemos exactamente quién es (por id) — no hace falta que el
  // admin escriba nada, mostramos directo sus turnos.
  useEffect(() => {
    if (!alumnoInicial) return;
    setLoading(true);
    setBuscado(true);
    fetch(`/api/admin/reservations?userId=${alumnoInicial.id}`).then((r) => r.json()).then((data) => {
      setReservas(data);
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alumnoInicial?.id]);

  const cargar = async (query: string) => {
    if (query.trim().length < 2) { setReservas([]); setBuscado(false); return; }
    setLoading(true);
    setBuscado(true);
    const res = await fetch(`/api/admin/reservations?q=${encodeURIComponent(query)}`);
    setReservas(await res.json());
    setLoading(false);
  };

  const [verPerfil, setVerPerfil] = useState<Reserva["user"] | null>(null);
  const [planMensualPerfil, setPlanMensualPerfil] = useState<PlanMensualInfo | undefined>(undefined);

  // Abre el perfil completo de esa alumna (igual que en "Asignar
  // turno"): datos, plan mensual con "Modificar días"/"Cancelar
  // clases", editar datos y WhatsApp. Para eso hay que traer también
  // sus créditos/plan mensual, que no vienen en la fila del turno.
  const abrirPerfil = async (user: Reserva["user"]) => {
    setVerPerfil(user);
    setPlanMensualPerfil(undefined);
    const creditos = await fetchCreditosDeAlumno(user.id);
    const planMensual = creditos.find((c) => c.tipo === "MENSUAL" && c.patrones.length > 0);
    if (planMensual) {
      setPlanMensualPerfil({
        paymentId: planMensual.id,
        nombre: planMensual.nombre,
        clasesPorSemana: planMensual.clasesPorSemana ?? 1,
        patrones: planMensual.patrones,
      });
    }
  };

  const cambiarEstado = async (id: string, estado: string) => {
    setActualizando(id);
    await patchReservationEstado(id, estado);
    setActualizando(null);
    cargarPendientes();
    if (q) cargar(q);
  };

  const estadoClases = (e: string) => {
    if (e === "CONFIRMADO") return { badge: "bg-moss-soft text-moss", label: "Confirmado" };
    if (e === "PENDIENTE_PAGO") return { badge: "bg-clay-soft text-clay-dark", label: "Pendiente de pago" };
    if (e === "CANCELADO") return { badge: "bg-danger-soft text-danger", label: "Cancelado" };
    if (e === "AUSENTE") return { badge: "bg-[#F0EDE3] text-ink-soft", label: "Ausente" };
    return { badge: "bg-clay-soft text-clay-dark", label: "Completado" };
  };

  const linkRecordatorio = (r: Reserva) => {
    const fechaFmt = new Date(r.fecha).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
    return buildWaLink(r.user.telefono, mensajeRecordatorioPago(r.user.nombre, fechaFmt, r.hora));
  };

  const renderReserva = (r: Reserva) => {
    const es = estadoClases(r.estado);
    const enCurso = actualizando === r.id;
    return (
      <div key={r.id} className={`${card} mb-2.5 p-4`}>
        <div className="mb-2 flex justify-between">
          <div className="flex items-center gap-2">
            <p className="m-0 font-extrabold">{r.user.nombre} {r.user.apellido}</p>
            <button
              onClick={() => abrirPerfil(r.user)}
              title={`Ver perfil de ${r.user.nombre} '${r.user.apellido}'`}
              className="flex border-none bg-transparent p-0 text-moss cursor-pointer"
            >
              <UserCircle size={20} />
            </button>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${es.badge}`}>{es.label}</span>
        </div>
        <p className="m-0 mb-3 text-[13px] capitalize text-ink-soft">
          {fmtLarga(new Date(r.fecha))} · {r.hora} hs · {r.user.telefono} {r.recurringReservationId ? "· plan mensual" : "· clase suelta"}
        </p>

        {r.estado === "PENDIENTE_PAGO" && (
          <div className="flex flex-wrap gap-2">
            <button
              className={`${btnGhost} flex items-center gap-1.5 !border-moss !text-moss ${enCurso ? "opacity-60" : ""}`}
              disabled={enCurso}
              onClick={() => cambiarEstado(r.id, "CONFIRMAR_PAGO")}
            >
              <Wallet size={14} /> Confirmar pago
            </button>
            <a
              href={linkRecordatorio(r)}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btnGhost} flex items-center gap-1.5 no-underline`}
            >
              <WhatsAppIcon size={16} /> Recordarle
            </a>
            <button
              className={`${btnGhost} flex items-center gap-1.5 !border-danger !text-danger ${enCurso ? "opacity-60" : ""}`}
              disabled={enCurso}
              onClick={() => cambiarEstado(r.id, "CANCELADO")}
            >
              <X size={14} /> Cancelar
            </button>
          </div>
        )}

        {r.estado === "CONFIRMADO" && (
          <div className="flex flex-wrap gap-2">
            <button className={`${btnGhost} flex items-center gap-1.5 ${enCurso ? "opacity-60" : ""}`} disabled={enCurso} onClick={() => cambiarEstado(r.id, "COMPLETADO")}>
              <Check size={14} /> Completado
            </button>
            <button className={`${btnGhost} flex items-center gap-1.5 ${enCurso ? "opacity-60" : ""}`} disabled={enCurso} onClick={() => cambiarEstado(r.id, "AUSENTE")}>
              <UserX size={14} /> Ausente
            </button>
            <button className={`${btnGhost} flex items-center gap-1.5 !border-danger !text-danger ${enCurso ? "opacity-60" : ""}`} disabled={enCurso} onClick={() => cambiarEstado(r.id, "CANCELADO")}>
              <X size={14} /> Cancelar
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="mb-0.5 mt-2 font-display text-[22px] font-semibold text-moss">Reservas</h1>
        <p className="m-0 text-sm text-ink-soft">Buscá a una alumna/o para asignar una reserva.</p>
      </div>

      {!mostrarForm && (
        <button className={`${btnPrimary} mb-4 flex items-center justify-center gap-2`} onClick={() => setMostrarForm(true)}>
          <Plus size={18} /> Asignar turno a un alumno
        </button>
      )}

      {mostrarForm && (
        <ManualBookingForm onClose={() => setMostrarForm(false)} onCreated={() => { setMostrarForm(false); cargarPendientes(); if (q) cargar(q); }} />
      )}

      {pendientes.length > 0 && (
        <div className="mb-6">
          <p className="m-0 mb-2.5 text-[13px] font-extrabold uppercase tracking-wide text-clay-dark">
            Pendientes de pago ({pendientes.length})
          </p>
          {pendientes.map(renderReserva)}
        </div>
      )}

      <div className="my-5 mb-2.5">
        <h1 className="mb-0.5 mt-2 font-display text-[22px] font-semibold text-moss">Ver reservas</h1>
        <p className="m-0 text-sm text-ink-soft">Buscá a una alumna/o para ver sus clases.</p>
      </div>
      <div className="relative mb-4">
        <Search size={17} color={palette.inkSoft} className="absolute left-[13px] top-3.5" />
        <input
          className={`${inputStyle} pl-10`}
          placeholder="Buscar alumna por nombre o teléfono…"
          value={q}
          onChange={(e) => { setQ(e.target.value); cargar(e.target.value); }}
        />
      </div>

      {loading && <p className="p-5 text-center text-ink-soft">Buscando…</p>}
      {buscado && !loading && reservas.length === 0 && <p className="p-5 text-center text-ink-soft">No encontramos turnos para esa búsqueda.</p>}

      {reservas.map(renderReserva)}

      {verPerfil && (
        <ProfilePanel
          sesion={verPerfil}
          contactoNumero={verPerfil.telefono}
          mostrarLogout={false}
          planMensual={planMensualPerfil}
          onClasesCanceladas={() => { setVerPerfil(null); cargarPendientes(); if (q) cargar(q); }}
          onDiasModificados={() => { setVerPerfil(null); if (q) cargar(q); }}
          onActualizado={() => { setVerPerfil(null); if (q) cargar(q); }}
          onClose={() => setVerPerfil(null)}
        />
      )}
    </div>
  );
}
