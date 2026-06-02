import React, { useEffect, useState, useMemo, useRef, use } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Factory,
  Plus,
  X,
  Package,
  CheckCircle,
  AlertTriangle,
  Clock,
  Play,
  Check,
  Trash2,
  Edit,
  Printer,
  Users,
  Search,
  Calendar,
  Ban,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
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

export default function ProduccionPage() {
  const { isAdministrador, user } = useAuth();
  const { fetchConAuth } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightId = searchParams.get("id");
  const [highlightedId, setHighlightedId] = useState(null);
  const cardRefs = useRef({});

  const [producciones, setProducciones] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [materiasPrimas, setMateriasPrimas] = useState([]);
  const [operarios, setOperarios] = useState([]);
  const [recetaDetalle, setRecetaDetalle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("Pendiente");
  const [modalConfirmarInicio, setModalConfirmarInicio] = useState(false);
  const [modalConfirmarEliminar, setModalConfirmarEliminar] = useState(false);
  const [ordenParaIniciar, setOrdenParaIniciar] = useState(null);
  const [ordenParaEliminar, setOrdenParaEliminar] = useState(null);
  const [modalConfirmarFinalizar, setModalConfirmarFinalizar] = useState(false);
  const [ordenParaFinalizar, setOrdenParaFinalizar] = useState(null);

  const [stockPreview, setStockPreview] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);
  const [erroresFormulario, setErroresFormulario] = useState({});

  const [formulario, setFormulario] = useState({
    id_receta: "",
    cantidad_producir: "",
  });

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const cambiarFiltroEstado = (valor) => {
    setFiltroEstado(valor);
    setFechaInicio("");
    setFechaFin("");
    setBusqueda("");
  };

  const [modalEditarCantidad, setModalEditarCantidad] = useState(false);
  const [ordenEditando, setOrdenEditando] = useState(null);
  const [nuevaCantidad, setNuevaCantidad] = useState("");
  const [nuevaRecetaId, setNuevaRecetaId] = useState("");
  const [stockPreviewEditar, setStockPreviewEditar] = useState(null);
  const [loadingStockEditar, setLoadingStockEditar] = useState(false);

  const [modalEditarReceta, setModalEditarReceta] = useState(false);
  const [ordenEditandoReceta, setOrdenEditandoReceta] = useState(null);
  const [ingredientesEditados, setIngredientesEditados] = useState([]);
  const [motivoModificacion, setMotivoModificacion] = useState("");
  const [guardandoReceta, setGuardandoReceta] = useState(false);
  const [stockEdicion, setStockEdicion] = useState({});

  const [modalReasignar, setModalReasignar] = useState(false);
  const [ordenReasignando, setOrdenReasignando] = useState(null);
  const [nuevoOperarioId, setNuevoOperarioId] = useState("");

  // ── Fetches ─────────────────────────────────────────────────────
  const fetchProducciones = async () => {
    try {
      setLoading(true);
      const res = await fetchConAuth(`${API_URL}/produccion`);
      if (!res) return;
      const data = await res.json();
      setProducciones(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error(error);
      setProducciones([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecetas = async () => {
    try {
      const res = await fetchConAuth(`${API_URL}/recetas`);
      if (!res) return;
      const data = await res.json();
      setRecetas(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchMateriasPrimas = async () => {
    try {
      const res = await fetchConAuth(`${API_URL}/materias-primas`);
      if (!res) return;
      const data = await res.json();
      setMateriasPrimas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchOperarios = async () => {
    try {
      const res = await fetchConAuth(`${API_URL}/produccion/operarios`);
      if (!res) return;
      const data = await res.json();
      setOperarios(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchProducciones();
    fetchRecetas();
    fetchMateriasPrimas();
    if (isAdministrador) fetchOperarios();
  }, []);

  // ── Manejar navegación con ?id=X desde Movimientos ───────────────
  useEffect(() => {
    if (!highlightId || producciones.length === 0) return;
    const idNum = parseInt(highlightId);
    const target = producciones.find((p) => p.id_orden_produccion === idNum);

    const aplicar = setTimeout(() => {
      if (!target) {
        toast.error("No se encontró la orden de producción referenciada");
        setSearchParams({});
        return;
      }

      setFiltroEstado(target.estado);
      setFechaInicio("");
      setFechaFin("");
      setBusqueda("");
      setHighlightedId(idNum);
      setSearchParams({});

      setTimeout(() => {
        const el = cardRefs.current[idNum];
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 350);
    }, 0);

    const timer = setTimeout(() => setHighlightedId(null), 3500);
    return () => {
      clearTimeout(aplicar);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId, producciones]);

  useEffect(() => {
    if (!formulario.id_receta) {
      setRecetaDetalle(null);
      setStockPreview(null);
      return;
    }
    const receta = recetas.find(
      (r) => String(r.id_receta) === String(formulario.id_receta),
    );
    setRecetaDetalle(receta || null);
    setStockPreview(null);
  }, [formulario.id_receta, recetas]);

  useEffect(() => {
    const { id_receta, cantidad_producir } = formulario;
    if (!id_receta || !cantidad_producir || Number(cantidad_producir) <= 0) {
      setStockPreview(null);
      return;
    }
    setLoadingStock(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetchConAuth(
          `${API_URL}/produccion/verificar-stock?id_receta=${id_receta}&cantidad_producir=${cantidad_producir}`,
        );
        const data = await res.json();
        if (data.status === "success") setStockPreview(data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingStock(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [formulario.id_receta, formulario.cantidad_producir]);

  useEffect(() => {
    if (
      !ordenEditando ||
      !nuevaCantidad ||
      Number(nuevaCantidad) <= 0 ||
      !nuevaRecetaId
    ) {
      setStockPreviewEditar(null);
      return;
    }
    setLoadingStockEditar(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetchConAuth(
          `${API_URL}/produccion/verificar-stock?id_receta=${nuevaRecetaId}&cantidad_producir=${nuevaCantidad}&id_orden=${ordenEditando.id_orden_produccion}`,
        );
        const data = await res.json();
        if (data.status === "success") setStockPreviewEditar(data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingStockEditar(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [ordenEditando, nuevaCantidad, nuevaRecetaId]);

  const crearProduccion = async () => {
    try {
      const res = await fetchConAuth(`${API_URL}/produccion`, {
        method: "POST",
        body: JSON.stringify({
          id_receta: Number(formulario.id_receta),
          cantidad_producir: Number(formulario.cantidad_producir),
        }),
      });
      if (!res) return;
      const data = await res.json();
      if (data.status === "error") {
        toast.error(data.message);
        return;
      }
      cerrarModal();
      fetchProducciones();
      toast.success("¡Orden de producción creada exitosamente!");
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!ordenEditandoReceta || ingredientesEditados.length === 0) return;
    const timeout = setTimeout(async () => {
      try {
        const res = await fetchConAuth(
          `${API_URL}/produccion/${ordenEditandoReceta.id_orden_produccion}/verificar-stock-edicion`,
          {
            method: "POST",
            body: JSON.stringify({
              ingredientes: ingredientesEditados.filter((i) => i.id_materia),
              cantidad_producir: ordenEditandoReceta.cantidad_producir,
            }),
          },
        );
        const data = await res.json();
        if (data.status === "success") {
          const mapa = {};
          data.data.ingredientes.forEach((i) => {
            mapa[String(i.id_materia)] = i;
          });
          setStockEdicion(mapa);
        }
      } catch (error) {
        console.error(error);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [ingredientesEditados, ordenEditandoReceta]);

  const iniciarProduccion = async () => {
    try {
      const res = await fetchConAuth(
        `${API_URL}/produccion/${ordenParaIniciar.id_orden_produccion}/iniciar`,
        { method: "PUT" },
      );
      if (!res) return;
      setModalConfirmarInicio(false);
      setOrdenParaIniciar(null);
      fetchProducciones();
      toast.success("¡Orden iniciada correctamente!");
    } catch (error) {
      console.error(error);
    }
  };

  const finalizarProduccion = async () => {
    try {
      const res = await fetchConAuth(
        `${API_URL}/produccion/${ordenParaFinalizar.id_orden_produccion}/finalizar`,
        { method: "PUT" },
      );
      if (!res) return;
      const data = await res.json();
      if (data.status === "error") {
        toast.error(data.message);
        return;
      }
      setModalConfirmarFinalizar(false);
      setOrdenParaFinalizar(null);
      fetchProducciones();
      toast.success("¡Producción completada!");
    } catch (error) {
      console.error(error);
    }
  };

  const eliminarProduccion = async (id, nombre) => {
    try {
      const res = await fetchConAuth(
        `${API_URL}/produccion/${ordenParaEliminar.id_orden_produccion}`,
        {
          method: "DELETE",
        },
      );
      if (!res) return;
      setModalConfirmarEliminar(false);
      setOrdenParaEliminar(null);
      fetchProducciones();
      toast.success("Orden eliminada correctamente");
    } catch (error) {
      console.error(error);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setFormulario({ id_receta: "", cantidad_producir: "" });
    setRecetaDetalle(null);
    setStockPreview(null);
    setErroresFormulario({});
  };

  const abrirModalEditarCantidad = (produccion) => {
    setOrdenEditando(produccion);
    setNuevaCantidad(String(produccion.cantidad_producir));
    setNuevaRecetaId(String(produccion.id_receta));
    setStockPreviewEditar(null);
    setModalEditarCantidad(true);
  };

  const cerrarModalEditarCantidad = () => {
    setModalEditarCantidad(false);
    setOrdenEditando(null);
    setNuevaCantidad("");
    setNuevaRecetaId("");
    setStockPreviewEditar(null);
  };

  const guardarCantidad = async () => {
    try {
      const res = await fetchConAuth(
        `${API_URL}/produccion/${ordenEditando.id_orden_produccion}/cantidad`,
        {
          method: "PUT",
          body: JSON.stringify({
            cantidad_producir: Number(nuevaCantidad),
            id_receta: Number(nuevaRecetaId),
          }),
        },
      );
      if (!res) return;
      const data = await res.json();
      if (data.status === "error") {
        toast.error(data.message);
        return;
      }
      cerrarModalEditarCantidad();
      fetchProducciones();
      toast.success("¡Orden actualizada correctamente!");
    } catch (error) {
      console.error(error);
    }
  };

  const abrirModalEditarReceta = (produccion) => {
    const ingredientesIniciales = produccion.ingredientes_orden
      ? typeof produccion.ingredientes_orden === "string"
        ? JSON.parse(produccion.ingredientes_orden)
        : produccion.ingredientes_orden
      : (recetas.find((r) => r.id_receta === produccion.id_receta)
          ?.ingredientes ?? []);

    if (ingredientesIniciales.length === 0) return;

    setOrdenEditandoReceta(produccion);
    setIngredientesEditados(
      ingredientesIniciales.map((ing) => ({
        id_materia: ing.id_materia,
        nombre_materia: ing.nombre_materia,
        cantidad_porcentaje: parseFloat(ing.cantidad_porcentaje),
      })),
    );
    setMotivoModificacion("");
    setModalEditarReceta(true);
  };

  const cerrarModalEditarReceta = () => {
    setModalEditarReceta(false);
    setOrdenEditandoReceta(null);
    setIngredientesEditados([]);
    setMotivoModificacion("");
    setStockEdicion({});
  };

  const agregarIngrediente = () => {
    setIngredientesEditados([
      ...ingredientesEditados,
      { id_materia: "", nombre_materia: "", cantidad_porcentaje: 0 },
    ]);
  };

  const eliminarIngrediente = (idx) => {
    setIngredientesEditados(ingredientesEditados.filter((_, i) => i !== idx));
  };

  const actualizarIngrediente = (idx, campo, valor) => {
    const copia = [...ingredientesEditados];
    if (campo === "id_materia") {
      const materia = materiasPrimas.find(
        (m) => String(m.id_materia) === String(valor),
      );
      copia[idx].id_materia = valor;
      copia[idx].nombre_materia = materia?.nombre || "";
    } else {
      const num = parseFloat(valor) || 0;
      copia[idx].cantidad_porcentaje = num < 0 ? 0 : num;
    }
    setIngredientesEditados(copia);
  };

  const sumaTotal = ingredientesEditados.reduce(
    (sum, ing) => sum + ing.cantidad_porcentaje,
    0,
  );

  const hubocambios = useMemo(() => {
    if (!ordenEditandoReceta || ingredientesEditados.length === 0) return false;
    const ingredientesOriginales = ordenEditandoReceta.ingredientes_orden
      ? typeof ordenEditandoReceta.ingredientes_orden === "string"
        ? JSON.parse(ordenEditandoReceta.ingredientes_orden)
        : ordenEditandoReceta.ingredientes_orden
      : (recetas.find((r) => r.id_receta === ordenEditandoReceta.id_receta)
          ?.ingredientes ?? []);

    if (ingredientesEditados.length !== ingredientesOriginales.length)
      return true;
    return ingredientesEditados.some((ing, idx) => {
      const orig = ingredientesOriginales[idx];
      return (
        String(ing.id_materia) !== String(orig.id_materia) ||
        parseFloat(ing.cantidad_porcentaje) !==
          parseFloat(orig.cantidad_porcentaje)
      );
    });
  }, [ingredientesEditados, ordenEditandoReceta, recetas]);

  const guardarRecetaEditada = async () => {
    if (hubocambios && !motivoModificacion.trim()) {
      toast.error("Debes ingresar el motivo de la modificación.");
      return;
    }
    setGuardandoReceta(true);
    try {
      const res = await fetchConAuth(
        `${API_URL}/produccion/${ordenEditandoReceta.id_orden_produccion}/receta`,
        {
          method: "PUT",
          body: JSON.stringify({
            ingredientes: ingredientesEditados,
            motivo: motivoModificacion,
          }),
        },
      );
      if (!res) return;
      const data = await res.json();
      if (data.status === "error") {
        toast.error("Datos duplicados");
        return;
      }
      cerrarModalEditarReceta();
      fetchProducciones();
      fetchRecetas();
      toast.success("¡Receta de la orden actualizada!");
    } catch (error) {
      console.error(error);
    } finally {
      setGuardandoReceta(false);
    }
  };

  const abrirModalReasignar = (produccion) => {
    setOrdenReasignando(produccion);
    setNuevoOperarioId(String(produccion.id_usuario_inicio || ""));
    setModalReasignar(true);
  };

  const cerrarModalReasignar = () => {
    setModalReasignar(false);
    setOrdenReasignando(null);
    setNuevoOperarioId("");
  };

  const guardarReasignacion = async () => {
    if (!nuevoOperarioId) {
      toast.error("Seleccione un operario");
      return;
    }
    try {
      const res = await fetchConAuth(
        `${API_URL}/produccion/${ordenReasignando.id_orden_produccion}/reasignar`,
        {
          method: "PUT",
          body: JSON.stringify({ id_usuario_inicio: Number(nuevoOperarioId) }),
        },
      );
      if (!res) return;
      const data = await res.json();
      if (data.status === "error") {
        toast.error(data.message);
        return;
      }
      cerrarModalReasignar();
      fetchProducciones();
      toast.success("Operario reasignado correctamente");
    } catch (error) {
      console.error(error);
    }
  };

  const imprimirOrden = (produccion) => {
    const ingredientesOrden = produccion.ingredientes_orden
      ? typeof produccion.ingredientes_orden === "string"
        ? JSON.parse(produccion.ingredientes_orden)
        : produccion.ingredientes_orden
      : null;

    const receta = recetas.find((r) => r.id_receta === produccion.id_receta);
    if (!receta) return;

    const ingredientes = ingredientesOrden || receta.ingredientes || [];
    const recetaFueModificada = !!ingredientesOrden;
    const idsBase = receta.ingredientes?.map((i) => i.id_materia) ?? [];

    const operarioNombre =
      operarios.find(
        (o) => String(o.id_usuario) === String(produccion.id_usuario_inicio),
      )?.nombre ||
      produccion.usuario_inicio ||
      "Sin asignar";

    const filas = ingredientes
      .map((ing, index) => {
        const cantNecesaria =
          (parseFloat(ing.cantidad_porcentaje) / 100) *
          parseFloat(produccion.cantidad_producir);

        const esNuevo =
          recetaFueModificada && !idsBase.includes(ing.id_materia);
        const esEditado =
          recetaFueModificada &&
          !esNuevo &&
          (() => {
            const original = receta.ingredientes?.find(
              (i) => i.id_materia === ing.id_materia,
            );
            return (
              original &&
              parseFloat(original.cantidad_porcentaje) !==
                parseFloat(ing.cantidad_porcentaje)
            );
          })();

        const materiaReal = materiasPrimas.find(
          (m) => String(m.id_materia) === String(ing.id_materia),
        );
        const stockDisp = materiaReal
          ? Number(materiaReal.stockDisponible ?? 0).toFixed(2)
          : "—";

        const claseRow = esNuevo
          ? "background-color:#d1fae5;font-weight:bold;"
          : esEditado
            ? "background-color:#fef3c7;font-weight:bold;"
            : "";

        const badge = esNuevo
          ? '<span style="background:#10b981;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">NUEVO</span>'
          : esEditado
            ? '<span style="background:#f59e0b;color:white;padding:2px 6px;border-radius:3px;font-size:10px;margin-left:5px;">MODIFICADO</span>'
            : "";

        return `
      <tr style="${claseRow}">
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${index + 1}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;">${ing.nombre_materia}${badge}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${parseFloat(ing.cantidad_porcentaje).toFixed(2)}%</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${cantNecesaria.toFixed(2)} KG</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">${stockDisp} KG</td>
      </tr>`;
      })
      .join("");

    const eliminados = recetaFueModificada
      ? (receta.ingredientes?.filter(
          (i) =>
            !ingredientes.some(
              (o) => String(o.id_materia) === String(i.id_materia),
            ),
        ) ?? [])
      : [];

    const agregados = recetaFueModificada
      ? ingredientes.filter((i) => !idsBase.includes(i.id_materia))
      : [];

    const eliminadosHtml =
      eliminados.length > 0
        ? `<p style="color:#dc2626;margin-top:6px;font-size:13px;">
      <strong>Ingredientes Eliminados:</strong> 
      ${eliminados.map((e) => `<span style="background:#fee2e2;color:#dc2626;padding:2px 8px;border-radius:12px;font-size:12px;margin-right:4px;">${e.nombre_materia}</span>`).join("")}
     </p>`
        : "";

    const agregadosHtml =
      agregados.length > 0
        ? `<p style="color:#16a34a;margin-top:6px;font-size:13px;">
      <strong>Ingredientes Agregados:</strong> 
      ${agregados.map((a) => `<span style="background:#dcfce7;color:#16a34a;padding:2px 8px;border-radius:12px;font-size:12px;margin-right:4px;">${a.nombre_materia}</span>`).join("")}
     </p>`
        : "";

    const seccionModificacion = recetaFueModificada
      ? `<div style="padding:15px;background:#fef3c7;border:2px solid #f59e0b;border-radius:5px;margin-bottom:20px;">
      <h4 style="color:#92400e;margin:0 0 8px 0;font-size:14px;">RECETA MODIFICADA</h4>
      <p style="color:#78350f;font-size:13px;margin:0 0 4px 0;">
        <strong>Motivo:</strong> ${produccion.observaciones || "No especificado"}
      </p>
      <p style="color:#78350f;font-size:13px;margin:0;">
        <strong>Receta Original:</strong> ${receta.nombre_producto}
      </p>
      ${eliminadosHtml}
      ${agregadosHtml}
    </div>`
      : "";

    const seccionObservaciones =
      produccion.observaciones && !recetaFueModificada
        ? `
    <div style="padding:15px;background:#fff8dc;border:1px solid #fdd835;border-radius:5px;margin-bottom:20px;">
      <h4 style="color:#2d3748;margin:0 0 8px 0;font-size:14px;">Observaciones:</h4>
      <p style="color:#4a5568;font-size:13px;line-height:1.5;margin:0;">${produccion.observaciones}</p>
    </div>`
        : "";

    const fechaFormateada = new Date(
      produccion.fecha_creacion,
    ).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const ahora = new Date().toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Orden de Producción - ${produccion.codigo_orden || produccion.id_orden_produccion}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; color: #2d3748; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #FDD835; padding-bottom: 20px; }
          .header h1 { color: #2d3748; font-size: 28px; margin-bottom: 10px; }
          .header h2 { color: #888; font-size: 18px; font-weight: normal; }
          .info-section { margin-bottom: 25px; }
          .info-section h3 { background-color: #FDD835; color: #2d3748; padding: 10px; margin-bottom: 15px; font-size: 15px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 15px; }
          .info-item { padding: 8px; background-color: #f7fafc; border-left: 3px solid #FDD835; }
          .info-item label { font-weight: bold; color: #4a5568; display: block; margin-bottom: 3px; font-size: 11px; text-transform: uppercase; }
          .info-item span { color: #2d3748; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          thead tr { background-color: #2d3748; color: white; }
          thead th { padding: 12px; text-align: left; font-size: 13px; }
          tbody tr:nth-child(even) { background-color: #f7fafc; }
          .total-row { background-color: #FDD835 !important; font-weight: bold; }
          .firma-section { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .firma-box { text-align: center; }
          .firma-line { border-top: 2px solid #2d3748; margin-bottom: 8px; margin-top: 60px; }
          .firma-box label { font-weight: bold; color: #4a5568; font-size: 13px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; color: #718096; font-size: 12px; }
          .print-button { position: fixed; top: 20px; right: 20px; padding: 12px 24px; background-color: #FDD835; color: #2d3748; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
          .print-button:hover { background-color: #fbc02d; }
          @media print { .print-button { display: none; } }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">🖨️ Imprimir</button>
        <div class="header">
          <h1>CASERCON S.A.S</h1>
          <h2>Orden de Producción</h2>
        </div>
        ${seccionModificacion}
        <div class="info-section">
          <h3>Información General</h3>
          <div class="info-grid">
            <div class="info-item"><label>Código de Orden</label><span>${produccion.codigo_orden || `OP-${produccion.id_orden_produccion}`}</span></div>
            <div class="info-item"><label>Estado</label><span>EN PROCESO</span></div>
            <div class="info-item"><label>Receta</label><span>${receta.nombre_producto}</span></div>
            <div class="info-item"><label>Peso Total a Producir</label><span>${parseFloat(produccion.cantidad_producir).toFixed(2)} KG</span></div>
            <div class="info-item"><label>Fecha de Creación</label><span>${fechaFormateada}</span></div>
            <div class="info-item"><label>Operario Asignado</label><span>${operarioNombre}</span></div>
          </div>
        </div>
        <div class="info-section">
          <h3>Ingredientes y Cantidades Necesarias</h3>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Materia Prima</th>
                <th style="text-align:center">Porcentaje</th>
                <th style="text-align:center">Cantidad Necesaria (KG)</th>
                <th style="text-align:center">Stock Disponible (KG)</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
              <tr class="total-row">
                <td style="padding:10px 12px;" colspan="2"><strong>TOTAL</strong></td>
                <td style="padding:10px 12px;text-align:center;"><strong>100.00%</strong></td>
                <td style="padding:10px 12px;text-align:center;"><strong>${parseFloat(produccion.cantidad_producir).toFixed(2)} KG</strong></td>
                <td style="padding:10px 12px;"></td>
              </tr>
            </tbody>
          </table>
        </div>
        ${seccionObservaciones}
        <div class="firma-section">
          <div class="firma-box"><div class="firma-line"></div><label>Operario de Producción</label></div>
          <div class="firma-box"><div class="firma-line"></div><label>Supervisor / Gerente</label></div>
        </div>
        <div class="footer">
          <p>CASERCON S.A.S - Fabricante de Pinturas</p>
          <p>Impreso el ${ahora}</p>
        </div>
      </body>
    </html>`;

    const ventana = window.open("", "_blank");
    if (!ventana) return;
    ventana.document.write(html);
    ventana.document.close();
  };

  const estadisticas = useMemo(() => {
    const esSoloOperario = !isAdministrador;
    const miId = Number(user?.id_usuario);
    const pendientes = producciones.filter(
      (p) => p.estado === "Pendiente",
    ).length;
    const enProceso = producciones.filter(
      (p) =>
        p.estado === "En proceso" &&
        (!esSoloOperario || Number(p.id_usuario_inicio) === miId),
    ).length;
    const completadas = producciones.filter(
      (p) =>
        p.estado === "Completada" &&
        (!esSoloOperario || Number(p.id_usuario_fin) === miId),
    ).length;
    const total = esSoloOperario
      ? pendientes + enProceso + completadas
      : producciones.length;
    return { total, pendientes, enProceso, completadas };
  }, [producciones, isAdministrador, user]);

  const produccionesFiltradas = useMemo(() => {
    const esSoloOperario = !isAdministrador;
    const miId = Number(user?.id_usuario);

    let resultado = producciones.filter((p) => {
      if (p.estado !== filtroEstado) return false;
      if (esSoloOperario && p.estado === "En proceso")
        return Number(p.id_usuario_inicio) === miId;
      if (esSoloOperario && p.estado === "Completada")
        return Number(p.id_usuario_fin) === miId;
      return true;
    });

    if (busqueda.trim()) {
      const term = busqueda.toLowerCase();
      resultado = resultado.filter(
        (p) =>
          p.nombre_producto?.toLowerCase().includes(term) ||
          p.codigo_orden?.toLowerCase().includes(term) ||
          p.usuario_creador?.toLowerCase().includes(term) ||
          p.usuario_inicio?.toLowerCase().includes(term) ||
          p.usuario_fin?.toLowerCase().includes(term),
      );
    }

    if (filtroEstado === "Completada") {
      if (fechaInicio) {
        const inicio = new Date(fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        resultado = resultado.filter((p) => {
          const campo =
            filtroEstado === "Completada"
              ? p.fecha_finalizacion
              : p.fecha_creacion;
          return campo && new Date(campo) >= inicio;
        });
      }
      if (fechaFin) {
        const fin = new Date(fechaFin);
        fin.setHours(23, 59, 59, 999);
        resultado = resultado.filter((p) => {
          const campo =
            filtroEstado === "Completada"
              ? p.fecha_finalizacion
              : p.fecha_creacion;
          return campo && new Date(campo) <= fin;
        });
      }
    }

    return resultado.sort(
      (a, b) =>
        new Date(b.fecha_creacion || 0) - new Date(a.fecha_creacion || 0),
    );
  }, [
    producciones,
    filtroEstado,
    fechaInicio,
    fechaFin,
    busqueda,
    isAdministrador,
    user,
  ]);

  // ── Paginación numérica (aplica a todas las pestañas) ────────────
  const PRODUCCION_POR_PAGINA = 15;
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
    Math.ceil(produccionesFiltradas.length / PRODUCCION_POR_PAGINA),
  );
  const produccionesVisibles = useMemo(() => {
    const inicio = (paginaActual - 1) * PRODUCCION_POR_PAGINA;
    return produccionesFiltradas.slice(inicio, inicio + PRODUCCION_POR_PAGINA);
  }, [produccionesFiltradas, paginaActual]);

  useEffect(() => {
    if (paginaActual > totalPaginas) setPaginaActual(totalPaginas);
  }, [totalPaginas, paginaActual]);

  const calcularMateriales = (ingredientes, cantidad) => {
    if (!ingredientes || !cantidad || isNaN(Number(cantidad))) return [];
    return ingredientes.map((ing) => ({
      nombre: ing.nombre_materia,
      porcentaje: parseFloat(ing.cantidad_porcentaje),
      cantidadNecesaria:
        (parseFloat(ing.cantidad_porcentaje) / 100) * Number(cantidad),
      id_materia: ing.id_materia,
    }));
  };

  const getEstadoBadge = (estado) => {
    const config = {
      Pendiente: {
        clase: "bg-yellow-100 text-yellow-700",
        icono: <Clock className="w-3 h-3 sm:w-4 sm:h-4" />,
        label: "Pendiente",
      },
      "En proceso": {
        clase: "bg-blue-100 text-blue-700",
        icono: <Play className="w-3 h-3 sm:w-4 sm:h-4" />,
        label: "En Proceso",
      },
      Completada: {
        clase: "bg-green-100 text-green-700",
        icono: <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />,
        label: "Completada",
      },
    };
    const c = config[estado] || {
      clase: "bg-gray-100 text-gray-700",
      icono: null,
      label: estado,
    };
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs sm:text-sm font-medium rounded-full ${c.clase}`}
      >
        {c.icono}
        {c.label}
      </span>
    );
  };

  // ── Componente reutilizable: preview de stock ────────────────────
  const StockPreviewPanel = ({ preview }) => {
    const hayAlertaCritica =
      preview.posible &&
      preview.ingredientes.some(
        (ing) =>
          ing.suficiente &&
          ing.stock_min != null &&
          ing.stock_disponible - ing.cantidad_necesaria < ing.stock_min,
      );

    return (
      <div
        className={`p-3 sm:p-4 rounded-lg border-2 ${preview.posible ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
      >
        <div className="flex items-center gap-2 mb-3">
          {preview.posible ? (
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
          )}
          <h4
            className={`font-medium text-sm sm:text-base ${preview.posible ? "text-green-900" : "text-red-900"}`}
          >
            {preview.posible ? "Stock suficiente" : "Stock insuficiente"}
          </h4>
        </div>

        {hayAlertaCritica && (
          <div className="flex items-start gap-2 mb-3 p-2.5 bg-orange-50 border border-orange-300 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-orange-700 font-medium">
              Algunas materias primas quedarán en estado crítico tras esta
              producción.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {preview.ingredientes.map((ing, idx) => (
            <div
              key={idx}
              className={`p-2.5 sm:p-3 rounded-lg border ${
                !ing.suficiente
                  ? "bg-red-100 border-red-300"
                  : ing.stock_min != null &&
                      ing.stock_disponible - ing.cantidad_necesaria <
                        ing.stock_min
                    ? "bg-orange-50 border-orange-300"
                    : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                    {ing.nombre_materia}
                  </span>
                  <span className="text-xs text-gray-400">
                    {ing.cantidad_porcentaje}%
                  </span>
                </div>
                <div className="text-right text-xs sm:text-sm flex-shrink-0">
                  <p
                    className={`font-bold ${ing.suficiente ? "text-gray-900" : "text-red-700"}`}
                  >
                    Necesita: {ing.cantidad_necesaria.toFixed(2)} KG
                  </p>
                  <p className="text-gray-500">
                    Disponible: {ing.stock_disponible.toFixed(2)} KG
                  </p>
                </div>
              </div>

              {!ing.suficiente && (
                <p className="text-xs text-red-600 font-medium mt-1">
                  Faltan{" "}
                  {(ing.cantidad_necesaria - ing.stock_disponible).toFixed(2)}{" "}
                  KG
                </p>
              )}

              {ing.suficiente &&
                ing.stock_min != null &&
                ing.stock_disponible - ing.cantidad_necesaria <
                  ing.stock_min && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <AlertTriangle className="w-3 h-3 text-orange-500 flex-shrink-0" />
                    <p className="text-xs text-orange-600 font-medium">
                      Quedará{" "}
                      {(ing.stock_disponible - ing.cantidad_necesaria).toFixed(
                        2,
                      )}{" "}
                      KG (Mínimo: {ing.stock_min.toFixed(2)} KG) - ESTADO
                      CRÍTICO
                    </p>
                  </div>
                )}
            </div>
          ))}

          <div className="flex items-center justify-between text-sm p-2.5 sm:p-3 bg-blue-50 rounded-lg border border-blue-100 font-medium">
            <span className="text-blue-900 text-xs sm:text-sm">
              Total a consumir
            </span>
            <span className="text-blue-900 text-xs sm:text-sm">
              {preview.ingredientes
                .reduce((sum, i) => sum + i.cantidad_necesaria, 0)
                .toFixed(2)}{" "}
              KG
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-gray-900 text-xl sm:text-2xl">
            Órdenes de Producción
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Crea y gestiona órdenes de producción
          </p>
        </div>
        {isAdministrador && (
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Crear Orden
          </button>
        )}
      </div>

      {/* ── Estadísticas ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Órdenes</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {estadisticas.total}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-yellow-700 mb-1">Pendientes</p>
          <p className="text-xl sm:text-2xl font-bold text-yellow-700">
            {estadisticas.pendientes}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-blue-700 mb-1">En Proceso</p>
          <p className="text-xl sm:text-2xl font-bold text-blue-700">
            {estadisticas.enProceso}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-green-700 mb-1">Completadas</p>
          <p className="text-xl sm:text-2xl font-bold text-green-700">
            {estadisticas.completadas}
          </p>
        </div>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 space-y-3 sm:space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          {[
            {
              label: "Pendientes",
              value: "Pendiente",
              active: "bg-yellow-600",
            },
            { label: "En Proceso", value: "En proceso", active: "bg-blue-600" },
            {
              label: "Completadas",
              value: "Completada",
              active: "bg-green-600",
            },
          ].map(({ label, value, active }) => (
            <button
              key={value}
              onClick={() => cambiarFiltroEstado(value)}
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por producto, código u operario..."
            className="w-full pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {filtroEstado === "Completada" && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1 border-t border-gray-100">
            <span className="text-xs sm:text-sm font-medium text-gray-500 flex-shrink-0">
              {filtroEstado === "Completada"
                ? "Fecha completada:"
                : "Fecha creación:"}
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

      {/* ── Lista de órdenes ── */}
      <div className="space-y-3 sm:space-y-4">
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-500">Cargando órdenes...</p>
          </div>
        ) : produccionesFiltradas.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Factory className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No hay órdenes en este estado</p>
          </div>
        ) : (
          produccionesVisibles.map((p) => {
            const esPendiente = p.estado === "Pendiente";
            const esProceso = p.estado === "En proceso";

            const ingredientesOrdenParsed = p.ingredientes_orden
              ? typeof p.ingredientes_orden === "string"
                ? JSON.parse(p.ingredientes_orden)
                : p.ingredientes_orden
              : null;

            const recetaBase = recetas.find((r) => r.id_receta === p.id_receta);
            const ingredientesAMostrar =
              ingredientesOrdenParsed || recetaBase?.ingredientes || [];
            const materialesOrden = calcularMateriales(
              ingredientesAMostrar,
              p.cantidad_producir,
            );
            const recetaFueModificada = !!ingredientesOrdenParsed;

            const idsBase =
              recetaBase?.ingredientes?.map((i) => i.id_materia) ?? [];
            const nuevosIds = recetaFueModificada
              ? ingredientesOrdenParsed
                  .filter((i) => !idsBase.includes(i.id_materia))
                  .map((i) => i.id_materia)
              : [];
            const modificadosIds = recetaFueModificada
              ? ingredientesOrdenParsed
                  .filter((i) => {
                    if (nuevosIds.includes(i.id_materia)) return false;
                    const orig = recetaBase?.ingredientes?.find(
                      (b) => b.id_materia === i.id_materia,
                    );
                    return (
                      orig &&
                      parseFloat(orig.cantidad_porcentaje) !==
                        parseFloat(i.cantidad_porcentaje)
                    );
                  })
                  .map((i) => i.id_materia)
              : [];

            return (
              <div
                key={p.id_orden_produccion}
                ref={(el) => {
                  if (el) cardRefs.current[p.id_orden_produccion] = el;
                }}
                className={`bg-white rounded-lg border-2 shadow-sm p-4 sm:p-6 transition-all ${
                  highlightedId === p.id_orden_produccion
                    ? "border-yellow-400 ring-4 ring-yellow-200 shadow-lg"
                    : "border-gray-200"
                }`}
              >
                {/* Cabecera de la orden */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Factory className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                          {p.nombre_producto}
                        </h3>
                        {getEstadoBadge(p.estado)}
                        {recetaFueModificada && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
                            <AlertTriangle className="w-3 h-3 text-yellow-600" />
                            Receta modificada
                          </span>
                        )}
                      </div>
                      {p.codigo_orden && (
                        <p className="text-xs sm:text-sm text-gray-500">
                          {p.codigo_orden}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {esPendiente && (
                      <>
                        <button
                          onClick={() => {
                            setOrdenParaIniciar(p);
                            setModalConfirmarInicio(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium"
                        >
                          <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          Iniciar
                        </button>
                        {isAdministrador && (
                          <>
                            <button
                              onClick={() => abrirModalEditarCantidad(p)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm font-medium"
                            >
                              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setOrdenParaEliminar(p);
                                setModalConfirmarEliminar(true);
                              }}
                              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              Eliminar
                            </button>

                            {/* ── Modal Confirmar Eliminar ── */}
                            {modalConfirmarEliminar && ordenParaEliminar && (
                              <ModalOverlay
                                onClose={() => {
                                  setModalConfirmarEliminar(false);
                                  setOrdenParaEliminar(null);
                                }}
                              >
                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
                                  <div className="flex items-start gap-4 mb-6">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                      <Trash2 className="w-6 h-6 text-red-600" />
                                    </div>
                                    <div>
                                      <h2 className="font-bold text-gray-900 text-lg mb-1">
                                        Eliminar Orden de Producción
                                      </h2>
                                      <p className="text-gray-600 text-sm">
                                        ¿Confirma que desea eliminar la orden de{" "}
                                        <strong>
                                          "{ordenParaEliminar.nombre_producto}"
                                        </strong>{" "}
                                        por{" "}
                                        <strong>
                                          {ordenParaEliminar.cantidad_producir}{" "}
                                          KG
                                        </strong>
                                        ? Esta acción no se puede deshacer.
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex gap-3">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setModalConfirmarEliminar(false);
                                        setOrdenParaEliminar(null);
                                      }}
                                      className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                                    >
                                      Cancelar
                                    </button>
                                    <button
                                      type="button"
                                      onClick={eliminarProduccion}
                                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm"
                                    >
                                      Eliminar
                                    </button>
                                  </div>
                                </div>
                              </ModalOverlay>
                            )}
                          </>
                        )}
                      </>
                    )}

                    {esProceso && (
                      <>
                        {(isAdministrador ||
                          Number(p.id_usuario_inicio) ===
                            Number(user?.id_usuario)) && (
                          <>
                            <button
                              onClick={() => imprimirOrden(p)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs sm:text-sm font-medium"
                            >
                              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden xs:inline">Imprimir</span>
                            </button>
                            <button
                              onClick={() => abrirModalEditarReceta(p)}
                              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-xs sm:text-sm font-medium"
                            >
                              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              <span className="hidden xs:inline">
                                Editar receta
                              </span>
                              <span className="xs:hidden">Receta</span>
                            </button>
                            <button
                              onClick={() => {
                                setOrdenParaFinalizar(p);
                                setModalConfirmarFinalizar(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium"
                            >
                              <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              Completar
                            </button>
                          </>
                        )}
                        {isAdministrador && (
                          <button
                            onClick={() => abrirModalReasignar(p)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-xs sm:text-sm font-medium"
                          >
                            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Reasignar
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Cantidad</p>
                    <p className="font-medium text-gray-900 text-sm">
                      {p.cantidad_producir} KG
                    </p>
                  </div>
                  {p.fecha_creacion && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Creado</p>
                      <p className="font-medium text-gray-900 text-sm">
                        {new Date(p.fecha_creacion).toLocaleDateString("es-CO")}
                      </p>
                    </div>
                  )}
                  {p.fecha_finalizacion && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Completado</p>
                      <p className="font-medium text-gray-900 text-sm">
                        {new Date(p.fecha_finalizacion).toLocaleDateString(
                          "es-CO",
                        )}
                      </p>
                    </div>
                  )}
                  {p.usuario_creador && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Creado por</p>
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {p.usuario_creador}
                      </p>
                    </div>
                  )}
                  {p.usuario_inicio && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        Iniciado por
                      </p>
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {p.usuario_inicio}
                      </p>
                    </div>
                  )}
                  {p.usuario_fin && (
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">
                        Completado por
                      </p>
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {p.usuario_fin}
                      </p>
                    </div>
                  )}
                </div>

                {/* Materiales necesarios */}
                {materialesOrden.length > 0 && p.estado !== "Completada" && (
                  <div className="border-t border-gray-200 pt-3 sm:pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                      Materiales Necesarios:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {materialesOrden.map((mat, idx) => {
                        const esNuevo = nuevosIds.includes(mat.id_materia);
                        const esEditado = modificadosIds.includes(
                          mat.id_materia,
                        );
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg ${
                              esNuevo
                                ? "bg-green-50 border border-green-200"
                                : esEditado
                                  ? "bg-yellow-50 border border-yellow-200"
                                  : "bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Package
                                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${
                                  esNuevo
                                    ? "text-green-600"
                                    : esEditado
                                      ? "text-yellow-600"
                                      : "text-gray-600"
                                }`}
                              />
                              <div className="flex flex-col min-w-0">
                                <span
                                  className={`text-xs sm:text-sm truncate ${esNuevo || esEditado ? "font-semibold" : ""} text-gray-700`}
                                >
                                  {mat.nombre}
                                </span>
                                {esNuevo && (
                                  <span className="text-xs text-green-600 font-medium">
                                    Nuevo
                                  </span>
                                )}
                                {esEditado && (
                                  <span className="text-xs text-yellow-600 font-medium">
                                    Modificado
                                  </span>
                                )}
                                {!esNuevo && !esEditado && (
                                  <span className="text-xs text-gray-400">
                                    {mat.porcentaje}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <span
                              className={`text-xs sm:text-sm font-bold flex-shrink-0 ml-2 ${
                                esNuevo
                                  ? "text-green-700"
                                  : esEditado
                                    ? "text-yellow-700"
                                    : "text-gray-900"
                              }`}
                            >
                              {mat.cantidadNecesaria.toFixed(2)} KG
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Lotes usados — órdenes completadas */}
                {p.estado === "Completada" &&
                  p.lotes_usados &&
                  (() => {
                    const lotes =
                      typeof p.lotes_usados === "string"
                        ? JSON.parse(p.lotes_usados)
                        : p.lotes_usados;
                    if (!lotes || lotes.length === 0) return null;
                    const agrupados = lotes.reduce((acc, lote) => {
                      const key = lote.nombre_materia;
                      if (!acc[key])
                        acc[key] = { nombre: key, lotes: [], total: 0 };
                      acc[key].lotes.push(lote.codigo_lote);
                      acc[key].total += parseFloat(lote.cantidad_usada || 0);
                      return acc;
                    }, {});
                    return (
                      <div className="border-t border-gray-200 pt-3 sm:pt-4 mt-3 sm:mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                          Materiales Usados:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {Object.values(agrupados).map((mat, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-100"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs sm:text-sm text-gray-700 truncate">
                                    {mat.nombre}
                                  </span>
                                  <span className="text-xs text-gray-400 truncate">
                                    Lotes: {mat.lotes.join(", ")}
                                  </span>
                                </div>
                              </div>
                              <span className="text-xs sm:text-sm font-bold text-gray-900 flex-shrink-0 ml-2">
                                {mat.total.toFixed(2)} KG
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                {/* Badge receta modificada con detalle */}
                {recetaFueModificada && (
                  <div className="mt-3 sm:mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-900 font-medium mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
                      Receta Modificada
                    </p>
                    {p.observaciones && (
                      <p className="text-xs sm:text-sm text-yellow-700 mb-2">
                        <strong>Motivo:</strong> {p.observaciones}
                      </p>
                    )}
                    {(() => {
                      const eliminados =
                        recetaBase?.ingredientes?.filter(
                          (i) =>
                            !ingredientesOrdenParsed.some(
                              (o) =>
                                String(o.id_materia) === String(i.id_materia),
                            ),
                        ) ?? [];
                      return eliminados.length > 0 ? (
                        <div className="mb-2">
                          <p className="text-xs font-semibold text-red-700 mb-1">
                            🗑️ Ingredientes eliminados:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {eliminados.map((e, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full border border-red-200"
                              >
                                {e.nombre_materia}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : null;
                    })()}
                    {nuevosIds.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-1">
                          Ingredientes agregados:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {ingredientesOrdenParsed
                            .filter((i) => nuevosIds.includes(i.id_materia))
                            .map((i, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full border border-green-200"
                              >
                                {i.nombre_materia}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
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

      {/* ── Modal Confirmar Inicio ── */}
      {modalConfirmarInicio && ordenParaIniciar && (
        <ModalOverlay
          onClose={() => {
            setModalConfirmarInicio(false);
            setOrdenParaIniciar(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg mb-1">
                  Aceptar Orden de Producción
                </h2>
                <p className="text-gray-600 text-sm">
                  ¿Confirma que desea aceptar la orden de{" "}
                  <strong>"{ordenParaIniciar.nombre_producto}"</strong> por{" "}
                  <strong>{ordenParaIniciar.cantidad_producir} KG</strong>?
                  Usted será asignado como responsable.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalConfirmarInicio(false);
                  setOrdenParaIniciar(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={iniciarProduccion}
                className="flex-1 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Modal Confirmar Finalizar ── */}
      {modalConfirmarFinalizar && ordenParaFinalizar && (
        <ModalOverlay
          onClose={() => {
            setModalConfirmarFinalizar(false);
            setOrdenParaFinalizar(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg mb-1">
                  Completar Producción
                </h2>
                <p className="text-gray-600 text-sm">
                  ¿Confirma que la producción de{" "}
                  <strong>"{ordenParaFinalizar.nombre_producto}"</strong> ha
                  sido completada? Esto actualizará el inventario y consumirá
                  los materiales.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModalConfirmarFinalizar(false);
                  setOrdenParaFinalizar(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={finalizarProduccion}
                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
              >
                Confirmar
              </button>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Modal Crear Orden ── */}
      {modalAbierto && (
        <ModalOverlay onClose={cerrarModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-lg sm:text-xl">
                Crear Orden de Producción
              </h2>
              <button
                onClick={cerrarModal}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccione Receta
                </label>
                <select
                  value={formulario.id_receta}
                  onChange={(e) => {
                    setFormulario({ ...formulario, id_receta: e.target.value });
                    setErroresFormulario((prev) => ({
                      ...prev,
                      id_receta: undefined,
                    }));
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    erroresFormulario.id_receta
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">Seleccione una receta</option>
                  {recetas
                    .filter((r) => r.estado === "Activo")
                    .map((r) => (
                      <option key={r.id_receta} value={r.id_receta}>
                        {r.nombre_producto}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad a Producir (KG)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={999999.99}
                  placeholder="Ej: 100"
                  value={formulario.cantidad_producir}
                  onChange={(e) => {
                    const valor = e.target.value;
                    if (valor.length > 9) return;
                    setFormulario({ ...formulario, cantidad_producir: valor });
                    setErroresFormulario((prev) => ({
                      ...prev,
                      cantidad_producir: undefined,
                    }));
                  }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    formulario.cantidad_producir !== "" &&
                    Number(formulario.cantidad_producir) <= 0
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300"
                  }`}
                />
                {formulario.cantidad_producir !== "" &&
                  Number(formulario.cantidad_producir) <= 0 && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> La cantidad debe ser
                      mayor a 0
                    </p>
                  )}
                <p className="text-xs text-gray-500 mt-1">
                  Ingrese el peso total del producto final a fabricar
                </p>
              </div>

              {loadingStock && (
                <p className="text-sm text-gray-400 italic">
                  Verificando stock disponible...
                </p>
              )}
              {!loadingStock && stockPreview && (
                <StockPreviewPanel preview={stockPreview} />
              )}

              <div className="flex gap-3 pt-2 pb-1">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={crearProduccion}
                  disabled={
                    (formulario.cantidad_producir !== "" &&
                      Number(formulario.cantidad_producir) <= 0) ||
                    (stockPreview !== null && !stockPreview.posible)
                  }
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors text-sm font-medium ${
                    (formulario.cantidad_producir !== "" &&
                      Number(formulario.cantidad_producir) <= 0) ||
                    (stockPreview !== null && !stockPreview.posible)
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Crear Orden
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Modal Editar Cantidad ── */}
      {modalEditarCantidad && ordenEditando && (
        <ModalOverlay onClose={cerrarModalEditarCantidad}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-base sm:text-lg truncate pr-2">
                Editar — {ordenEditando.nombre_producto}
              </h2>
              <button
                onClick={cerrarModalEditarCantidad}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receta
                </label>
                <select
                  value={nuevaRecetaId}
                  onChange={(e) => {
                    setNuevaRecetaId(e.target.value);
                    setStockPreviewEditar(null);
                  }}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Seleccione una receta</option>
                  {recetas
                    .filter((r) => r.estado === "Activo")
                    .map((r) => (
                      <option key={r.id_receta} value={r.id_receta}>
                        {r.nombre_producto}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Cantidad (KG)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={nuevaCantidad}
                  onChange={(e) => setNuevaCantidad(e.target.value)}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    nuevaCantidad !== "" && Number(nuevaCantidad) <= 0
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300"
                  }`}
                />
                {nuevaCantidad !== "" && Number(nuevaCantidad) <= 0 && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> La cantidad debe ser
                    mayor a 0
                  </p>
                )}
              </div>

              {loadingStockEditar && (
                <p className="text-sm text-gray-400 italic">
                  Verificando stock disponible...
                </p>
              )}
              {!loadingStockEditar && stockPreviewEditar && (
                <StockPreviewPanel preview={stockPreviewEditar} />
              )}

              <div className="flex gap-3 pt-2 pb-1">
                <button
                  type="button"
                  onClick={cerrarModalEditarCantidad}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarCantidad}
                  disabled={
                    (nuevaCantidad !== "" && Number(nuevaCantidad) <= 0) ||
                    (stockPreviewEditar !== null && !stockPreviewEditar.posible)
                  }
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors text-sm font-medium ${
                    (nuevaCantidad !== "" && Number(nuevaCantidad) <= 0) ||
                    (stockPreviewEditar !== null && !stockPreviewEditar.posible)
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Modal Editar Receta ── */}
      {modalEditarReceta && ordenEditandoReceta && (
        <ModalOverlay onClose={cerrarModalEditarReceta}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-base sm:text-lg truncate pr-2">
                Editar Receta — {ordenEditandoReceta.nombre_producto}
              </h2>
              <button
                onClick={cerrarModalEditarReceta}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg flex-shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingredientes
                </label>
                <div className="space-y-2">
                  {ingredientesEditados.map((ing, idx) => (
                    <div key={idx} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <select
                          value={ing.id_materia}
                          onChange={(e) =>
                            actualizarIngrediente(
                              idx,
                              "id_materia",
                              e.target.value,
                            )
                          }
                          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        >
                          <option value="">Materia prima</option>
                          {materiasPrimas
                            .filter((m) => m.estado === "Activo")
                            .map((m) => {
                              const enUso = ingredientesEditados.some(
                                (otro, i) =>
                                  i !== idx &&
                                  String(otro.id_materia) ===
                                    String(m.id_materia),
                              );
                              return (
                                <option
                                  key={m.id_materia}
                                  value={m.id_materia}
                                  disabled={enUso}
                                >
                                  {m.nombre}
                                  {enUso ? " (ya agregada)" : ""}
                                </option>
                              );
                            })}
                        </select>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={ing.cantidad_porcentaje}
                          onChange={(e) =>
                            actualizarIngrediente(
                              idx,
                              "cantidad_porcentaje",
                              e.target.value,
                            )
                          }
                          className={`w-20 sm:w-24 flex-shrink-0 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center ${
                            ing.cantidad_porcentaje <= 0
                              ? "border-red-400 bg-red-50"
                              : "border-gray-300"
                          }`}
                          placeholder="%"
                        />
                        <span className="text-gray-500 text-sm flex-shrink-0">
                          %
                        </span>
                        <button
                          type="button"
                          onClick={() => eliminarIngrediente(idx)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {ing.id_materia &&
                        ing.cantidad_porcentaje > 0 &&
                        (() => {
                          const info = stockEdicion[String(ing.id_materia)];
                          if (!info) return null;
                          const sinStock = !info.suficiente;
                          return (
                            <span
                              className={`text-xs px-2 py-1 rounded-lg w-fit ml-1 ${
                                sinStock
                                  ? "bg-red-100 text-red-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {sinStock
                                ? `❌ Faltan ${(info.cantidad_necesaria - info.stock_disponible).toFixed(2)} kg`
                                : `✅ ${info.stock_disponible.toFixed(2)} kg disponibles`}
                            </span>
                          );
                        })()}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={agregarIngrediente}
                  className="mt-3 flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" /> Agregar ingrediente
                </button>
              </div>

              <div
                className={`p-3 rounded-lg border ${Math.abs(sumaTotal - 100) <= 0.01 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
              >
                <p
                  className={`text-sm font-medium ${Math.abs(sumaTotal - 100) <= 0.01 ? "text-green-800" : "text-red-800"}`}
                >
                  Suma total: {sumaTotal.toFixed(2)}%
                  {Math.abs(sumaTotal - 100) <= 0.01
                    ? " ✓ Correcto"
                    : " — debe ser exactamente 100%"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo de la modificación
                </label>
                <textarea
                  value={motivoModificacion}
                  onChange={(e) => setMotivoModificacion(e.target.value)}
                  rows={3}
                  placeholder="Explique por qué se modifica la receta..."
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 resize-none text-sm ${
                    hubocambios && !motivoModificacion.trim()
                      ? "border-red-400 bg-red-50 focus:ring-red-400"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                />
                {hubocambios && !motivoModificacion.trim() && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Este campo es
                    obligatorio cuando se realizan cambios
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2 pb-1">
                <button
                  type="button"
                  onClick={cerrarModalEditarReceta}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarRecetaEditada}
                  disabled={guardandoReceta}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {guardandoReceta ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}

      {/* ── Modal Reasignar Operario ── */}
      {modalReasignar && ordenReasignando && (
        <ModalOverlay onClose={cerrarModalReasignar}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900 text-lg">
                Reasignar Operario
              </h2>
              <button
                onClick={cerrarModalReasignar}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <p className="font-medium mb-1 truncate">
                  {ordenReasignando.nombre_producto}
                </p>
                <p className="text-xs">
                  Cantidad: {ordenReasignando.cantidad_producir} KG
                </p>
                {ordenReasignando.usuario_inicio && (
                  <p className="text-xs">
                    Operario actual: {ordenReasignando.usuario_inicio}
                  </p>
                )}
                {ordenReasignando.usuario_creador && (
                  <p className="text-xs">
                    Creado por: {ordenReasignando.usuario_creador}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Operario
                </label>
                <select
                  value={nuevoOperarioId}
                  onChange={(e) => setNuevoOperarioId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">Seleccione un operario</option>
                  {operarios.map((op) => (
                    <option key={op.id_usuario} value={op.id_usuario}>
                      {op.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={cerrarModalReasignar}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarReasignacion}
                  className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  Reasignar
                </button>
              </div>
            </div>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
