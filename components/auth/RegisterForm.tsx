"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { FONT_DISPLAY, palette, btnPrimary, card, inputStyle } from "../ui";
import { Field } from "../Field";
import ErrorBanner from "../ErrorBanner";

export default function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: "", apellido: "", email: "", telefono: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push("/");
    router.refresh();
  };

  return (
    <div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, margin: "8px 0 20px", color: palette.moss }}>Creá tu cuenta</h1>
      <div style={card}>
        <ErrorBanner message={error} />
        <Field label="Nombre"><input style={inputStyle} value={form.nombre} onChange={set("nombre")} placeholder="Julieta" /></Field>
        <Field label="Apellido"><input style={inputStyle} value={form.apellido} onChange={set("apellido")} placeholder="Gómez" /></Field>
        <Field label="Email"><input style={inputStyle} value={form.email} onChange={set("email")} placeholder="nombre@correo.com" /></Field>
        <Field label="Teléfono"><input style={inputStyle} value={form.telefono} onChange={set("telefono")} placeholder="11 2345 6789" /></Field>
        <Field label="Contraseña"><input style={inputStyle} type="password" value={form.password} onChange={set("password")} placeholder="Mínimo 8 caracteres" /></Field>
        <button style={{ ...btnPrimary, marginBottom: 14, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={submit}>
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>
        <p style={{ textAlign: "center", fontSize: 14, margin: 0, color: palette.inkSoft }}>
          Ya tengo una cuenta{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); router.push("/login"); }} style={{ color: palette.moss, fontWeight: 700, textDecoration: "none" }}>Ingresar</a>
        </p>
      </div>
    </div>
  );
}
