"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Wallet, X, User, MessageCircle, CalendarX, Users, Search, Mail, Phone } from "lucide-react";
import { FONT_DISPLAY, palette, card, inputStyle } from "../ui";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { WhatsAppIcon } from "../WhatsAppIcon";

type Alumno = { id: string; nombre: string; apellido: string; email: string; telefono: string };
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

/** Sección plegable: el título siempre se ve, el contenido solo si está abierta. */
function Seccion({
  titulo, contador, contadorColor, abierta, onToggle, children,
}: {
  titulo: string; contador?: number; contadorColor?: string; abierta: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{ ...card, marginBottom: 16, padding: 0, overflow: "hidden" }}>
      <button
        onClick={onToggle}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%",
          background: "none", border: "none", cursor: "pointer", padding: "16px 18px", textAlign: "left",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: palette.ink }}>{titulo}</span>
          {contador !== undefined && contador > 0 && (
            <span style={{ fontSize: 11.5, fontWeight: 700, color: contadorColor ?? palette.moss, background: (contadorColor ?? palette.moss) + "22", padding: "2px 8px", borderRadius: 999 }}>
              {contador}
            </span>
          )}
        </span>
        <ChevronDown size={18} color={palette.inkSoft} style={{ transform: abierta ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
      </button>
      {abierta && <div style={{ padding: "0 18px 18px" }}>{children}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [datos, setDatos] = useState<Inicio | null>(null);
  const [actualizando, setActualizando] = useState<string | null>(null);
  const [abiertas, setAbiertas] = useState({ pendientes: false, hoy: false, semana: false, alumnosMes: false, contacto: false });
  const [qContacto, setQContacto] = useState("");
  const [resultadosContacto, setResultadosContacto] = useState<Alumno[]>([]);

  useEffect(() => {
    if (qContacto.trim().length < 2) { setResultadosContacto([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/admin/users?q=${encodeURIComponent(qContacto)}`).then((r) => r.json()).then(setResultadosContacto);
    }, 300);
    return () => clearTimeout(t);
  }, [qContacto]);

  const toggle = (clave: keyof typeof abiertas) => setAbiertas((prev) => ({ ...prev, [clave]: !prev[clave] }));

  const cargar = () => {
    fetch("/api/admin/stats").then((r) => r.json()).then(setDatos);
  };

  useEffect(() => { cargar(); }, []);

  const cambiarEstado = async (id: string, estado: string) => {
    setActualizando(id);
    await fetch(`/api/admin/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado }),
    });
    setActualizando(null);
    cargar();
  };

  const irAReservasDe = (id: string, nombreCompleto: string) => router.push(`/admin/reservas?userId=${id}&nombre=${encodeURIComponent(nombreCompleto)}`);

  if (!datos) return <p style={{ color: palette.inkSoft, textAlign: "center", padding: 40 }}>Cargando…</p>;

  const hoyDate = new Date(datos.hoy.fecha + "T00:00:00");
  const mesActualNombre = MESES[hoyDate.getMonth()];
  const mesPasadoNombre = MESES[(hoyDate.getMonth() + 11) % 12];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, margin: "8px 0 2px", color: palette.moss }}>Panel administrativo</h1>
        <p style={{ color: palette.inkSoft, fontSize: 14, margin: 0 }}>Resumen general de Monte Pilates</p>
      </div>

      <Seccion titulo="Pendientes de pago" contador={datos.pendientesDePago.length} contadorColor={palette.clayDark} abierta={abiertas.pendientes} onToggle={() => toggle("pendientes")}>
        {datos.pendientesDePago.length === 0 ? (
          <p style={{ fontSize: 13, color: palette.inkSoft, margin: 0 }}>No hay ninguna clase pendiente de pago.</p>
        ) : (
          datos.pendientesDePago.map((p) => {
            const enCurso = actualizando === p.id;
            const texto = `¡Hola ${p.user.nombre}! Te recuerdo tu clase del ${fmtDia(p.fecha, { day: "numeric", month: "long" })} a las ${p.hora} hs — todavía me falta el pago de esa clase suelta para confirmártela 🌿`;
            const linkWa = `https://wa.me/${p.user.telefono.replace(/[^\d]/g, "") || WHATSAPP_NUMBER}?text=${encodeURIComponent(texto)}`;
            return (
              <div key={p.id} style={{ padding: "10px 0", borderTop: `1px solid ${palette.line}` }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 2px" }}>{p.user.nombre} {p.user.apellido}</p>
                <p style={{ fontSize: 12.5, color: palette.inkSoft, margin: "0 0 8px", textTransform: "capitalize" }}>
                  {fmtDia(p.fecha, { weekday: "long", day: "numeric", month: "long" })} · {p.hora} hs
                </p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    onClick={() => cambiarEstado(p.id, "CONFIRMAR_PAGO")}
                    disabled={enCurso}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1.5px solid ${palette.moss}`, color: palette.moss, fontWeight: 700, fontSize: 12.5, borderRadius: 8, padding: "6px 12px", cursor: "pointer", opacity: enCurso ? 0.6 : 1 }}
                  >
                    <Wallet size={13} /> Confirmar pago
                  </button>
                  <a
                    href={linkWa}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", background: "none", border: `1.5px solid ${palette.line}`, color: palette.ink, fontWeight: 700, fontSize: 12.5, borderRadius: 8, padding: "6px 12px" }}
                  >
                    <MessageCircle size={13} color="#25D366" /> Recordarle
                  </a>
                  <button
                    onClick={() => cambiarEstado(p.id, "CANCELADO")}
                    disabled={enCurso}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: `1.5px solid ${palette.danger}`, color: palette.danger, fontWeight: 700, fontSize: 12.5, borderRadius: 8, padding: "6px 12px", cursor: "pointer", opacity: enCurso ? 0.6 : 1 }}
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
          <p style={{ fontSize: 13, color: palette.inkSoft, margin: 0 }}>Hoy está bloqueado — no hay clases.</p>
        ) : datos.hoy.horarios.length === 0 ? (
          <p style={{ fontSize: 13, color: palette.inkSoft, margin: 0 }}>Hoy no hay franja horaria configurada.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {datos.hoy.horarios.map((h) => (
              <div key={h.hora} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: palette.inkSoft, width: 42, flexShrink: 0 }}>{h.hora}</span>
                {h.cancelado ? (
                  <span style={{ fontSize: 12.5, color: palette.danger, fontWeight: 600 }}>Cancelado</span>
                ) : h.alumnas.length === 0 ? (
                  <span style={{ fontSize: 12.5, color: palette.inkSoft }}>Sin alumnas anotadas</span>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {h.alumnas.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => irAReservasDe(a.id, a.nombreCompleto)}
                        title={`Ver reservas de ${a.nombreCompleto}`}
                        style={{
                          display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600,
                          color: a.pendiente ? palette.clayDark : palette.ink,
                          background: a.pendiente ? palette.claySoft : palette.mossSoft,
                          padding: "4px 9px", borderRadius: 999, border: "none", cursor: "pointer",
                        }}
                      >
                        <User size={11} /> {a.nombre}{a.pendiente ? " · pendiente" : ""}
                      </button>
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
          <p style={{ fontSize: 13, color: palette.inkSoft, margin: 0 }}>No hay más días de estudio esta semana.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {datos.semana.map((d) => (
              <div key={d.fecha}>
                <p style={{ fontSize: 12.5, fontWeight: 700, color: palette.mossDark, margin: "0 0 6px", textTransform: "capitalize" }}>
                  {fmtDia(d.fecha, { weekday: "long", day: "numeric" })}
                </p>
                {d.bloqueado ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: palette.danger, fontWeight: 600 }}>
                    <CalendarX size={12} /> Bloqueado
                  </span>
                ) : d.horariosLibres.length === 0 ? (
                  <span style={{ fontSize: 12, color: palette.inkSoft }}>Completo</span>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {d.horariosLibres.map((h) => (
                      <span
                        key={h.hora}
                        style={{ fontSize: 12, fontWeight: 600, color: palette.moss, background: palette.mossSoft, padding: "4px 9px", borderRadius: 999 }}
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
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1, textAlign: "center", padding: "14px 8px", borderRadius: 12, background: palette.mossSoft }}>
            <Users size={16} color={palette.moss} style={{ marginBottom: 4 }} />
            <p style={{ fontSize: 26, fontWeight: 800, color: palette.mossDark, margin: "2px 0" }}>{datos.alumnosMes.actual}</p>
            <p style={{ fontSize: 11.5, color: palette.inkSoft, margin: 0, textTransform: "capitalize" }}>{mesActualNombre} (en curso)</p>
          </div>
          <div style={{ flex: 1, textAlign: "center", padding: "14px 8px", borderRadius: 12, background: palette.bg }}>
            <Users size={16} color={palette.inkSoft} style={{ marginBottom: 4 }} />
            <p style={{ fontSize: 26, fontWeight: 800, color: palette.ink, margin: "2px 0" }}>{datos.alumnosMes.pasado}</p>
            <p style={{ fontSize: 11.5, color: palette.inkSoft, margin: 0, textTransform: "capitalize" }}>{mesPasadoNombre}</p>
          </div>
        </div>
        <p style={{ fontSize: 11.5, color: palette.inkSoft, margin: "10px 0 0" }}>Cuenta alumnas distintas con al menos una clase reservada (no canceladas) en cada mes.</p>
      </Seccion>

      <Seccion titulo="Contactar alumno" abierta={abiertas.contacto} onToggle={() => toggle("contacto")}>
        <div style={{ position: "relative", marginBottom: 10 }}>
          <Search size={16} color={palette.inkSoft} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            style={{ ...inputStyle, paddingLeft: 36 }}
            placeholder="Buscar por nombre, email o teléfono…"
            value={qContacto}
            onChange={(e) => setQContacto(e.target.value)}
          />
        </div>
        {qContacto.trim().length >= 2 && resultadosContacto.length === 0 && (
          <p style={{ fontSize: 12.5, color: palette.inkSoft, margin: 0 }}>No encontramos ningún alumno con ese dato.</p>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {resultadosContacto.map((a) => {
            const numeroWa = a.telefono.replace(/[^\d]/g, "");
            return (
              <div key={a.id} style={{ padding: "10px 12px", borderRadius: 10, background: palette.bg }}>
                <p style={{ fontWeight: 700, fontSize: 14, margin: "0 0 6px" }}>{a.nombre} {a.apellido}</p>
                <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: palette.inkSoft, margin: "0 0 3px" }}>
                  <Mail size={12} /> {a.email}
                </p>
                <p style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: palette.inkSoft, margin: "0 0 8px" }}>
                  <Phone size={12} /> {a.telefono}
                </p>
                <a
                  href={`https://wa.me/${numeroWa}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", background: "#25D366", color: "#fff", fontWeight: 700, fontSize: 12.5, padding: "6px 12px", borderRadius: 8 }}
                >
                  <WhatsAppIcon size={13} color="#fff" /> Escribirle por WhatsApp
                </a>
              </div>
            );
          })}
        </div>
      </Seccion>
    </div>
  );
}