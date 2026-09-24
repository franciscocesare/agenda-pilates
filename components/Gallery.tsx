"use client";
import { useCallback, useEffect, useRef, useState } from "react";

type Foto = { src: string; alt: string };

const FOTOS: Foto[] = [
    { src: "/img/frente-local.jpeg", alt: "La fachada de Monte Pilates, en Villa Ciudad Parque" },
    { src: "/img/local-desde-atras.jpeg", alt: "El estudio, con los reformers listos para la clase" },
    { src: "/img/local-desde-frente.jpeg", alt: "Otro rincón del estudio, con la torre y el barril" },
    { src: "/img/joseph-cuatro.jpg", alt: "Joseph Pilates demostrando un ejercicio en el barril" },
    { src: "/img/cuadro-joseph.jpg", alt: "Joseph Pilates demostrando un ejercicio en el barril" },
    { src: "/img/bunda.jpg", alt: "Joseph Pilates en la silla Wunda, una de las piezas originales del método" },
    { src: "/img/dibujo2.jpg", alt: "Joseph Pilates en la silla Wunda, una de las piezas originales del método" },
    { src: "/img/dibujo3.jpg", alt: "Joseph Pilates en la silla Wunda, una de las piezas originales del método" },
    { src: "/img/dibujo1.jpg", alt: "El estudio vacío, con la luz entrando por la ventana" },

];

// Cuánto tiene que quedarse quieto el dedo, en ms, para que cuente
// como "lo mantuvo apretado" y no como el arranque de un swipe.
const HOLD_MS = 100;
// Si el dedo se mueve más que esto (en px) antes de cumplirse HOLD_MS,
// se interpreta como que está scrolleando, no reteniendo la foto.
const MOVE_TOLERANCE = 8;
// Cada cuánto avanza solo, en ms, cuando nadie lo está tocando.
const AUTOPLAY_MS = 2700;
// Cuánto se espera después de que alguien interactúa (toca, arrastra,
// usa la rueda del mouse) antes de que el autoplay retome la posta.
const REANUDAR_AUTOPLAY_MS = 1000;

export default function Gallery() {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [activo, setActivo] = useState(0);
    const [zoomIdx, setZoomIdx] = useState<number | null>(null);
    // Se usa dentro de intervalos/listeners para siempre leer la
    // posición actual sin quedar atados a un closure viejo.
    const activoRef = useRef(0);
    const pausadoRef = useRef(false);
    const reanudarTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const irA = useCallback((i: number, comportamiento: ScrollBehavior = "smooth") => {
        const el = slideRefs.current[i];
        const scroller = scrollerRef.current;
        if (!el || !scroller) return;
        const destino = el.offsetLeft - (scroller.clientWidth - el.clientWidth) / 2;
        scroller.scrollTo({ left: destino, behavior: comportamiento });
    }, []);

    // Pausa el autoplay mientras alguien interactúa, y lo retoma solo
    // después de un rato quieto — así no le pelea el scroll a la mano
    // de la persona ni salta justo cuando estás mirando una foto.
    const pausar = useCallback(() => {
        pausadoRef.current = true;
        if (reanudarTimer.current) clearTimeout(reanudarTimer.current);
        reanudarTimer.current = setTimeout(() => { pausadoRef.current = false; }, REANUDAR_AUTOPLAY_MS);
    }, []);

    // Efecto de profundidad: a medida que cada foto se aleja del centro
    // del carrousel (por el scroll horizontal), se achica y se
    // desvanece un poco — así se alcanza a "ver de lejos" la que salió
    // y la que viene, en vez de que aparezcan/desaparezcan de golpe.
    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        let frame = 0;
        const actualizar = () => {
            frame = 0;
            const contRect = scroller.getBoundingClientRect();
            const centro = contRect.left + contRect.width / 2;
            let masCercano = 0;
            let menorDistancia = Infinity;

            slideRefs.current.forEach((el, i) => {
                if (!el) return;
                const rect = el.getBoundingClientRect();
                const distancia = Math.abs(rect.left + rect.width / 2 - centro);
                if (distancia < menorDistancia) { menorDistancia = distancia; masCercano = i; }
                const normalizada = Math.min(distancia / (contRect.width / 2), 1);
                el.style.transform = `scale(${1 - normalizada * 0.3})`;
                el.style.opacity = String(1 - normalizada * 0.65);
            });
            activoRef.current = masCercano;
            setActivo(masCercano);
        };

        const onScroll = () => {
            if (frame) return;
            frame = requestAnimationFrame(actualizar);
        };

        // La rueda del mouse, por defecto, solo scrollea vertical — la
        // convertimos en movimiento horizontal para que un mouse común
        // (sin trackpad) también pueda recorrer las fotos.
        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // ya es un gesto horizontal, dejarlo como está
            e.preventDefault();
            pausar();
            scroller.scrollLeft += e.deltaY;
        };

        actualizar();
        scroller.addEventListener("scroll", onScroll, { passive: true });
        scroller.addEventListener("wheel", onWheel, { passive: false });
        window.addEventListener("resize", onScroll);
        return () => {
            scroller.removeEventListener("scroll", onScroll);
            scroller.removeEventListener("wheel", onWheel);
            window.removeEventListener("resize", onScroll);
            if (frame) cancelAnimationFrame(frame);
        };
    }, [pausar]);

    // Autoplay: avanza sola cada AUTOPLAY_MS, salvo que esté pausada
    // por una interacción reciente. Al llegar a la última, vuelve a la
    // primera.
    useEffect(() => {
        const id = setInterval(() => {
            if (pausadoRef.current) return;
            irA((activoRef.current + 1) % FOTOS.length);
        }, AUTOPLAY_MS);
        return () => clearInterval(id);
    }, [irA]);

    useEffect(() => () => { if (reanudarTimer.current) clearTimeout(reanudarTimer.current); }, []);

    // Mantener el dedo apretado sobre una foto la agranda (zoom sobre
    // el detalle) hasta que se suelta. Se distingue de un swipe por
    // tiempo + tolerancia de movimiento: si el dedo se corre antes de
    // HOLD_MS, se cancela el zoom y el scroll nativo sigue su curso
    // normalmente (no hace falta desactivar nada a mano).
    const startPos = useRef<{ x: number; y: number } | null>(null);
    const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const clearPress = () => {
        if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; }
    };
    const onPointerDown = (i: number) => (e: React.PointerEvent) => {
        pausar();
        startPos.current = { x: e.clientX, y: e.clientY };
        clearPress();
        pressTimer.current = setTimeout(() => setZoomIdx(i), HOLD_MS);
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (!startPos.current || !pressTimer.current) return;
        const dx = Math.abs(e.clientX - startPos.current.x);
        const dy = Math.abs(e.clientY - startPos.current.y);
        if (dx > MOVE_TOLERANCE || dy > MOVE_TOLERANCE) clearPress();
    };
    const endPress = () => {
        clearPress();
        startPos.current = null;
        setZoomIdx(null);
    };

    return (
        <div>
            <div
                ref={scrollerRef}
                className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-[12%] py-3"
            >
                {FOTOS.map((foto, i) => (
                    <div
                        key={foto.src}
                        ref={(el) => { slideRefs.current[i] = el; }}
                        className="w-[76%] shrink-0 snap-center md:max-w-[460px]"
                        style={{ willChange: "transform, opacity" }}
                    >
                        <div className="aspect-[4/6] overflow-hidden rounded-2xl2 border border-line bg-moss-soft shadow-[0_18px_34px_-18px_rgba(46,33,22,0.35)]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={foto.src}
                                alt={foto.alt}
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                                onPointerDown={onPointerDown(i)}
                                onPointerMove={onPointerMove}
                                onPointerUp={endPress}
                                onPointerCancel={endPress}
                                onPointerLeave={endPress}
                                style={{ WebkitTouchCallout: "none" } as React.CSSProperties}
                                className={`h-full w-full select-none object-contain transition-transform duration-300 ease-out ${zoomIdx === i ? "scale-[1.7]" : "scale-100"
                                    }`}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Indicador de posición: puntitos clickeables, el activo se alarga */}
            <div className="mt-5 flex justify-center gap-1.5">
                {FOTOS.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => { pausar(); irA(i); }}
                        aria-label={`Ir a la foto ${i + 1}`}
                        className={`h-1.5 rounded-full border-none cursor-pointer transition-all duration-300 ${i === activo ? "w-6 bg-clay" : "w-1.5 bg-line"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}