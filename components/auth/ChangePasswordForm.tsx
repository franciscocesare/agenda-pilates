"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FONT_DISPLAY, palette, btnPrimary, card, inputStyle } from "../ui";
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
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, margin: "8px 0 8px", color: palette.moss }}>Cambiar contraseña</h1>
      <p style={{ color: palette.inkSoft, fontSize: 14, margin: "0 0 20px" }}>
        Si tu profesora te cargó como alumna, tu contraseña actual son los números de tu teléfono (sin espacios ni guiones). Elegí una contraseña propia para poder editar tu perfil.
      </p>
      <div style={card}>
        <ErrorBanner message={error} />
        <Field label="Contraseña actual">
          <input style={inputStyle} type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} placeholder="Ingrese su contraseña actual" />
        </Field>
        <Field label="Contraseña nueva">
          <input style={inputStyle} type="password" value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} placeholder="Mínimo 8 caracteres" />
        </Field>
        <Field label="Repetir contraseña nueva">
          <input style={inputStyle} type="password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
        </Field>
        <div style={{ display: "flex", alignItems: "center", flexDirection: "column", gap: 8, marginTop: 10 }}>
        <button style={{ ...btnPrimary, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={submit}>
          {loading ? "Guardando…" : "Cambiar contraseña"}
        </button>
           <button
                onClick={() => router.push("/")}
                style={{ background: "none", width: "80%", border: `1.5px solid ${palette.danger}`, color: palette.danger, fontWeight: 700, fontSize: 13.5, borderRadius: 10, padding: "10px 16px", cursor: "pointer" }}
              >
                Cancelar
              </button>
              </div>
      </div>
    </div>
  );
}