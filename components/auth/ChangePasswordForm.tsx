"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, card, inputStyle } from "../ui";
import { Field } from "../Field";
import ErrorBanner from "../ErrorBanner";

export default function ChangePasswordForm() {
  const router = useRouter();
  const [passwordActual, setPasswordActual] = useState("");
  const [passwordNueva, setPasswordNueva] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (passwordNueva !== confirmar) { setError("Las dos contraseñas nuevas no coinciden."); return; }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/cambiar-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ passwordActual, passwordNueva }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push("/");
    router.refresh();
  };

  return (
    <div>
      <h1 className="mb-2 mt-2 font-display text-[26px] font-semibold text-moss">Cambiar contraseña</h1>
      <p className="m-0 mb-5 text-sm text-ink-soft">
        Si tu profesora te cargó como alumna, tu contraseña actual son los números de tu teléfono (sin espacios ni guiones). Elegí una contraseña propia para poder editar tu perfil.
      </p>
      <form className={card} onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <ErrorBanner message={error} />
        <Field label="Contraseña actual">
          <input name="current-password" autoComplete="current-password" className={inputStyle} type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} placeholder="Ingrese su contraseña actual" />
        </Field>
        <Field label="Contraseña nueva">
          <input name="new-password" autoComplete="new-password" className={inputStyle} type="password" value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} placeholder="Mínimo 8 caracteres" />
        </Field>
        <Field label="Repetir contraseña nueva">
          <input name="confirm-password" autoComplete="new-password" className={inputStyle} type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
        </Field>
        <div className="mt-2.5 flex flex-col items-center gap-2">
          <button type="submit" className={`${btnPrimary} ${loading ? "opacity-70" : ""}`} disabled={loading}>
            {loading ? "Guardando…" : "Cambiar contraseña"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-4/5 rounded-md2 border-[1.5px] border-danger bg-transparent px-4 py-2.5 text-[13.5px] font-bold text-danger cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
