import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  AlertTriangle,
  Truck,
  Factory,
  ClipboardList,
  ArrowLeftRight,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  ArrowLeft,
  Trash2,
  ExternalLink,
  Calendar,
  User,
  Hash,
  Tag,
  ArrowDownToLine,
  ArrowUpFromLine,
  Undo2,
} from "lucide-react";
import API_URL from "../service/api";

// ── Overlay compartido ────────────────────────────────────────────────────────
const overlayStyle = {
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  backgroundColor: "rgba(15, 23, 42, 0.55)",
};

// ── Componente de paginación numérica reutilizable ──────────────────
function Paginacion({ paginaActual, totalPaginas, onCambiar }) {
  if (totalPaginas <= 1) return null;
  const paginas = Array.from({ length: totalPaginas }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-1 mt-4 flex-wrap">
      <button
        onClick={() => onCambiar(paginaActual - 1)}
        disabled={paginaActual === 1}
        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center"
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {paginas.map((n) => (
        <button
          key={n}
          onClick={() => onCambiar(n)}
          className={`min-w-[2.25rem] px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
            n === paginaActual
              ? "bg-blue-600 text-white border-blue-600"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onCambiar(paginaActual + 1)}
        disabled={paginaActual === totalPaginas}
        className="px-3 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed text-sm flex items-center"
        aria-label="Página siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function Movimientos() {
  const { isAdministrador, fetchConAuth } = useAuth();
  const navigate = useNavigate();

  // ── Datos
  const [movimientos, setMovimientos] = useState([]);
  const [materiasPrimas, setMateriasPrimas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);

  // ── Tarjeta expandida
  const [expandedId, setExpandedId] = useState(null);

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
  const [resultadoReporte, setResultadoReporte] = useState(null);
  const [cargandoReporte, setCargandoReporte] = useState(false);
  const [pasoReporte, setPasoReporte] = useState(1);

  // ─── Bloquear scroll del body cuando hay un modal abierto ────────────────
  useEffect(() => {
    const hayModalAbierto = modalAbierto || modalReportes;
    if (hayModalAbierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalAbierto, modalReportes]);

  // ── Carga de datos
  const cargarMovimientos = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/movimientos`);
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
      const res = await fetchConAuth(`${API_URL}/materias-primas`);
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
      const res = await fetchConAuth(
        `${API_URL}/movimientos/lotes/${id_materia}`,
      );
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

  // ── Paginación numérica — aplica a tabs, búsqueda y fechas ───────
  const MOVIMIENTOS_POR_PAGINA = 25;
  const [paginaActual, setPaginaActual] = useState(1);
  const listaRef = useRef(null);

  const cambiarPagina = (nuevaPagina) => {
    setPaginaActual(nuevaPagina);
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 50);
  };

  useEffect(() => {
    setPaginaActual(1);
  }, [busqueda, filtroTipo, fechaInicio, fechaFin]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(movimientosFiltrados.length / MOVIMIENTOS_POR_PAGINA),
  );
  const movimientosVisibles = useMemo(() => {
    const inicio = (paginaActual - 1) * MOVIMIENTOS_POR_PAGINA;
    return movimientosFiltrados.slice(inicio, inicio + MOVIMIENTOS_POR_PAGINA);
  }, [movimientosFiltrados, paginaActual]);

  useEffect(() => {
    if (paginaActual > totalPaginas) setPaginaActual(totalPaginas);
  }, [totalPaginas, paginaActual]);

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
    cargarMateriasPrimas();
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setLotes([]);
  };

  const handleMateriaChange = (id_materia) => {
    setForm((prev) => ({ ...prev, id_materia, id_lote: "" }));
    if (tipoMovimiento === "Salida" || tipoMovimiento === "Devolucion")
      cargarLotes(id_materia);
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
          ? `${API_URL}/movimientos/entrada`
          : tipoMovimiento === "Salida"
            ? `${API_URL}/movimientos/salida`
            : `${API_URL}/movimientos/devolucion`;

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
      cargarMateriasPrimas();
    } catch {
      toast.error("Error de conexión");
    } finally {
      setGuardando(false);
    }
  };

  // ── Reportes config
  const REPORTES_CONFIG = [
    {
      key: "inventario",
      icono: <Package className="w-5 h-5 mt-0.5 flex-shrink-0" />,
      color: "blue",
      title: "Estado de Inventario",
      desc: "Stock actual, niveles críticos y cobertura por materia prima",
      sinFechas: true,
    },
    {
      key: "consumo",
      icono: <TrendingDown className="w-5 h-5 mt-0.5 flex-shrink-0" />,
      color: "red",
      title: "Consumo por Materia Prima",
      desc: "Ranking de materias más gastadas con promedio y tendencia",
    },
    {
      key: "balance",
      icono: <ArrowLeftRight className="w-5 h-5 mt-0.5 flex-shrink-0" />,
      color: "purple",
      title: "Entradas vs Salidas",
      desc: "Balance neto por categoría: ¿se repone lo que se consume?",
    },
    {
      key: "proveedores",
      icono: <Truck className="w-5 h-5 mt-0.5 flex-shrink-0" />,
      color: "yellow",
      title: "Actividad por Proveedor",
      desc: "Órdenes, KG recibidos, devoluciones y % de problemas",
    },
    {
      key: "produccion",
      icono: <Factory className="w-5 h-5 mt-0.5 flex-shrink-0" />,
      color: "green",
      title: "Rendimiento de Producción",
      desc: "Órdenes completadas, KG producidos y tiempos operativos",
    },
    {
      key: "ejecutivo",
      icono: <ClipboardList className="w-5 h-5 mt-0.5 flex-shrink-0" />,
      color: "blue",
      title: "Reporte Ejecutivo General",
      desc: "Combina inventario + balance + consumo + producción + proveedores",
    },
  ];

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
      const res = await fetchConAuth(
        `${API_URL}/reportes/${tipoReporte}?${params}`,
      );
      if (!res) return;
      const data = await res.json();
      setResultadoReporte(data.data);
      setPasoReporte(2);
    } catch {
      toast.error("Error al generar reporte");
    } finally {
      setCargandoReporte(false);
    }
  };

  const abrirModalReportes = () => {
    setModalReportes(true);
    setPasoReporte(1);
    setTipoReporte("");
    setResultadoReporte(null);
    setFiltroReporte({ fecha_inicio: "", fecha_fin: "" });
  };

  const volverPaso1 = () => {
    setPasoReporte(1);
    setResultadoReporte(null);
  };

  const getResumenReporte = () => {
    if (!resultadoReporte) return null;
    const cfg = REPORTES_CONFIG.find((r) => r.key === tipoReporte);
    const titulo = cfg?.title || "Reporte";
    if (tipoReporte === "ejecutivo")
      return { titulo, registros: "Reporte combinado", esEjecutivo: true };
    const arr = Array.isArray(resultadoReporte) ? resultadoReporte : [];
    return { titulo, registros: arr.length };
  };

  // ── Preview tabla resultado
  const renderPreviewTabla = () => {
    if (!resultadoReporte) return null;
    const datos = Array.isArray(resultadoReporte) ? resultadoReporte : [];

    if (tipoReporte === "inventario") {
      const criticos = datos.filter((m) => m.estado_stock === "Critico");
      const bajos = datos.filter((m) => m.estado_stock === "Bajo");
      const suficientes = datos.filter((m) => m.estado_stock === "Suficiente");
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-700">
                {criticos.length}
              </p>
              <p className="text-xs text-red-600">Críticos</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-700">
                {bajos.length}
              </p>
              <p className="text-xs text-yellow-600">Bajos</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">
                {suficientes.length}
              </p>
              <p className="text-xs text-green-600">Suficientes</p>
            </div>
          </div>
          {criticos.length > 0 && (
            <div className="border border-red-200 rounded-lg overflow-hidden">
              <div className="bg-red-50 px-3 py-2 border-b border-red-200">
                <p className="text-xs font-semibold text-red-700">
                  ⚠️ Materias en estado CRÍTICO
                </p>
              </div>
              <div className="max-h-32 overflow-y-auto">
                {criticos.map((m) => (
                  <div
                    key={m.id_materia}
                    className="flex justify-between px-3 py-1.5 text-xs border-b border-red-100 last:border-0"
                  >
                    <span className="text-gray-800 font-medium">
                      {m.nombre}
                    </span>
                    <span className="text-red-700 font-bold">
                      {m.stock_actual} / {m.stock_min} KG
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (tipoReporte === "consumo") {
      const top5 = datos.slice(0, 5);
      return (
        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-500">
            Top 5 materias más consumidas
          </p>
          {top5.map((m, i) => (
            <div
              key={m.id_materia}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
            >
              <span className="w-6 h-6 bg-red-100 text-red-700 rounded-full flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {m.nombre}
                </p>
                <p className="text-xs text-gray-500">
                  {m.total_movimientos} movimientos
                </p>
              </div>
              <span className="text-xs font-bold text-red-700">
                {Number(m.total_consumido).toFixed(1)} KG
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (tipoReporte === "balance") {
      const totalEntradas = datos.reduce(
        (s, b) => s + Number(b.total_entradas),
        0,
      );
      const totalSalidas = datos.reduce(
        (s, b) => s + Number(b.total_salidas),
        0,
      );
      const balanceNeto = datos.reduce((s, b) => s + Number(b.balance_neto), 0);
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-green-700">
                {totalEntradas.toFixed(0)}
              </p>
              <p className="text-xs text-green-600">KG Entradas</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-red-700">
                {totalSalidas.toFixed(0)}
              </p>
              <p className="text-xs text-red-600">KG Salidas</p>
            </div>
            <div
              className={`border rounded-lg p-3 text-center ${balanceNeto >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}
            >
              <p
                className={`text-lg font-bold ${balanceNeto >= 0 ? "text-blue-700" : "text-orange-700"}`}
              >
                {balanceNeto >= 0 ? "+" : ""}
                {balanceNeto.toFixed(0)}
              </p>
              <p
                className={`text-xs ${balanceNeto >= 0 ? "text-blue-600" : "text-orange-600"}`}
              >
                Balance Neto
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (tipoReporte === "proveedores") {
      return (
        <div className="space-y-2">
          {datos.slice(0, 4).map((p) => (
            <div
              key={p.id_proveedor}
              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-900 truncate">
                  {p.nombre_proveedor}
                  {p.nombre_empresa ? ` — ${p.nombre_empresa}` : ""}
                </p>
                <p className="text-xs text-gray-500">
                  {p.total_ordenes} órdenes ·{" "}
                  {Number(p.total_kg_solicitado).toFixed(0)} KG
                </p>
              </div>
              {Number(p.porcentaje_devolucion) > 0 && (
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
                  {p.porcentaje_devolucion}% devol.
                </span>
              )}
            </div>
          ))}
        </div>
      );
    }

    if (tipoReporte === "produccion") {
      const completadas = datos.filter((p) => p.estado === "Completada").length;
      const pendientes = datos.filter((p) => p.estado === "Pendiente").length;
      const enProceso = datos.filter((p) => p.estado === "En proceso").length;
      const totalKg = datos
        .filter((p) => p.estado === "Completada")
        .reduce((s, p) => s + Number(p.cantidad_producir), 0);
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{completadas}</p>
            <p className="text-xs text-green-600">Completadas</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">
              {totalKg.toFixed(0)}
            </p>
            <p className="text-xs text-blue-600">KG Producidos</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-700">{pendientes}</p>
            <p className="text-xs text-yellow-600">Pendientes</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-purple-700">{enProceso}</p>
            <p className="text-xs text-purple-600">En Proceso</p>
          </div>
        </div>
      );
    }

    if (tipoReporte === "ejecutivo") {
      const r = resultadoReporte;
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-600 mb-1">Inventario Crítico</p>
              <p className="text-xl font-bold text-red-700">
                {r.resumenInventario?.criticos || 0} materias
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-600 mb-1">Balance Neto</p>
              <p className="text-xl font-bold text-blue-700">
                {(r.resumenBalance?.balance_neto || 0).toFixed(0)} KG
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-600 mb-1">Producción</p>
              <p className="text-xl font-bold text-green-700">
                {r.resumenProduccion?.completadas || 0} completadas
              </p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-600 mb-1">Proveedores</p>
              <p className="text-xl font-bold text-yellow-700">
                {r.proveedores?.length || 0} activos
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <p className="text-sm text-gray-500 text-center py-4">
        Sin datos disponibles
      </p>
    );
  };

  // ── IMPRIMIR REPORTE (sin cambios)
  const imprimirReporte = () => {
    if (!resultadoReporte) return;
    const cfg = REPORTES_CONFIG.find((r) => r.key === tipoReporte);
    const titulo = cfg?.title || "Reporte";
    const fechaDesde = filtroReporte.fecha_inicio
      ? new Date(filtroReporte.fecha_inicio + "T00:00:00").toLocaleDateString(
          "es-CO",
          { year: "numeric", month: "long", day: "numeric" },
        )
      : "Sin filtro";
    const fechaHasta = filtroReporte.fecha_fin
      ? new Date(filtroReporte.fecha_fin + "T00:00:00").toLocaleDateString(
          "es-CO",
          { year: "numeric", month: "long", day: "numeric" },
        )
      : "Sin filtro";

    const estilosBase = `
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:Arial,sans-serif;padding:20px;max-width:1100px;margin:0 auto;color:#111827;font-size:12px;}
      .header{text-align:center;margin-bottom:24px;border-bottom:3px solid #FDD835;padding-bottom:16px;}
      .header h1{color:#2d3748;font-size:26px;margin-bottom:4px;}
      .header h2{color:#1e40af;font-size:16px;font-weight:normal;}
      .section-title{background:#FDD835;color:#2d3748;padding:8px 12px;margin:16px 0 10px;font-size:13px;font-weight:bold;border-radius:4px;}
      .info-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;}
      .info-item{padding:8px 12px;background:#f9fafb;border-left:4px solid #FDD835;border-radius:2px;}
      .info-item label{font-size:10px;color:#6b7280;display:block;margin-bottom:2px;text-transform:uppercase;letter-spacing:.5px;}
      .info-item span{font-size:13px;font-weight:600;color:#1f2937;}
      .stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;}
      .stat-box{padding:12px;border-radius:6px;text-align:center;border:1px solid #e5e7eb;}
      .stat-box .num{font-size:22px;font-weight:bold;display:block;}
      .stat-box .lbl{font-size:10px;display:block;margin-top:2px;}
      table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:11px;}
      thead tr{background:#1e40af;color:white;}
      thead th{padding:8px 10px;text-align:left;font-size:10px;text-transform:uppercase;}
      tbody td{padding:6px 10px;border-bottom:1px solid #e5e7eb;}
      tbody tr:nth-child(even){background:#f9fafb;}
      .total-row{background:#FDD835 !important;font-weight:bold;}
      .total-row td{padding:8px 10px;color:#1f2937;}
      .badge{padding:2px 8px;border-radius:10px;font-size:10px;font-weight:600;}
      .badge-critico{background:#fee2e2;color:#dc2626;}
      .badge-bajo{background:#fef9c3;color:#a16207;}
      .badge-suficiente{background:#dcfce7;color:#15803d;}
      .badge-entrada{background:#dcfce7;color:#15803d;}
      .badge-salida{background:#fee2e2;color:#dc2626;}
      .badge-devolucion{background:#dbeafe;color:#1d4ed8;}
      .badge-completada{background:#dcfce7;color:#15803d;}
      .badge-pendiente{background:#fef9c3;color:#a16207;}
      .badge-enproceso{background:#dbeafe;color:#1d4ed8;}
      .firma{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:50px;}
      .firma div{border-top:2px solid #9ca3af;padding-top:8px;text-align:center;font-size:12px;color:#6b7280;}
      .footer{text-align:center;margin-top:24px;padding-top:12px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:10px;}
      .print-btn{position:fixed;top:20px;right:20px;padding:10px 22px;background:#1e40af;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:bold;display:flex;align-items:center;gap:8px;z-index:100;}
      .print-btn:hover{background:#1e3a8a;}
      .alerta{padding:10px;border-radius:6px;margin-bottom:12px;font-size:11px;}
      .alerta-rojo{background:#fef2f2;border:1px solid #fecaca;color:#991b1b;}
      @media print{.print-btn{display:none;} body{padding:10px;}}
    `;

    let cuerpoHTML = "";

    if (tipoReporte === "inventario") {
      const datos = resultadoReporte;
      const criticos = datos.filter((m) => m.estado_stock === "Critico");
      const bajos = datos.filter((m) => m.estado_stock === "Bajo");
      const suficientes = datos.filter((m) => m.estado_stock === "Suficiente");
      const totalKg = datos.reduce((s, m) => s + Number(m.stock_actual), 0);
      cuerpoHTML = `
        <div class="stat-grid">
          <div class="stat-box" style="background:#fef2f2;border-color:#fecaca;"><span class="num" style="color:#dc2626;">${criticos.length}</span><span class="lbl" style="color:#dc2626;">Críticos</span></div>
          <div class="stat-box" style="background:#fefce8;border-color:#fde68a;"><span class="num" style="color:#a16207;">${bajos.length}</span><span class="lbl" style="color:#a16207;">Bajos</span></div>
          <div class="stat-box" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="num" style="color:#15803d;">${suficientes.length}</span><span class="lbl" style="color:#15803d;">Suficientes</span></div>
          <div class="stat-box" style="background:#eff6ff;border-color:#bfdbfe;"><span class="num" style="color:#1d4ed8;">${totalKg.toFixed(0)}</span><span class="lbl" style="color:#1d4ed8;">KG Total</span></div>
        </div>
        ${criticos.length > 0 ? `<div class="alerta alerta-rojo">⚠️ <strong>${criticos.length} materia(s) en estado CRÍTICO</strong> requieren reabastecimiento inmediato.</div>` : ""}
        <div class="section-title">Detalle de Inventario por Materia Prima</div>
        <table>
          <thead><tr><th>#</th><th>Materia Prima</th><th>Código</th><th>Categoría</th><th style="text-align:center">Stock Mín.</th><th style="text-align:center">Stock Actual</th><th style="text-align:center">Cobertura</th><th>Estado</th></tr></thead>
          <tbody>
            ${datos.map((m, i) => `<tr><td>${i + 1}</td><td style="font-weight:600;">${m.nombre}</td><td style="font-family:monospace;">${m.abreviacion}</td><td>${m.categoria}</td><td style="text-align:center;">${Number(m.stock_min).toFixed(0)} KG</td><td style="text-align:center;font-weight:bold;">${Number(m.stock_actual).toFixed(2)} KG</td><td style="text-align:center;">${m.porcentaje_cobertura}%</td><td><span class="badge badge-${m.estado_stock.toLowerCase()}">${m.estado_stock}</span></td></tr>`).join("")}
            <tr class="total-row"><td colspan="4">TOTAL (${datos.length} materias)</td><td style="text-align:center;">${datos.reduce((s, m) => s + Number(m.stock_min), 0).toFixed(0)} KG</td><td style="text-align:center;">${totalKg.toFixed(2)} KG</td><td colspan="2">—</td></tr>
          </tbody>
        </table>`;
    }

    if (tipoReporte === "consumo") {
      const datos = resultadoReporte;
      const totalKg = datos.reduce((s, m) => s + Number(m.total_consumido), 0);
      cuerpoHTML = `
        <div class="section-title">Ranking de Consumo de Materias Primas</div>
        <table>
          <thead><tr><th>#</th><th>Materia Prima</th><th>Categoría</th><th style="text-align:center">Movimientos</th><th style="text-align:center">Total Consumido</th><th style="text-align:center">Promedio/Mov.</th><th>Primera Salida</th><th>Última Salida</th></tr></thead>
          <tbody>
            ${datos.map((m, i) => `<tr><td style="font-weight:bold;">${i + 1}</td><td style="font-weight:600;">${m.nombre}</td><td>${m.categoria}</td><td style="text-align:center;">${m.total_movimientos}</td><td style="text-align:center;font-weight:bold;color:#dc2626;">${Number(m.total_consumido).toFixed(2)} KG</td><td style="text-align:center;">${Number(m.promedio_por_movimiento).toFixed(2)} KG</td><td>${m.primera_salida ? new Date(m.primera_salida).toLocaleDateString("es-CO") : "—"}</td><td>${m.ultima_salida ? new Date(m.ultima_salida).toLocaleDateString("es-CO") : "—"}</td></tr>`).join("")}
            <tr class="total-row"><td colspan="3">TOTAL (${datos.length} materias)</td><td style="text-align:center;">${datos.reduce((s, m) => s + Number(m.total_movimientos), 0)}</td><td style="text-align:center;">${totalKg.toFixed(2)} KG</td><td colspan="3">—</td></tr>
          </tbody>
        </table>`;
    }

    if (tipoReporte === "balance") {
      const datos = resultadoReporte;
      const tE = datos.reduce((s, b) => s + Number(b.total_entradas), 0);
      const tS = datos.reduce((s, b) => s + Number(b.total_salidas), 0);
      const tD = datos.reduce((s, b) => s + Number(b.total_devoluciones), 0);
      const tB = datos.reduce((s, b) => s + Number(b.balance_neto), 0);
      cuerpoHTML = `
        <div class="stat-grid">
          <div class="stat-box" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="num" style="color:#15803d;">${tE.toFixed(0)}</span><span class="lbl" style="color:#15803d;">KG Entradas</span></div>
          <div class="stat-box" style="background:#fef2f2;border-color:#fecaca;"><span class="num" style="color:#dc2626;">${tS.toFixed(0)}</span><span class="lbl" style="color:#dc2626;">KG Salidas</span></div>
          <div class="stat-box" style="background:#eff6ff;border-color:#bfdbfe;"><span class="num" style="color:#1d4ed8;">${tD.toFixed(0)}</span><span class="lbl" style="color:#1d4ed8;">KG Devoluciones</span></div>
          <div class="stat-box" style="background:${tB >= 0 ? "#f0fdf4" : "#fff7ed"};border-color:${tB >= 0 ? "#bbf7d0" : "#fed7aa"};"><span class="num" style="color:${tB >= 0 ? "#15803d" : "#c2410c"};">${tB >= 0 ? "+" : ""}${tB.toFixed(0)}</span><span class="lbl" style="color:${tB >= 0 ? "#15803d" : "#c2410c"};">Balance Neto KG</span></div>
        </div>
        ${tB < 0 ? `<div class="alerta alerta-rojo">⚠️ <strong>Balance negativo:</strong> se está consumiendo ${Math.abs(tB).toFixed(0)} KG más de lo que entra.</div>` : ""}
        <div class="section-title">Balance por Categoría de Materia Prima</div>
        <table>
          <thead><tr><th>Categoría</th><th style="text-align:center">Entradas (KG)</th><th style="text-align:center">Salidas (KG)</th><th style="text-align:center">Devoluciones (KG)</th><th style="text-align:center">Balance Neto</th><th style="text-align:center">Movimientos</th></tr></thead>
          <tbody>
            ${datos.map((b) => `<tr><td style="font-weight:600;">${b.categoria}</td><td style="text-align:center;color:#15803d;">${Number(b.total_entradas).toFixed(2)}</td><td style="text-align:center;color:#dc2626;">${Number(b.total_salidas).toFixed(2)}</td><td style="text-align:center;color:#1d4ed8;">${Number(b.total_devoluciones).toFixed(2)}</td><td style="text-align:center;font-weight:bold;color:${Number(b.balance_neto) >= 0 ? "#15803d" : "#c2410c"};">${Number(b.balance_neto) >= 0 ? "+" : ""}${Number(b.balance_neto).toFixed(2)}</td><td style="text-align:center;">${b.total_movimientos}</td></tr>`).join("")}
            <tr class="total-row"><td>TOTAL</td><td style="text-align:center;">${tE.toFixed(2)}</td><td style="text-align:center;">${tS.toFixed(2)}</td><td style="text-align:center;">${tD.toFixed(2)}</td><td style="text-align:center;">${tB >= 0 ? "+" : ""}${tB.toFixed(2)}</td><td style="text-align:center;">${datos.reduce((s, b) => s + Number(b.total_movimientos), 0)}</td></tr>
          </tbody>
        </table>`;
    }

    if (tipoReporte === "proveedores") {
      const datos = resultadoReporte;
      cuerpoHTML = `
        <div class="section-title">Actividad por Proveedor</div>
        <table>
          <thead><tr><th>Proveedor</th><th>Empresa</th><th style="text-align:center">Órdenes</th><th style="text-align:center">Recibidas</th><th style="text-align:center">Pendientes</th><th style="text-align:center">KG Solicitados</th><th style="text-align:center">Devoluciones</th><th style="text-align:center">KG Devueltos</th><th style="text-align:center">% Devol.</th></tr></thead>
          <tbody>
            ${datos.map((p) => `<tr><td style="font-weight:600;">${p.nombre_proveedor}</td><td>${p.nombre_empresa || "—"}</td><td style="text-align:center;">${p.total_ordenes}</td><td style="text-align:center;color:#15803d;">${p.ordenes_recibidas}</td><td style="text-align:center;color:#a16207;">${p.ordenes_pendientes}</td><td style="text-align:center;font-weight:bold;">${Number(p.total_kg_solicitado).toFixed(2)}</td><td style="text-align:center;color:#dc2626;">${p.total_devoluciones}</td><td style="text-align:center;color:#dc2626;">${Number(p.total_kg_devuelto).toFixed(2)}</td><td style="text-align:center;font-weight:bold;color:${Number(p.porcentaje_devolucion) > 10 ? "#dc2626" : Number(p.porcentaje_devolucion) > 0 ? "#a16207" : "#15803d"};">${p.porcentaje_devolucion}%</td></tr>`).join("")}
          </tbody>
        </table>`;
    }

    if (tipoReporte === "produccion") {
      const datos = resultadoReporte;
      const completadas = datos.filter((p) => p.estado === "Completada");
      const totalKg = completadas.reduce(
        (s, p) => s + Number(p.cantidad_producir),
        0,
      );
      cuerpoHTML = `
        <div class="stat-grid">
          <div class="stat-box" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="num" style="color:#15803d;">${completadas.length}</span><span class="lbl" style="color:#15803d;">Completadas</span></div>
          <div class="stat-box" style="background:#eff6ff;border-color:#bfdbfe;"><span class="num" style="color:#1d4ed8;">${datos.filter((p) => p.estado === "En proceso").length}</span><span class="lbl" style="color:#1d4ed8;">En Proceso</span></div>
          <div class="stat-box" style="background:#fefce8;border-color:#fde68a;"><span class="num" style="color:#a16207;">${datos.filter((p) => p.estado === "Pendiente").length}</span><span class="lbl" style="color:#a16207;">Pendientes</span></div>
          <div class="stat-box" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="num" style="color:#15803d;">${totalKg.toFixed(0)}</span><span class="lbl" style="color:#15803d;">KG Producidos</span></div>
        </div>
        <div class="section-title">Detalle de Órdenes de Producción</div>
        <table>
          <thead><tr><th>Código</th><th>Receta</th><th style="text-align:center">KG</th><th>Estado</th><th>Creado por</th><th>Operario</th><th>Fecha Creación</th><th>Fecha Fin</th><th style="text-align:center">Horas</th></tr></thead>
          <tbody>
            ${datos.map((p) => `<tr><td style="font-family:monospace;font-weight:bold;">${p.codigo_orden || "—"}</td><td style="font-weight:600;">${p.nombre_producto}</td><td style="text-align:center;font-weight:bold;">${Number(p.cantidad_producir).toFixed(2)}</td><td><span class="badge badge-${p.estado === "Completada" ? "completada" : p.estado === "Pendiente" ? "pendiente" : "enproceso"}">${p.estado}</span></td><td>${p.usuario_creador}</td><td>${p.usuario_fin || p.usuario_inicio || "—"}</td><td>${new Date(p.fecha_creacion).toLocaleDateString("es-CO")}</td><td>${p.fecha_finalizacion ? new Date(p.fecha_finalizacion).toLocaleDateString("es-CO") : "—"}</td><td style="text-align:center;">${p.horas_produccion != null ? p.horas_produccion + "h" : "—"}</td></tr>`).join("")}
            <tr class="total-row"><td colspan="2">TOTAL (${datos.length} órdenes)</td><td style="text-align:center;">${datos.reduce((s, p) => s + Number(p.cantidad_producir), 0).toFixed(2)} KG</td><td colspan="6">—</td></tr>
          </tbody>
        </table>`;
    }

    if (tipoReporte === "ejecutivo") {
      const r = resultadoReporte;
      const ri = r.resumenInventario;
      const rb = r.resumenBalance;
      const rp = r.resumenProduccion;
      cuerpoHTML = `
        <div class="section-title">1. Resumen de Inventario</div>
        <div class="stat-grid">
          <div class="stat-box" style="background:#fef2f2;border-color:#fecaca;"><span class="num" style="color:#dc2626;">${ri.criticos}</span><span class="lbl" style="color:#dc2626;">Críticos</span></div>
          <div class="stat-box" style="background:#fefce8;border-color:#fde68a;"><span class="num" style="color:#a16207;">${ri.bajos}</span><span class="lbl" style="color:#a16207;">Bajos</span></div>
          <div class="stat-box" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="num" style="color:#15803d;">${ri.suficientes}</span><span class="lbl" style="color:#15803d;">Suficientes</span></div>
          <div class="stat-box" style="background:#eff6ff;border-color:#bfdbfe;"><span class="num" style="color:#1d4ed8;">${ri.total_kg.toFixed(0)}</span><span class="lbl" style="color:#1d4ed8;">KG Total</span></div>
        </div>
        ${ri.criticos > 0 ? `<div class="alerta alerta-rojo">⚠️ <strong>${ri.criticos} materia(s) en estado CRÍTICO</strong></div>` : ""}
        ${r.inventarioCriticos.length > 0 ? `<table><thead><tr><th>Materia Crítica</th><th style="text-align:center">Stock Actual</th><th style="text-align:center">Stock Mínimo</th><th style="text-align:center">Cobertura</th></tr></thead><tbody>${r.inventarioCriticos.map((m) => `<tr><td style="font-weight:600;">${m.nombre}</td><td style="text-align:center;color:#dc2626;font-weight:bold;">${Number(m.stock_actual).toFixed(2)} KG</td><td style="text-align:center;">${Number(m.stock_min).toFixed(0)} KG</td><td style="text-align:center;">${m.porcentaje_cobertura}%</td></tr>`).join("")}</tbody></table>` : ""}
        <div class="section-title">2. Balance de Inventario</div>
        <div class="stat-grid">
          <div class="stat-box" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="num" style="color:#15803d;">${rb.total_entradas.toFixed(0)}</span><span class="lbl" style="color:#15803d;">KG Entradas</span></div>
          <div class="stat-box" style="background:#fef2f2;border-color:#fecaca;"><span class="num" style="color:#dc2626;">${rb.total_salidas.toFixed(0)}</span><span class="lbl" style="color:#dc2626;">KG Salidas</span></div>
          <div class="stat-box" style="background:#eff6ff;border-color:#bfdbfe;"><span class="num" style="color:#1d4ed8;">${rb.total_devoluciones.toFixed(0)}</span><span class="lbl" style="color:#1d4ed8;">KG Devoluciones</span></div>
          <div class="stat-box" style="background:${rb.balance_neto >= 0 ? "#f0fdf4" : "#fff7ed"};border-color:${rb.balance_neto >= 0 ? "#bbf7d0" : "#fed7aa"};"><span class="num" style="color:${rb.balance_neto >= 0 ? "#15803d" : "#c2410c"};">${rb.balance_neto >= 0 ? "+" : ""}${rb.balance_neto.toFixed(0)}</span><span class="lbl" style="color:${rb.balance_neto >= 0 ? "#15803d" : "#c2410c"};">Balance Neto</span></div>
        </div>
        <table><thead><tr><th>Categoría</th><th style="text-align:center">Entradas</th><th style="text-align:center">Salidas</th><th style="text-align:center">Balance</th></tr></thead><tbody>${r.balancePorCategoria.map((b) => `<tr><td>${b.categoria}</td><td style="text-align:center;color:#15803d;">${Number(b.total_entradas).toFixed(0)}</td><td style="text-align:center;color:#dc2626;">${Number(b.total_salidas).toFixed(0)}</td><td style="text-align:center;font-weight:bold;color:${Number(b.balance_neto) >= 0 ? "#15803d" : "#c2410c"};">${Number(b.balance_neto) >= 0 ? "+" : ""}${Number(b.balance_neto).toFixed(0)}</td></tr>`).join("")}</tbody></table>
        <div class="section-title">3. Top 10 — Materias Más Consumidas</div>
        <table><thead><tr><th>#</th><th>Materia Prima</th><th style="text-align:center">Movimientos</th><th style="text-align:center">Total Consumido</th><th style="text-align:center">Promedio/Mov.</th></tr></thead><tbody>${r.top10Consumo.map((m, i) => `<tr><td style="font-weight:bold;">${i + 1}</td><td style="font-weight:600;">${m.nombre}</td><td style="text-align:center;">${m.total_movimientos}</td><td style="text-align:center;font-weight:bold;color:#dc2626;">${Number(m.total_consumido).toFixed(2)} KG</td><td style="text-align:center;">${Number(m.promedio_por_movimiento).toFixed(2)} KG</td></tr>`).join("")}</tbody></table>
        <div class="section-title">4. Producción</div>
        <div class="stat-grid">
          <div class="stat-box" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="num" style="color:#15803d;">${rp.completadas}</span><span class="lbl" style="color:#15803d;">Completadas</span></div>
          <div class="stat-box" style="background:#eff6ff;border-color:#bfdbfe;"><span class="num" style="color:#1d4ed8;">${rp.en_proceso}</span><span class="lbl" style="color:#1d4ed8;">En Proceso</span></div>
          <div class="stat-box" style="background:#fefce8;border-color:#fde68a;"><span class="num" style="color:#a16207;">${rp.pendientes}</span><span class="lbl" style="color:#a16207;">Pendientes</span></div>
          <div class="stat-box" style="background:#f0fdf4;border-color:#bbf7d0;"><span class="num" style="color:#15803d;">${rp.total_kg_producidos.toFixed(0)}</span><span class="lbl" style="color:#15803d;">KG Producidos</span></div>
        </div>
        <div class="section-title">5. Actividad de Proveedores</div>
        <table><thead><tr><th>Proveedor</th><th>Empresa</th><th style="text-align:center">Órdenes</th><th style="text-align:center">KG Solicit.</th><th style="text-align:center">KG Devueltos</th><th style="text-align:center">% Devol.</th></tr></thead><tbody>${r.proveedores.map((p) => `<tr><td style="font-weight:600;">${p.nombre_proveedor}</td><td>${p.nombre_empresa || "—"}</td><td style="text-align:center;">${p.total_ordenes}</td><td style="text-align:center;font-weight:bold;">${Number(p.total_kg_solicitado).toFixed(0)}</td><td style="text-align:center;color:#dc2626;">${Number(p.total_kg_devuelto).toFixed(0)}</td><td style="text-align:center;font-weight:bold;color:${Number(p.porcentaje_devolucion) > 10 ? "#dc2626" : "#15803d"};">${p.porcentaje_devolucion}%</td></tr>`).join("")}</tbody></table>
      `;
    }

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>${titulo} — CASERCON S.A.S</title><style>${estilosBase}</style></head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ Imprimir</button>
        <div class="header"><h1>CASERCON S.A.S</h1><h2>${titulo}</h2></div>
        <div class="section-title">Información del Reporte</div>
        <div class="info-grid">
          <div class="info-item"><label>Tipo de Reporte</label><span>${titulo}</span></div>
          <div class="info-item"><label>Desde</label><span>${fechaDesde}</span></div>
          <div class="info-item"><label>Hasta</label><span>${fechaHasta}</span></div>
        </div>
        ${cuerpoHTML}
        <div class="firma"><div>Firma Operario / Receptor</div><div>Firma Administrador</div></div>
        <div class="footer"><p>CASERCON S.A.S — Fabricante de Pinturas</p><p>Impreso el ${new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p></div>
      </body></html>`;

    const ventana = window.open("", "_blank");
    if (!ventana) return;
    ventana.document.write(html);
    ventana.document.close();
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-gray-900 text-xl sm:text-2xl">
            Registro de Movimientos
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Entradas, salidas y devoluciones de inventario
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
          <button
            onClick={abrirModalReportes}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium text-sm"
          >
            <BarChart2 className="w-4 h-4 sm:w-5 sm:h-5" /> Generar Reportes
          </button>
          <button
            onClick={abrirModal}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Registrar Movimiento
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {stats.total}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-blue-700 mb-1">Hoy</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-700">
            {stats.hoy}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-green-700 mb-1">Entradas</p>
          <p className="text-xl sm:text-2xl font-bold text-green-700">
            {stats.entradas}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-red-700 mb-1">Salidas</p>
          <p className="text-xl sm:text-2xl font-bold text-red-700">
            {stats.salidas}
          </p>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-purple-50 rounded-lg border border-purple-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-purple-700 mb-1">
            Devoluciones
          </p>
          <p className="text-xl sm:text-2xl font-bold text-purple-700">
            {stats.devoluciones}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {["Todos", "Entrada", "Salida", "Devolucion"].map((tipo) => (
            <button
              key={tipo}
              onClick={() => setFiltroTipo(tipo)}
              className={`flex-shrink-0 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm font-medium transition-all ${
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Materia, lote o usuario..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
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

      {/* Ancla para scroll al cambiar de página */}
      <div ref={listaRef} className="scroll-mt-4" />

      {/* ── Lista de movimientos — tarjetas expandibles (unificado desktop + móvil) ── */}
      <div className="space-y-3">
        {cargando ? (
          <div className="bg-white rounded-lg border border-gray-200 px-6 py-16 text-center text-gray-500">
            Cargando...
          </div>
        ) : movimientosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 px-6 py-16 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No hay movimientos registrados</p>
          </div>
        ) : (
          movimientosVisibles.map((m) => {
            const isExpanded = expandedId === m.id_movimiento;
            const tipoConfig = {
              Entrada: {
                bg: "bg-green-100",
                iconColor: "text-green-600",
                Icon: ArrowDownToLine,
              },
              Salida: {
                bg: "bg-red-100",
                iconColor: "text-red-600",
                Icon: ArrowUpFromLine,
              },
              Devolucion: {
                bg: "bg-blue-100",
                iconColor: "text-blue-600",
                Icon: Undo2,
              },
            }[m.tipo_movimiento] ?? {
              bg: "bg-gray-100",
              iconColor: "text-gray-500",
              Icon: Package,
            };

            // Determinar botón de acción según el tipo de movimiento
            let actionButton = null;
            if (
              m.tipo_movimiento === "Entrada" &&
              m.id_pedido &&
              m.tipo_pedido === "compra"
            ) {
              actionButton = {
                label: "Ver Recepción",
                color: "bg-yellow-400 hover:bg-yellow-500 text-gray-900",
                onClick: (e) => {
                  e.stopPropagation();
                  navigate(`/pedidos?id=${m.id_pedido}`);
                },
              };
            } else if (m.tipo_movimiento === "Devolucion" && m.id_pedido) {
              actionButton = {
                label: "Ver Devolución",
                color: "bg-blue-500 hover:bg-blue-600 text-white",
                onClick: (e) => {
                  e.stopPropagation();
                  navigate(`/pedidos?id=${m.id_pedido}`);
                },
              };
            } else if (
              m.tipo_movimiento === "Salida" &&
              m.id_orden_produccion
            ) {
              actionButton = {
                label: "Ver Producción",
                color: "bg-green-500 hover:bg-green-600 text-white",
                onClick: (e) => {
                  e.stopPropagation();
                  navigate(`/produccion?id=${m.id_orden_produccion}`);
                },
              };
            }

            return (
              <div
                key={m.id_movimiento}
                onClick={() =>
                  setExpandedId(isExpanded ? null : m.id_movimiento)
                }
                className={`bg-white rounded-lg border ${isExpanded ? "border-blue-300 ring-1 ring-blue-100" : "border-gray-200"} shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden`}
              >
                {/* ── Vista colapsada (siempre visible) ───────────────────────── */}
                <div className="p-4 flex items-start gap-3 sm:gap-4">
                  {/* Ícono del tipo */}
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-lg ${tipoConfig.bg} flex items-center justify-center flex-shrink-0`}
                  >
                    <tipoConfig.Icon
                      className={`w-5 h-5 ${tipoConfig.iconColor}`}
                    />
                  </div>

                  {/* Información principal */}
                  <div className="flex-1 min-w-0">
                    {/* Línea 1: Materia + Badge tipo */}
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                        {m.nombre_materia}
                      </h3>
                      {badgeTipo(m.tipo_movimiento)}
                    </div>

                    {/* Línea 2: Datos en grid responsive */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs sm:text-sm">
                      <div>
                        <p className="text-gray-500">Cantidad</p>
                        <p className="font-semibold text-gray-900">
                          {parseFloat(m.cantidad).toFixed(2)} KG
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-500">Lote</p>
                        <p className="font-mono text-blue-600 truncate">
                          {m.codigo_lote || "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Fecha</p>
                        <p className="font-medium text-gray-900">
                          {new Date(m.fecha).toLocaleDateString("es-CO")}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-500">Registrado por</p>
                        <p className="flex items-center gap-1 font-medium text-gray-900 truncate">
                          <User className="w-3 h-3 text-blue-500 flex-shrink-0" />
                          <span className="truncate">{m.usuario || "—"}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Acciones a la derecha */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    {actionButton && (
                      <button
                        onClick={actionButton.onClick}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors ${actionButton.color}`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">
                          {actionButton.label}
                        </span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    {/* Chevron indicador de expansión */}
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>

                {/* ── Vista expandida (info adicional) ──────────────────────── */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 sm:px-5 sm:py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                      <div className="flex items-start gap-2">
                        <Hash className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">
                            Código materia
                          </p>
                          <p className="text-sm font-mono text-gray-900">
                            {m.codigo_materia || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Tag className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Categoría</p>
                          <p className="text-sm text-gray-900">
                            {m.categoria || "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-gray-500">Hora exacta</p>
                          <p className="text-sm text-gray-900">
                            {new Date(m.fecha).toLocaleString("es-CO", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Código de orden si existe */}
                    {(m.codigo_orden || m.codigo_orden_produccion) && (
                      <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 mb-3">
                        <p className="text-xs text-gray-500 mb-0.5">
                          {m.codigo_orden_produccion
                            ? "Orden de Producción"
                            : m.tipo_pedido === "devolucion"
                              ? "Orden de Devolución"
                              : "Orden de Recepción"}
                        </p>
                        <p className="text-sm font-mono font-semibold text-gray-900">
                          {m.codigo_orden_produccion || m.codigo_orden}
                        </p>
                      </div>
                    )}

                    {/* Observaciones */}
                    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2">
                      <p className="text-xs text-gray-500 mb-0.5">
                        Observaciones
                      </p>
                      <p className="text-sm text-gray-700">
                        {m.observacion && m.observacion.trim() !== "" ? (
                          m.observacion
                        ) : (
                          <span className="italic text-gray-400">
                            Sin observaciones registradas
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        {/* Paginación numérica */}
        {!cargando && (
          <Paginacion
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onCambiar={cambiarPagina}
          />
        )}
      </div>

      {/* ── Modal Registrar Movimiento ─────────────────────────────────────── */}
      {modalAbierto && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={overlayStyle}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center gap-3 p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-bold text-gray-900 text-lg sm:text-xl">
                Registrar Movimiento
              </h2>
              <button
                onClick={cerrarModal}
                className="ml-auto p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
              {/* Selector tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Movimiento
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    {
                      key: "Entrada",
                      icono: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />,
                      color: "green",
                      label: "Entrada",
                    },
                    {
                      key: "Salida",
                      icono: <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />,
                      color: "red",
                      label: "Salida",
                    },
                    {
                      key: "Devolucion",
                      icono: <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />,
                      color: "blue",
                      label: "Devolución",
                    },
                  ].map(({ key, icono, color, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleTipoChange(key)}
                      className={`flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all ${
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
                        className={`text-xs sm:text-sm font-semibold ${tipoMovimiento === key ? `text-${color}-700` : "text-gray-600"}`}
                      >
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Materia prima + cantidad */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Materia Prima *
                  </label>
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
                <div className="sm:w-32">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cantidad (kg) *
                  </label>
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

              {/* Lote (solo salida y devolución) */}
              {(tipoMovimiento === "Salida" ||
                tipoMovimiento === "Devolucion") && (
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
              <div className="flex gap-3 pt-2 pb-1">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={guardando}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {guardando ? "Registrando..." : "Registrar Movimiento"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Generar Reportes ──────────────────────────────────────────── */}
      {modalReportes && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={overlayStyle}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 sm:p-5 border-b border-gray-200 flex-shrink-0">
              {pasoReporte === 2 && (
                <button
                  onClick={volverPaso1}
                  className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <BarChart2 className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 text-base sm:text-lg">
                  {pasoReporte === 1
                    ? "Reportes Estratégicos"
                    : getResumenReporte()?.titulo || "Resultado"}
                </h2>
                <p className="text-xs text-gray-500">
                  {pasoReporte === 1
                    ? "Seleccione tipo de reporte y rango de fechas"
                    : "Vista previa del reporte generado"}
                </p>
              </div>
              <button
                onClick={() => setModalReportes(false)}
                className="ml-auto p-2 text-gray-400 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* PASO 1 */}
              {pasoReporte === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Tipo de Reporte
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {REPORTES_CONFIG.map(
                        ({ key, icono, color, title, desc }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setTipoReporte(key)}
                            className={`flex items-start gap-3 p-3 sm:p-3.5 rounded-xl border-2 text-left transition-all ${
                              tipoReporte === key
                                ? key === "ejecutivo"
                                  ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 ring-1 ring-blue-200"
                                  : `border-${color}-500 bg-${color}-50`
                                : key === "ejecutivo"
                                  ? "border-gray-200 hover:border-blue-300 bg-gradient-to-br from-gray-50 to-slate-50"
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
                            <div className="min-w-0">
                              <p
                                className={`text-sm font-semibold ${tipoReporte === key ? `text-${color}-700` : "text-gray-700"}`}
                              >
                                {title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {desc}
                              </p>
                            </div>
                            {tipoReporte === key && (
                              <ChevronRight
                                className={`w-4 h-4 ml-auto mt-0.5 flex-shrink-0 text-${color}-500`}
                              />
                            )}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  {/* Fechas opcionales */}
                  {tipoReporte &&
                    !REPORTES_CONFIG.find((r) => r.key === tipoReporte)
                      ?.sinFechas && (
                      <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
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
                        <p className="text-xs text-gray-400 mt-2">
                          Deje en blanco para incluir todos los registros
                        </p>
                      </div>
                    )}

                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={() => setModalReportes(false)}
                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Cerrar
                    </button>
                    <button
                      onClick={generarReporte}
                      disabled={cargandoReporte || !tipoReporte}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {cargandoReporte ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />{" "}
                          Generando...
                        </>
                      ) : (
                        <>
                          <BarChart2 className="w-4 h-4" /> Generar Reporte
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* PASO 2 */}
              {pasoReporte === 2 && resultadoReporte && (
                <>
                  {renderPreviewTabla()}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      onClick={volverPaso1}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      <ArrowLeft className="w-4 h-4" /> Volver
                    </button>
                    <button
                      onClick={imprimirReporte}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
                    >
                      <Printer className="w-4 h-4" /> Imprimir / Exportar PDF
                    </button>
                    <button
                      onClick={() => setModalReportes(false)}
                      className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Cerrar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
