"use client";
import { ReactNode, useEffect, useRef, useState } from "react";

/**
 * Envuelve cualquier bloque y lo hace aparecer con un fade + slide-up
 * suave cuando entra en pantalla al scrollear, en vez de estar todo
 * visible de entrada. Respeta "prefers-reduced-motion": si el usuario
 * lo tiene activado, el contenido se muestra directo sin animación
 * (ver .reveal en globals.css).
 */
export default function Reveal({
  children, className = "", delay = 0, as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  /** Milisegundos de espera antes de animar, para escalonar varios elementos. */
  delay?: number;
  as?: "div" | "span";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -15% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref as never}
      className={`reveal ${visible ? "is-visible" : ""} ${className}`}
      style={{ "--reveal-delay": `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
}
