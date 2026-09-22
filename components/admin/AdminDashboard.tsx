"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Wallet, X, MessageCircle, CalendarX, Users, Search, Mail, Phone, UserPlus, UserCircle } from "lucide-react";
import { palette, card, inputStyle } from "../ui";
import { buildWaLink, mensajeRecordatorioPago } from "@/lib/whatsapp";
import { patchReservationEstado } from "@/lib/api/reservations";
import { useBuscarAlumnas } from "@/lib/hooks/useBuscarAlumnas";
import type { Alumno } from "@/lib/types";
import { BRAND } from "@/lib/brand";
import { WhatsAppIcon } from "../Icons/WhatsAppIcon";
import AlumnaChip from "../AlumnaChip";
import ProfilePanel from "../ProfilePanel";

type Pendiente = { id: string; fecha: string; hora: string; user: { id: string; nombre: string; apellido: string; telefono: string } };
type AlumnaHorario = { id: string; nombre: string; nombreCompleto: string; pendiente: boolean };
type HorarioHoy = { hora: string; cancelado: boolean; alumnas: AlumnaHorario[] };
type DiaSemana = { fecha: string; bloqueado: boolean; horariosLibres: { hora: string; quedan: number }[] };
type Inicio = {
  pendientesDePago: Pendiente[];
  hoy: { fecha: string; bloqueado: boolean; horarios: HorarioHoy[] };
  semana: DiaSemana[];
  alumnosMes: { actual: number; pasado: number };
};

const fmtDia = (fecha: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(fecha + "T00:00:00").toLocaleDateString("es-AR", opts);

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

// Colores de fondo para el contador de una sección plegable (ej. la
// cantidad de pendientes de pago), como par [texto, fondo] ya que
// Tailwind necesita clases completas y no puede construir un color
// con transparencia agregada en tiempo de ejecución (`color + "22"`).
const CONTADOR_CLASES: Record<"moss" | "clay", string> = {
  moss: "text-moss bg-moss-soft",
  clay: "text-clay-dark bg-clay-soft",
};

/** Sección plegable: el título siempre se ve, el contenido solo si está abierta. */
function Seccion({
  titulo, contador, contadorColor = "moss", abierta, onToggle, children,
}: {
  titulo: string; contador?: number; contadorColor?: "moss" | "clay"; abierta: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className={`${card} mb-4 overflow-hidden p-0`}>
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between border-none bg-transparent px-[18px] py-4 text-left cursor-pointer"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-bold text-ink">{titulo}</span>
          {contador !== undefined && contador > 0 && (
            <span className={`rounded-full px-2 py-0.5 text-[11.5px] font-bold ${CONTADOR_CLASES[contadorColor]}`}>
              {contador}
            </span>
          )}
        </span>
        <ChevronDown size={18} color={palette.inkSoft} className={`transition-transform duration-150 ${abierta ? "rotate-180" : ""}`} />
      </button>
      {abierta && <div className="px-[18px] pb-[18px]">{children}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [datos, setDatos] = useState<Inicio | null>(null);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [abiertas, setAbiertas] = useState({ pendientes: false, hoy: false, semana: false, alumnosMes: false, contacto: false, importar: false });
  const [textoImportar, setTextoImportar] = useState("");
  const [importando, setImportando] = useState(false);
  const [resultadoImportar, setResultadoImportar] = useState<{ creadas: number; duplicadas: string[]; fallidas: { fila: string; motivo: string }[] } | null>(null);
  const [errorImportar, setErrorImportar] = useState<string | null>(null);
  const [qContacto, setQContacto] = useState("");
  const resultadosContacto = useBuscarAlumnas(qContacto);
  const [perfilAlumno, setPerfilAlumno] = useState<Alumno | null>(null);

  const toggle = (clave: keyof typeof abiertas) => setAbiertas((prev) => ({ ...prev, [clave]: !prev[clave] }));

  const cargar = () => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setDatos);
  };

  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (id: string, estado: string) => {
    setActualizando(id);
    await patchReservationEstado(id, estado);
    setActualizando(null);
    cargar();
  };

  const irAReservasDe = (id: string, nombreCompleto: string) => router.push(`/admin/reservas?userId=${id}&nombre=${encodeURIComponent(nombreCompleto)}`);

  // Cada línea: "Nombre Apellido, Teléfono, Email(opcional)". El
  // apellido y el email son opcionales (alcanza con "Nombre, Teléfono"
  // o incluso solo "Nombre" si más adelante se le agrega el teléfono
  // a mano). Ignora líneas vacías.
  // Formato ideal: "Nombre Apellido, Teléfono, Email". Pero admite
  // pegado más informal: sin coma entre nombre y teléfono ("Julia
  // +54 9 3516 763769"), con coma final vacía ("Julia +54 9..., "),
  // o teléfono pegado sin espacios — en todos esos casos separa el
  // teléfono por patrón (un tramo de dígitos/espacios/guiones de al
  // menos 7 caracteres) en vez de depender de la coma.
  const REGEX_TELEFONO = /(\+?\d[\d\s-]{6,}\d)\s*$/;
  const parsearAlumnas = (texto: string) => {
    return texto
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((linea) => {
        let partes = linea
          .split(",")
          .map((p) => p.trim())
          .filter((p, i) => !(i > 0 && p === "")); // ignora una coma final vacía

        if (partes.length === 1) {
          const match = partes[0].match(REGEX_TELEFONO);
          if (match) {
            partes = [partes[0].slice(0, match.index).trim(), match[1].trim()];
          }
        }

        const [nombreCompleto = "", telefono = "", email = ""] = partes;
        const [nombre, ...resto] = nombreCompleto.split(/\s+/);
        const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
        return { nombre: nombre ?? "", apellido: resto.join(" "), telefono: telefono.trim(), email: emailValido };
      });
  };

  const alumnasAImportar = parsearAlumnas(textoImportar);
  const alumnasSinTelefono = alumnasAImportar.filter((a) => !a.telefono);

  const importarAlumnas = async () => {
    setImportando(true);
    setErrorImportar(null);
    setResultadoImportar(null);
    const conTelefono = alumnasAImportar.filter((a) => a.telefono);
    const res = await fetch("/api/admin/users/importar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ alumnas: conTelefono }),
    });
    const data = await res.json();
    setImportando(false);
    if (!res.ok) { setErrorImportar(data.error); return; }
    setResultadoImportar(data);
    setTextoImportar("");
  };

  if (!datos) return <p className="p-10 text-center text-ink-soft">Cargando…</p>;

  const hoyDate = new Date(datos.hoy.fecha + "T00:00:00");
  const mesActualNombre = MESES[hoyDate.getMonth()];
  const mesPasadoNombre = MESES[(hoyDate.getMonth() + 11) % 12];

  return (
    <div>
      <div className="mb-5">
        <h1 className="m-0 mb-0.5 mt-2 font-display text-[22px] font-semibold text-moss">Panel administrativo</h1>
        <p className="m-0 text-sm text-ink-soft">Resumen general de {BRAND.nombre}</p>
      </div>

      <Seccion titulo="Pendientes de pago" contador={datos.pendientesDePago.length} contadorColor="clay" abierta={abiertas.pendientes} onToggle={() => toggle("pendientes")}>
        {datos.pendientesDePago.length === 0 ? (
          <p className="m-0 text-[13px] text-ink-soft">No hay ninguna clase pendiente de pago.</p>
        ) : (
          datos.pendientesDePago.map((p) => {
            const enCurso = actualizando === p.id;
            const linkWa = buildWaLink(p.user.telefono, mensajeRecordatorioPago(p.user.nombre, fmtDia(p.fecha, { day: "numeric", month: "long" }), p.hora));
            return (
              <div key={p.id} className="border-t border-line py-2.5">
                <p className="m-0 mb-0.5 text-sm font-bold">{p.user.nombre} {p.user.apellido}</p>
                <p className="m-0 mb-2 text-[12.5px] capitalize text-ink-soft">
                  {fmtDia(p.fecha, { weekday: "long", day: "numeric", month: "long" })} · {p.hora} hs
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => cambiarEstado(p.id, "CONFIRMAR_PAGO")}
                    disabled={enCurso}
                    className={`flex items-center gap-1.5 rounded-md2 border-[1.5px] border-moss bg-transparent px-3 py-1.5 text-[12.5px] font-bold text-moss cursor-pointer ${enCurso ? "opacity-60" : ""}`}
                  >
                    <Wallet size={13} /> Confirmar pago
                  </button>
                  <a
                    href={linkWa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-md2 border-[1.5px] border-line bg-transparent px-3 py-1.5 text-[12.5px] font-bold text-ink no-underline"
                  >
                    <MessageCircle size={13} color="#25D366" /> Recordarle
                  </a>
                  <button
                    onClick={() => cambiarEstado(p.id, "CANCELADO")}
                    disabled={enCurso}
                    className={`flex items-center gap-1.5 rounded-md2 border-[1.5px] border-danger bg-transparent px-3 py-1.5 text-[12.5px] font-bold text-danger cursor-pointer ${enCurso ? "opacity-60" : ""}`}
                  >
                    <X size={13} /> Cancelar
                  </button>
                </div>
              </div>
            );
          })
        )}
      </Seccion>

      <Seccion titulo={`Hoy · ${fmtDia(datos.hoy.fecha, { weekday: "long", day: "numeric", month: "long" })}`} abierta={abiertas.hoy} onToggle={() => toggle("hoy")}>
        {datos.hoy.bloqueado ? (
          <p className="m-0 text-[13px] text-ink-soft">Hoy está bloqueado — no hay clases.</p>
        ) : datos.hoy.horarios.length === 0 ? (
          <p className="m-0 text-[13px] text-ink-soft">Hoy no hay franja horaria configurada.</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {datos.hoy.horarios.map((h) => (
              <div key={h.hora} className="flex items-center gap-2.5">
                <span className="w-[42px] shrink-0 text-[12.5px] font-bold text-ink-soft">{h.hora}</span>
                {h.cancelado ? (
                  <span className="text-[12.5px] font-semibold text-danger">Cancelado</span>
                ) : h.alumnas.length === 0 ? (
                  <span className="text-[12.5px] text-ink-soft">Sin alumnas anotadas</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {h.alumnas.map((a) => (
                      <AlumnaChip key={a.id} alumna={a} onClick={() => irAReservasDe(a.id, a.nombreCompleto)} iconSize={11} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Seccion>

      <Seccion titulo="Horarios libres esta semana" abierta={abiertas.semana} onToggle={() => toggle("semana")}>
        {datos.semana.length === 0 ? (
          <p className="m-0 text-[13px] text-ink-soft">No hay más días de estudio esta semana.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {datos.semana.map((d) => (
              <div key={d.fecha}>
                <p className="m-0 mb-1.5 text-[12.5px] font-bold capitalize text-moss-dark">
                  {fmtDia(d.fecha, { weekday: "long", day: "numeric" })}
                </p>
                {d.bloqueado ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-danger">
                    <CalendarX size={12} /> Bloqueado
                  </span>
                ) : d.horariosLibres.length === 0 ? (
                  <span className="text-xs text-ink-soft">Completo</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {d.horariosLibres.map((h) => (
                      <span
                        key={h.hora}
                        className="rounded-full bg-moss-soft px-2.5 py-1 text-xs font-semibold text-moss"
                      >
                        {h.hora} · {h.quedan} libre{h.quedan === 1 ? "" : "s"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Seccion>

      <Seccion titulo="Alumnas por mes" abierta={abiertas.alumnosMes} onToggle={() => toggle("alumnosMes")}>
        <div className="flex gap-3">
          <div className="flex-1 rounded-md2 bg-moss-soft px-2 py-3.5 text-center">
            <Users size={16} color={palette.moss} className="mb-1 inline-block" />
            <p className="my-0.5 text-2xl font-extrabold text-moss-dark">{datos.alumnosMes.actual}</p>
            <p className="m-0 text-[11.5px] capitalize text-ink-soft">{mesActualNombre} (en curso)</p>
          </div>
          <div className="flex-1 rounded-md2 bg-bg px-2 py-3.5 text-center">
            <Users size={16} color={palette.inkSoft} className="mb-1 inline-block" />
            <p className="my-0.5 text-2xl font-extrabold text-ink">{datos.alumnosMes.pasado}</p>
            <p className="m-0 text-[11.5px] capitalize text-ink-soft">{mesPasadoNombre}</p>
          </div>
        </div>
        <p className="m-0 mt-2.5 text-[11.5px] text-ink-soft">Cuenta alumnas distintas con al menos una clase reservada (no canceladas) en cada mes.</p>
      </Seccion>

      <Seccion titulo="Contactar alumno" abierta={abiertas.contacto} onToggle={() => toggle("contacto")}>
        <div className="relative mb-2.5">
          <Search size={16} color={palette.inkSoft} className="absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            className={`${inputStyle} pl-9`}
            placeholder="Buscar por nombre, email o teléfono…"
            value={qContacto}
            onChange={(e) => setQContacto(e.target.value)}
          />
        </div>
        {qContacto.trim().length >= 2 && resultadosContacto.length === 0 && (
          <p className="m-0 text-[12.5px] text-ink-soft">No encontramos ningún alumno con ese dato.</p>
        )}
        <div className="flex flex-col gap-2">
          {resultadosContacto.map((a) => {
            return (
            <div key={a.id} className="rounded-md2 bg-bg px-3 py-2.5">
              <p className="m-0 mb-1.5 flex items-center gap-1.5 font-semibold">
                {a.nombre} {a.apellido}
                <button
                  onClick={() => setPerfilAlumno(a)}
                  title={`Ver perfil de ${a.nombre} ${a.apellido}`}
                  className="flex items-center border-none bg-transparent p-0 text-moss cursor-pointer"
                >
                  <UserCircle size={20} />
                </button>
              </p>
              <p className="m-0 mb-1 flex items-center gap-1.5 text-[12.5px] text-ink-soft">
                  <Mail size={12} /> {a.email}
                </p>
                <p className="m-0 mb-1 flex items-center gap-1.5 text-[12.5px] text-ink-soft">
                  <Phone size={12} /> {a.telefono}
                </p>
                <a
                  href={buildWaLink(a.telefono)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-md2 text-[12.5px] text-ink-soft no-underline"
                >
                  <WhatsAppIcon size={12} /> Escribirle por WhatsApp
                </a>
              </div>
            );
          })}
        </div>
        {/* perfil del usuario por si admin quiere editar */}
        {perfilAlumno && (
          <ProfilePanel
            sesion={perfilAlumno}
            contactoNumero={perfilAlumno.telefono}
            mostrarLogout={false}
            onClose={() => setPerfilAlumno(null)}
            onActualizado={(datos) =>
              setPerfilAlumno((prev) => (prev ? { ...prev, ...datos } : prev))
            }
            // onClasesCanceladas={() => {}}
            // onDiasModificados={() => {}}
          />
        )}
      </Seccion>

      <Seccion titulo="Importar alumnas" abierta={abiertas.importar} onToggle={() => toggle("importar")}>
        <p className="m-0 mb-2.5 text-[12.5px] text-ink-soft">
          Pegá tu lista, una alumna por línea, así: <strong>Nombre Apellido, Teléfono, Email (opcional)</strong>. El apellido y el email no son obligatorios. Si dos alumnas distintas comparten el mismo teléfono de contacto (ej. dos hermanas), no hay problema. A cada una le queda como contraseña provisoria su propio teléfono — se lo tienen que cambiar antes de poder editar su perfil.
        </p>
        <form onSubmit={(e) => { e.preventDefault(); importarAlumnas(); }}>
          <textarea
            value={textoImportar}
            onChange={(e) => { setTextoImportar(e.target.value); setResultadoImportar(null); }}
            placeholder={"Andrea Caire, +54 9 3516 763769\nBeatriz, +54 9 3546 457211"}
            rows={8}
            className={`${inputStyle} mb-2.5 h-auto resize-y font-mono text-[12.5px]`}
          />
          {alumnasAImportar.length > 0 && (
            <p className="m-0 mb-2.5 text-xs text-ink-soft">
              Detecté {alumnasAImportar.length} línea{alumnasAImportar.length === 1 ? "" : "s"}
              {alumnasSinTelefono.length > 0 && (
                <> — <span className="font-bold text-danger">{alumnasSinTelefono.length} sin teléfono, no se van a importar</span>: {alumnasSinTelefono.map((a) => `${a.nombre} ${a.apellido}`.trim()).join(", ")}</>
              )}
            </p>
          )}
          {errorImportar && <p className="m-0 mb-2.5 text-[12.5px] text-danger">{errorImportar}</p>}
          <button
            type="submit"
            disabled={importando || alumnasAImportar.filter((a) => a.telefono).length === 0}
            className={`flex items-center gap-1.5 rounded-md2 border-none bg-moss px-4 py-2.5 text-[13px] font-bold text-white cursor-pointer ${
              importando || alumnasAImportar.filter((a) => a.telefono).length === 0 ? "opacity-60" : "opacity-100"
            }`}
          >
            <UserPlus size={15} /> {importando ? "Importando…" : "Importar alumnas"}
          </button>
        </form>

        {resultadoImportar && (
          <div className="mt-3.5 rounded-md2 bg-moss-soft p-3">
            <p className="m-0 mb-1.5 text-[13px] font-bold text-moss-dark">
              Se cargaron {resultadoImportar.creadas} alumna{resultadoImportar.creadas === 1 ? "" : "s"}.
            </p>
            {resultadoImportar.duplicadas.length > 0 && (
              <p className="m-0 mb-1 text-xs text-ink-soft">
                Ya existían (no se tocaron): {resultadoImportar.duplicadas.join(", ")}
              </p>
            )}
            {resultadoImportar.fallidas.length > 0 && (
              <p className="m-0 text-xs text-danger">
                No se pudieron cargar: {resultadoImportar.fallidas.map((f) => f.fila).join(", ")}
              </p>
            )}
          </div>
        )}
      </Seccion>
    </div>
  );
}
