import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  Package, Plus, Edit, Search, AlertTriangle, CheckCircle,
  XCircle, X, FileText, Calendar, ShoppingCart,
  ChevronDown, ChevronUp, Check, Ban,
} from "lucide-react";
import { z } from "zod";
import API_URL from "../service/api";

const LIMITES = {
  nombre:      80,
  abreviacion: 3,
  codigo_max:  11,
  stock_max:   9999999999.99,
};

// ─── ÚNICA fuente de verdad para el estado de stock ──────────────────────────
const calcularEstado = (stockActual, stockMinimo) => {
  const actual = parseFloat(stockActual) || 0;
  const minimo = parseFloat(stockMinimo) || 0;
  if (actual <= minimo)      return "Critico";
  if (actual <= minimo * 2)  return "Bajo";
  return "Suficiente";
};

// ─── Badge de estado ──────────────────────────────────────────────────────────
const StatusBadge = ({ stockActual, stockMinimo }) => {
  const estado = calcularEstado(stockActual, stockMinimo);
  const cfg = {
    Critico:    { cls: "bg-red-100 text-red-700",      Icon: XCircle,      label: "Crítico"    },
    Bajo:       { cls: "bg-yellow-100 text-yellow-700", Icon: AlertTriangle, label: "Bajo"      },
    Suficiente: { cls: "bg-green-100 text-green-700",  Icon: CheckCircle,  label: "Suficiente" },
  }[estado] ?? { cls: "bg-gray-100 text-gray-700", Icon: Package, label: estado };

  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${cfg.cls}`}>
      <cfg.Icon className="w-4 h-4" />{cfg.label}
    </span>
  );
};

// ─── Contador de caracteres ───────────────────────────────────────────────────
const CharCount = ({ value, max }) => {
  const len  = String(value || "").length;
  const pct  = len / max;
  const cls  = pct >= 1 ? "text-red-500 font-semibold"
             : pct >= 0.85 ? "text-amber-500"
             : "text-gray-400";
  return <span className={`text-xs ${cls}`}>{len}/{max}</span>;
};

const FORM_VACIO = {
  nombre: "", codigo: "", abreviacion: "",
  id_categoria_materia: "", stock_min: "", stock_inicial: "",
};

export default function Inventario() {
  const { isAdministrador, user } = useAuth();

  const [materias,    setMaterias]    = useState([]);
  const [categorias,  setCategorias]  = useState([]);
  const [cargando,    setCargando]    = useState(true);

  const [busqueda,     setBusqueda]     = useState("");
  const [filtroStock,  setFiltroStock]  = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("Activo");
  const [catsFiltro,   setCatsFiltro]   = useState(new Set());
  const [mostrarCats,  setMostrarCats]  = useState(false);

  const [modalAbierto,     setModalAbierto]     = useState(false);
  const [editando,         setEditando]         = useState(null);
  const [formulario,       setFormulario]       = useState(FORM_VACIO);
  const [guardando,        setGuardando]        = useState(false);
  const [loteInicialUsado, setLoteInicialUsado] = useState(false);
  const [errores,          setErrores]          = useState({});

  const [modalLotes,    setModalLotes]    = useState(false);
  const [materiaLotes,  setMateriaLotes]  = useState(null);
  const [lotes,         setLotes]         = useState([]);
  const [cargandoLotes, setCargandoLotes] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  // ─── Schema Zod alineado con la BD ───────────────────────────────────────
  const materiaPrimaSchema = z.object({
    nombre: z
      .string()
      .trim()
      .min(3,  "El nombre debe tener al menos 3 caracteres")
      .max(LIMITES.nombre, `El nombre no puede superar ${LIMITES.nombre} caracteres`),

    codigo: z
      .string()
      .min(1, "El código es obligatorio")
      .max(LIMITES.codigo_max, `El código no puede superar ${LIMITES.codigo_max} dígitos`),

    abreviacion: z
      .string()
      .trim()
      .min(1, "La abreviación es obligatoria")
      .max(LIMITES.abreviacion, `Máximo ${LIMITES.abreviacion} caracteres`),

    id_categoria_materia: z
      .string()
      .min(1, "Seleccione una categoría"),

    stock_min: z.coerce
      .number({ invalid_type_error: "Ingrese un número válido" })
      .min(0,                "El stock mínimo no puede ser negativo")
      .max(LIMITES.stock_max, `El stock mínimo supera el límite permitido (${LIMITES.stock_max.toLocaleString("es-CO")} kg)`),

    stock_inicial: z.coerce
      .number({ invalid_type_error: "Ingrese un número válido" })
      .min(0.01,             "El stock inicial debe ser mayor a 0")
      .max(LIMITES.stock_max, `El stock inicial supera el límite permitido (${LIMITES.stock_max.toLocaleString("es-CO")} kg)`),
  });

  // ─── Helper: limpiar error de un campo al editarlo ────────────────────────
  const setField = (campo, valor) => {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo]) setErrores((prev) => { const e = { ...prev }; delete e[campo]; return e; });
  };

  if (!isAdministrador) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <XCircle className="w-12 h-12 text-red-400" />
        <p className="text-gray-600 font-medium">No tienes permisos para acceder a este módulo.</p>
      </div>
    );
  }

  // ─── Carga ────────────────────────────────────────────────────────────────
  const cargarMaterias = async () => {
    setCargando(true);
    try {
      const res  = await fetch(`${API_URL}/materias-primas`);
      const data = await res.json();
      setMaterias(Array.isArray(data) ? data : []);
    } catch { toast.error("Error al cargar materias primas"); }
    finally  { setCargando(false); }
  };

  const cargarCategorias = async () => {
    try {
      const res  = await fetch(`${API_URL}/materias-primas/categorias`);
      const data = await res.json();
      setCategorias(Array.isArray(data) ? data : []);
    } catch { /* silencioso */ }
  };

  useEffect(() => { cargarMaterias(); cargarCategorias(); }, []);

  // ─── Filtrado ─────────────────────────────────────────────────────────────
  const materiasFiltradas = useMemo(() =>
    materias.filter((m) => {
      const coincideNombre = m.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const estadoStock    = calcularEstado(m.stockActual, m.stockMinimo);
      const coincideStock  = filtroStock === "todos" || estadoStock === filtroStock;
      const coincideEstado = m.estado === filtroEstado;
      const coincideCat    = catsFiltro.size === 0 || catsFiltro.has(m.categoria);
      return coincideNombre && coincideStock && coincideEstado && coincideCat;
    }),
  [materias, busqueda, filtroStock, filtroEstado, catsFiltro]);

  const estadisticas = useMemo(() => {
    const activas = materias.filter((m) => m.estado === "Activo");
    return {
      total:      activas.length,
      suficiente: activas.filter((m) => calcularEstado(m.stockActual, m.stockMinimo) === "Suficiente").length,
      bajo:       activas.filter((m) => calcularEstado(m.stockActual, m.stockMinimo) === "Bajo").length,
      critico:    activas.filter((m) => calcularEstado(m.stockActual, m.stockMinimo) === "Critico").length,
    };
  }, [materias]);

  // ─── Modal ────────────────────────────────────────────────────────────────
  const abrirModal = (materia = null) => {
    setEditando(materia);
    if (materia) setLoteInicialUsado(materia.loteInicialUsado);
    setFormulario(
      materia ? {
        nombre:               materia.nombre,
        codigo:               materia.codigo || "",
        abreviacion:          materia.abreviacion || "",
        id_categoria_materia: materia.id_categoria_materia ? String(materia.id_categoria_materia) : "",
        stock_min:            materia.stockMinimo ?? "",
        stock_inicial:        materia.stockActual ?? "",
      } : FORM_VACIO,
    );
    setErrores({});
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
    setFormulario(FORM_VACIO);
    setErrores({});
  };

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrores({});

    // ✅ CORRECCIÓN: se aplica trim() aquí y se usa formularioLimpio en todo
    const formularioLimpio = {
      ...formulario,
      nombre:      formulario.nombre.trim(),
      abreviacion: formulario.abreviacion.trim(),
    };

    const schemaValidar =
      editando && loteInicialUsado
        ? materiaPrimaSchema.omit({ stock_inicial: true })
        : materiaPrimaSchema;

    const result = schemaValidar.safeParse(formularioLimpio);

    if (!result.success) {
      const erroresForm = {};
      result.error.issues.forEach((err) => { erroresForm[err.path[0]] = err.message; });
      setErrores(erroresForm);
      toast.error("Corrige los campos marcados en el formulario");
      return;
    }

    // Verificar duplicados
    const duplicado = materias.find((m) => {
      if (editando && m.id_materia === editando.id_materia) return false;
      return (
        m.nombre.toLowerCase()       === formularioLimpio.nombre.toLowerCase()      ||
        m.codigo                     === formularioLimpio.codigo                     ||
        m.abreviacion?.toLowerCase() === formularioLimpio.abreviacion.toLowerCase()
      );
    });

    if (duplicado) {
      const erroresDup = {};
      if (duplicado.nombre.toLowerCase() === formularioLimpio.nombre.toLowerCase())
        erroresDup.nombre      = "Ya existe una materia prima con este nombre";
      if (duplicado.codigo === formularioLimpio.codigo)
        erroresDup.codigo      = "Ya existe una materia prima con este código";
      if (duplicado.abreviacion?.toLowerCase() === formularioLimpio.abreviacion.toLowerCase())
        erroresDup.abreviacion = "Ya existe una materia prima con esta abreviación";
      setErrores(erroresDup);
      toast.error("Ya existe una materia prima con esos datos");
      return;
    }

    setGuardando(true);
    try {
      const url    = editando ? `${API_URL}/materias-primas/${editando.id_materia}` : `${API_URL}/materias-primas`;
      const method = editando ? "PUT" : "POST";

      // ✅ CORRECCIÓN: se envía formularioLimpio (con trim aplicado) no formulario
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formularioLimpio,
          stock_min:            parseFloat(formularioLimpio.stock_min)     || 0,
          stock_inicial:        parseFloat(formularioLimpio.stock_inicial) || 0,
          id_categoria_materia: parseInt(formularioLimpio.id_categoria_materia),
          id_usuario:           user.id_usuario,
        }),
      });

      const data = await res.json();
      if (!res.ok) { toast.error(data.message || "Error al guardar"); return; }
      toast.success(editando ? "Materia prima actualizada" : "Materia prima creada");
      cerrarModal();
      cargarMaterias();
    } catch { toast.error("Error de conexión"); }
    finally  { setGuardando(false); }
  };

  // ─── Inhabilitar / Habilitar ──────────────────────────────────────────────
  const solicitarAccion = async (materia, accion) => {
    if (accion === "inhabilitar") {
      let lotesActivos = 0;
      try {
        const res  = await fetch(`${API_URL}/materias-primas/${materia.id_materia}/lotes`);
        const data = await res.json();
        lotesActivos = Array.isArray(data)
          ? data.filter((l) => l.estado !== "agotado" && Number(l.stock_restante) > 0).length
          : 0;
      } catch { /* continúa */ }
      setConfirmData({ materia, accion, tieneStockComprometido: Number(materia.stockComprometido) > 0, lotesActivos });
    } else {
      setConfirmData({ materia, accion, tieneStockComprometido: false, lotesActivos: 0 });
    }
    setConfirmOpen(true);
  };

  const confirmarAccion = async () => {
    const { materia, accion } = confirmData;
    try {
      const url    = accion === "inhabilitar" ? `${API_URL}/materias-primas/${materia.id_materia}` : `${API_URL}/materias-primas/${materia.id_materia}/habilitar`;
      const method = accion === "inhabilitar" ? "DELETE" : "PATCH";
      const res    = await fetch(url, { method });
      const data   = await res.json();
      if (!res.ok) { toast.error(data.message || "Error"); return; }
      toast.success(accion === "inhabilitar" ? `${materia.nombre} inhabilitada correctamente` : `${materia.nombre} habilitada correctamente`);
      cargarMaterias();
    } catch { toast.error("Error de conexión"); }
    finally  { setConfirmOpen(false); setConfirmData(null); }
  };

  const verLotes = async (materia) => {
    setMateriaLotes(materia); setModalLotes(true); setCargandoLotes(true);
    try {
      const res  = await fetch(`${API_URL}/materias-primas  /${materia.id_materia}/lotes`);
      const data = await res.json();
      setLotes(Array.isArray(data) ? data : []);
    } catch { toast.error("Error al cargar lotes"); }
    finally  { setCargandoLotes(false); }
  };

  const cerrarLotes = () => { setModalLotes(false); setMateriaLotes(null); setLotes([]); };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900 text-2xl">Inventario de Materias Primas</h1>
          <p className="text-gray-600 mt-1">Gestión y control de stock</p>
        </div>
        <button onClick={() => abrirModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
          <Plus className="w-5 h-5" /> Agregar Materia Prima
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Activas</p>
          <p className="text-2xl font-bold text-gray-900">{estadisticas.total}</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-700 mb-1">Stock Suficiente</p>
          <p className="text-2xl font-bold text-green-700">{estadisticas.suficiente}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <p className="text-sm text-yellow-700 mb-1">Stock Bajo</p>
          <p className="text-2xl font-bold text-yellow-700">{estadisticas.bajo}</p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-700 mb-1">Stock Crítico</p>
          <p className="text-2xl font-bold text-red-700">{estadisticas.critico}</p>
        </div>
      </div>

      {/* Filtro habilitados/inhabilitados */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
          <div className="flex gap-2">
            <button onClick={() => setFiltroEstado("Activo")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filtroEstado === "Activo" ? "bg-green-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" /> Habilitados ({materias.filter((m) => m.estado === "Activo").length})
              </span>
            </button>
            <button onClick={() => setFiltroEstado("Inhabilitado")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filtroEstado === "Inhabilitado" ? "bg-red-600 text-white shadow-sm" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              <span className="flex items-center gap-2">
                <Ban className="w-4 h-4" /> Inhabilitados ({materias.filter((m) => m.estado === "Inhabilitado").length})
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Búsqueda + Filtro stock + Categoría */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { val: "todos",      label: "Todos",      cls: "bg-blue-600"   },
              { val: "Suficiente", label: "Suficiente", cls: "bg-green-600"  },
              { val: "Bajo",       label: "Bajo",       cls: "bg-yellow-600" },
              { val: "Critico",    label: "Crítico",    cls: "bg-red-600"    },
            ].map(({ val, label, cls }) => (
              <button key={val} onClick={() => setFiltroStock(val)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filtroStock === val ? `${cls} text-white` : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {categorias.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <button onClick={() => setMostrarCats(!mostrarCats)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200">
              {mostrarCats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Filtrar por Categoría
              {catsFiltro.size > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  {catsFiltro.size} seleccionada{catsFiltro.size !== 1 ? "s" : ""}
                </span>
              )}
            </button>
            {mostrarCats && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 max-h-60 overflow-y-auto">
                  {categorias.map((cat) => (
                    <label key={cat.id_categoria_materia}
                      className="flex items-center cursor-pointer hover:bg-white px-2 py-1.5 rounded transition-colors">
                      <input type="checkbox" checked={catsFiltro.has(cat.nombre_categoria_materia)}
                        onChange={() => {
                          const s = new Set(catsFiltro);
                          s.has(cat.nombre_categoria_materia) ? s.delete(cat.nombre_categoria_materia) : s.add(cat.nombre_categoria_materia);
                          setCatsFiltro(s);
                        }}
                        className="mr-3 w-4 h-4 text-blue-600 border-gray-300 rounded" />
                      <span className="text-sm text-gray-700">{cat.nombre_categoria_materia}</span>
                    </label>
                  ))}
                </div>
                {catsFiltro.size > 0 && (
                  <div className="mt-3 pt-2 border-t border-gray-300">
                    <button onClick={() => setCatsFiltro(new Set())}
                      className="text-sm text-red-600 hover:text-red-700 font-medium">
                      Limpiar filtros de categoría
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Código","Nombre","Stock Actual","Stock Mínimo","Stock Comprometido","Stock Disponible","Estado","Acciones"].map((col) => (
                  <th key={col}
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${col === "Acciones" ? "text-right" : "text-left"}`}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cargando ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500">Cargando...</td></tr>
              ) : materiasFiltradas.length === 0 ? (
                <tr><td colSpan={8} className="px-6 py-12 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No se encontraron materias primas</p>
                </td></tr>
              ) : (
                materiasFiltradas.map((m) => (
                  <tr key={m.id_materia} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-bold text-blue-600">{m.codigo || "N/A"}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{m.nombre}</p>
                          <button onClick={() => verLotes(m)}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 mt-1">
                            <FileText className="w-3 h-3" /> Ver Lotes
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{Number(m.stockActual).toFixed(2)} kg</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{Number(m.stockMinimo).toFixed(2)} kg</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-amber-600">{Number(m.stockComprometido).toFixed(2)} kg</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-blue-600">{Number(m.stockDisponible).toFixed(2)} kg</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge stockActual={m.stockActual} stockMinimo={m.stockMinimo} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        {filtroEstado === "Activo" ? (
                          <>
                            <button onClick={() => abrirModal(m)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => solicitarAccion(m, "inhabilitar")}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Inhabilitar">
                              <Ban className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button onClick={() => solicitarAccion(m, "habilitar")}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Habilitar">
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal Crear / Editar ───────────────────────────────────────────── */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-xl">
                {editando ? "Editar Materia Prima" : "Nueva Materia Prima"}
              </h2>
              <button onClick={cerrarModal} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">

              {/* ── Nombre ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Nombre *</label>
                  {/* ✅ Contador visible para el usuario */}
                  <CharCount value={formulario.nombre} max={LIMITES.nombre} />
                </div>
                <input
                  type="text"
                  required
                  // ✅ maxLength alineado con VARCHAR(80) de la BD
                  maxLength={LIMITES.nombre}
                  value={formulario.nombre}
                  onChange={(e) => setField("nombre", e.target.value)}
                  placeholder="Ej: Dióxido de Titanio"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.nombre ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                  }`}
                />
                {errores.nombre && (
                  <p className="flex items-center gap-1 text-red-500 text-sm mt-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {errores.nombre}
                  </p>
                )}
              </div>

              {/* ── Código ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Código *</label>
                  <CharCount value={formulario.codigo} max={LIMITES.codigo_max} />
                </div>
                <input
                  type="text"
                  required
                  maxLength={LIMITES.codigo_max}
                  value={formulario.codigo}
                  onChange={(e) => setField("codigo", e.target.value.replace(/\D/g, ""))}
                  placeholder="Ej: 61902511179"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.codigo ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                  }`}
                />
                {errores.codigo && (
                  <p className="flex items-center gap-1 text-red-500 text-sm mt-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {errores.codigo}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">Código numérico único — máximo {LIMITES.codigo_max} dígitos</p>
              </div>

              {/* ── Abreviación ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Abreviación * (máx. {LIMITES.abreviacion} caracteres)
                  </label>
                  <CharCount value={formulario.abreviacion} max={LIMITES.abreviacion} />
                </div>
                <input
                  type="text"
                  required
                  maxLength={LIMITES.abreviacion}
                  value={formulario.abreviacion}
                  onChange={(e) => setField("abreviacion", e.target.value.toUpperCase())}
                  placeholder="Ej: DT"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.abreviacion ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                  }`}
                />
                {errores.abreviacion && (
                  <p className="flex items-center gap-1 text-red-500 text-sm mt-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {errores.abreviacion}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">Se usa para generar códigos de lote</p>
              </div>

              {/* ── Stock Inicial ── */}
              {(!editando || !loteInicialUsado) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Inicial (kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    // ✅ max alineado con DECIMAL(12,2)
                    max={LIMITES.stock_max}
                    required
                    value={formulario.stock_inicial}
                    onChange={(e) => setField("stock_inicial", e.target.value)}
                    placeholder="Ej: 350.00"
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errores.stock_inicial ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                    }`}
                  />
                  {errores.stock_inicial && (
                    <p className="flex items-center gap-1 text-red-500 text-sm mt-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {errores.stock_inicial}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Hasta 2 decimales — máx. {LIMITES.stock_max.toLocaleString("es-CO")} kg. Se creará un lote con esta cantidad.
                  </p>
                </div>
              )}

              {/* ── Stock Mínimo ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock Mínimo (kg) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={LIMITES.stock_max}
                  required
                  value={formulario.stock_min}
                  onChange={(e) => setField("stock_min", e.target.value)}
                  placeholder="Ej: 100.00"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.stock_min ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                  }`}
                />
                {errores.stock_min && (
                  <p className="flex items-center gap-1 text-red-500 text-sm mt-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {errores.stock_min}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Hasta 2 decimales — máx. {LIMITES.stock_max.toLocaleString("es-CO")} kg
                </p>
              </div>

              {/* ── Categoría ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoría *</label>
                <select
                  required
                  value={formulario.id_categoria_materia}
                  onChange={(e) => setField("id_categoria_materia", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errores.id_categoria_materia ? "border-red-500 focus:ring-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Seleccione una categoría...</option>
                  {categorias.map((c) => (
                    <option key={c.id_categoria_materia} value={c.id_categoria_materia}>
                      {c.nombre_categoria_materia}
                    </option>
                  ))}
                </select>
                {errores.id_categoria_materia && (
                  <p className="flex items-center gap-1 text-red-500 text-sm mt-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {errores.id_categoria_materia}
                  </p>
                )}
              </div>

              {editando && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded p-2 border border-gray-200">
                  ℹ️ El stock actual solo se modifica mediante movimientos de entrada/salida o recepciones de pedidos.
                </p>
              )}

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={cerrarModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                  {guardando ? "Guardando..." : editando ? "Guardar Cambios" : "Crear Materia Prima"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Lotes ────────────────────────────────────────────────────── */}
      {modalLotes && materiaLotes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="font-bold text-gray-900 text-xl">Lotes de {materiaLotes.nombre}</h2>
                <p className="text-sm text-gray-600 mt-1">Trazabilidad por orden de recepción</p>
              </div>
              <button onClick={cerrarLotes} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {cargandoLotes ? (
                <p className="text-center text-gray-500 py-12">Cargando lotes...</p>
              ) : lotes.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No hay lotes registrados para esta materia prima</p>
                  <p className="text-sm text-gray-400 mt-1">Los lotes se crean al recibir pedidos</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lotes.map((lote) => {
                    const agotado    = lote.estado === "agotado" || Number(lote.stock_restante) === 0;
                    const inicial    = Number(lote.stock_inicial);
                    const restante   = Number(lote.stock_restante);
                    const porcentaje = inicial > 0 ? (restante / inicial) * 100 : 0;
                    return (
                      <div key={lote.id_lote}
                        className={`border rounded-lg p-4 ${agotado ? "border-gray-300 bg-gray-50 opacity-75" : "border-gray-200 hover:shadow-md bg-white"}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${agotado ? "bg-gray-200" : "bg-green-100"}`}>
                              <FileText className={`w-5 h-5 ${agotado ? "text-gray-500" : "text-green-600"}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-gray-900">Lote</h3>
                                <span className="font-bold text-gray-900">{lote.codigo_lote}</span>
                                {agotado && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">Agotado</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">Proveedor: {lote.proveedor || "No especificado"}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {lote.fecha_ingreso ? new Date(lote.fecha_ingreso).toLocaleDateString("es-CO") : "N/A"}
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-3 border-t border-gray-100">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Stock Inicial</p>
                            <p className="font-bold text-gray-900">{inicial.toFixed(2)} kg</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Stock Restante</p>
                            <p className={`font-bold ${agotado ? "text-red-600" : porcentaje < 30 ? "text-yellow-600" : "text-green-600"}`}>
                              {restante.toFixed(2)} kg
                            </p>
                          </div>
                          {lote.numero_orden_compra && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Orden de Compra</p>
                              <div className="flex items-center gap-1">
                                <ShoppingCart className="w-4 h-4 text-blue-600" />
                                <p className="font-medium text-blue-600">{lote.numero_orden_compra}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        {!agotado && (
                          <div className="mt-3">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className={`h-2 rounded-full transition-all ${porcentaje < 30 ? "bg-yellow-500" : "bg-green-500"}`}
                                style={{ width: `${porcentaje}%` }} />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 text-right">{porcentaje.toFixed(1)}% disponible</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200">
              <button onClick={cerrarLotes}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ─────────────────────────────────────────────────── */}
      {confirmOpen && confirmData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              {confirmData.accion === "inhabilitar"
                ? <Ban className="w-8 h-8 text-red-500" />
                : <Check className="w-8 h-8 text-green-500" />}
              <h2 className="font-bold text-gray-900 text-lg">
                {confirmData.accion === "inhabilitar" ? "Inhabilitar" : "Habilitar"} materia prima
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              ¿Estás seguro de que deseas {confirmData.accion === "inhabilitar" ? "inhabilitar" : "habilitar"}{" "}
              <span className="font-semibold text-gray-900">{confirmData.materia.nombre}</span>?
            </p>
            {confirmData.tieneStockComprometido && (
              <div className="flex gap-3 p-3 mb-3 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">Stock comprometido activo</p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    Tiene <span className="font-semibold">{Number(confirmData.materia.stockComprometido).toFixed(2)} kg</span>{" "}
                    comprometidos en órdenes pendientes o en proceso.
                  </p>
                </div>
              </div>
            )}
            {confirmData.lotesActivos > 0 && (
              <div className="flex gap-3 p-3 mb-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">Lotes con stock disponible</p>
                  <p className="text-sm text-red-700 mt-0.5">
                    Tiene <span className="font-semibold">{confirmData.lotesActivos} lote{confirmData.lotesActivos !== 1 ? "s" : ""}</span>{" "}
                    activo{confirmData.lotesActivos !== 1 ? "s" : ""} con stock sin agotar. Al inhabilitar, ese stock quedará inaccesible.
                  </p>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => { setConfirmOpen(false); setConfirmData(null); }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button onClick={confirmarAccion}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                  confirmData.accion === "inhabilitar" ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                }`}>
                {confirmData.accion === "inhabilitar" ? "Inhabilitar de todas formas" : "Habilitar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}