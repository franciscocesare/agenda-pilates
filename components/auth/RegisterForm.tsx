"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { btnPrimary, card, inputStyle } from "../ui";
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
      <h1 className="mb-5 mt-2 font-display text-[26px] font-semibold text-moss">Creá tu cuenta</h1>
      <form className={card} onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <ErrorBanner message={error} />
        <Field label="Nombre"><input name="nombre" autoComplete="given-name" className={inputStyle} value={form.nombre} onChange={set("nombre")} placeholder="Julieta" /></Field>
        <Field label="Apellido"><input name="apellido" autoComplete="family-name" className={inputStyle} value={form.apellido} onChange={set("apellido")} placeholder="Gómez" /></Field>
        <Field label="Email"><input name="email" type="email" autoComplete="email" className={inputStyle} value={form.email} onChange={set("email")} placeholder="nombre@correo.com" /></Field>
        <Field label="Teléfono"><input name="telefono" autoComplete="tel" className={inputStyle} value={form.telefono} onChange={set("telefono")} placeholder="11 2345 6789" /></Field>
        <Field label="Contraseña"><input name="password" autoComplete="new-password" className={inputStyle} type="password" value={form.password} onChange={set("password")} placeholder="Mínimo 8 caracteres" /></Field>
        <button type="submit" className={`${btnPrimary} mb-3.5 ${loading ? "opacity-70" : ""}`} disabled={loading}>
          {loading ? "Creando cuenta…" : "Crear cuenta"}
        </button>
        <p className="m-0 text-center text-sm text-ink-soft">
          Ya tengo una cuenta{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); router.push("/login"); }} className="font-bold text-moss no-underline">Ingresar</a>
        </p>
      </form>
    </div>
  );
}
