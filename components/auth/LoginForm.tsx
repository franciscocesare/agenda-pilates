"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, EyeOff, Eye } from "lucide-react";
import { FONT_DISPLAY, palette, btnPrimary, card } from "../ui";
import { Field } from "../Field";
import ErrorBanner from "../ErrorBanner";
import { inputStyle } from "../ui";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("julieta@correo.demo");
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
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    router.push(data.rol === "ADMIN" ? "/admin" : "/");
    router.refresh();
  };

  return (
    <div>
      <h1 style={{ fontFamily: FONT_DISPLAY, fontSize: 26, fontWeight: 600, margin: "8px 0 20px", color: palette.moss }}>Ingresá a tu cuenta</h1>
      <div style={card}>
        <ErrorBanner message={error} />
        <Field label="Email">
          <div style={{ position: "relative" }}>
            <Mail size={17} color={palette.inkSoft} style={{ position: "absolute", left: 13, top: 14 }} />
            <input style={{ ...inputStyle, paddingLeft: 40 }} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@correo.com" />
          </div>
        </Field>
       <Field label="Contraseña">
  <div style={{ position: "relative" }}>
    {/* Icono del candado a la izquierda */}
    <Lock size={17} color={palette.inkSoft} style={{ position: "absolute", left: 13, top: 14 }} />
    
    {/* Input: Cambia dinámicamente entre 'password' y 'text' */}
    <input 
      style={{ ...inputStyle, paddingLeft: 40, paddingRight: 40 }} // Añadido paddingRight para que el texto no tape el ojo
      type={showPassword ? "text" : "password"} 
      value={password} 
      onChange={(e) => setPassword(e.target.value)} 
    />

    {/* Botón del ojo a la derecha */}
    <button
      type="button" // Importante para que no envíe el formulario por accidente
      onClick={() => setShowPassword(!showPassword)}
      style={{
        position: "absolute",
        right: 13,
        top: 14,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: 0,
        display: "flex",
        alignItems: "center"
      }}
    >
      {showPassword ? (
        <EyeOff size={17} color={palette.inkSoft} />
      ) : (
        <Eye size={17} color={palette.inkSoft} />
      )}
    </button>
  </div>
</Field>

        <button style={{ ...btnPrimary, marginBottom: 14, opacity: loading ? 0.7 : 1 }} disabled={loading} onClick={submit}>
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
        <p style={{ textAlign: "center", fontSize: 14, margin: "0 0 6px" }}>
          <a href="#" style={{ color: palette.moss, fontWeight: 700, textDecoration: "none" }}>Olvidé mi contraseña</a>
        </p>
        <p style={{ textAlign: "center", fontSize: 14, margin: 0, color: palette.inkSoft }}>
          ¿No tenés cuenta?{" "}
          <a href="#" onClick={(e) => { e.preventDefault(); router.push("/registro"); }} style={{ color: palette.moss, fontWeight: 700, textDecoration: "none" }}>Creá una</a>
        </p>
      </div>
      <p style={{ fontSize: 12, color: palette.inkSoft, textAlign: "center", marginTop: 16 }}>
        Cuentas de prueba: julieta@correo.demo · martin@correo.demo · admin@montepilates.demo (contraseña Demo1234)
      </p>
    </div>
  );
}
