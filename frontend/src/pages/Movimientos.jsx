import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  X,
  FileText,
  BarChart2,
  Package,
  Printer,
} from "lucide-react";

const API = "http://localhost:3000/api/movimientos";
const API_MP = "http://localhost:3000/api/materias-primas";

export default function Movimientos() {
  const { isAdministrador, fetchConAuth } = useAuth();

  // ── Datos
  const [movimientos, setMovimientos] = useState([]);
  const [materiasPrimas, setMateriasPrimas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // ── Filtros listado principal
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  // ── Modal registrar movimiento
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState("Entrada");
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState({
    id_materia: "",
    id_lote: "",
    cantidad: "",
    observacion: "",
    no_orden_compra: "",
  });

  // ── Modal reportes
  const [modalReportes, setModalReportes] = useState(false);
  const [tipoReporte, setTipoReporte] = useState("");
  const [filtroReporte, setFiltroReporte] = useState({
    fecha_inicio: "",
    fecha_fin: "",
  });
  const [resultadoReporte, setResultadoReporte] = useState([]);
  const [reporteGenerado, setReporteGenerado] = useState(false);
  const [cargandoReporte, setCargandoReporte] = useState(false);

  // ── Carga de datos
  const cargarMovimientos = async () => {
    setCargando(true);
    try {
      const res = await fetch(API);
      const data = await res.json();
      const lista = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data)
          ? data
          : [];
      setMovimientos(lista);
    } catch {
      toast.error("Error al cargar movimientos");
    } finally {
      setCargando(false);
    }
  };

  const cargarMateriasPrimas = async () => {
    try {
      const res = await fetchConAuth(API_MP);
      if (!res) return;
      const data = await res.json();
      const todas = Array.isArray(data) ? data : [];
      setMateriasPrimas(todas.filter((m) => m.estado === "Activo"));
    } catch {
      toast.error("Error al cargar materias primas");
    }
  };

  const cargarLotes = async (id_materia) => {
    if (!id_materia) {
      setLotes([]);
      return;
    }
    try {
      const res = await fetchConAuth(`${API}/lotes/${id_materia}`);
      if (!res) return;
      const data = await res.json();
      setLotes(Array.isArray(data.data) ? data.data : []);
    } catch {
      toast.error("Error al cargar lotes");
    }
  };

  useEffect(() => {
    cargarMovimientos();
    cargarMateriasPrimas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Estadísticas
  const stats = useMemo(() => {
    const hoy = new Date().toLocaleDateString("es-CO");
    return {
      total: movimientos.length,
      hoy: movimientos.filter(
        (m) => new Date(m.fecha).toLocaleDateString("es-CO") === hoy,
      ).length,
      entradas: movimientos.filter((m) => m.tipo_movimiento === "Entrada")
        .length,
      salidas: movimientos.filter((m) => m.tipo_movimiento === "Salida").length,
      devoluciones: movimientos.filter(
        (m) => m.tipo_movimiento === "Devolucion",
      ).length,
    };
  }, [movimientos]);

  // ── Filtrado listado
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter((m) => {
      const coincideBusqueda =
        m.nombre_materia?.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.usuario?.toLowerCase().includes(busqueda.toLowerCase()) ||
        m.codigo_lote?.toLowerCase().includes(busqueda.toLowerCase());
      const coincideTipo =
        filtroTipo === "Todos" || m.tipo_movimiento === filtroTipo;
      const fecha = new Date(m.fecha);
      const coincideFechaInicio =
        !fechaInicio || fecha >= new Date(fechaInicio);
      const coincideFechaFin =
        !fechaFin || fecha <= new Date(fechaFin + "T23:59:59");
      return (
        coincideBusqueda &&
        coincideTipo &&
        coincideFechaInicio &&
        coincideFechaFin
      );
    });
  }, [movimientos, busqueda, filtroTipo, fechaInicio, fechaFin]);

  // ── Modal registrar
  const abrirModal = () => {
    setTipoMovimiento("Entrada");
    setForm({
      id_materia: "",
      id_lote: "",
      cantidad: "",
      observacion: "",
      no_orden_compra: "",
    });
    setLotes([]);
    cargarMateriasPrimas(); // Fix 2 — recargar materias al abrir modal
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setLotes([]);
  };

  const handleMateriaChange = (id_materia) => {
    setForm((prev) => ({ ...prev, id_materia, id_lote: "" }));
    if (tipoMovimiento === "Salida" || tipoMovimiento === "Devolucion") {
      cargarLotes(id_materia);
    }
  };

  const handleTipoChange = (tipo) => {
    setTipoMovimiento(tipo);
    setForm((prev) => ({ ...prev, id_materia: "", id_lote: "", cantidad: "" }));
    setLotes([]);
    if (tipo === "Salida" || tipo === "Devolucion") cargarMateriasPrimas();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_materia) {
      toast.error("Selecciona una materia prima");
      return;
    }
    if (!form.cantidad || parseFloat(form.cantidad) <= 0) {
      toast.error("La cantidad debe ser mayor a cero");
      return;
    }
    if (
      (tipoMovimiento === "Salida" || tipoMovimiento === "Devolucion") &&
      !form.id_lote
    ) {
      toast.error("Selecciona un lote");
      return;
    }

    setGuardando(true);
    try {
      const url =
        tipoMovimiento === "Entrada"
          ? `${API}/entrada`
          : tipoMovimiento === "Salida"
            ? `${API}/salida`
            : `${API}/devolucion`;

      const body =
        tipoMovimiento === "Entrada"
          ? {
              id_materia: parseInt(form.id_materia),
              cantidad: parseFloat(form.cantidad),
              observacion: form.observacion,
            }
          : {
              id_materia: parseInt(form.id_materia),
              id_lote: parseInt(form.id_lote),
              cantidad: parseFloat(form.cantidad),
              observacion: form.observacion,
            };

      const res = await fetchConAuth(url, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!res) return;
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Error al registrar");
        return;
      }
      toast.success(data.message || "Movimiento registrado correctamente");
      cerrarModal();
      cargarMovimientos();
      cargarMateriasPrimas(); // Fix 1 — recargar materias después de registrar
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // ── Reportes
  const generarReporte = async () => {
    if (!tipoReporte) {
      toast.error("Selecciona un tipo de reporte");
      return;
    }
    if (
      filtroReporte.fecha_inicio &&
      filtroReporte.fecha_fin &&
      filtroReporte.fecha_inicio > filtroReporte.fecha_fin
    ) {
      toast.error(
        "La fecha de inicio no puede ser posterior a la fecha de fin",
      );
      return;
    }
    setCargandoReporte(true);
    try {
      const params = new URLSearchParams();
      if (filtroReporte.fecha_inicio)
        params.append("fecha_inicio", filtroReporte.fecha_inicio);
      if (filtroReporte.fecha_fin)
        params.append("fecha_fin", filtroReporte.fecha_fin);
      if (tipoReporte === "por_tipo_entrada") params.append("tipo", "Entrada");
      if (tipoReporte === "por_tipo_salida") params.append("tipo", "Salida");

      const res = await fetchConAuth(`${API}/filtros?${params}`);
      if (!res) return;
      const data = await res.json();
      setResultadoReporte(Array.isArray(data.data) ? data.data : []);
      setReporteGenerado(true);
    } catch {
      toast.error("Error al generar reporte");
    } finally {
      setCargandoReporte(false);
    }
  };

  const imprimirReporte = () => {
    const tipoLabel =
      {
        mas_gastadas: "Materias Primas Más Gastadas",
        por_tipo_entrada: "Movimientos — Entradas",
        por_tipo_salida: "Movimientos — Salidas",
        resumen: "Resumen Completo de Movimientos",
      }[tipoReporte] || "Informe de Movimientos";

    const fechaDesde = filtroReporte.fecha_inicio || "Sin filtro";
    const fechaHasta = filtroReporte.fecha_fin || "Sin filtro";

    const filas = resultadoReporte
      .map(
        (m) => `
      <tr>
        <td>${new Date(m.fecha).toLocaleDateString("es-CO")}</td>
        <td>${m.tipo_movimiento}</td>
        <td>${m.nombre_materia}</td>
        <td>${m.categoria}</td>
        <td>${m.codigo_lote || "-"}</td>
        <td>${parseFloat(m.cantidad).toFixed(2)} kg</td>
        <td>${m.usuario}</td>
        <td>${m.codigo_orden || "-"}</td>
        <td>${m.observacion || "-"}</td>
      </tr>
    `,
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8"/>
        <title>${tipoLabel}</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; }
          h1 { font-size: 18px; margin-bottom: 4px; }
          .sub { color: #555; margin-bottom: 16px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #1e3a5f; color: white; padding: 8px; text-align: left; font-size: 11px; }
          td { padding: 6px 8px; border-bottom: 1px solid #ddd; font-size: 11px; }
          tr:nth-child(even) { background: #f5f5f5; }
          .sin-datos { text-align: center; padding: 20px; color: #888; }
          @media print { button { display: none; } }
        </style>
      </head>
      <body>
        <h1>${tipoLabel} — Casercon S.A.S</h1>
        <p class="sub">
          Desde: <strong>${fechaDesde}</strong> &nbsp;|&nbsp;
          Hasta: <strong>${fechaHasta}</strong> &nbsp;|&nbsp;
          Total: <strong>${resultadoReporte.length}</strong> registros
        </p>
        <table>
          <thead>
            <tr>
              <th>Fecha</th><th>Tipo</th><th>Materia Prima</th><th>Categoría</th>
              <th>Lote</th><th>Cantidad</th><th>Usuario</th><th>Cód. Orden</th><th>Observación</th>
            </tr>
          </thead>
          <tbody>
            ${
              resultadoReporte.length > 0
                ? filas
                : '<tr><td colspan="9" class="sin-datos">No hay datos para el período seleccionado</td></tr>'
            }
          </tbody>
        </table>
      </body>
      </html>
    `;

    const ventana = window.open("", "_blank");
    ventana.document.write(html);
    ventana.document.close();
    ventana.print();
  };

  // ── Badge tipo movimiento
  const badgeTipo = (tipo) => {
    const cfg = {
      Entrada: {
        cls: "bg-green-100 text-green-700 border-green-200",
        Icon: TrendingUp,
        label: "Entrada",
      },
      Salida: {
        cls: "bg-red-100 text-red-700 border-red-200",
        Icon: TrendingDown,
        label: "Salida",
      },
      Devolucion: {
        cls: "bg-blue-100 text-blue-700 border-blue-200",
        Icon: RefreshCw,
        label: "Devolución",
      },
    }[tipo] ?? {
      cls: "bg-gray-100 text-gray-700 border-gray-200",
      Icon: Package,
      label: tipo,
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}
      >
        <cfg.Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  // ── Guard
  if (!isAdministrador) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <X className="w-12 h-12 text-red-400" />
        <p className="text-gray-600 font-medium">
          No tienes permisos para acceder a este módulo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900 text-2xl">
            Registro de Movimientos
          </h1>
          <p className="text-gray-600 mt-1">
            Entradas, salidas y devoluciones de inventario
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setModalReportes(true);
              setReporteGenerado(false);
              setTipoReporte("");
              setResultadoReporte([]);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
          >
            <BarChart2 className="w-5 h-5" /> Generar Reportes
          </button>
          <button
            onClick={abrirModal}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" /> Registrar Movimiento
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Movimientos</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm text-blue-700 mb-1">Hoy</p>
          <p className="text-2xl font-bold text-blue-700">{stats.hoy}</p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-700 mb-1">Entradas</p>
          <p className="text-2xl font-bold text-green-700">{stats.entradas}</p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-4">
          <p className="text-sm text-red-700 mb-1">Salidas</p>
          <p className="text-2xl font-bold text-red-700">{stats.salidas}</p>
        </div>
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-4">
          <p className="text-sm text-purple-700 mb-1">Devoluciones</p>
          <p className="text-2xl font-bold text-purple-700">
            {stats.devoluciones}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          {["Todos", "Entrada", "Salida", "Devolucion"].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(tipo)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                filtroTipo === tipo
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tipo === "Devolucion"
                ? "Devoluciones"
                : tipo === "Todos"
                  ? "Todos"
                  : tipo + "s"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por materia, lote o usuario..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="py-16 text-center text-gray-500">Cargando...</div>
        ) : movimientosFiltrados.length === 0 ? (
          <div className="py-16 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay movimientos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {[
                    "Fecha",
                    "Tipo",
                    "Materia Prima",
                    "Categoría",
                    "Lote",
                    "Cantidad",
                    "Usuario",
                    "Cód. Orden",
                    "Observación",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {movimientosFiltrados.map((m) => (
                  <tr
                    key={m.id_movimiento}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {new Date(m.fecha).toLocaleDateString("es-CO")}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {badgeTipo(m.tipo_movimiento)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="text-sm font-semibold text-gray-900">
                        {m.nombre_materia}
                      </p>
                      <p className="text-xs text-blue-600">
                        {m.codigo_materia}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {m.categoria}
                    </td>
                    <td className="px-4 py-4 text-sm text-blue-600 font-mono whitespace-nowrap">
                      {m.codigo_lote || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-900 whitespace-nowrap">
                      {parseFloat(m.cantidad).toFixed(2)} kg
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {m.usuario}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                      {m.codigo_orden || "-"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {m.observacion || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Registrar Movimiento */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
              <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-bold text-gray-900 text-xl">
                Registrar Movimiento
              </h2>
              <button
                onClick={cerrarModal}
                className="ml-auto p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Selector tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Movimiento
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      key: "Entrada",
                      icono: <TrendingUp className="w-6 h-6" />,
                      color: "green",
                      label: "Entrada",
                    },
                    {
                      key: "Salida",
                      icono: <TrendingDown className="w-6 h-6" />,
                      color: "red",
                      label: "Salida",
                    },
                    {
                      key: "Devolucion",
                      icono: <RefreshCw className="w-6 h-6" />,
                      color: "blue",
                      label: "Devolución",
                    },
                  ].map(({ key, icono, color, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleTipoChange(key)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        tipoMovimiento === key
                          ? `border-${color}-500 bg-${color}-50`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span
                        className={
                          tipoMovimiento === key
                            ? `text-${color}-600`
                            : "text-gray-400"
                        }
                      >
                        {icono}
                      </span>
                      <span
                        className={`text-sm font-semibold ${tipoMovimiento === key ? `text-${color}-700` : "text-gray-600"}`}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Materia prima + cantidad */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <select
                    value={form.id_materia}
                    onChange={(e) => handleMateriaChange(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Seleccione una materia prima</option>
                    {materiasPrimas.map((mp) => (
                      <option key={mp.id_materia} value={mp.id_materia}>
                        {mp.nombre} — Stock: {mp.stockActual} kg
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.cantidad}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, cantidad: e.target.value }))
                    }
                    placeholder="100"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              {/* Lote (solo salida) */}
{/* Lote (solo salida y devolución) */}
{(tipoMovimiento === "Salida" || tipoMovimiento === "Devolucion") && (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Lote *
    </label>
    <select
      value={form.id_lote}
      onChange={(e) =>
        setForm((prev) => ({ ...prev, id_lote: e.target.value }))
      }
      disabled={!form.id_materia}
      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm disabled:bg-gray-50"
    >
      <option value="">
        {form.id_materia
          ? "Selecciona lote..."
          : "Primero selecciona materia prima"}
      </option>
      {lotes.map((l) => (
        <option key={l.id_lote} value={l.id_lote}>
          {l.codigo_lote} — Disponible:{" "}
          {parseFloat(l.stock_restante).toFixed(2)} kg
        </option>
      ))}
    </select>
    {form.id_materia && lotes.length === 0 && (
      <p className="text-xs text-red-500 mt-1">
        No hay lotes activos para esta materia prima
      </p>
    )}
  </div>
)}

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={form.observacion}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      observacion: e.target.value,
                    }))
                  }
                  placeholder="Detalles adicionales del movimiento..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={guardando}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {guardando ? "Registrando..." : "Registrar Movimiento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Generar Reportes */}
      {modalReportes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
              <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">
                  Generar Reportes de Movimientos
                </h2>
                <p className="text-xs text-gray-500">
                  Seleccione el tipo de reporte y el rango de fechas
                </p>
              </div>
              <button
                onClick={() => setModalReportes(false)}
                className="ml-auto p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Tipo de reporte */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Reporte
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      key: "mas_gastadas",
                      icono: (
                        <TrendingDown className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      ),
                      color: "red",
                      title: "Materias Primas Más Gastadas",
                      desc: "Ranking de materias por cantidad de salidas",
                    },
                    {
                      key: "por_tipo_salida",
                      icono: (
                        <BarChart2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      ),
                      color: "blue",
                      title: "Movimientos por Tipo",
                      desc: "Análisis de entradas, salidas y devoluciones",
                    },
                    {
                      key: "resumen",
                      icono: (
                        <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" />
                      ),
                      color: "green",
                      title: "Resumen Completo",
                      desc: "Vista general con todas las estadísticas",
                    },
                  ].map(({ key, icono, color, title, desc }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTipoReporte(key)}
                      className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                        tipoReporte === key
                          ? `border-${color}-500 bg-${color}-50`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <span
                        className={
                          tipoReporte === key
                            ? `text-${color}-600`
                            : "text-gray-400"
                        }
                      >
                        {icono}
                      </span>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            tipoReporte === key
                              ? `text-${color}-700`
                              : "text-gray-700"
                          }`}
                        >
                          {title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Rango de fechas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Rango de Fechas (Opcional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Fecha Inicio
                    </label>
                    <input
                      type="date"
                      value={filtroReporte.fecha_inicio}
                      onChange={(e) =>
                        setFiltroReporte((prev) => ({
                          ...prev,
                          fecha_inicio: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">
                      Fecha Fin
                    </label>
                    <input
                      type="date"
                      value={filtroReporte.fecha_fin}
                      onChange={(e) =>
                        setFiltroReporte((prev) => ({
                          ...prev,
                          fecha_fin: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Deje las fechas en blanco para incluir todos los movimientos
                </p>
              </div>

              {/* Resultado preview */}
              {reporteGenerado && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-700">
                      {resultadoReporte.length} registro(s) encontrado(s)
                    </span>
                    {resultadoReporte.length > 0 && (
                      <button
                        onClick={imprimirReporte}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors"
                      >
                        <Printer className="w-4 h-4" /> Imprimir / Exportar PDF
                      </button>
                    )}
                  </div>
                  {resultadoReporte.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                      No hay datos para el período y tipo seleccionado
                    </div>
                  ) : (
                    <div className="overflow-x-auto max-h-48">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            {[
                              "Fecha",
                              "Tipo",
                              "Materia Prima",
                              "Cantidad",
                              "Usuario",
                            ].map((col) => (
                              <th
                                key={col}
                                className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {resultadoReporte.map((m) => (
                            <tr
                              key={m.id_movimiento}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap text-xs">
                                {new Date(m.fecha).toLocaleDateString("es-CO")}
                              </td>
                              <td className="px-3 py-2">
                                {badgeTipo(m.tipo_movimiento)}
                              </td>
                              <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap text-xs">
                                {m.nombre_materia}
                              </td>
                              <td className="px-3 py-2 font-medium whitespace-nowrap text-xs">
                                {parseFloat(m.cantidad).toFixed(2)} kg
                              </td>
                              <td className="px-3 py-2 text-gray-600 whitespace-nowrap text-xs">
                                {m.usuario}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={() => setModalReportes(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cerrar
                </button>
                <button
                  onClick={generarReporte}
                  disabled={cargandoReporte || !tipoReporte}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  <BarChart2 className="w-4 h-4" />
                  {cargandoReporte ? "Generando..." : "Generar Reporte"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
