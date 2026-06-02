import { useState, useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import {
  Package,
  Plus,
  X,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Trash2,
  Edit,
  AlertTriangle,
  Search,
  Calendar,
  Printer,
  RotateCcw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import API_URL from "../service/api";

// ── Overlay base reutilizable ────────────────────────────────────
const ModalOverlay = ({ children, onClose }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center p-4"
    style={{
      backgroundColor: "rgba(15, 23, 42, 0.55)",
      backdropFilter: "blur(6px)",
    }}
    onClick={(e) => {
      if (e.target === e.currentTarget && onClose) onClose();
    }}
  >
    {children}
  </div>
);

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

export default function PedidosPage() {
  const STOCK_MAX = 99999.99;
  const { isAdministrador, user, fetchConAuth } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("id");
  const [highlightedId, setHighlightedId] = useState(null);
  const cardRefs = useRef({});

  const [pedidos, setPedidos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [materias, setMaterias] = useState([]);

  const [filtroEstado, setFiltroEstado] = useState("pendiente");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [loading, setLoading] = useState(false);
  const [modalForm, setModalForm] = useState(false);
  const [modalRecibir, setModalRecibir] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [pedidoEditando, setPedidoEditando] = useState(null);
  const [pedidoActivo, setPedidoActivo] = useState(null);
  const [errores, setErrores] = useState({});
  const [itemsDevolucion, setItemsDevolucion] = useState([]);

  const formularioVacio = {
    id_proveedor: "",
    fecha_entrega: "",
    observaciones: "",
    items: [{ id_materia: "", cantidad_solicitada: "" }],
  };
  const [formulario, setFormulario] = useState(formularioVacio);

  // ── Fetch ────────────────────────────────────────────────────────
  const fetchPedidos = async () => {
    try {
      setLoading(true);
      const res = await fetchConAuth(`${API_URL}/pedidos`);
      if (!res) return;
      const data = await res.json();
      setPedidos(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCatalogos = async () => {
    try {
      const [rProv, rMat] = await Promise.all([
        fetchConAuth(`${API_URL}/proveedores`),
        fetchConAuth(`${API_URL}/pedidos/materias`),
      ]);
      if (!rProv || !rMat) return;
      const dProv = await rProv.json();
      const dMat = await rMat.json();
      setProveedores(Array.isArray(dProv.data) ? dProv.data : []);
      setMaterias(Array.isArray(dMat.data) ? dMat.data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPedidos();
    fetchCatalogos();
    return () => window.removeEventListener("focus", fetchPedidos);
  }, []);

  // ── Manejar navegación con ?id=X desde Movimientos ───────────────
  useEffect(() => {
    if (!highlightId || pedidos.length === 0) return;
    const idNum = parseInt(highlightId);
    const target = pedidos.find((p) => p.id_pedido === idNum);

    // Diferir las actualizaciones de estado fuera del cuerpo síncrono del effect
    const aplicar = setTimeout(() => {
      if (!target) {
        toast.error("No se encontró la orden referenciada");
        setSearchParams({});
        return;
      }

      // Auto-seleccionar el filtro según el tipo y estado del pedido
      if (target.tipo_pedido === "devolucion") {
        setFiltroEstado("devolucion");
      } else {
        setFiltroEstado(target.estado);
      }

      // Limpiar filtros de fecha y búsqueda para asegurar que se vea
      setFechaInicio("");
      setFechaFin("");
      setBusqueda("");
      setHighlightedId(idNum);
      setSearchParams({});

      // Scroll al pedido después de que se renderice
      setTimeout(() => {
        const el = cardRefs.current[idNum];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 350);
    }, 0);

    // Quitar el resaltado después de unos segundos
    const timer = setTimeout(() => setHighlightedId(null), 3500);
    return () => {
      clearTimeout(aplicar);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId, pedidos]);

  // ── Estadísticas ─────────────────────────────────────────────────
  const stats = useMemo(
    () => ({
      total: pedidos.filter((p) => p.tipo_pedido === "compra").length,
      pendientes: pedidos.filter(
        (p) => p.tipo_pedido === "compra" && p.estado === "pendiente",
      ).length,
      recibidos: pedidos.filter(
        (p) => p.tipo_pedido === "compra" && p.estado === "recibido",
      ).length,
      devoluciones: pedidos.filter((p) => p.tipo_pedido === "devolucion")
        .length,
      devPendientes: pedidos.filter(
        (p) => p.tipo_pedido === "devolucion" && p.estado === "pendiente",
      ).length,
      devRecibidas: pedidos.filter(
        (p) => p.tipo_pedido === "devolucion" && p.estado === "recibido",
      ).length,
    }),
    [pedidos],
  );

  // ── Filtrado ─────────────────────────────────────────────────────
  const pedidosFiltrados = useMemo(() => {
    const compras = pedidos.filter((p) => p.tipo_pedido === "compra");
    const devoluciones = pedidos.filter((p) => p.tipo_pedido === "devolucion");

    let res =
      filtroEstado === "devolucion"
        ? devoluciones
        : compras.filter((p) => p.estado === filtroEstado);

    if (busqueda.trim()) {
      const term = busqueda.toLowerCase();
      res = res.filter(
        (p) =>
          p.no_orden_compra?.toLowerCase().includes(term) ||
          p.nombre_proveedor?.toLowerCase().includes(term) ||
          p.nombre_empresa?.toLowerCase().includes(term) ||
          p.usuario_creador?.toLowerCase().includes(term),
      );
    }

    if (filtroEstado !== "pendiente") {
      if (fechaInicio) {
        const ini = new Date(fechaInicio);
        ini.setHours(0, 0, 0, 0);
        res = res.filter((p) => new Date(p.fecha_creacion) >= ini);
      }
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        res = res.filter((p) => new Date(p.fecha_creacion) <= fin);
      }
    }

    return res.sort(
      (a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion),
    );
  }, [pedidos, filtroEstado, fechaInicio, fechaFin, busqueda]);

  // ── Paginación numérica (aplica a todas las pestañas) ────────────
  const PEDIDOS_POR_PAGINA = 15;
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
  }, [filtroEstado, fechaInicio, fechaFin, busqueda]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(pedidosFiltrados.length / PEDIDOS_POR_PAGINA),
  );
  const pedidosVisibles = useMemo(() => {
    const inicio = (paginaActual - 1) * PEDIDOS_POR_PAGINA;
    return pedidosFiltrados.slice(inicio, inicio + PEDIDOS_POR_PAGINA);
  }, [pedidosFiltrados, paginaActual]);

  useEffect(() => {
    if (paginaActual > totalPaginas) setPaginaActual(totalPaginas);
  }, [totalPaginas, paginaActual]);

  const cambiarFiltro = (valor) => {
    setFiltroEstado(valor);
    setFechaInicio("");
    setFechaFin("");
    setBusqueda("");
  };

  // ── Items formulario ─────────────────────────────────────────────
  const hayItemsValidos = (items) =>
    items.some(
      (i) =>
        i.id_materia &&
        i.cantidad_solicitada &&
        Number(i.cantidad_solicitada) > 0,
    );

  const agregarItem = () =>
    setFormulario((prev) => ({
      ...prev,
      items: [...prev.items, { id_materia: "", cantidad_solicitada: "" }],
    }));

  const eliminarItem = (idx) =>
    setFormulario((prev) => {
      const nuevos = prev.items.filter((_, i) => i !== idx);
      if (hayItemsValidos(nuevos))
        setErrores((e) => ({ ...e, items: undefined }));
      return { ...prev, items: nuevos };
    });

  const actualizarItem = (idx, campo, valor) =>
    setFormulario((prev) => {
      const copia = [...prev.items];
      copia[idx] = { ...copia[idx], [campo]: valor };
      if (campo === "id_materia") {
        setErrores((e) => {
          const limpio = { ...e };
          copia.forEach((_, i) => delete limpio[`item_materia_${i}`]);
          return limpio;
        });
      } else if (campo === "cantidad_solicitada") {
        setErrores((e) => {
          const l = { ...e };
          delete l[`item_cantidad_${idx}`];
          return l;
        });
      }
      if (hayItemsValidos(copia))
        setErrores((e) => ({ ...e, items: undefined }));
      return { ...prev, items: copia };
    });

  // ── Abrir modales ────────────────────────────────────────────────
  const abrirCrear = () => {
    setPedidoEditando(null);
    setFormulario(formularioVacio);
    setErrores({});
    setModalForm(true);
  };

  const abrirEditar = (pedido) => {
    setPedidoEditando(pedido);
    setFormulario({
      id_proveedor: String(pedido.id_proveedor),
      fecha_entrega: pedido.fecha_entrega
        ? pedido.fecha_entrega.split("T")[0]
        : "",
      observaciones: pedido.observaciones || "",
      items: (pedido.items || []).map((i) => ({
        id_materia: String(i.id_materia),
        cantidad_solicitada: String(i.cantidad_solicitada),
      })),
    });
    setErrores({});
    setModalForm(true);
  };

  const abrirRecibir = (pedido) => {
    setPedidoActivo(pedido);
    setItemsDevolucion(
      (pedido.items || []).filter(Boolean).map((i) => ({
        id_materia: i.id_materia,
        nombre_materia: i.nombre_materia,
        cantidad_solicitada: Number(i.cantidad_solicitada),
        tieneProblema: false,
        cantidad_devuelta: "",
        observacion: "",
      })),
    );
    setModalRecibir(true);
  };

  // ── Guardar pedido ───────────────────────────────────────────────
  const guardarPedido = async () => {
    const nuevosErrores = {};

    if (!formulario.id_proveedor)
      nuevosErrores.id_proveedor = "Debe seleccionar un proveedor";
    if (!formulario.fecha_entrega)
      nuevosErrores.fecha_entrega = "Debe ingresar una fecha de entrega";

    const idsUsados = new Set();
    formulario.items.forEach((item, idx) => {
      if (!item.id_materia) {
        nuevosErrores[`item_materia_${idx}`] = "Seleccione una materia prima";
      } else if (idsUsados.has(item.id_materia)) {
        nuevosErrores[`item_materia_${idx}`] =
          "Esta materia prima ya fue agregada en otro item";
      } else {
        idsUsados.add(item.id_materia);
      }
      const cant = parseFloat(item.cantidad_solicitada);
      if (!item.cantidad_solicitada || isNaN(cant) || cant <= 0) {
        nuevosErrores[`item_cantidad_${idx}`] =
          "Ingrese una cantidad válida mayor a 0";
      } else if (cant > STOCK_MAX) {
        nuevosErrores[`item_cantidad_${idx}`] =
          `Máximo ${STOCK_MAX.toLocaleString("es-CO")} KG`;
      }
    });

    const itemsValidos = formulario.items.filter(
      (i) => i.id_materia && parseFloat(i.cantidad_solicitada) > 0,
    );
    if (itemsValidos.length === 0)
      nuevosErrores.items =
        "Debe agregar al menos una materia prima con cantidad válida";

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      toast.error("Corrige los campos marcados antes de continuar");
      return;
    }
    setErrores({});

    const payload = {
      id_proveedor: Number(formulario.id_proveedor),
      fecha_entrega: formulario.fecha_entrega || null,
      observaciones: formulario.observaciones || null,
      items: itemsValidos.map((i) => ({
        id_materia: Number(i.id_materia),
        cantidad_solicitada: parseFloat(i.cantidad_solicitada),
      })),
    };

    try {
      const url = pedidoEditando
        ? `${API_URL}/pedidos/${pedidoEditando.id_pedido}`
        : `${API_URL}/pedidos`;
      const method = pedidoEditando ? "PUT" : "POST";
      const res = await fetchConAuth(url, {
        method,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === "error") {
        toast.error("Error al guardar", { description: data.message });
        return;
      }
      toast.success(pedidoEditando ? "Pedido actualizado" : "Pedido creado", {
        description: pedidoEditando
          ? "Los cambios han sido guardados exitosamente"
          : "La orden de recepción fue creada exitosamente",
      });
      setModalForm(false);
      fetchPedidos();
    } catch {
      toast.error("Error de conexión", {
        description: "No se pudo conectar con el servidor",
      });
    }
  };

  // ── Devoluciones ─────────────────────────────────────────────────
  const toggleProblema = (idx) => {
    setItemsDevolucion((prev) => {
      const copia = [...prev];
      copia[idx].tieneProblema = !copia[idx].tieneProblema;
      if (!copia[idx].tieneProblema) {
        copia[idx].cantidad_devuelta = "";
        copia[idx].observacion = "";
      }
      return copia;
    });
  };

  const actualizarDevolucion = (idx, campo, valor) => {
    setItemsDevolucion((prev) => {
      const copia = [...prev];
      copia[idx] = { ...copia[idx], [campo]: valor };
      return copia;
    });
  };

  // ── Confirmar recepción ──────────────────────────────────────────
  const confirmarRecepcion = async () => {
    if (!pedidoActivo) return;

    for (const item of itemsDevolucion.filter((i) => i.tieneProblema)) {
      if (!item.cantidad_devuelta || Number(item.cantidad_devuelta) <= 0) {
        toast.error("Cantidad inválida", {
          description: `Ingrese la cantidad a devolver de "${item.nombre_materia}"`,
        });
        return;
      }
      if (Number(item.cantidad_devuelta) > item.cantidad_solicitada) {
        toast.error("Cantidad excedida", {
          description: `La cantidad devuelta de "${item.nombre_materia}" supera la pedida`,
        });
        return;
      }
      if (!item.observacion.trim()) {
        toast.error("Observación requerida", {
          description: `Ingrese la observación para "${item.nombre_materia}"`,
        });
        return;
      }
    }

    const itemsConProblema = itemsDevolucion
      .filter((i) => i.tieneProblema)
      .map((i) => ({
        id_materia: i.id_materia,
        cantidad_devuelta: Number(i.cantidad_devuelta),
        observacion: i.observacion,
      }));

    try {
      const res = await fetchConAuth(
        `${API_URL}/pedidos/${pedidoActivo.id_pedido}/recibir`,
        {
          method: "PUT",
          body: JSON.stringify({ itemsDevolucion: itemsConProblema }),
        },
      );
      if (!res) return;
      const data = await res.json();
      if (data.status === "error") {
        toast.error("Error", { description: data.message });
        return;
      }
      toast.success("Pedido recibido", {
        description:
          itemsConProblema.length > 0
            ? "Recepción completada. Se generó una orden de devolución automáticamente."
            : "Los lotes e inventario han sido actualizados correctamente.",
      });
      setModalRecibir(false);
      setPedidoActivo(null);
      setItemsDevolucion([]);
      fetchPedidos();
    } catch {
      toast.error("Error de conexión");
    }
  };

  // ── Eliminar ─────────────────────────────────────────────────────
  const confirmarCancelar = async () => {
    if (!pedidoActivo) return;
    try {
      const res = await fetchConAuth(
        `${API_URL}/pedidos/${pedidoActivo.id_pedido}`,
        { method: "DELETE" },
      );
      if (!res) return;
      const data = await res.json();
      if (data.status === "error") {
        toast.error("Error", { description: data.message });
        return;
      }
      toast.success("Pedido eliminado", {
        description: "La orden fue eliminada exitosamente",
      });
      setModalCancelar(false);
      setPedidoActivo(null);
      fetchPedidos();
    } catch {
      toast.error("Error de conexión");
    }
  };

  // ── Imprimir ─────────────────────────────────────────────────────
  const imprimirOrden = (pedido) => {
    const esDevolucion = pedido.tipo_pedido === "devolucion";
    const titulo = esDevolucion ? "Orden de Devolución" : "Orden de Recepción";
    const colorHeader = esDevolucion ? "#7c3aed" : "#1e40af";
    const colorAccent = esDevolucion ? "#7c3aed" : "#FDD835";

    const filas = (pedido.items || [])
      .filter(Boolean)
      .map((item, idx) => {
        const cantDev = parseFloat(item.cantidad_devuelta || 0);
        const cantOrig = parseFloat(item.cantidad_solicitada);
        const cantIngreso = cantOrig - cantDev;
        const tieneDevol = cantDev > 0;
        return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${idx + 1}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${item.nombre_materia}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${cantOrig.toFixed(2)} KG</td>
          ${
            pedido.estado === "recibido"
              ? `
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#dc2626;font-weight:${tieneDevol ? "bold" : "normal"};">${cantDev.toFixed(2)} KG</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;color:#16a34a;font-weight:bold;">${cantIngreso.toFixed(2)} KG</td>
          <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#6b7280;">${item.observacion_devolucion || (tieneDevol ? "Sin observación" : "—")}</td>`
              : ""
          }
        </tr>`;
      })
      .join("");

    const ordenOrigen =
      esDevolucion && pedido.id_pedido_origen
        ? pedidos.find((p) => p.id_pedido === pedido.id_pedido_origen)
        : null;

    const html = `<!DOCTYPE html><html>
      <head><meta charset="UTF-8"><title>${titulo}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box;}
        body{font-family:Arial,sans-serif;padding:20px;max-width:900px;margin:0 auto;color:#111827;}
        .header{text-align:center;margin-bottom:30px;border-bottom:3px solid ${colorAccent};padding-bottom:20px;}
        .header h1{color:#2d3748;font-size:28px;margin-bottom:6px;}
        .header h2{color:${colorHeader};font-size:20px;font-weight:normal;}
        .section-title{background-color:${colorAccent};color:${esDevolucion ? "white" : "#2d3748"};padding:10px 14px;margin-bottom:14px;font-size:15px;font-weight:bold;border-radius:4px;}
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;}
        .info-item{padding:10px 14px;background:#f9fafb;border-left:4px solid ${colorAccent};border-radius:2px;}
        .info-item label{font-size:11px;color:#6b7280;display:block;margin-bottom:3px;text-transform:uppercase;letter-spacing:.5px;}
        .info-item span{font-size:14px;font-weight:600;color:#1f2937;}
        table{width:100%;border-collapse:collapse;margin-bottom:24px;font-size:13px;}
        thead tr{background:${colorHeader};color:white;}
        thead th{padding:10px 12px;text-align:left;}
        tbody tr:nth-child(even){background:#f9fafb;}
        .total-row{background:${colorAccent} !important;font-weight:bold;}
        .total-row td{padding:10px 12px;color:${esDevolucion ? "white" : "#1f2937"};}
        .firma{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:60px;}
        .firma div{border-top:2px solid #9ca3af;padding-top:8px;text-align:center;font-size:13px;color:#6b7280;}
        .footer{text-align:center;margin-top:30px;padding-top:16px;border-top:1px solid #e5e7eb;color:#9ca3af;font-size:11px;}
        .print-btn{position:fixed;top:20px;right:20px;padding:10px 22px;background:${colorHeader};color:white;border:none;border-radius:6px;cursor:pointer;font-size:15px;font-weight:bold;}
        @media print{.print-btn{display:none;}}
      </style></head>
      <body>
        <button class="print-btn" onclick="window.print()">🖨️ Imprimir</button>
        <div class="header"><h1>CASERCON S.A.S</h1><h2>${titulo}</h2></div>
        <div class="section-title">Información General</div>
        <div class="info-grid">
          <div class="info-item"><label>N° Orden</label><span>${pedido.no_orden_compra}</span></div>
          <div class="info-item"><label>Estado</label><span>${pedido.estado.toUpperCase()}</span></div>
          <div class="info-item"><label>Proveedor</label><span>${pedido.nombre_proveedor}${pedido.nombre_empresa ? ` — ${pedido.nombre_empresa}` : ""}</span></div>
          <div class="info-item"><label>Fecha Creación</label><span>${new Date(pedido.fecha_creacion).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</span></div>
          <div class="info-item"><label>Creado por</label><span>${pedido.usuario_creador || "—"}</span></div>
          ${pedido.usuario_receptor ? `<div class="info-item"><label>Recibido por</label><span>${pedido.usuario_receptor}</span></div>` : ""}
          ${pedido.fecha_entrega ? `<div class="info-item"><label>${pedido.estado === "recibido" ? "Fecha Recepción" : "Entrega Esperada"}</label><span>${new Date(pedido.fecha_entrega).toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric" })}</span></div>` : ""}
          ${pedido.observaciones ? `<div class="info-item" style="grid-column:span 2;"><label>Observaciones del pedido</label><span>${pedido.observaciones}</span></div>` : ""}
          ${ordenOrigen ? `<div class="info-item" style="grid-column:span 2;border-left-color:#1e40af;"><label>Orden de Recepción Relacionada</label><span>${ordenOrigen.no_orden_compra} — ${ordenOrigen.nombre_proveedor}${ordenOrigen.nombre_empresa ? ` (${ordenOrigen.nombre_empresa})` : ""} · Estado: ${ordenOrigen.estado.toUpperCase()}</span></div>` : ""}
        </div>
        <div class="section-title">Materias Primas</div>
        <table>
          <thead><tr><th>#</th><th>Materia Prima</th><th style="text-align:center">Cantidad Solicitada</th>${pedido.estado === "recibido" ? "<th style='text-align:center'>Devuelto</th><th style='text-align:center'>Ingresado</th><th>Observación Devolución</th>" : ""}</tr></thead>
          <tbody>
            ${filas}
            <tr class="total-row">
              <td colspan="2">TOTAL</td>
              <td style="text-align:center;">${(pedido.items || [])
                .filter(Boolean)
                .reduce((s, i) => s + parseFloat(i.cantidad_solicitada), 0)
                .toFixed(2)} KG</td>
              ${
                pedido.estado === "recibido"
                  ? `
              <td style="text-align:center;color:#dc2626;">${(
                pedido.items || []
              )
                .filter(Boolean)
                .reduce((s, i) => s + parseFloat(i.cantidad_devuelta || 0), 0)
                .toFixed(2)} KG</td>
              <td style="text-align:center;color:#16a34a;">${(
                pedido.items || []
              )
                .filter(Boolean)
                .reduce(
                  (s, i) =>
                    s +
                    (parseFloat(i.cantidad_solicitada) -
                      parseFloat(i.cantidad_devuelta || 0)),
                  0,
                )
                .toFixed(2)} KG</td>
              <td>—</td>`
                  : ""
              }
            </tr>
          </tbody>
        </table>
        <div class="firma"><div>Firma Operario / Receptor</div><div>Firma Administrador</div></div>
        <div class="footer"><p>CASERCON S.A.S — Fabricante de Pinturas</p><p>Impreso el ${new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p></div>
      </body></html>`;

    const ventana = window.open("", "_blank");
    if (!ventana) return;
    ventana.document.write(html);
    ventana.document.close();
  };

  // ── Badges ───────────────────────────────────────────────────────
  const getEstadoBadge = (estado) => {
    const cfg = {
      pendiente: {
        cls: "bg-yellow-100 text-yellow-700",
        icon: <Clock className="w-3 h-3 sm:w-4 sm:h-4" />,
        label: "Pendiente",
      },
      recibido: {
        cls: "bg-green-100 text-green-700",
        icon: <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />,
        label: "Recibido",
      },
      cancelado: {
        cls: "bg-red-100 text-red-700",
        icon: <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />,
        label: "Cancelado",
      },
    };
    const c = cfg[estado] || {
      cls: "bg-gray-100 text-gray-700",
      icon: null,
      label: estado,
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs sm:text-sm font-medium rounded-full ${c.cls}`}
      >
        {c.icon}
        {c.label}
      </span>
    );
  };

  // ── RENDER ───────────────────────────────────────────────────────
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-gray-900 text-xl sm:text-2xl">
            Gestión de Pedidos
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Control de compras y recepción de materia prima
          </p>
        </div>
        {isAdministrador && (
          <button
            onClick={abrirCrear}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Crear Pedido
          </button>
        )}
      </div>

      {/* ── Estadísticas ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Órdenes</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {stats.total}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-yellow-700 mb-1">Pendientes</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-700">
            {stats.pendientes}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-green-700 mb-1">Recibidos</p>
          <p className="text-xl sm:text-2xl font-bold text-green-700">
            {stats.recibidos}
          </p>
        </div>
        <div className="bg-purple-50 rounded-lg border border-purple-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-purple-700 mb-1">
            Devoluciones
          </p>
          <p className="text-xl sm:text-2xl font-bold text-purple-700">
            {stats.devoluciones}
          </p>
          <div className="flex gap-3 mt-1">
            <p className="text-xs text-yellow-600 font-medium">
              {stats.devPendientes} pend.
            </p>
            <p className="text-xs text-green-600 font-medium">
              {stats.devRecibidas} recib.
            </p>
          </div>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Tabs — scroll horizontal en móvil con scrollbar oculto */}
        <div
          className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {[
            {
              label: "Pendientes",
              value: "pendiente",
              active: "bg-yellow-600",
            },
            { label: "Recibidos", value: "recibido", active: "bg-green-600" },
            {
              label: "Devoluciones",
              value: "devolucion",
              active: "bg-purple-600",
            },
          ].map(({ label, value, active }) => (
            <button
              key={value}
              onClick={() => cambiarFiltro(value)}
              className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filtroEstado === value
                  ? `${active} text-white`
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por orden, proveedor o usuario..."
            className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Rango de fechas */}
        {(filtroEstado === "recibido" || filtroEstado === "devolucion") && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-gray-100">
            <span className="text-xs sm:text-sm font-medium text-gray-500 flex-shrink-0">
              Fecha de creación:
            </span>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[130px]">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                />
              </div>
              <span className="text-gray-400 font-medium">—</span>
              <div className="relative flex-1 min-w-[130px]">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={fechaFin}
                  min={fechaInicio || undefined}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full pl-8 pr-2 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                />
              </div>
              {(fechaInicio || fechaFin) && (
                <button
                  onClick={() => {
                    setFechaInicio("");
                    setFechaFin("");
                  }}
                  className="flex items-center gap-1 px-2.5 py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" /> Limpiar
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ancla para scroll al cambiar de página */}
      <div ref={listaRef} className="scroll-mt-4" />

      {/* ── Lista ── */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Cargando pedidos...</p>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No hay pedidos en este estado</p>
          </div>
        ) : (
          pedidosVisibles.map((pedido) => {
            const esDevolucion = pedido.tipo_pedido === "devolucion";
            const isHighlighted = highlightedId === pedido.id_pedido;
            return (
              <div
                key={pedido.id_pedido}
                ref={(el) => {
                  if (el) cardRefs.current[pedido.id_pedido] = el;
                }}
                className={`bg-white rounded-lg border-2 shadow-sm p-4 sm:p-6 transition-all ${
                  isHighlighted
                    ? "border-yellow-400 ring-4 ring-yellow-200 shadow-lg"
                    : esDevolucion
                      ? "border-purple-200 bg-purple-50"
                      : "border-gray-200"
                }`}
              >
                {/* Cabecera */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${esDevolucion ? "bg-purple-100" : "bg-blue-100"}`}
                    >
                      {esDevolucion ? (
                        <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                      ) : (
                        <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                          {pedido.no_orden_compra}
                        </h3>
                        {esDevolucion && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                            <RotateCcw className="w-3 h-3" /> Devolución
                          </span>
                        )}
                        {getEstadoBadge(pedido.estado)}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600">
                        <span className="font-medium">Proveedor:</span>{" "}
                        {pedido.nombre_proveedor}
                        {pedido.nombre_empresa && ` — ${pedido.nombre_empresa}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Creado por: {pedido.usuario_creador}
                      </p>
                      {pedido.usuario_receptor && (
                        <p className="text-xs text-green-600 mt-0.5 font-medium">
                          Recibido por: {pedido.usuario_receptor}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones — wrap en móvil */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {pedido.estado === "pendiente" && (
                      <button
                        onClick={() => abrirRecibir(pedido)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium"
                      >
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{" "}
                        Recibir
                      </button>
                    )}
                    {(pedido.estado === "pendiente" || isAdministrador) && (
                      <button
                        onClick={() => imprimirOrden(pedido)}
                        className={`flex items-center gap-1.5 px-3 py-2 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium ${esDevolucion ? "bg-purple-600 hover:bg-purple-700" : "bg-gray-600 hover:bg-gray-700"}`}
                      >
                        <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="hidden xs:inline">Imprimir</span>
                      </button>
                    )}
                    {isAdministrador && pedido.estado === "pendiente" && (
                      <>
                        <button
                          onClick={() => abrirEditar(pedido)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
                        >
                          <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Editar
                        </button>
                        <button
                          onClick={() => {
                            setPedidoActivo(pedido);
                            setModalCancelar(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs sm:text-sm font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />{" "}
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-4">
                  {esDevolucion &&
                    pedido.id_pedido_origen &&
                    (() => {
                      const origen = pedidos.find(
                        (p) => p.id_pedido === pedido.id_pedido_origen,
                      );
                      return origen ? (
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">
                            Pedido Origen
                          </p>
                          <p className="font-medium text-gray-900 flex items-center gap-1 text-sm">
                            <Truck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                            {origen.no_orden_compra}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {origen.nombre_proveedor}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-gray-500 mb-0.5">
                            Pedido Origen
                          </p>
                          <p className="text-xs text-gray-400 italic">
                            No encontrado
                          </p>
                        </div>
                      );
                    })()}
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      Fecha Creación
                    </p>
                    <p className="font-medium text-gray-900 text-sm">
                      {new Date(pedido.fecha_creacion).toLocaleDateString(
                        "es-CO",
                      )}
                    </p>
                  </div>
                  {pedido.fecha_entrega && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        {pedido.estado === "recibido"
                          ? "Fecha Recepción"
                          : "Entrega Esperada"}
                      </p>
                      <p className="font-medium text-gray-900 text-sm">
                        {new Date(pedido.fecha_entrega).toLocaleDateString(
                          "es-CO",
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {pedido.observaciones && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs sm:text-sm text-blue-900">
                      <span className="font-medium">Observaciones:</span>{" "}
                      {pedido.observaciones}
                    </p>
                  </div>
                )}

                {/* Items */}
                {(pedido.items || []).filter(Boolean).length > 0 && (
                  <div className="border-t border-gray-100 pt-3 sm:pt-4">
                    <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
                      Materias Primas
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {(pedido.items || []).filter(Boolean).map((item, idx) => {
                        const cantDev = Number(item.cantidad_devuelta || 0);
                        const cantOrig = Number(item.cantidad_solicitada);
                        const cantIngreso = cantOrig - cantDev;
                        const tieneDevol = cantDev > 0;
                        return (
                          <div
                            key={idx}
                            className={`rounded-lg px-3 py-2 border ${tieneDevol ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-100"}`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                                  {item.nombre_materia}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0 ml-2 text-xs">
                                {tieneDevol ? (
                                  <>
                                    <span className="text-gray-400 line-through">
                                      {cantOrig.toFixed(2)} KG
                                    </span>
                                    <span className="text-red-500 font-medium">
                                      −{cantDev.toFixed(2)}
                                    </span>
                                    <span className="text-green-600 font-bold">
                                      ={cantIngreso.toFixed(2)} KG
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm font-bold text-gray-900">
                                    {cantOrig.toFixed(2)} KG
                                  </span>
                                )}
                              </div>
                            </div>
                            {tieneDevol && item.observacion_devolucion && (
                              <p className="mt-1 text-xs text-orange-700 pl-5">
                                <span className="font-medium">Razón:</span>{" "}
                                {item.observacion_devolucion}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
        {/* Paginación numérica */}
        {!loading && (
          <Paginacion
            paginaActual={paginaActual}
            totalPaginas={totalPaginas}
            onCambiar={cambiarPagina}
          />
        )}
      </div>

      {/* ── Modal Crear / Editar ── */}
      {modalForm && (
        <ModalOverlay
          onClose={() => {
            setModalForm(false);
            setErrores({});
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="font-bold text-gray-900 text-lg sm:text-xl">
                {pedidoEditando ? "Editar Pedido" : "Nueva Orden de Recepción"}
              </h2>
              <button
                onClick={() => {
                  setModalForm(false);
                  setErrores({});
                }}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Proveedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proveedor *
                </label>
                <select
                  value={formulario.id_proveedor}
                  onChange={(e) => {
                    setFormulario({
                      ...formulario,
                      id_proveedor: e.target.value,
                    });
                    setErrores((prev) => ({
                      ...prev,
                      id_proveedor: undefined,
                    }));
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errores.id_proveedor ? "border-red-500 focus:ring-red-500" : "border-gray-300"}`}
                >
                  <option value="">Seleccione un proveedor</option>
                  {proveedores.map((p) => (
                    <option key={p.id_proveedor} value={p.id_proveedor}>
                      {p.nombre_proveedor}
                      {p.nombre_empresa ? ` — ${p.nombre_empresa}` : ""}
                    </option>
                  ))}
                </select>
                {errores.id_proveedor && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errores.id_proveedor}
                  </p>
                )}
              </div>

              {/* Fecha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Entrega Esperada *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formulario.fecha_entrega}
                    onChange={(e) => {
                      setFormulario({
                        ...formulario,
                        fecha_entrega: e.target.value,
                      });
                      setErrores((prev) => ({
                        ...prev,
                        fecha_entrega: undefined,
                      }));
                    }}
                    className={`w-full pl-9 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-gray-700 text-sm ${errores.fecha_entrega ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                  />
                </div>
                {errores.fecha_entrega && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errores.fecha_entrega}
                  </p>
                )}
              </div>

              {/* Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Materias Primas *
                  </label>
                  <button
                    type="button"
                    onClick={agregarItem}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Plus className="w-4 h-4" /> Agregar item
                  </button>
                </div>
                {errores.items && !hayItemsValidos(formulario.items) && (
                  <p className="text-red-500 text-xs mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {errores.items}
                  </p>
                )}
                <div className="space-y-2 max-h-52 overflow-y-auto">
                  {formulario.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex gap-2">
                        <select
                          value={item.id_materia}
                          onChange={(e) => {
                            actualizarItem(idx, "id_materia", e.target.value);
                            setErrores((prev) => ({
                              ...prev,
                              [`item_materia_${idx}`]: undefined,
                            }));
                          }}
                          className={`flex-1 min-w-0 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errores[`item_materia_${idx}`] ? "border-red-500" : "border-gray-300"}`}
                        >
                          <option value="">Seleccione materia prima</option>
                          {materias.map((m) => (
                            <option key={m.id_materia} value={m.id_materia}>
                              {m.nombre}
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={item.cantidad_solicitada}
                          onChange={(e) => {
                            actualizarItem(
                              idx,
                              "cantidad_solicitada",
                              e.target.value,
                            );
                            setErrores((prev) => ({
                              ...prev,
                              [`item_cantidad_${idx}`]: undefined,
                            }));
                          }}
                          placeholder="KG"
                          className={`w-24 sm:w-28 flex-shrink-0 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${errores[`item_cantidad_${idx}`] ? "border-red-500" : "border-gray-300"}`}
                        />
                        {formulario.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => eliminarItem(idx)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {errores[`item_materia_${idx}`] && (
                          <p className="text-red-500 text-xs flex items-center gap-1 flex-1">
                            <AlertTriangle className="w-3 h-3" />
                            {errores[`item_materia_${idx}`]}
                          </p>
                        )}
                        {errores[`item_cantidad_${idx}`] && (
                          <p className="text-red-500 text-xs flex items-center gap-1 w-24 sm:w-28">
                            <AlertTriangle className="w-3 h-3" />
                            {errores[`item_cantidad_${idx}`]}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={formulario.observaciones}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      observaciones: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="Información adicional del pedido..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                />
              </div>

              <div className="flex gap-3 pt-2 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setModalForm(false);
                    setErrores({});
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarPedido}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  {pedidoEditando ? "Guardar Cambios" : "Crear Pedido"}
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Modal Recibir ── */}
      {modalRecibir && pedidoActivo && (
        <ModalOverlay
          onClose={() => {
            setModalRecibir(false);
            setPedidoActivo(null);
            setItemsDevolucion([]);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <div className="min-w-0 pr-2">
                <h2 className="font-bold text-gray-900 text-lg sm:text-xl">
                  Recepción de Pedido
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">
                  {pedidoActivo.no_orden_compra} —{" "}
                  {pedidoActivo.nombre_proveedor}
                </p>
              </div>
              <button
                onClick={() => {
                  setModalRecibir(false);
                  setPedidoActivo(null);
                  setItemsDevolucion([]);
                }}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg flex-shrink-0 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Instrucciones */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm text-blue-900">
                    <p className="font-medium mb-1">
                      Instrucciones de Recepción:
                    </p>
                    <ul className="space-y-0.5 text-blue-700">
                      <li>• Marca los items que presentan problemas</li>
                      <li>
                        • Indica la cantidad exacta a devolver (puede ser
                        parcial)
                      </li>
                      <li>
                        • La observación es obligatoria para items con problema
                      </li>
                      <li>
                        • Solo la materia en buen estado entrará al inventario
                      </li>
                      <li>
                        • Se generará automáticamente una orden de devolución
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Items de devolución */}
              <div className="space-y-3">
                {itemsDevolucion.map((item, idx) => (
                  <div
                    key={idx}
                    className={`border-2 rounded-xl p-3 sm:p-4 transition-colors ${item.tieneProblema ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"}`}
                  >
                    <div className="flex items-start justify-between mb-3 gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                        <Package
                          className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${item.tieneProblema ? "text-red-600" : "text-gray-500"}`}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            {item.nombre_materia}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600">
                            Cantidad pedida:{" "}
                            <span className="font-bold">
                              {item.cantidad_solicitada} KG
                            </span>
                          </p>
                        </div>
                      </div>
                      <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={item.tieneProblema}
                          onChange={() => toggleProblema(idx)}
                          className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                        />
                        <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
                          Tiene problema
                        </span>
                      </label>
                    </div>

                    {item.tieneProblema && (
                      <div className="space-y-3 pt-3 border-t border-red-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Cantidad a devolver (KG) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0.01"
                              max={item.cantidad_solicitada}
                              value={item.cantidad_devuelta}
                              onChange={(e) =>
                                actualizarDevolucion(
                                  idx,
                                  "cantidad_devuelta",
                                  e.target.value,
                                )
                              }
                              placeholder="0.00"
                              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm ${
                                item.cantidad_devuelta &&
                                Number(item.cantidad_devuelta) >
                                  item.cantidad_solicitada
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-300"
                              }`}
                            />
                            {item.cantidad_devuelta &&
                              Number(item.cantidad_devuelta) >
                                item.cantidad_solicitada && (
                                <p className="text-red-500 text-xs mt-1">
                                  Excede la cantidad pedida
                                </p>
                              )}
                          </div>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                              Cantidad que entra (KG)
                            </label>
                            <input
                              type="text"
                              readOnly
                              value={Math.max(
                                0,
                                item.cantidad_solicitada -
                                  (Number(item.cantidad_devuelta) || 0),
                              ).toFixed(2)}
                              className="w-full px-3 py-2 border border-green-300 bg-green-50 text-green-700 font-bold rounded-lg text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                            Observación / Razón de devolución *
                          </label>
                          <textarea
                            value={item.observacion}
                            onChange={(e) =>
                              actualizarDevolucion(
                                idx,
                                "observacion",
                                e.target.value,
                              )
                            }
                            rows={2}
                            placeholder="Ej: Material dañado, empaque roto, calidad deficiente..."
                            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none text-sm ${
                              item.tieneProblema && !item.observacion.trim()
                                ? "border-red-300"
                                : "border-gray-300"
                            }`}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Resumen */}
              <div className="p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">
                  Resumen de Recepción
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Items con problema</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">
                      {itemsDevolucion.filter((i) => i.tieneProblema).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Items sin problema</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      {itemsDevolucion.filter((i) => !i.tieneProblema).length}
                    </p>
                  </div>
                  {itemsDevolucion.some((i) => i.tieneProblema) && (
                    <div className="col-span-2 sm:col-span-1 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center">
                      <p className="text-xs text-amber-700 font-medium">
                        ⚠️ Se generará una orden de devolución automáticamente
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setModalRecibir(false);
                    setPedidoActivo(null);
                    setItemsDevolucion([]);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => imprimirOrden(pedidoActivo)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  <Printer className="w-4 h-4" /> Imprimir
                </button>
                <button
                  onClick={confirmarRecepcion}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
                >
                  Confirmar Recepción
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Modal Eliminar ── */}
      {modalCancelar && pedidoActivo && (
        <ModalOverlay
          onClose={() => {
            setModalCancelar(false);
            setPedidoActivo(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              </div>
              <h2 className="font-bold text-gray-900 text-base sm:text-lg">
                Eliminar Pedido
              </h2>
            </div>
            <p className="text-gray-600 text-sm sm:text-base mb-6">
              ¿Confirma que desea eliminar permanentemente{" "}
              <span className="font-medium text-gray-900">
                {pedidoActivo.no_orden_compra}
              </span>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalCancelar(false);
                  setPedidoActivo(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCancelar}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
