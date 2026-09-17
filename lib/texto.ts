/**
 * Capitaliza un nombre/apellido: primera letra de cada palabra en
 * mayúscula, el resto en minúscula — así da lo mismo si se tipeó
 * "MARIA EUGENIA", "maria eugenia" o "Maria eugenia", siempre queda
 * "Maria Eugenia". Contempla partículas comunes en apellidos
 * castellanos ("de", "los", "del", "la", "y") que van en minúscula
 * salvo que sean la primera palabra.
 */
const PARTICULAS = new Set(["de", "del", "la", "los", "las", "y"]);

export function capitalizarNombre(texto: string): string {
  const palabras = texto.trim().replace(/\s+/g, " ").split(" ").filter(Boolean);
  return palabras
    .map((palabra, i) => {
      const minuscula = palabra.toLocaleLowerCase("es-AR");
      if (i > 0 && PARTICULAS.has(minuscula)) return minuscula;
      return minuscula.charAt(0).toLocaleUpperCase("es-AR") + minuscula.slice(1);
    })
    .join(" ");
}