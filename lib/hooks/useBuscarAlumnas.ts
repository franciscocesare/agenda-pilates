"use client";
import { useEffect, useState } from "react";
import type { Alumno } from "../types";

/**
 * Busca alumnas por nombre, email o teléfono a medida que se escribe,
 * con un pequeño debounce para no disparar una consulta por cada
 * tecla. Con menos de 2 caracteres no busca nada (evita traer medio
 * padrón de alumnas con una sola letra).
 */
export function useBuscarAlumnas(q: string) {
  const [resultados, setResultados] = useState<Alumno[]>([]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResultados([]);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/admin/users?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then(setResultados);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return resultados;
}
