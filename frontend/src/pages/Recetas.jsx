import { useState, useEffect, useMemo } from "react";
import React from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  Plus, Edit, Search, Ban, Check,
  FlaskConical, X, ChevronDown, ChevronUp, Percent,
} from "lucide-react";

const API    = "http://localhost:3000/api/recetas";
const API_MP = "http://localhost:3000/api/materias-primas";

export default function Recetas() {
  const { isAdministrador } = useAuth();

  const [recetas, setRecetas]               = useState([]);
  const [materiasPrimas, setMateriasPrimas] = useState([]);
  const [cargando, setCargando]             = useState(true);
  const [busqueda, setBusqueda]             = useState("");
  const [filtroEstado, setFiltroEstado]     = useState("Activo");
  const [modalAbierto, setModalAbierto]     = useState(false);
  const [editando, setEditando]             = useState(null);
  const [guardando, setGuardando]           = useState(false);
  const [nombreProducto, setNombreProducto] = useState("");
  const [ingredientes, setIngredientes]     = useState([{ id_materia: "", cantidad_porcentaje: "" }]);
  const [confirmOpen, setConfirmOpen]       = useState(false);
  const [confirmData, setConfirmData]       = useState(null);
  const [expandidas, setExpandidas]         = useState(new Set());

  const getToken = () => localStorage.getItem("token");

  const cargarRecetas = async () => {
    setCargando(true);
    try {
      const res  = await fetch(API, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      const lista = Array.isArray(data.data) ? data.data : Array.isArray(data) ? data : [];
      setRecetas(lista);
    } catch {
      toast.error("Error al cargar recetas");
    } finally {
      setCargando(false);
    }
  };

  const cargarMateriasPrimas = async () => {
    try {
      const res  = await fetch(API_MP, { headers: { Authorization: `Bearer ${getToken()}` } });
      const data = await res.json();
      const todas = Array.isArray(data) ? data : [];
      setMateriasPrimas(todas.filter((m) => m.estado === "Activo"));
    } catch {
      toast.error("Error al cargar materias primas");
    }
  };

useEffect(() => {
  cargarRecetas();
  cargarMateriasPrimas();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  const recetasFiltradas = useMemo(() => {
    return recetas.filter((r) => {
      if (!r || !r.nombre_producto) return false;
      return (
        r.nombre_producto.toLowerCase().includes(busqueda.toLowerCase()) &&
        r.estado === filtroEstado
      );
    });
  }, [recetas, busqueda, filtroEstado]);

  const sumaPorcentajes = useMemo(() => {
    return ingredientes.reduce((sum, ing) => sum + (parseFloat(ing.cantidad_porcentaje) || 0), 0);
  }, [ingredientes]);

  const agregarIngrediente = () =>
    setIngredientes([...ingredientes, { id_materia: "", cantidad_porcentaje: "" }]);

  const quitarIngrediente = (index) => {
    if (ingredientes.length === 1) { toast.error("La receta debe tener al menos un ingrediente"); return; }
    setIngredientes(ingredientes.filter((_, i) => i !== index));
  };

  const actualizarIngrediente = (index, campo, valor) => {
    const copia = [...ingredientes];
    copia[index][campo] = valor;
    setIngredientes(copia);
  };

  const abrirModalNuevo = () => {
    setEditando(null);
    setNombreProducto("");
    setIngredientes([{ id_materia: "", cantidad_porcentaje: "" }]);
    setModalAbierto(true);
  };

  const abrirModalEditar = (receta) => {
    setEditando(receta);
    setNombreProducto(receta.nombre_producto);
    setIngredientes(receta.ingredientes.map((ing) => ({
      id_materia: ing.id_materia,
      cantidad_porcentaje: ing.cantidad_porcentaje,
    })));
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
    setNombreProducto("");
    setIngredientes([{ id_materia: "", cantidad_porcentaje: "" }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombreProducto.trim()) { toast.error("El nombre del producto es obligatorio"); return; }
    if (ingredientes.some((ing) => !ing.id_materia || !ing.cantidad_porcentaje)) {
      toast.error("Completa todos los campos de los ingredientes"); return;
    }
    if (Math.abs(sumaPorcentajes - 100) > 0.01) {
      toast.error(`Los porcentajes deben sumar 100%. Suma actual: ${sumaPorcentajes.toFixed(2)}%`); return;
    }
    setGuardando(true);
    try {
      const url    = editando ? `${API}/${editando.id_receta}` : API;
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          nombre_producto: nombreProducto.trim(),
          ingredientes: ingredientes.map((ing) => ({
            id_materia: parseInt(ing.id_materia),
            cantidad_porcentaje: parseFloat(ing.cantidad_porcentaje),
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Error al guardar"); return; }
      toast.success(editando ? "Receta actualizada correctamente" : "Receta creada correctamente");
      cerrarModal();
      cargarRecetas();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  const solicitarAccion = (receta, accion) => { setConfirmData({ receta, accion }); setConfirmOpen(true); };

  const confirmarAccion = async () => {
    const { receta, accion } = confirmData;
    try {
      const url    = accion === "inhabilitar" ? `${API}/${receta.id_receta}` : `${API}/${receta.id_receta}/habilitar`;
      const method = accion === "inhabilitar" ? "DELETE" : "PATCH";
      const res    = await fetch(url, { method, headers: { Authorization: `Bearer ${getToken()}` } });
      const data   = await res.json();
      if (!res.ok) { toast.error(data.message || "Error al realizar la acción"); return; }
      toast.success(accion === "inhabilitar"
        ? `"${receta.nombre_producto}" inhabilitada correctamente`
        : `"${receta.nombre_producto}" habilitada correctamente`
      );
      cargarRecetas();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setConfirmOpen(false);
      setConfirmData(null);
    }
  };

  const toggleExpandir = (id) => {
    const copia = new Set(expandidas);
    copia.has(id) ? copia.delete(id) : copia.add(id);
    setExpandidas(copia);
  };

  // Guard después de todos los hooks
  if (!isAdministrador) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <X className="w-12 h-12 text-red-400" />
        <p className="text-gray-600 font-medium">No tienes permisos para acceder a este módulo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900 text-2xl">Recetas</h1>
          <p className="text-gray-600 mt-1">Gestión de fórmulas de producción</p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" /> Nueva Receta
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Recetas</p>
          <p className="text-2xl font-bold text-gray-900">{recetas.length}</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-700 mb-1">Activas</p>
          <p className="text-2xl font-bold text-green-700">
            {recetas.filter((r) => r.estado === "Activo").length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-700 mb-1">Inhabilitadas</p>
          <p className="text-2xl font-bold text-red-700">
            {recetas.filter((r) => r.estado === "Inhabilitado").length}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setFiltroEstado("Activo")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filtroEstado === "Activo" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Activas ({recetas.filter((r) => r.estado === "Activo").length})
              </span>
            </button>
            <button
              onClick={() => setFiltroEstado("Inhabilitado")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filtroEstado === "Inhabilitado" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <span className="flex items-center gap-2">
                <Ban className="w-4 h-4" />
                Inhabilitadas ({recetas.filter((r) => r.estado === "Inhabilitado").length})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre de receta..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Receta", "Ingredientes", "Estado", "Fecha creación", "Acciones"].map((col) => (
                  <th
                    key={col}
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      col === "Acciones" ? "text-right" : "text-left"
                    }`}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cargando ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Cargando...</td>
                </tr>
              ) : recetasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <FlaskConical className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No se encontraron recetas</p>
                  </td>
                </tr>
              ) : (
                recetasFiltradas.map((r) => (
                  <React.Fragment key={r.id_receta}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FlaskConical className="w-5 h-5 text-blue-600" />
                          </div>
                          <p className="font-medium text-gray-900">{r.nombre_producto}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleExpandir(r.id_receta)}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                        >
                          {expandidas.has(r.id_receta) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {r.ingredientes?.length || 0} ingrediente(s)
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${
                          r.estado === "Activo" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {r.estado === "Activo" ? <Check className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                          {r.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {r.fecha_creacion ? new Date(r.fecha_creacion).toLocaleDateString("es-CO") : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          {r.estado === "Activo" ? (
                            <>
                              <button onClick={() => abrirModalEditar(r)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => solicitarAccion(r, "inhabilitar")} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Inhabilitar">
                                <Ban className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => solicitarAccion(r, "habilitar")} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Habilitar">
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandidas.has(r.id_receta) && (
                      <tr className="bg-blue-50">
                        <td colSpan={5} className="px-10 py-3">
                          <div className="flex flex-wrap gap-2">
                            {r.ingredientes?.map((ing) => (
                              <span key={ing.id_materia} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-blue-200 rounded-full text-sm text-gray-700">
                                <Percent className="w-3 h-3 text-blue-500" />
                                <span className="font-medium">{ing.nombre_materia}</span>
                                <span className="text-blue-600 font-bold">{parseFloat(ing.cantidad_porcentaje).toFixed(2)}%</span>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-xl">{editando ? "Editar Receta" : "Nueva Receta"}</h2>
              <button onClick={cerrarModal} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre del producto *</label>
                <input
                  type="text"
                  required
                  value={nombreProducto}
                  onChange={(e) => setNombreProducto(e.target.value)}
                  placeholder="Ej: Pintura Blanca Mate"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Ingredientes *</label>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${
                    Math.abs(sumaPorcentajes - 100) <= 0.01 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>
                    Suma: {sumaPorcentajes.toFixed(2)}% / 100%
                  </span>
                </div>
                <div className="space-y-2">
                  {ingredientes.map((ing, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <select
                        required
                        value={ing.id_materia}
                        onChange={(e) => actualizarIngrediente(index, "id_materia", e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecciona materia prima...</option>
                        {materiasPrimas.map((mp) => (
                          <option key={mp.id_materia} value={mp.id_materia}>{mp.nombre}</option>
                        ))}
                      </select>
                      <div className="relative w-32">
                        <input
                          type="number"
                          required
                          min="0.01"
                          max="100"
                          step="0.01"
                          value={ing.cantidad_porcentaje}
                          onChange={(e) => actualizarIngrediente(index, "cantidad_porcentaje", e.target.value)}
                          placeholder="0.00"
                          className="w-full px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                      </div>
                      <button type="button" onClick={() => quitarIngrediente(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={agregarIngrediente} className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
                  <Plus className="w-4 h-4" /> Agregar ingrediente
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarModal} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {guardando ? "Guardando..." : editando ? "Guardar Cambios" : "Crear Receta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      {confirmOpen && confirmData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              {confirmData.accion === "inhabilitar" ? <Ban className="w-8 h-8 text-red-500" /> : <Check className="w-8 h-8 text-green-500" />}
              <h2 className="font-bold text-gray-900 text-lg">
                {confirmData.accion === "inhabilitar" ? "Inhabilitar" : "Habilitar"} Receta
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas {confirmData.accion === "inhabilitar" ? "inhabilitar" : "habilitar"} la receta{" "}
              <span className="font-semibold text-gray-900">"{confirmData.receta.nombre_producto}"</span>?
              {confirmData.accion === "inhabilitar" && (
                <span className="block mt-2 text-sm text-red-600">No podrá usarse en nuevas órdenes de producción.</span>
              )}
            </p>
            <div className="flex gap-3">
              <button onClick={() => { setConfirmOpen(false); setConfirmData(null); }} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={confirmarAccion}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  confirmData.accion === "inhabilitar" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {confirmData.accion === "inhabilitar" ? "Inhabilitar" : "Habilitar"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}