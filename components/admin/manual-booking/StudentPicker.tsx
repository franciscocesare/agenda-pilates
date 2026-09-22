"use client";
import { useState } from "react";
import { Search, Plus, UserCircle } from "lucide-react";
import { palette, inputStyle } from "../../ui";
import { useBuscarAlumnas } from "@/lib/hooks/useBuscarAlumnas";
import type { Usuario } from "./types";

/**
 * Buscar una alumna existente (por nombre, email o teléfono) o cargar
 * una ficha nueva al vuelo, sin salir del flujo de asignar un turno.
 * Una vez elegida, muestra el chip compacto con "Cambiar" y "Ver perfil".
 */
export default function StudentPicker({
  usuario,
  onSelect,
  onClear,
  onVerPerfil,
}: {
  usuario: Usuario | null;
  onSelect: (u: Usuario) => void;
  onClear: () => void;
  onVerPerfil: () => void;
}) {
  const [q, setQ] = useState("");
  const resultados = useBuscarAlumnas(q);
  const [creandoAlumna, setCreandoAlumna] = useState(false);
  const [nuevaAlumna, setNuevaAlumna] = useState({ nombre: "", apellido: "", telefono: "", email: "" });
  const [guardandoAlumna, setGuardandoAlumna] = useState(false);
  const [errorAlumna, setErrorAlumna] = useState<string | null>(null);

  const abrirNuevaAlumna = () => {
    const partes = q.trim().split(/\s+/);
    setNuevaAlumna({ nombre: partes[0] ?? "", apellido: partes.slice(1).join(" "), telefono: "", email: "" });
    setErrorAlumna(null);
    setCreandoAlumna(true);
  };

  const crearAlumna = async () => {
    setGuardandoAlumna(true);
    setErrorAlumna(null);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevaAlumna),
    });
    const data = await res.json();
    setGuardandoAlumna(false);
    if (!res.ok) { setErrorAlumna(data.error); return; }
    if (!data.telefonoValido) {
      window.alert(`Ojo: el teléfono "${data.telefono}" no parece un celular argentino completo — revisalo, puede que el link de WhatsApp no funcione bien.`);
    }
    if (data.posibleDuplicado) {
      // No se bloqueó la carga (el mismo teléfono puede ser legítimo
      // entre distintas personas de una familia), pero acá coincide
      // también nombre y apellido: probablemente sea la misma alumna
      // cargada dos veces por error.
      window.alert(`Ojo: ya había otra ficha con el mismo nombre y teléfono (${nuevaAlumna.nombre} ${nuevaAlumna.apellido}). Se creó igual, pero convendría revisar si no quedó duplicada.`);
    }
    setCreandoAlumna(false);
    setQ("");
    onSelect(data);
  };

  if (usuario) {
    return (
      <div className="flex items-center justify-between rounded-md2 bg-moss-soft px-3 py-2.5">
        <div className="flex items-center gap-1">
          <span className="text-sm font-bold">
            {usuario.nombre} {usuario.apellido}
          </span>
          <button
            onClick={onVerPerfil}
            className="flex items-center border-none bg-transparent text-moss cursor-pointer"
            title="Ver perfil / escribirle por WhatsApp"
          >
            <UserCircle size={20} />
          </button>
        </div>
        <button onClick={onClear} className="border-none bg-transparent text-[13px] font-bold text-moss cursor-pointer">
          Cambiar
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search size={16} color={palette.inkSoft} className="absolute left-3 top-[13px]" />
        <input
          className={`${inputStyle} pl-9`}
          placeholder="Buscar por nombre, email o teléfono"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {resultados.length > 0 && (
        <div className="mt-2 overflow-hidden rounded-md2 border border-line">
          {resultados.map((u) => (
            <button
              key={u.id}
              onClick={() => { onSelect(u); setQ(""); }}
              className="block w-full border-none border-b border-line bg-white px-3 py-2.5 text-left text-sm cursor-pointer"
            >
              <strong>{u.nombre} {u.apellido}</strong> — {u.email}
            </button>
          ))}
        </div>
      )}

      {!creandoAlumna ? (
        q.trim().length >= 2 && (
          <button
            onClick={abrirNuevaAlumna}
            className="flex items-center gap-1.5 border-none bg-transparent pt-2.5 text-[12.5px] font-bold text-moss cursor-pointer"
          >
            <Plus size={14} /> Cargar "{q}" como alumna nueva
          </button>
        )
      ) : (
        <form
          className="mt-2.5 rounded-md2 bg-moss-soft p-3"
          onSubmit={(e) => { e.preventDefault(); crearAlumna(); }}
        >
          <p className="m-0 mb-2.5 text-xs font-extrabold uppercase tracking-wide text-moss-dark">Alumna nueva</p>
          <div className="mb-2 flex gap-2">
            <input name="nombre" autoComplete="given-name" className={inputStyle} value={nuevaAlumna.nombre} onChange={(e) => setNuevaAlumna({ ...nuevaAlumna, nombre: e.target.value })} placeholder="Nombre" />
            <input name="apellido" autoComplete="family-name" className={inputStyle} value={nuevaAlumna.apellido} onChange={(e) => setNuevaAlumna({ ...nuevaAlumna, apellido: e.target.value })} placeholder="Apellido" />
          </div>
          <input name="telefono" autoComplete="tel" className={`${inputStyle} mb-2`} value={nuevaAlumna.telefono} onChange={(e) => setNuevaAlumna({ ...nuevaAlumna, telefono: e.target.value })} placeholder="Teléfono" />
          <input name="email" type="email" autoComplete="email" className={`${inputStyle} mb-2.5`} value={nuevaAlumna.email} onChange={(e) => setNuevaAlumna({ ...nuevaAlumna, email: e.target.value })} placeholder="Email (opcional)" />
          {errorAlumna && <p className="m-0 mb-2.5 text-[12.5px] text-danger">{errorAlumna}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!nuevaAlumna.nombre || !nuevaAlumna.telefono || guardandoAlumna}
              className={`flex-1 rounded-md2 border-none bg-moss py-2.5 text-[13px] font-bold text-white cursor-pointer ${
                !nuevaAlumna.nombre || !nuevaAlumna.telefono || guardandoAlumna ? "opacity-60" : "opacity-100"
              }`}
            >
              {guardandoAlumna ? "Guardando…" : "Crear ficha"}
            </button>
            <button
              type="button"
              onClick={() => setCreandoAlumna(false)}
              disabled={guardandoAlumna}
              className="border-none bg-transparent text-[13px] font-bold text-ink-soft cursor-pointer"
            >
              Cancelar
            </button>
          </div>
          <p className="m-0 mt-2 text-[11px] text-ink-soft">Queda lista para asignarle turnos ya mismo. Su contraseña inicial son los números de su teléfono (ella la puede cambiar después).</p>
        </form>
      )}
    </div>
  );
}
