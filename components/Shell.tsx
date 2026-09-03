"use client";
import { useState } from "react";
import { ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Calendar, Clock, LayoutGrid, Users, MessageCircle, Home } from "lucide-react";
import { FONT, FONT_DISPLAY, palette, btnGhost } from "./ui";
import { WHATSAPP_NUMBER } from "@/lib/constants";
import ProfilePanel from "./ProfilePanel";
import { WhatsAppIcon } from "./WhatsAppIcon";

type Sesion = { id: string; nombre: string; apellido: string; rol: "CLIENTE" | "ADMIN"; email?: string | null; telefono?: string | null } | null;

// Páginas "de marketing", públicas y anchas: la landing y la agenda.
// El resto de la app (login, mis turnos, panel admin) mantiene el
// layout angosto tipo app.
const PAGINAS_ANCHAS = new Set(["/", "/agenda"]);

export default function Shell({ children, session }: { children: ReactNode; session: Sesion }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAdmin = session?.rol === "ADMIN";
  const esPaginaAncha = PAGINAS_ANCHAS.has(pathname);
  const [perfilAbierto, setPerfilAbierto] = useState(false);

  const navItems = isAdmin
    ? [
        // { href: "/admin", label: "Panel", icon: LayoutGrid },
          { href: "/", label: "Inicio", icon: Home },
        { href: "/admin/agenda", label: "Agenda", icon: Calendar },
        { href: "/admin/reservas", label: "Reservas", icon: Users },
      ]
    : [
        { href: "/", label: "Inicio", icon: Home },
        { href: "/agenda", label: "Agenda", icon: Calendar },
        { href: "/mis-turnos", label: "Mis clases", icon: Clock },
      ];

  const initials = session ? `${session.nombre[0]}${session.apellido[0]}` : "";

  return (
    <div style={{ fontFamily: FONT, background: palette.bg, minHeight: "100vh", color: palette.ink }}>
      <header
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px", borderBottom: `1px solid ${palette.line}`, background: palette.card,
          position: "sticky", top: 0, zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28, maxWidth: esPaginaAncha ? 1120 : undefined, margin: esPaginaAncha ? "0 auto" : undefined, width:"100%", justifyContent: "space-between"}}>
          <button onClick={() => router.push(isAdmin ? "/admin" : "/")} style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0, background: "none", border: "none", cursor: "pointer" }}>
            <span style={{ fontFamily: FONT_DISPLAY, fontWeight: 700, fontSize: 19, letterSpacing: 0.5, color: palette.moss, lineHeight: 1 }}>MONTE</span>
            <span style={{ fontFamily: FONT_DISPLAY, fontStyle: "italic", fontWeight: 500, fontSize: 13, color: palette.inkSoft, lineHeight: 1, marginTop: 2 }}>Pilates Clásico</span>
          </button>

          {!session && esPaginaAncha && (
            <nav style={{ display: "flex", alignItems: "center", gap: 22 }} className="hide-on-mobile">
              <a href="/#quienes-somos" style={navLinkStyle}>Quiénes somos</a>
              <a href="/#beneficios" style={navLinkStyle}>Beneficios</a>
              <a href="/agenda" style={navLinkStyle}>Agenda</a>
              <a href="/#contacto" style={navLinkStyle}>Contacto</a>
            </nav>
          )}

          {session ? (
            <button
              onClick={() => setPerfilAbierto(true)}
              style={{ display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: palette.inkSoft, fontSize: 14, fontWeight: 600 }}
            >
              <span className="hide-on-mobile" style={{ fontWeight: 700, color: palette.ink }}>{session.nombre}</span>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: palette.mossSoft, display: "flex", alignItems: "center", justifyContent: "center", color: palette.moss, fontWeight: 700, fontSize: 13 }}>
                {initials}
              </div>
            </button>
          ) : (
            <button onClick={() => router.push("/login")} style={btnGhost}>Ingresar</button>
          )}
        </div>
      </header>

      <main
        style={
          esPaginaAncha
            ? { maxWidth: 1120, margin: "0 auto", padding: "0 16px 80px" }
            : { maxWidth: 480, margin: "0 auto", padding: "24px 20px 100px" }
        }
      >
        {children}
      </main>

      {/* Botón flotante de WhatsApp, visible en todo el sitio salvo el panel admin */}
      {!isAdmin && (
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribinos por WhatsApp"
          style={{
            position: "fixed", right: 18, bottom: session ? 92 : 22, zIndex: 30,
            width: 56, height: 56, borderRadius: "50%", background: "#25D366",
            borderColor: palette.line, borderWidth: 1.5, borderStyle: "solid",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 20px rgba(0,0,0,0.25)", color: "#fff",
          }}
        >
          <WhatsAppIcon size={32} color="#fff" />
        </a>
      )}

      {session && (
        <nav
          style={{
            position: "fixed", bottom: 0, left: 0, right: 0, background: palette.card,
            borderTop: `1px solid ${palette.line}`, display: "flex", justifyContent: "center", gap: 8,
            padding: "10px 8px 14px", zIndex: 10,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-around", width: "100%", maxWidth: esPaginaAncha ? 1120 : 480 }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                    background: "none", border: "none", cursor: "pointer",
                    color: isActive ? palette.moss : palette.inkSoft, minWidth: 72, padding: "4px 0",
                  }}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                  <span style={{ fontSize: 12, fontWeight: isActive ? 700 : 500 }}>{item.label}</span>
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

const navLinkStyle = { color: palette.ink, fontWeight: 700, fontSize: 14, textDecoration: "none" } as const;
