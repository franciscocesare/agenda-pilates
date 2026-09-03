"use client";
import { useRouter } from "next/navigation";
import {
  ArrowRight, MapPin, Target, Award, Users2, CalendarCheck,
  CalendarDaysIcon,
  UserCheck2,
  Clock,
  Instagram,
} from "lucide-react";
import { FONT_DISPLAY, palette, btnPrimary, btnSecondary, card } from "./ui";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import { InstagramIcon } from "./InstagramIcon";
import { WhatsAppIcon } from "./WhatsAppIcon";

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
    texto: `Los ejercicios se hacen en el orden y la progresión que diseñó Joseph Pilates hace casi un siglo — nada de rutinas armadas al azar clase a clase.
    Aparatos fieles al diseño original, cada resorte y cada palanca tiene un propósito exacto dentro del método.`,
  },
  {
    icon: Award,
    titulo: "Progresión real",
    texto: `Cada alumna avanza dentro de niveles pensados para el cuerpo completo, no clases sueltas sin relación entre sí. 
    El foco está en la precisión del movimiento y la respiración (la \"contrology\")`,
  },
  {
    icon: Users2,
    titulo: "Grupos reducidos",
    texto: `Clases chicas para que la profesora pueda corregir la postura de cada una, ejercicio por ejercicio.
    Un estudio con luz natural y vista al valle, en Villa Ciudad Parque.`,
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
  { icon: CalendarDaysIcon, titulo: "Ves la agenda y elegis día", texto: "Elegís si clases sueltas o un plan mensual. Se paga en el estudio o se coordina por WhatsApp." },
  { icon: CalendarCheck, titulo: "La profesora confirma día y horario", texto: "Vos mirás la disponibilidad en la Agenda, administración confirma lugar y fija el día y la hora." },
  { icon: UserCheck2, titulo: "Vas a tu clase", texto: "Iniciás sesión cuando quieras para ver tus próximos turnos, o cancelar con más de 3 horas de anticipación sin perder el crédito." },
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
          <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: "clamp(34px, 5vw, 56px)", lineHeight: 1.05, fontWeight: 600, color: palette.mossDark, margin: "0 0 10px", letterSpacing: -0.5 }}>
            MONTE,<br />
            <span style={{ fontStyle: "italic", color: palette.moss }}>Pilates clásico.</span>
          </h1>
          <span style={{ display: "inline-block", fontSize: 12, fontWeight: 800, letterSpacing: 1.6, textTransform: "uppercase", color: palette.clayDark, background: palette.claySoft, padding: "6px 12px", borderRadius: 999, marginBottom: 18 }}>
            Villa Ciudad Parque
          </span>
          <p style={{ fontSize: 18, color: palette.inkSoft, maxWidth: 460, margin: "0 0 30px", lineHeight: 1.55 }}>
            El método original de Joseph Pilates, sin atajos ni modas: la misma secuencia, los mismos aparatos, la misma precisión, ahora en el valle de Calamuchita.
          </p>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            <button style={{ ...btnPrimary, width: "auto", padding: "16px 26px" }} onClick={() => router.push("/agenda")}>
              Ver la agenda <ArrowRight size={18} />
            </button>
          </div>
          <div style={{ marginTop: 34 }}>
            <SpringDivider />
          </div>
        </div>
<div
  style={{
    borderRadius: 28,
    minHeight: 340,
    position: "relative",
    overflow: "hidden",
    backgroundImage: `
      linear-gradient(
        165deg,
        rgba(60, 85, 65, 0.25) 0%,
        rgba(78,51,37,0.45) 100%
      ),
      url('/img/cuadro-joseph.jpg')
    `,
    backgroundSize: "cover",
    backgroundPosition: "center",
    boxShadow: "0 30px 60px -20px rgba(78,51,37,0.45)",
  }}
>
  <div
    style={{
      position: "absolute",
      left: 24,
      right: 24,
      bottom: 24,
      color: "#fff",
    }}
  >
    <p
      style={{
        fontFamily: FONT_DISPLAY,
        fontStyle: "italic",
        fontSize: 20,
        margin: "0 0 6px",
      }}
    >
      “Contrology is complete coordination of body, mind and spirit.”
    </p>

    <p
      style={{
        fontSize: 13,
        opacity: 0.75,
        margin: 0,
      }}
    >
      — Joseph Pilates
    </p>
  </div>
</div>
        {/* <div
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
        </div> */}
      </section>

      {/* ---------- QUIÉNES SOMOS ---------- */}
      <section id="quienes-somos" className="landing-section">
        <div style={{ display: "inline-block", gridTemplateColumns: "0.9fr 1.1fr", gap: 40, alignItems: "center" }} className="compare-grid">
          <div>
            <p style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1.4, textTransform: "uppercase", color: palette.moss, margin: "0 0 10px" }}>Quiénes somos</p>
            <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 32, fontWeight: 600, color: palette.mossDark, margin: "0 0 18px" }}>
              Un estudio chico, pensado para hacer las cosas bien.
            </h2>
          </div>
          <div>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: palette.ink, margin: "0 0 16px" }}>
              Monte Pilates nace en Villa Ciudad Parque con una idea simple: enseñar el método de Pilates tal como fue creado, con aparatos originales y grupos reducidos, en un lugar donde el entorno también forma parte de la clase.
              Mi nombre es Mariana Olivares y soy la instructora a cargo, me forme en la UNA en Buenos Aires y en el estudio de Joseph Pilates en Nueva York. Llevo más de 10 años enseñando el método clásico, y me apasiona que cada alumna pueda progresar a su ritmo, con seguridad y precisión.
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
            Secuencia fija de ~34 ejercicios, en el orden original, Aparatos originales: reformer, cadillac, silla, barril. 
            Foco en respiración, control y precisión del movimiento. Al detalle
          </p>
        </div>

        <div className="benefits-grid">
          {BENEFICIOS.map((b) => (
            <div key={b.titulo} style={{ ...card, background: palette.bg, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "32px 24px" }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: palette.mossSoft, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <b.icon size={21} color={palette.moss} />
              </div>
              <p style={{ fontWeight: 700, fontSize: 16, margin: "0 0 8px", color: palette.mossDark }}>{b.titulo}</p>
              <p style={{ fontSize: 14, color: palette.inkSoft, margin: 0, lineHeight: 1.55 }}>{b.texto}</p>
            </div>
          ))}
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
          <p style={{ color: "rgba(255,255,255,0.8)", margin: "0 0 24px", fontSize: 15 }}>Mirá el mes completo y en cada dia, los horarios, pedinos el día que te quede mejor.</p>
          <button style={{ ...btnPrimary, width: "auto", padding: "15px 28px", margin: "0 auto", background: palette.clay }} onClick={() => router.push("/agenda")}>
            Ver la agenda <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ---------- CONTACTO y FOOTER---------- */}
       <footer id="contacto" className="landing-section" style={{ paddingBottom: 0 }}>
        <div
          className="footer-card"
          style={{
            borderRadius: 8, position: "relative", overflow: "hidden",
            background: `${palette.moss}E6`, color: "#fff",
          }}
        >
          <svg viewBox="0 0 400 60" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: 60, opacity: 0.4 }} preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 30 Q100 5 200 30 T400 30" stroke= "rgba(255, 255, 255, 0.22)" strokeWidth="1" fill="none" />
          </svg>
            {/* Marca */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 12, gap: 4 }}>
              <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 21, letterSpacing: 0.5 }}>MONTE</span>
              <span style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontSize: 14, color: palette.bg}}>Pilates, método clásico</span>
            </div>
          <div 
            style={{
              position: "relative", paddingTop: 18, borderTop: "1px solid rgba(255, 255, 255, 0.22)",
              display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8,
            }}
          >  
               <a href={waHref} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, color: palette.bg, textDecoration: "none" }}>
            <WhatsAppIcon size={16} /> 3546 567-378
          </a> 
          <a href="https://www.instagram.com/monte.pilates" target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, color: palette.bg, textDecoration: "none" }}>
            <InstagramIcon size={16} fill={palette.claySoft} /> monte.pilates
          </a> {/*whatsapp icon*/}
              <a 
            href="https://maps.app.goo.gl/sz1yhPngBS4qqMay8"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "flex", gap: 4, alignItems: "flex-start", fontSize: 14, color: palette.bg, lineHeight: 1.6, textDecoration: "none" }}
          >
            <MapPin size={16} color={palette.bg} style={{ flexShrink: 0, marginTop: 2 }} />
            Bv. Los Reartes 705, Villa Ciudad Parque.
          </a> 
          </div>
        </div>
      </footer>
       <p style={{ fontSize: 12, color: palette.inkSoft, textAlign: "center" }}>© {new Date().getFullYear()} Monte Pilates - Valle de Calamuchita - Argentina</p>
    </div>
  );
}

