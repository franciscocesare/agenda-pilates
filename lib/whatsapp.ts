import { WHATSAPP_NUMBER } from "./constants";

/**
 * Arma un link de wa.me a partir de un número de teléfono y,
 * opcionalmente, un mensaje precargado. Le saca cualquier cosa que no
 * sea un dígito (espacios, guiones, "+"), que es como wa.me espera el
 * número. Si no se pasa número (o viene vacío), usa el número del
 * estudio.
 */
export function buildWaLink(numero?: string | null, texto?: string) {
  const limpio = (numero || "").replace(/[^\d]/g, "") || WHATSAPP_NUMBER;
  return texto ? `https://wa.me/${limpio}?text=${encodeURIComponent(texto)}` : `https://wa.me/${limpio}`;
}

/** Mensaje para recordarle a un alumno que le falta pagar una clase suelta ya reservada. */
export function mensajeRecordatorioPago(nombre: string, fechaFmt: string, hora: string) {
  return `¡Hola ${nombre}! Te recuerdo tu clase del ${fechaFmt} a las ${hora} hs — todavía me falta el pago de esa clase suelta para confirmártela 🌿`;
}
