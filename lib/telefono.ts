/**
 * Se asegura de que un teléfono tenga el código de país argentino
 * antes de guardarlo, para que el link de WhatsApp (wa.me/<dígitos>)
 * siempre funcione — sin esto, un número cargado como "3546 457211"
 * (sin 54 9) arma un link roto. De paso limpia espacios y guiones: se
 * guarda solo como "+" seguido de los dígitos, sin importar cómo lo
 * haya tipeado el admin (con espacios, guiones, etc.) — más prolijo y
 * sin ambigüedad para comparar teléfonos entre sí.
 *
 * - Se antepone "54" si los dígitos no lo traían ya (asumiendo que sin
 *   código de país es un número local, sacándole un 0 inicial si lo
 *   tenía), y "9" después del "54" si hace falta (todos los celulares
 *   argentinos lo necesitan para WhatsApp).
 * - `valido` es una estimación: una cantidad de dígitos razonable
 *   para un celular argentino con código de país (12 a 14). Sirve
 *   para avisar en la interfaz, no bloquea nada.
 */
export function asegurarCodigoPais(crudo: string): { telefono: string; valido: boolean } {
  let digits = crudo.replace(/[^\d]/g, "");
  if (!digits) return { telefono: crudo.trim(), valido: false };

  if (!digits.startsWith("54")) digits = `549${digits.replace(/^0+/, "")}`;
  else if (!digits.startsWith("549")) digits = `549${digits.slice(2)}`;

  const telefono = `+${digits}`;
  const valido = digits.length >= 12 && digits.length <= 14;
  return { telefono, valido };
}