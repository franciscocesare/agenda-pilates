"use client";
import { useRouter } from "next/navigation";
import {
  ArrowRight, MessageCircle, MapPin, Mountain, Target, Wind,
  Repeat, Award, Users2, Layers, CalendarCheck, Wallet, ClipboardCheck,
} from "lucide-react";
import { FONT_DISPLAY, palette, btnPrimary, btnSecondary, card } from "./ui";
import { WHATSAPP_NUMBER } from "@/lib/constants";

const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  "¡Hola! Quiero consultar por las clases de Monte Pilates 🌿"
)}`;

// El "resorte" de reformer es el elemento de marca ya usado en el cupo
// diario (SpringGauge); acá se repite como divisor decorativo, para
// que el hero y las secciones se sientan de la misma familia visual.
function SpringDivider({ color = palette.clay }: { color?: string }) {
  return (
    <div className="spring-divider" aria-hidden="true">
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 9, height: 13, borderRadius: 3, background: color,
            opacity: 0.35 + (i % 3) * 0.22,
            transform: i % 2 === 0 ? "rotate(10deg)" : "rotate(-10deg)",
          }}
        />
      ))}
    </div>
  );
}

const BENEFICIOS = [
  {
    icon: Target,
    titulo: "La secuencia original",
    texto: "Los ejercicios se hacen en el orden y la progresión que diseñó Joseph Pilates hace casi un siglo — nada de rutinas armadas al azar clase a clase.",
  },
  {
    icon: Layers,
    titulo: "Aparatos fieles al diseño original",
    texto: "Reformer, Cadillac, silla y barril tal como fueron pensados: cada resorte y cada palanca tiene un propósito exacto dentro del método.",
  },
  {
    icon: Wind,
    titulo: "Respiración y control, no cardio",
    texto: "El foco está en la precisión del movimiento y la respiración (la \"contrology\"), no en sumar repeticiones ni subir pulsaciones.",
  },
  {
    icon: Award,
    titulo: "Progresión real",
    texto: "Cada alumna avanza dentro de niveles pensados para el cuerpo completo, no clases sueltas sin relación entre sí.",
  },
  {
    icon: Users2,
    titulo: "Grupos reducidos",
    texto: "Clases chicas para que la profesora pueda corregir la postura de cada una, ejercicio por ejercicio.",
  },
  {
    icon: Mountain,
    titulo: "En plena sierra",
    texto: "Un estudio con luz natural y vista al valle, en Villa Ciudad Parque — entrenar rodeada de montaña, no de espejos y parlantes.",
  },
];

const COMPARACION = {
  clasico: [
    "Secuencia fija de ~34 ejercicios, en el orden original",
    "Aparatos originales: reformer, cadillac, silla, barril",
    "Foco en respiración, control y precisión del movimiento",
    "Progresión method-based por niveles",
  ],
  moderno: [
    "Rutinas libres, distintas en cada clase",
    "Aparatos modificados o mezclados con otras disciplinas",
    "Foco más estético, cardio o de tonificación",
    "Clases sueltas sin una progresión definida",
  ],
};

const PASOS = [
  { icon: Wallet, titulo: "Comprás tus clases", texto: "Elegís un bono de clases sueltas o un plan mensual. Se paga en el estudio o se coordina por WhatsApp." },
  { icon: ClipboardCheck, titulo: "La profesora te asigna día y horario", texto: "Vos mirás la disponibilidad en la Agenda; administración fija el día y la hora que mejor encajen y te descuenta la clase." },
  { icon: CalendarCheck, titulo: "Vas a tu clase", texto: "Iniciás sesión cuando quieras para ver tus próximos turnos, o cancelar con más de 3 horas de anticipación sin perder el crédito." },
];

export default function Home() {
  const router = useRouter();

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section
        className="landing-hero"
        style={{
          background: `radial-gradient(120% 140% at 100% 0%, ${palette.mossSoft} 0%, ${palette.bg} 55%)`,
        }}
      >
        <div>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase", color: palette.clayDark, background: palette.claySoft, padding: "6px 12px", borderRadius: 999, marginBottom: 18 }}>
            Villa Ciudad Parque · Valle de Calamuchita · Córdoba
          </span>
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(34px, 5vw, 56px)", lineHeight: 1.05, fontWeight: 600, color: palette.mossDark, margin: "0 0 20px", letterSpacing: -0.5 }}>
            Pilates clásico,<br />
            <span style={{ fontStyle: "italic", color: palette.moss }}>en las sierras.</span>
          </h1>
          <p style={{ fontSize: 18, color: palette.inkSoft, maxWidth: 460, margin: "0 0 30px", lineHeight: 1.55 }}>
            El método original de Joseph Pilates, sin atajos ni modas: la misma secuencia, los mismos aparatos, la misma precisión — ahora a pocos metros del río, en el valle de Calamuchita.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button style={{ ...btnPrimary, width: "auto", padding: "16px 26px" }} onClick={() => router.push("/agenda")}>
              Ver la agenda <ArrowRight size={18} />
            </button>
            <a href={waHref} target="_blank" rel="noopener noreferrer" style={{ ...btnSecondary, width: "auto", padding: "16px 26px", display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
              <MessageCircle size={18} color="#25D366" /> Escribinos
            </a>
          </div>
          <div style={{ marginTop: 34 }}>
            <SpringDivider />
          </div>
        </div>

        <div
          style={{
            borderRadius: 28, minHeight: 340, position: "relative", overflow: "hidden",
            background: `linear-gradient(165deg, ${palette.moss} 0%, ${palette.mossDark} 100%)`,
            boxShadow: "0 30px 60px -20px rgba(78,51,37,0.45)",
          }}
        >
          <svg viewBox="0 0 400 340" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} preserveAspectRatio="xMidYMax slice">
            <polygon points="0,340 0,220 90,120 170,210 240,90 320,200 400,150 400,340" fill="rgba(255,255,255,0.06)" />
            <polygon points="0,340 0,260 120,170 210,250 300,160 400,230 400,340" fill="rgba(255,255,255,0.10)" />
          </svg>
          <div style={{ position: "absolute", left: 24, right: 24, bottom: 24, color: "#fff" }}>
            <p style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 20, margin: "0 0 6px" }}>“Contrology is complete coordination of body, mind and spirit.”</p>
            <p style={{ fontSize: 13, opacity: 0.75, margin: 0 }}>— Joseph Pilates</p>
          </div>
        </div>
      </section>

      {/* ---------- QUIÉNES SOMOS ---------- */}
      <section id="quienes-somos" className="landing-section">
        <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 40, alignItems: "center" }} className="compare-grid">
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: palette.moss, margin: "0 0 10px" }}>Quiénes somos</p>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 600, color: palette.mossDark, margin: "0 0 18px" }}>
              Un estudio chico, hecho para hacer las cosas bien.
            </h2>
          </div>
          <div>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: palette.ink, margin: "0 0 16px" }}>
              Monte Pilates nace en Villa Ciudad Parque con una idea simple: enseñar el método de Pilates tal como fue creado, con aparatos originales y grupos reducidos, en un lugar donde el entorno también forma parte de la clase.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: palette.inkSoft, margin: 0 }}>
              No damos clases masivas ni mezclamos disciplinas. Cada alumna tiene su progresión, su nivel y su seguimiento — la profesora conoce tu cuerpo, no solo tu nombre en una lista.
            </p>
          </div>
        </div>
      </section>

      {/* ---------- BENEFICIOS ---------- */}
      <section id="beneficios" className="landing-section" style={{ background: palette.card, borderRadius: 32 }}>
        <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 44px" }}>
          <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: palette.moss, margin: "0 0 10px" }}>Por qué clásico</p>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 600, color: palette.mossDark, margin: "0 0 14px" }}>
            El pilates clásico no es una variante más.
          </h2>
          <p style={{ fontSize: 16, color: palette.inkSoft, lineHeight: 1.6, margin: 0 }}>
            Es el método original — y trabaja distinto al pilates "moderno" que se ve en la mayoría de los gimnasios.
          </p>
        </div>

        <div className="benefits-grid">
          {BENEFICIOS.map((b) => (
            <div key={b.titulo} style={{ ...card, background: palette.bg }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: palette.mossSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <b.icon size={21} color={palette.moss} />
              </div>
              <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 8px", color: palette.mossDark }}>{b.titulo}</p>
              <p style={{ fontSize: 14, color: palette.inkSoft, margin: 0, lineHeight: 1.55 }}>{b.texto}</p>
            </div>
          ))}
        </div>

        {/* ---- Clásico vs moderno ---- */}
        <div style={{ marginTop: 48 }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: palette.mossDark, textAlign: "center", margin: "0 0 24px" }}>
            Clásico vs. moderno, en criollo
          </h3>
          <div className="compare-grid">
            <div style={{ ...card, border: `2px solid ${palette.moss}`, background: palette.mossSoft }}>
              <p style={{ fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5, color: palette.moss, margin: "0 0 14px" }}>Pilates clásico (el nuestro)</p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {COMPARACION.clasico.map((t) => (
                  <li key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, fontSize: 14, color: palette.ink, lineHeight: 1.5 }}>
                    <Repeat size={16} color={palette.moss} style={{ flexShrink: 0, marginTop: 2 }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ ...card, background: "#fff" }}>
              <p style={{ fontWeight: 800, fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5, color: palette.inkSoft, margin: "0 0 14px" }}>Pilates moderno (típico)</p>
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {COMPARACION.moderno.map((t) => (
                  <li key={t} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 12, fontSize: 14, color: palette.inkSoft, lineHeight: 1.5 }}>
                    <div style={{ width: 16, height: 1.5, background: palette.line, marginTop: 10, flexShrink: 0 }} />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- CÓMO FUNCIONA / AGENDA CTA ---------- */}
      <section id="agenda" className="landing-section">
        <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 44px" }}>
          <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: palette.moss, margin: "0 0 10px" }}>Cómo funciona</p>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 600, color: palette.mossDark, margin: 0 }}>
            Vos mirás la disponibilidad. Nosotras coordinamos el turno.
          </h2>
        </div>

        <div className="steps-grid">
          {PASOS.map((p, i) => (
            <div key={p.titulo} style={{ textAlign: "center" }}>
              <div style={{ width: 54, height: 54, borderRadius: 16, background: palette.mossSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <p.icon size={24} color={palette.moss} />
              </div>
              <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 8px", color: palette.mossDark }}>{i + 1}. {p.titulo}</p>
              <p style={{ fontSize: 14, color: palette.inkSoft, margin: 0, lineHeight: 1.55, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>{p.texto}</p>
            </div>
          ))}
        </div>

        <div style={{ ...card, marginTop: 48, textAlign: "center", padding: "40px 24px", background: `linear-gradient(180deg, ${palette.moss}E6 0%, ${palette.mossDark}E6 100%)`, border: "none" }}>
          <h3 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, color: "#fff", margin: "0 0 10px" }}>¿Hay lugar esta semana?</h3>
          <p style={{ color: "rgba(255,255,255,0.8)", margin: "0 0 24px", fontSize: 15 }}>Mirá el mes completo y pedinos el día que te quede mejor.</p>
          <button style={{ ...btnPrimary, width: "auto", padding: "15px 28px", margin: "0 auto", background: palette.clay }} onClick={() => router.push("/agenda")}>
            Ver la agenda <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ---------- UBICACIÓN DESTACADA ---------- */}
      <section className="landing-section" style={{ paddingTop: 0 }}>
        <a
          href="https://maps.app.goo.gl/sz1yhPngBS4qqMay8"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20,
            textDecoration: "none", borderRadius: 24, padding: "32px 28px", position: "relative", overflow: "hidden",
            background: `linear-gradient(120deg, ${palette.mossDark} 0%, ${palette.moss} 100%)`,
          }}
        >
          <svg viewBox="0 0 400 160" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.5 }} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <path d="M0 40 Q100 10 200 40 T400 40" stroke="rgba(255,255,255,0.18)" strokeWidth="2" fill="none" />
            <path d="M0 90 Q100 60 200 90 T400 90" stroke="rgba(255,255,255,0.14)" strokeWidth="2" fill="none" />
            <path d="M0 130 Q100 105 200 130 T400 130" stroke="rgba(255,255,255,0.10)" strokeWidth="2" fill="none" />
          </svg>

          <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 18 }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.16)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <MapPin size={28} color="#fff" />
            </div>
            <div>
              <p style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: "#fff", margin: "0 0 4px" }}>Villa Ciudad Parque</p>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", margin: 0 }}>Valle de Calamuchita, Córdoba — tocá para ver cómo llegar</p>
            </div>
          </div>

          <span
            style={{
              position: "relative", display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
              background: "#fff", color: palette.mossDark, fontWeight: 800, fontSize: 14,
              padding: "13px 20px", borderRadius: 999, whiteSpace: "nowrap",
            }}
          >
            Ver en Google Maps <ArrowRight size={16} />
          </span>
        </a>
      </section>

      {/* ---------- CONTACTO ---------- */}
      <section id="contacto" className="landing-section footer-grid">
        <div>
          <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 20, color: palette.moss }}>MONTE</span>
          <span style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 14, color: palette.inkSoft, marginLeft: 6 }}>pilates clásico</span>
          <p style={{ fontSize: 14, color: palette.inkSoft, lineHeight: 1.6, margin: "14px 0 0", maxWidth: 300 }}>
            Método original de Joseph Pilates, en el corazón del valle de Calamuchita.
          </p>
        </div>
        <div>
          <p style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.6, color: palette.moss, margin: "0 0 14px" }}>Dónde estamos</p>
          <a
            href="https://maps.app.goo.gl/sz1yhPngBS4qqMay8"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 14, color: palette.ink, lineHeight: 1.6, margin: "0 0 10px", textDecoration: "none" }}
          >
            <MapPin size={16} color={palette.moss} style={{ flexShrink: 0, marginTop: 2 }} />
            Villa Ciudad Parque, Valle de Calamuchita, Córdoba
          </a>
        </div>
        <div>
          <p style={{ fontWeight: 800, fontSize: 13, textTransform: "uppercase", letterSpacing: 0.6, color: palette.moss, margin: "0 0 14px" }}>Contacto</p>
          <a href={waHref} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700, color: palette.ink, textDecoration: "none", marginBottom: 10 }}>
            <MessageCircle size={16} color="#25D366" /> WhatsApp del estudio
          </a>
          <p style={{ fontSize: 12, color: palette.inkSoft, margin: "10px 0 0" }}>© {new Date().getFullYear()} Monte Pilates</p>
        </div>
      </section>
    </div>
  );
}
