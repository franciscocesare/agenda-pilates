/**
 * Todo lo que identifica a ESTE estudio (nombre, ubicación, contacto,
 * redes, metadatos de la página) vive acá. La idea es que, al
 * adaptar el proyecto para otro estudio de Pilates o gimnasio, la
 * identidad se cambie tocando este archivo — más la paleta de
 * colores y la tipografía en tailwind.config.ts — sin tener que
 * salir a buscar texto hardcodeado en los componentes.
 *
 * Lo que NO vive acá: el copy narrativo de cada sección de la
 * landing (la bajada de "Quiénes somos", los beneficios, los pasos
 * de "cómo funciona"). Eso es contenido real de marketing, distinto
 * para cada estudio, y se sigue escribiendo a mano en Home.tsx como
 * el texto de cualquier sitio — no tiene sentido forzarlo a una
 * plantilla genérica.
 */
export const BRAND = {
  /** Nombre completo del estudio. */
  nombre: "Monte Pilates",
  /** Como aparece en el logo del header y del footer (corto, en mayúsculas). */
  nombreCorto: "MONTE",
  /** Bajada debajo del nombre corto, en el header y el footer. */
  tagline: "Pilates Clásico",
  /** Ciudad o localidad donde está el estudio. */
  ubicacion: "Villa Ciudad Parque",
  /** Región más amplia (aparece en el subtítulo del hero y en metadatos). */
  region: "Valle de Calamuchita",
  /** País, para el pie de página. */
  pais: "Argentina",
  /** Dirección completa, para el footer y el link de Google Maps. */
  direccion: "Bv. Los Reartes 705, Villa Ciudad Parque",
  /** Link de Google Maps al estudio. */
  googleMapsUrl: "https://maps.app.goo.gl/sz1yhPngBS4qqMay8",
  /** Usuario de Instagram, sin el @. */
  instagramHandle: "monte.pilates",
  instagramUrl: "https://www.instagram.com/monte.pilates",
  /**
   * El teléfono para mostrar en pantalla, con formato legible. El
   * número que realmente se usa para armar los links de WhatsApp es
   * WHATSAPP_NUMBER en lib/constants.ts (son dos formatos del mismo
   * número — si cambia el teléfono del estudio, hay que actualizar
   * los dos).
   */
  telefonoDisplay: "3546 567-378",
  /** <title> de la pestaña y título por defecto para compartir en redes. */
  metaTitle: "Monte Pilates — Pilates clásico en Villa Ciudad Parque, Calamuchita",
  /** Meta descripción para buscadores y previews al compartir el link. */
  metaDescription:
    "Estudio de Pilates clásico en Villa Ciudad Parque, Valle de Calamuchita, Córdoba. Método original de Joseph Pilates, aparatos originales y grupos reducidos.",
} as const;
