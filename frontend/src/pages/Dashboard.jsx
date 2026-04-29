import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package, BookOpen, Factory, TrendingDown,
  ShoppingCart, Activity, CheckCircle, XCircle,
} from "lucide-react";

export default function Dashboard() {
  const [user, setUser]       = useState(null);
  const [materias, setMaterias] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalMaterias:   0,
    totalRecetas:    0,
    totalPedidos:    0,
    totalProduccion: 0,
    movimientosHoy:  0,
    stockSuficiente: 0,
    stockBajo:       0,
    stockCritico:    0,
  });

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  // ── Usuario ──────────────────────────────────────────────────────
  useEffect(() => {
    const savedUser = localStorage.getItem("casercon_user");
    if (savedUser) {
      try { setUser(JSON.parse(savedUser)); }
      catch (e) { console.error("Error al parsear usuario:", e); }
    }
  }, []);

  // ── Materias primas ──────────────────────────────────────────────
  useEffect(() => {
  const fetchMaterias = async () => {
    try {
      const res  = await fetch("http://localhost:3000/api/materias-primas", { headers });
      const data = await res.json();
      const lista = Array.isArray(data) ? data : Array.isArray(data.data) ? data.data : [];

      // ✅ Solo las activas
      const activas = lista.filter((m) => m.estado === "Activo");

      setMaterias(lista); // la lista completa para la tabla de críticos
      setEstadisticas((prev) => ({
        ...prev,
        totalMaterias:   activas.length,
        stockSuficiente: activas.filter((m) => m.estadoStock === "Suficiente").length,
        stockBajo:       activas.filter((m) => m.estadoStock === "Bajo").length,
        stockCritico:    activas.filter((m) => m.estadoStock === "Critico").length,
      }));
    } catch (e) {
      console.error("Error al obtener materias primas:", e);
    }
  };

  fetchMaterias();
  window.addEventListener("focus", fetchMaterias);
  return () => window.removeEventListener("focus", fetchMaterias);
}, []);

  // ── Recetas ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchRecetas = async () => {
      try {
        const res  = await fetch("http://localhost:3000/api/recetas", { headers });
        const data = await res.json();
        const lista = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
        setEstadisticas((prev) => ({
          ...prev,
          totalRecetas: lista.filter((r) => r.estado === "Activo").length,
          
        }));
      } catch (e) {
        console.error("Error al obtener recetas:", e);
      }
    };
    fetchRecetas();
  }, []);

  // ── Pedidos de recepción ─────────────────────────────────────────
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const res  = await fetch("http://localhost:3000/api/pedidos", { headers });
        const data = await res.json();
        const lista = Array.isArray(data.data) ? data.data : [];
        setEstadisticas((prev) => ({
          ...prev,
          totalPedidos: lista.filter((p) => p.estado === "pendiente").length,
        }));
      } catch (e) {
        console.error("Error al obtener pedidos:", e);
      }
    };
    fetchPedidos();
  }, []);

  // ── Producción ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchProduccion = async () => {
      try {
        const res  = await fetch("http://localhost:3000/api/produccion", { headers });
        const data = await res.json();
        const lista = Array.isArray(data.data) ? data.data : [];
        setEstadisticas((prev) => ({
          ...prev,
          totalProduccion: lista.filter((p) => p.estado === "Pendiente").length,
        }));
      } catch (e) {
        console.error("Error al obtener producción:", e);
      }
    };
    fetchProduccion();
  }, []);

  // ── Movimientos ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchMovimientos = async () => {
      try {
        const res  = await fetch("http://localhost:3000/api/movimientos", { headers });
        const data = await res.json();
        const lista = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];

        // Filtrar solo los de hoy
        const hoy = new Date().toISOString().split("T")[0];
        const hoyCount = lista.filter((m) => {
          const fechaMov = m.fecha ? m.fecha.split("T")[0] : "";
          return fechaMov === hoy;
        }).length;

        setEstadisticas((prev) => ({ ...prev, movimientosHoy: hoyCount }));
      } catch (e) {
        console.error("Error al obtener movimientos:", e);
      }
    };
    fetchMovimientos();
  }, []);

  if (!user) return <p>Cargando usuario...</p>;

  const getStatusColor = (status) => {
    switch (status) {
      case "Critico": return "bg-red-100 text-red-700 border-red-200";
      case "Bajo":    return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:        return "";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Critico": return <XCircle className="w-5 h-5" />;
      case "Bajo":    return <TrendingDown className="w-5 h-5" />;
      default:        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Bienvenida */}
      <div>
        <h1 className="font-bold text-2xl text-gray-900">
          Bienvenid(a), {user?.nombre}
        </h1>
        <p className="text-gray-600 mt-1">
          Resumen de operaciones y estado del inventario
        </p>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <Package className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold">{estadisticas.totalMaterias}</span>
          </div>
          <p className="text-sm text-gray-600">Materias Primas</p>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <ShoppingCart className="w-8 h-8 text-rose-500" />
            <span className="text-2xl font-bold">{estadisticas.totalPedidos}</span>
          </div>
          <p className="text-sm text-gray-600">Pedidos Pendientes</p>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <Factory className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold">{estadisticas.totalProduccion}</span>
          </div>
          <p className="text-sm text-gray-600">Órdenes de Producción Pendientes</p>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <BookOpen className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold">{estadisticas.totalRecetas}</span>
          </div>
          <p className="text-sm text-gray-600">Recetas Activas</p>
        </div>

        <div className="bg-white border rounded-lg p-6 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <Activity className="w-8 h-8 text-green-600" />
            <span className="text-2xl font-bold">{estadisticas.movimientosHoy}</span>
          </div>
          <p className="text-sm text-gray-600">Movimientos Hoy</p>
        </div>
      </div>

      {/* Estado inventario */}
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h2 className="font-bold mb-4">Estado del Inventario</h2>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex gap-3 p-4 bg-green-50 border rounded-lg">
            <CheckCircle className="text-green-700" />
            <div>
              <p className="text-2xl font-bold text-green-700">{estadisticas.stockSuficiente}</p>
              <p className="text-sm text-green-700">Suficiente</p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-yellow-50 border rounded-lg">
            <TrendingDown className="text-yellow-700" />
            <div>
              <p className="text-2xl font-bold text-yellow-700">{estadisticas.stockBajo}</p>
              <p className="text-sm text-yellow-700">Bajo</p>
            </div>
          </div>
          <div className="flex gap-3 p-4 bg-red-50 border rounded-lg">
            <XCircle className="text-red-700" />
            <div>
              <p className="text-2xl font-bold text-red-700">{estadisticas.stockCritico}</p>
              <p className="text-sm text-red-700">Crítico</p>
            </div>
          </div>
        </div>
      </div>

      {/* Materias críticas */}
      <div className="bg-white border rounded-lg shadow-sm">
        <div className="p-6 border-b">
          <h2 className="font-bold">Materias que requieren atención</h2>
        </div>
        <div className="p-6 space-y-3">
          {materias
            .filter((m) => m.estadoStock === "Bajo" || m.estadoStock === "Critico")
            .map((materia) => (
              <div
                key={materia.id_materia}
                className={`flex justify-between p-3 rounded-lg border ${getStatusColor(materia.estadoStock)}`}
              >
                <div className="flex gap-3 items-center">
                  {getStatusIcon(materia.estadoStock)}
                  <div>
                    <p className="font-medium">{materia.nombre}</p>
                    <p className="text-sm">
                      Stock: {materia.stockActual} {materia.unidad} / Min: {materia.stockMinimo} {materia.unidad}
                    </p>
                  </div>
                </div>
              </div>
            ))}

          {materias.filter((m) => m.estadoStock === "Bajo" || m.estadoStock === "Critico").length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2">
              Todas las materias tienen stock suficiente ✓
            </p>
          )}

          <Link to="/inventario" className="block text-center text-sm text-blue-600 mt-4">
            Ver inventario →
          </Link>
        </div>
      </div>
    </div>
  );
}