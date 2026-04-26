// src/pages/ForgotPassword.jsx

import React, { useState, useEffect, useRef } from "react";
import {
  Mail,
  KeyRound,
  Lock,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logoCarsecon from "../assets/logo.png";

export function ForgotPassword() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1); // 1: email | 2: código | 3: nueva contraseña | 4: éxito
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(15 * 60); // 15 minutos en segundos
  const [codigoExpirado, setCodigoExpirado] = useState(false);
  const intervalRef = useRef(null);

  // Inicia el timer cuando llega al paso 2
  useEffect(() => {
    if (paso === 2) {
      setTimer(15 * 60);
      setCodigoExpirado(false);

      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setCodigoExpirado(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [paso]);

  // Formato mm:ss
  const formatTimer = (segundos) => {
    const m = Math.floor(segundos / 60)
      .toString()
      .padStart(2, "0");
    const s = (segundos % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Reenviar código
  const handleReenviarCodigo = async () => {
    setError("");
    setCodigo("");
    setCodigoExpirado(false);
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Error al reenviar el código.");
        return;
      }
      setTimer(15 * 60); // reinicia el timer
      // reiniciar el timer
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setCodigoExpirado(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 1: Solicitar código al backend ──
  const handleSolicitarCodigo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "El correo no está registrado.");
        return;
      }
      // Siempre avanzamos (no revelamos si el email existe)
      setPaso(2);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 2: Verificar que el código tenga 6 dígitos y avanzar ──
  const handleVerificarCodigo = async (e) => {
    e.preventDefault();
    if (codigo.length !== 6) {
      setError("El código debe tener 6 dígitos.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/verify-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Código inválido o expirado.");
        return;
      }

      setPaso(3); // ← solo avanza si el backend confirma que es válido
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // ── Paso 3: Enviar nueva contraseña ──
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (contraseña !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codigo, contraseña }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Código inválido o expirado.");
        return;
      }
      setPaso(4);
      setTimeout(() => navigate("/"), 2500);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-white rounded-2xl mx-auto mb-4 p-3 shadow-2xl">
            <img src={logoCarsecon} alt="Logo" />
          </div>
          <h1 className="text-white text-3xl font-bold">Carsecon S.A.S</h1>
          <p className="text-yellow-400">Sistema de Inventario</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-2xl">
          {/* Indicador de pasos */}
          {paso < 4 && (
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3].map((n) => (
                <React.Fragment key={n}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                    ${paso >= n ? "bg-yellow-400 text-gray-900" : "bg-gray-200 text-gray-400"}`}
                  >
                    {n}
                  </div>
                  {n < 3 && (
                    <div
                      className={`h-1 w-8 rounded transition-colors ${paso > n ? "bg-yellow-400" : "bg-gray-200"}`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* ── PASO 1: Email ── */}
          {paso === 1 && (
            <>
              <Link
                to="/"
                className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-4"
              >
                <ArrowLeft size={14} /> Volver al login
              </Link>
              <h2 className="text-xl font-bold mb-1">
                ¿Olvidaste tu contraseña?
              </h2>
              <p className="text-sm text-gray-500 mb-5">
                Ingresa tu correo y te enviaremos un código de 6 dígitos.
              </p>
              <form onSubmit={handleSolicitarCodigo} className="space-y-4">
                <div>
                  <label className="text-sm">Correo electrónico</label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-3 text-gray-400"
                      size={18}
                    />
                    <input
                      type="email"
                      placeholder="tucorreo@ejemplo.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 p-3 border rounded-lg"
                      required
                    />
                  </div>
                </div>
                {error && <ErrorBox mensaje={error} />}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-400 p-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60"
                >
                  {loading ? "Enviando..." : "Enviar código"}
                </button>
              </form>
            </>
          )}

          {/* ── PASO 2: Código ── */}
          {paso === 2 && (
            <>
              <h2 className="text-xl font-bold mb-1">Ingresa el código</h2>
              <p className="text-sm text-gray-500 mb-5">
                Enviamos un código de 6 dígitos a <strong>{email}</strong>.
                Revisa también spam.
              </p>

              {/* Timer o mensaje de expirado */}
              {!codigoExpirado ? (
                <div
                  className={`flex items-center justify-center gap-2 mb-4 text-sm font-medium
        ${timer <= 60 ? "text-red-500" : "text-gray-500"}`}
                >
                  <span>El código expira en</span>
                  <span
                    className={`font-bold text-base px-2 py-0.5 rounded
          ${timer <= 60 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-700"}`}
                  >
                    {formatTimer(timer)}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 font-medium text-sm text-center">
                    ⚠️ El código ha expirado. Solicita uno nuevo.
                  </p>
                  <button
                    type="button"
                    onClick={handleReenviarCodigo}
                    disabled={loading}
                    className="bg-yellow-400 px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-500 transition disabled:opacity-60"
                  >
                    {loading ? "Enviando..." : "Reenviar código"}
                  </button>
                </div>
              )}

              <form onSubmit={handleVerificarCodigo} className="space-y-4">
                <div>
                  <label className="text-sm">Código de verificación</label>
                  <div className="relative">
                    <KeyRound
                      className="absolute left-3 top-3 text-gray-400"
                      size={18}
                    />
                    <input
                      type="text"
                      placeholder="123456"
                      value={codigo}
                      maxLength={6}
                      onChange={(e) =>
                        setCodigo(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full pl-10 p-3 border rounded-lg tracking-widest text-center text-xl font-bold"
                      disabled={codigoExpirado}
                      required
                    />
                  </div>
                </div>
                {error && <ErrorBox mensaje={error} />}
                <button
                  type="submit"
                  disabled={loading || codigoExpirado}
                  className="w-full bg-yellow-400 p-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60"
                >
                  {loading ? "Verificando..." : "Verificar código"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaso(1);
                    setError("");
                  }}
                  className="w-full text-sm text-gray-400 hover:text-gray-600"
                >
                  ← Cambiar correo
                </button>
              </form>
            </>
          )}
          {/* ── PASO 3: Nueva contraseña ── */}
          {paso === 3 && (
            <>
              <h2 className="text-xl font-bold mb-1">Nueva contraseña</h2>
              <p className="text-sm text-gray-500 mb-5">
                Crea una contraseña segura para tu cuenta.
              </p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-sm">Nueva contraseña</label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-3 text-gray-400"
                      size={18}
                    />
                    <input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={contraseña}
                      onChange={(e) => setContraseña(e.target.value)}
                      className="w-full pl-10 p-3 border rounded-lg"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm">Confirmar contraseña</label>
                  <div className="relative">
                    <Lock
                      className="absolute left-3 top-3 text-gray-400"
                      size={18}
                    />
                    <input
                      type="password"
                      placeholder="Repite la contraseña"
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                      className="w-full pl-10 p-3 border rounded-lg"
                      required
                      minLength={6}
                    />
                  </div>
                </div>
                {error && <ErrorBox mensaje={error} />}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-400 p-3 rounded-lg font-bold hover:bg-yellow-500 transition disabled:opacity-60"
                >
                  {loading ? "Guardando..." : "Guardar contraseña"}
                </button>
              </form>
            </>
          )}

          {/* ── PASO 4: Éxito ── */}
          {paso === 4 && (
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <CheckCircle className="text-green-500" size={52} />
              <h2 className="text-xl font-bold text-green-700">
                ¡Contraseña actualizada!
              </h2>
              <p className="text-sm text-gray-500">
                Serás redirigido al login en un momento...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para mostrar errores
function ErrorBox({ mensaje }) {
  return (
    <div className="flex gap-2 p-3 bg-red-100 rounded-lg">
      <AlertCircle className="text-red-600 shrink-0" size={18} />
      <p className="text-red-700 text-sm">{mensaje}</p>
    </div>
  );
}
