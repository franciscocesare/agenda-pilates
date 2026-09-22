"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, EyeOff, Eye } from "lucide-react";
import { palette, btnPrimary, card, inputStyle } from "../ui";
import { Field } from "../Field";
import ErrorBanner from "../ErrorBanner";

export default function LoginForm() {
  const router = useRouter();
  const [identificador, setIdentificador] = useState("usuario@montepilates.com");
  const [password, setPassword] = useState("Demo1234");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identificador, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push(data.rol === "ADMIN" ? "/admin" : "/");
    router.refresh();
  };

  return (
    <div>
      <h1 className="mb-5 mt-2 font-display text-[26px] font-semibold text-moss">Ingresá a tu cuenta</h1>
      <form className={card} onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <ErrorBanner message={error} />
        <Field label="Email o teléfono">
          <div className="relative">
            <Mail size={17} color={palette.inkSoft} className="absolute left-[13px] top-3.5" />
            <input
              name="identificador"
              id="login-identificador"
              autoComplete="username"
              className={`${inputStyle} pl-10`}
              value={identificador}
              onChange={(e) => setIdentificador(e.target.value)}
              placeholder="nombre@correo.com o tu teléfono"
            />
          </div>
        </Field>
        <Field label="Contraseña">
          <div className="relative">
            {/* Icono del candado a la izquierda */}
            <Lock size={17} color={palette.inkSoft} className="absolute left-[13px] top-3.5" />

            {/* Input: Cambia dinámicamente entre 'password' y 'text' */}
            <input
              name="password"
              id="login-password"
              autoComplete="current-password"
              className={`${inputStyle} pl-10 pr-10`}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Botón del ojo a la derecha */}
            <button
              type="button" // Importante para que no envíe el formulario por accidente
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-[13px] top-3.5 flex items-center border-none bg-transparent p-0 cursor-pointer"
            >
              {showPassword ? (
                <EyeOff size={17} color={palette.inkSoft} />
              ) : (
                <Eye size={17} color={palette.inkSoft} />
              )}
            </button>
          </div>
        </Field>

        <button type="submit" className={`${btnPrimary} mb-3.5 ${loading ? "opacity-70" : ""}`} disabled={loading}>
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
        <p className="m-0 mb-1.5 text-center text-sm">
          <a href="#" className="font-bold text-moss no-underline">Olvidé mi contraseña</a>
        </p>
        <p className="m-0 mb-1.5 text-center text-[13px] text-ink-soft">
          ¿Tu profesora te cargó como alumna? Tu contraseña inicial son los números de tu teléfono, sin espacios ni guiones.
        </p>
        <p className="m-0 text-center text-sm text-ink-soft">
          ¿No tenés cuenta?{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); router.push("/registro"); }} className="font-bold text-moss no-underline">Creá una</a>
        </p>
      </form>
      <p className="mt-4 text-center text-xs text-ink-soft">
        Cuentas de prueba: usuario@montepilates.com (contraseña Demo1234)
      </p>
    </div>
  );
}
