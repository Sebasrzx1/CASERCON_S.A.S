import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, AlertCircle } from "lucide-react";
import logoCarsecon from "../assets/logo.png";

export function Login() {
  const [email, setEmail] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 🔐 Verificar sesión activa
  useEffect(() => {
    const savedUser = localStorage.getItem("casercon_user");

    if (savedUser && savedUser !== "undefined") {
      try {
        const user = JSON.parse(savedUser);

        if (user.nombre_rol === "Administrador") {
          navigate("/dashboard", { replace: true });
        } else if (user.nombre_rol === "Operario" && user.sectores) {
          if (user.sectores.includes("recepcion")) {
            navigate("/pedidos", { replace: true });
          } else if (user.sectores.includes("produccion")) {
            navigate("/produccion", { replace: true });
          }
        }
      } catch (error) {
        console.error("Error al parsear usuario:", error);
        localStorage.removeItem("casercon_user");
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          contraseña: contraseña, // 🔥 corregido
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Credenciales incorrectas");
        return;
      }

      // 🔐 Guardar sesión correctamente
      localStorage.setItem("token", data.token);
      localStorage.setItem("casercon_user", JSON.stringify(data.data));

      // 🚀 Redirección por rol
      if (data.data.nombre_rol === "Administrador") {
        navigate("/dashboard");
      } else if (data.data.nombre_rol === "Operario") {
        if (data.data.sectores?.includes("recepcion")) {
          navigate("/pedidos");
        } else if (data.data.sectores?.includes("produccion")) {
          navigate("/produccion");
        } else {
          navigate("/"); // fallback
        }
      }
    } catch (error) {
      console.error(error);
      setError("No se pudo conectar al servidor");
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-yellow-400 rounded-full blur-3xl"></div>
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

        {/* Formulario */}
        <div className="bg-white p-8 rounded-2xl shadow-2xl">
          <h2 className="text-xl font-bold mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-sm">Correo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  placeholder="Ingrese su correo electronico"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 p-3 border rounded-lg"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-sm">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="password"
                  placeholder="Ingrese su contraseña"
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  className="w-full pl-10 p-3 border rounded-lg"
                  required
                />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex gap-2 p-3 bg-red-100 rounded-lg">
                <AlertCircle className="text-red-600" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <button className="w-full bg-yellow-400 p-3 rounded-lg font-bold hover:bg-yellow-500 transition">
              Ingresar
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}