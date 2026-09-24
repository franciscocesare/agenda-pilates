"use client";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Target, Award, Users2, CalendarCheck,
  CalendarDaysIcon,
  UserCheck2,
  UserCircle,
} from "lucide-react";
import { palette, btnPrimary, card } from "./ui";
import { buildWaLink } from "@/lib/whatsapp";
import { BRAND } from "@/lib/brand";
import Gallery from "./Gallery";
import Reveal from "./Reveal";
import Footer from "./Footer";

const waHref = buildWaLink(undefined, `¡Hola! Quiero consultar por las clases de ${BRAND.nombre} 🌿`);

// El "resorte" de reformer es el elemento de marca ya usado en el cupo
// diario (SpringGauge); acá se repite como divisor decorativo, para
// que el hero y las secciones se sientan de la misma familia visual.
function SpringDivider({ color = palette.clay }: { color?: string }) {
  return (
    <div className="spring-divider" aria-hidden="true">
      {Array.from({ length: 14 }).map((_, i) => (
        <div
          key={i}
          className={`h-[13px] w-[9px] rounded-[3px] ${i % 2 === 0 ? "rotate-[10deg]" : "-rotate-[10deg]"}`}
          style={{ background: color, opacity: 0.35 + (i % 3) * 0.22 }}
        />
      ))}
    </div>
  );
}

const BENEFICIOS = [
  {
    icon: Target,
    titulo: "La secuencia original",
    texto: `Los ejercicios se hacen en el orden y la progresión que diseñó Joseph Pilates con
    aparatos fieles al diseño original.`,
  },
  {
    icon: Award,
    titulo: "Progresión real",
    texto: `Cada alumna avanza dentro de niveles pensados para el cuerpo completo. 
    El foco está en la precisión del movimiento y la respiración.`,
  },
  {
    icon: Users2,
    titulo: "Grupos reducidos",
    texto: `Clases chicas para que la profesora pueda corregir la postura de cada una, ejercicio por ejercicio.
    Un estudio con luz natural y vista al valle, en Villa Ciudad Parque.`,
  },
];

const PASOS = [
  { icon: CalendarDaysIcon, titulo: "Ves la agenda y elegis día", texto: "En el horario que te sirve, si hay lugar,  un boton te lleva a pedir ese turno." },
  { icon: CalendarCheck, titulo: "La profesora confirma día y horario", texto: "Vos mirás la disponibilidad en la Agenda, administración confirma lugar y fija el día y la hora." },
  { icon: UserCircle, titulo: "Login", texto: "Iniciás sesión cuando quieras para ver tus próximos turnos, o cancelar con más de 3 horas de anticipación sin perder el crédito." },
  { icon: UserCheck2, titulo: "Vas a tu clase", texto: "Las clases se realizan en el orden y la progresión que diseñó Joseph Pilates." },
];

export default function Home() {
  const router = useRouter();

  return (
    <div>
      {/* ---------- HERO ---------- */}
      <section
        className="grid grid-cols-1 items-center gap-8 px-5 pb-14 pt-10 text-center md:grid-cols-[1.1fr_0.9fr] md:px-6 md:pb-14 md:pt-16 md:text-left"
        style={{
          background: `radial-gradient(120% 140% at 100% 0%, ${palette.mossSoft} 0%, ${palette.bg} 55%)`,
        }}
      >
        <div>
          <h1 className="m-0 mb-2.5 font-display text-[clamp(34px,5vw,56px)] font-semibold leading-[1.05] tracking-[-0.5px] text-moss-dark">
            {BRAND.nombreCorto},<br />
            <span className="italic text-moss">Pilates clásico.</span>
          </h1>
          <span className="mb-[18px] inline-block rounded-full bg-clay-soft px-3 py-1.5 text-xs font-extrabold uppercase tracking-[1.6px] text-clay-dark">
            {BRAND.ubicacion}
          </span>
          <p className="m-0 mb-[30px] max-w-[460px] text-lg leading-[1.55] text-ink-soft md:mx-0 mx-auto">
            El método original de Joseph Pilates, sin atajos ni modas: la misma secuencia, los mismos aparatos, la misma precisión, ahora en el valle de Calamuchita.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5 md:justify-start">
            <button className={`${btnPrimary} w-auto px-[26px] py-4`} onClick={() => router.push("/agenda")}>
              Ver la agenda <ArrowRight className="arrow-nudge" size={18} />
            </button>
          </div>
          <div className="mt-[34px] flex justify-center md:justify-start">
            <SpringDivider />
          </div>
        </div>
        <div
          className="float-anim relative min-h-[340px] overflow-hidden rounded-[28px] bg-cover bg-center shadow-[0_30px_60px_-20px_rgba(78,51,37,0.45)]"
          style={{
            backgroundImage: `
      linear-gradient(
        165deg,
        rgba(60, 85, 65, 0.25) 0%,
        rgba(78,51,37,0.45) 100%
      ),
      url('/img/cuadro-joseph.jpg')
    `,
          }}
        >
          <div className="absolute inset-x-6 bottom-6 text-white">
            <p className="m-0 mb-1.5 font-display text-xl italic">
              “Contrology is complete coordination of body, mind and spirit.”
            </p>
            <p className="m-0 text-[13px] opacity-75">— Joseph Pilates</p>
          </div>
        </div>
      </section>

      {/* ---------- QUIÉNES SOMOS ---------- */}
      <section id="quienes-somos" className="px-5 py-11 md:px-6 md:py-16">
        <Reveal>
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="m-0 mb-2.5 text-[13px] font-extrabold uppercase tracking-[1.4px] text-moss">Quiénes somos</p>
              <Reveal delay={80}>
                <h2 className="m-0 mb-[18px] font-display text-[32px] font-semibold text-moss-dark">
                  Un estudio chico, pensado para hacer las cosas bien.
                </h2>
              </Reveal>
            </div>
            <div>
              <Reveal delay={80}>
                <p className="m-0 mb-4 text-base leading-[1.7] text-ink">
                  Monte Pilates nace en Villa Ciudad Parque con una idea simple: enseñar el método de Pilates tal como fue creado, con aparatos originales y grupos reducidos, en un lugar donde el entorno también forma parte de la clase.
                  Mi nombre es Mariana Olivares y soy la instructora a cargo, me forme en la UNA en Buenos Aires y en el estudio de Joseph Pilates en Nueva York. Llevo más de 10 años enseñando el método clásico, y me apasiona que cada alumna pueda progresar a su ritmo, con seguridad y precisión.
                </p>
                <p className="m-0 text-base leading-[1.7] text-ink-soft">
                  No damos clases masivas ni mezclamos disciplinas. Cada alumna tiene su progresión, su nivel y su seguimiento — la profesora conoce tu cuerpo, no solo tu nombre en una lista.
                </p>
              </Reveal>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ---------- GALERÍA ---------- */}
      <Reveal>
        <section className="py-6 md:py-10">
          <Gallery />
        </section>
      </Reveal>

      {/* ---------- BENEFICIOS ---------- */}
      <section id="beneficios" className="rounded-[32px] bg-card px-5 py-11 md:px-6 md:py-16">
        <Reveal>
          <div className="mx-auto mb-11 max-w-[620px] text-center">
            <Reveal>
              <p className="m-0 mb-2.5 text-[13px] font-extrabold uppercase tracking-[1.4px] text-moss">Por qué clásico</p>
              <h2 className="m-0 mb-3.5 font-display text-[32px] font-semibold text-moss-dark">
                El pilates clásico no es una variante más.
              </h2>
            </Reveal>
            <Reveal>
              <p className="m-0 text-base leading-[1.6] text-ink-soft">
                Es el método original — y trabaja distinto al pilates "moderno" que se ve en la mayoría de los gimnasios.
                Secuencia fija de ~34 ejercicios, en el orden original, Aparatos originales: reformer, cadillac, silla, barril.
                Foco en respiración, control y precisión del movimiento. Al detalle
              </p>
            </Reveal>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {BENEFICIOS.map((b, i) => (
              <Reveal key={b.titulo} delay={i * 90}>
                <div className={`hover-lift ${card} flex h-full flex-col items-center bg-bg px-6 py-8 text-center`}>
                  <div className="icon-pop mb-4 flex h-11 w-11 items-center justify-center rounded-md2 bg-moss-soft">
                    <b.icon size={21} color={palette.moss} />
                  </div>
                  <Reveal key={b.titulo} delay={i * 90}>
                    <p className="m-0 mb-2 text-base font-bold text-moss-dark">{b.titulo}</p>
                    <p className="m-0 text-sm leading-[1.55] text-ink-soft">{b.texto}</p>
                  </Reveal>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ---------- CÓMO FUNCIONA / AGENDA CTA ---------- */}
      <section id="agenda" className="px-5 py-11 md:px-6 md:py-16">
        <Reveal>
          <div className="mx-auto mb-11 max-w-[620px] text-center">
            <span className="mb-[18px] inline-block rounded-full bg-clay-soft px-3 py-1.5 text-xs font-extrabold uppercase tracking-[1.6px] text-clay-dark">
              Cómo funciona
            </span>
            <h2 className="m-0 mb-3.5 font-display text-[32px] font-semibold text-moss-dark">
              Vos mirás la disponibilidad. Nosotras coordinamos el turno.
            </h2>
            <p className="m-0 text-base leading-[1.6] text-ink-soft">
              Aunque no seas alumno, podes ver la agenda y que dia podés participar.<br /> <strong>¿Hay un horario que encaja con vos?, <br /> podés pedir tu lugar!.</strong> <br />
              Y si ya sos alumno, podés iniciar sesión para ver tus próximas clases, editar datos, o cancelar con más de 3 horas de anticipación sin perder el crédito. <br />
              El pago es lo único que no se hace desde acá, lo arreglamos después.
            </p>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {PASOS.map((p, i) => (
            <Reveal key={p.titulo} delay={i * 90}>
              <div className="text-center bg-card hover-lift rounded-[28px] px-6 py-8">
                <div className="hover-lift mx-auto mb-4 flex h-[54px] w-[54px] items-center justify-center rounded-xl2 bg-moss-soft">
                  <p.icon className="icon-pop" size={24} color={palette.moss} />
                </div>
                <p className="m-0 mb-2 text-base font-bold text-moss-dark">{i + 1}. {p.titulo}</p>
                <p className="mx-auto my-0 max-w-[280px] text-sm leading-[1.55] text-ink-soft">{p.texto}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div
            className={`${card} mt-12 border-none px-3 py-5 text-center`}
            style={{ background: `linear-gradient(180deg, ${palette.moss}E6 0%, ${palette.mossDark}E6 100%)` }}
          >
            <h3 className="m-0 mb-2.5 font-display text-[26px] font-semibold text-white">¿Hay lugar esta semana?</h3>
            <p className="m-0 text-[15px] text-white/80">Mirá el mes completo y en cada dia, los horarios, y si hay horario que te sirve:</p>
            <p className="m-0 mb-6 text-[15px] text-white/80">
              Podés pedir un lugar con un click. </p>
            <button className={`${btnPrimary} mx-auto w-auto !bg-clay px-7 py-[15px]`} onClick={() => router.push("/agenda")}>
              Ver la agenda <ArrowRight className="arrow-nudge" size={18} />
            </button>
          </div>
        </Reveal>
      </section>

      {/* ---------- CONTACTO y FOOTER---------- */}
      <Footer />
      <p className="text-center text-xs text-ink-soft">© {new Date().getFullYear()} {BRAND.nombre} - {BRAND.region} - {BRAND.pais}</p>
    </div>
  );
}