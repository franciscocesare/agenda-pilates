"use client";
import { useState } from "react";
import { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Calendar, Clock, LayoutGrid, Users, Home, UserCircleIcon } from "lucide-react";
import { buildWaLink } from "@/lib/whatsapp";
import { BRAND } from "@/lib/brand";
import ProfilePanel from "./ProfilePanel";
import { WhatsAppIcon } from "./Icons/WhatsAppIcon";

type Sesion = { id: string; nombre: string; apellido: string; rol: "CLIENTE" | "ADMIN"; email?: string | null; telefono?: string | null; passwordProvisoria?: boolean } | null;

// Páginas "de marketing", públicas y anchas: la landing y la agenda.
// El resto de la app (login, mis turnos, panel admin) mantiene el
// layout angosto tipo app.
const PAGINAS_ANCHAS = new Set(["/", "/agenda"]);

const navLinkClass = "font-bold text-sm text-ink no-underline link-underline";

export default function Shell({ children, session }: { children: ReactNode; session: Sesion }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = session?.rol === "ADMIN";
  const esPaginaAncha = PAGINAS_ANCHAS.has(pathname);
  const [perfilAbierto, setPerfilAbierto] = useState(false);

  const navItems = isAdmin
    ? [
      { href: "/", label: "Web", icon: Home },
        { href: "/admin", label: "Panel", icon: LayoutGrid },
        { href: "/admin/agenda", label: "Agenda", icon: Calendar },
        { href: "/admin/reservas", label: "Reservas", icon: Users },
      ]
    : [
        // { href: "/", label: "Inicio", icon: Home },
        { href: "/agenda", label: "Agenda", icon: Calendar },
        { href: "/mis-turnos", label: "Mis clases", icon: Clock },
      ];

  return (
    <div className="min-h-screen bg-bg font-sans text-ink">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-card px-5 py-4">
        <div
          className={`flex w-full items-center justify-between gap-7 ${
            esPaginaAncha ? "mx-auto max-w-[1120px]" : ""
          }`}
        >
          <button
            onClick={() => router.push(isAdmin ? "/admin" : "/")}
            className="flex cursor-pointer flex-col items-start border-none bg-transparent"
          >
            <span className="font-display text-[19px] font-bold leading-none tracking-wide text-moss">{BRAND.nombreCorto}</span>
            <span className="mt-0.5 font-display text-[13px] italic font-medium leading-none text-ink-soft">{BRAND.tagline}</span>
          </button>

          {!session && esPaginaAncha && (
            <nav className="hide-on-mobile flex items-center gap-5">
              <a href="/#quienes-somos" className={navLinkClass}>Quiénes somos</a>
              <a href="/#beneficios" className={navLinkClass}>Beneficios</a>
              <a href="/#contacto" className={navLinkClass}>Contacto</a>
            </nav>
          )}

          {session ? (
            <button
              onClick={() => setPerfilAbierto(true)}
              className="flex items-center gap-2 border-none bg-transparent text-sm font-semibold text-ink-soft cursor-pointer"
            >
              <span className="font-bold text-ink">{session.nombre}</span>
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-moss-soft text-[13px] font-bold text-moss">
                <UserCircleIcon size={32} strokeWidth={1.5} />
              </div>
            </button>
          ) : (
            <button onClick={() => router.push("/login")} className="btn-login max-w-[120px]">Ingresar</button>
          )}
        </div>
      </header>

      <main className={esPaginaAncha ? "mx-auto max-w-[1120px] px-4 pb-20" : "mx-auto max-w-[480px] px-5 pb-24 pt-6"}>
        {children}
      </main>

      {/* Botón flotante de WhatsApp, visible en todo el sitio salvo el panel admin */}
      {!isAdmin && (
        <a
          href={buildWaLink()}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribinos por WhatsApp"
          className={`fixed right-[18px] z-30 flex h-14 w-14 items-center justify-center rounded-full border-[1.5px] border-line bg-[#25D366] text-white shadow-[0_6px_20px_rgba(0,0,0,0.25)] wa-pulse ${
            session ? "bottom-[92px]" : "bottom-[22px]"
          }`}
        >
          <WhatsAppIcon size={32} color="#fff" />
        </a>
      )}

      {session && (
        <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-center gap-2 border-t border-line bg-card px-2 pb-3.5 pt-2.5">
          <div className={`flex w-full justify-around ${esPaginaAncha ? "max-w-[1120px]" : "max-w-[480px]"}`}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex min-w-[72px] flex-col items-center gap-1 border-none bg-transparent py-1 cursor-pointer ${
                    isActive ? "text-moss" : "text-ink-soft"
                  }`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                  <span className={`text-xs ${isActive ? "font-bold" : "font-medium"}`}>{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {session && perfilAbierto && <ProfilePanel sesion={session} onClose={() => setPerfilAbierto(false)} />}
    </div>
  );
}
