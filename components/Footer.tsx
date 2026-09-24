import { BRAND } from "@/lib/brand";
import { WhatsAppIcon } from "./Icons/WhatsAppIcon";
import { MapPin } from "lucide-react";
import Reveal from "./Reveal";
import { palette } from "./ui";
import { buildWaLink } from "@/lib/whatsapp";
import { InstagramIcon } from "./Icons/InstagramIcon";

const waHref = buildWaLink(undefined, `¡Hola! Quiero consultar por las clases de ${BRAND.nombre} 🌿`);


export default function Footer() {
  return (
   <Reveal>
        <footer id="contacto" className="px-5 pb-0 pt-11 md:px-6 md:pt-16">
          <div
            className="footer-card hover-lift relative overflow-hidden rounded-lg text-white"
            style={{ background: `${palette.moss}E6` }}
          >
            <svg viewBox="0 0 400 60" className="absolute left-0 top-0 h-[60px] w-full opacity-40" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 30 Q100 5 200 30 T400 30" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1" fill="none" />
            </svg>
            {/* Marca */}
            <div className="mb-3 flex flex-col items-center gap-1">
              <span className="font-display text-[21px] font-bold tracking-wide">{BRAND.nombreCorto}</span>
              <span className="font-display text-sm italic text-bg">Pilates, método clásico</span>
            </div>
            <div className="relative flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.22] pt-[18px]">
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn-anim inline-flex items-center gap-1 text-sm text-bg no-underline">
                <WhatsAppIcon size={16} /> {BRAND.telefonoDisplay}
              </a>
              <a href={BRAND.instagramUrl} className="btn-anim inline-flex items-center gap-1 text-sm text-bg no-underline" target="_blank" rel="noopener noreferrer">
                <InstagramIcon size={16} fill={palette.claySoft} /> {BRAND.instagramHandle}
              </a>
              <a
                className="link-underline flex items-start gap-1 text-sm leading-relaxed text-bg no-underline"
                href={BRAND.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin size={16} color={palette.bg} className="mt-0.5 shrink-0" />
                {BRAND.direccion}.
              </a>
            </div>
          </div>
        </footer>
      </Reveal>
  );
}
