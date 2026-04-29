import React, { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function ProduccionPage() {
  const { isAdministrador, user } = useAuth();

  const [producciones, setProducciones] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [materiasPrimas, setMateriasPrimas] = useState([]);
  const [operarios, setOperarios] = useState([]);
  const [recetaDetalle, setRecetaDetalle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("Pendiente");

  // Stock preview al crear orden
  const [stockPreview, setStockPreview] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);

  const [formulario, setFormulario] = useState({
    id_receta: "",
    cantidad_producir: "",
  });

  // ── Filtros de fecha (Pendiente y Completada) ───────────────────
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [busqueda, setBusqueda] = useState("");

  // Limpia fechas al cambiar de tab para no arrastrar filtros viejos
  const cambiarFiltroEstado = (valor) => {
  setFiltroEstado(valor);
  setFechaInicio("");
  setFechaFin("");
  setBusqueda("");
};

  // ── Modal editar cantidad (solo admin, orden pendiente) ─────────────────────
  const [modalEditarCantidad, setModalEditarCantidad] = useState(false);
  const [ordenEditando, setOrdenEditando] = useState(null);
  const [nuevaCantidad, setNuevaCantidad] = useState("");
  const [nuevaRecetaId, setNuevaRecetaId] = useState("");
  const [stockPreviewEditar, setStockPreviewEditar] = useState(null);
  const [loadingStockEditar, setLoadingStockEditar] = useState(false);

  // ── Modal editar receta (admin y operario, orden en proceso) ────────────────
  const [modalEditarReceta, setModalEditarReceta] = useState(false);
  const [ordenEditandoReceta, setOrdenEditandoReceta] = useState(null);
  const [ingredientesEditados, setIngredientesEditados] = useState([]);
  const [motivoModificacion, setMotivoModificacion] = useState("");
  const [guardandoReceta, setGuardandoReceta] = useState(false);

  // ── Modal reasignar operario (solo admin, orden en proceso) ─────────────────
  const [modalReasignar, setModalReasignar] = useState(false);
  const [ordenReasignando, setOrdenReasignando] = useState(null);
  const [nuevoOperarioId, setNuevoOperarioId] = useState("");

  const token = localStorage.getItem("token");

  // ── Fetch producciones ──────────────────────────────────────────
  const fetchProducciones = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/produccion", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setProducciones(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error(error);
      setProducciones([]);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch recetas ───────────────────────────────────────────────
  const fetchRecetas = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/recetas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRecetas(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error(error);
    }
  };

  // ── Fetch materias primas (para el modal editar receta) ─────────
  const fetchMateriasPrimas = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/materias-primas", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMateriasPrimas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    }
  };

  // ── Fetch operarios — usa la ruta interna de producción ─────────
  const fetchOperarios = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/produccion/operarios", {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  // Cuando cambia la receta en el formulario de crear
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

  // Verificar stock al crear — debounce 400ms
  useEffect(() => {
    const { id_receta, cantidad_producir } = formulario;
    if (!id_receta || !cantidad_producir || Number(cantidad_producir) <= 0) {
      setStockPreview(null);
      return;
    }
    setLoadingStock(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/produccion/verificar-stock?id_receta=${id_receta}&cantidad_producir=${cantidad_producir}`,
          { headers: { Authorization: `Bearer ${token}` } },
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

  // Verificar stock al editar cantidad — debounce 400ms
  useEffect(() => {
    if (!ordenEditando || !nuevaCantidad || Number(nuevaCantidad) <= 0 || !nuevaRecetaId) {
      setStockPreviewEditar(null);
      return;
    }
    setLoadingStockEditar(true);
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/api/produccion/verificar-stock?id_receta=${nuevaRecetaId}&cantidad_producir=${nuevaCantidad}`,
          { headers: { Authorization: `Bearer ${token}` } },
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

  // ── Crear orden ─────────────────────────────────────────────────
  const crearProduccion = async () => {
    if (!formulario.id_receta || !formulario.cantidad_producir) {
      alert("Todos los campos son obligatorios");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/produccion", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id_receta: Number(formulario.id_receta),
          cantidad_producir: Number(formulario.cantidad_producir),
        }),
      });
      const data = await res.json();
      if (data.status === "error") {
        alert(data.message);
        return;
      }
      cerrarModal();
      fetchProducciones();
    } catch (error) {
      console.error(error);
    }
  };

  // ── Iniciar producción ──────────────────────────────────────────
  const iniciarProduccion = async (id) => {
    if (!window.confirm("¿Desea iniciar esta orden de producción?")) return;
    try {
      await fetch(`http://localhost:3000/api/produccion/${id}/iniciar`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducciones();
    } catch (error) {
      console.error(error);
    }
  };

  // ── Finalizar producción ────────────────────────────────────────
  const finalizarProduccion = async (id) => {
    if (
      !window.confirm(
        "¿Confirma que la producción fue completada? Esto actualizará el inventario.",
      )
    )
      return;
    try {
      const res = await fetch(`http://localhost:3000/api/produccion/${id}/finalizar`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.status === "error") {
        alert(data.message);
        return;
      }
      fetchProducciones();
    } catch (error) {
      console.error(error);
    }
  };

  // ── Eliminar ────────────────────────────────────────────────────
  const eliminarProduccion = async (id, nombre) => {
    if (
      !window.confirm(
        `¿Eliminar la orden de "${nombre}"? Esta acción no se puede deshacer.`,
      )
    )
      return;
    try {
      await fetch(`http://localhost:3000/api/produccion/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchProducciones();
    } catch (error) {
      console.error(error);
    }
  };

  // ── Cerrar modal crear ──────────────────────────────────────────
  const cerrarModal = () => {
    setModalAbierto(false);
    setFormulario({ id_receta: "", cantidad_producir: "" });
    setRecetaDetalle(null);
    setStockPreview(null);
  };

  // ── Editar cantidad (modal) ─────────────────────────────────────
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
    if (!nuevaCantidad || Number(nuevaCantidad) <= 0) {
      alert("Ingrese una cantidad válida");
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:3000/api/produccion/${ordenEditando.id_orden_produccion}/cantidad`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cantidad_producir: Number(nuevaCantidad),
            id_receta: Number(nuevaRecetaId),
          }),
        },
      );
      const data = await res.json();
      if (data.status === "error") {
        alert(data.message);
        return;
      }
      cerrarModalEditarCantidad();
      fetchProducciones();
    } catch (error) {
      console.error(error);
    }
  };

  // ── Editar receta de la orden en proceso ────────────────────────
  const abrirModalEditarReceta = (produccion) => {
    const receta = recetas.find((r) => r.id_receta === produccion.id_receta);
    if (!receta) return;
    setOrdenEditandoReceta(produccion);
    setIngredientesEditados(
      receta.ingredientes.map((ing) => ({
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
      copia[idx].cantidad_porcentaje = parseFloat(valor) || 0;
    }
    setIngredientesEditados(copia);
  };

  const sumaTotal = ingredientesEditados.reduce(
    (sum, ing) => sum + ing.cantidad_porcentaje,
    0,
  );

  const guardarRecetaEditada = async () => {
    if (ingredientesEditados.some((ing) => !ing.id_materia)) {
      alert("Todos los ingredientes deben tener una materia prima seleccionada");
      return;
    }
    if (Math.abs(sumaTotal - 100) > 0.01) {
      alert(
        `La suma de porcentajes debe ser 100%. Suma actual: ${sumaTotal.toFixed(2)}%`,
      );
      return;
    }
    if (!motivoModificacion.trim()) {
      alert("Debe especificar el motivo de la modificación");
      return;
    }
    setGuardandoReceta(true);
    try {
      const res = await fetch(
        `http://localhost:3000/api/produccion/${ordenEditandoReceta.id_orden_produccion}/receta`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ingredientes: ingredientesEditados,
            motivo: motivoModificacion,
          }),
        },
      );
      const data = await res.json();
      if (data.status === "error") {
        alert(data.message);
        return;
      }
      cerrarModalEditarReceta();
      fetchProducciones();
      fetchRecetas();
    } catch (error) {
      console.error(error);
    } finally {
      setGuardandoReceta(false);
    }
  };

  // ── Reasignar operario ──────────────────────────────────────────
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
      alert("Seleccione un operario");
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:3000/api/produccion/${ordenReasignando.id_orden_produccion}/reasignar`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ id_usuario_inicio: Number(nuevoOperarioId) }),
        },
      );
      const data = await res.json();
      if (data.status === "error") {
        alert(data.message);
        return;
      }
      cerrarModalReasignar();
      fetchProducciones();
    } catch (error) {
      console.error(error);
    }
  };

  // ── Imprimir orden ──────────────────────────────────────────────
  const imprimirOrden = (produccion) => {
    const receta = recetas.find((r) => r.id_receta === produccion.id_receta);
    if (!receta) return;

    const ingredientes = receta.ingredientes || [];
    const filas = ingredientes
      .map((ing) => {
        const cantNecesaria =
          (parseFloat(ing.cantidad_porcentaje) / 100) *
          parseFloat(produccion.cantidad_producir);
        return `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${ing.nombre_materia}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${parseFloat(ing.cantidad_porcentaje).toFixed(2)}%</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;">${cantNecesaria.toFixed(2)} KG</td>
          </tr>`;
      })
      .join("");

    const operarioNombre =
      operarios.find(
        (o) => o.id_usuario === produccion.id_usuario_inicio,
      )?.nombre || "Sin asignar";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Orden de Producción</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            h1 { font-size: 22px; margin-bottom: 4px; }
            h2 { font-size: 16px; font-weight: normal; color: #6b7280; margin-bottom: 24px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
            .campo { background: #f9fafb; border-radius: 6px; padding: 10px 14px; }
            .campo label { font-size: 11px; color: #6b7280; display: block; margin-bottom: 2px; }
            .campo span { font-size: 14px; font-weight: 600; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            thead tr { background: #1e40af; color: white; }
            thead th { padding: 10px 12px; text-align: left; font-size: 13px; }
            tbody tr:nth-child(even) { background: #f3f4f6; }
            .total-row { background: #dbeafe !important; font-weight: bold; }
            .firma { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 60px; }
            .firma div { border-top: 1px solid #9ca3af; padding-top: 8px; text-align: center; font-size: 13px; color: #6b7280; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <button onclick="window.print()" style="margin-bottom:20px;padding:8px 20px;background:#1e40af;color:white;border:none;border-radius:6px;cursor:pointer;font-size:14px;">
            🖨️ Imprimir
          </button>
          <h1>CASERCON S.A.S — Orden de Producción</h1>
          <h2>Estado: En Proceso</h2>
          <div class="grid">
            <div class="campo"><label>Producto</label><span>${receta.nombre_producto}</span></div>
            <div class="campo"><label>Cantidad a producir</label><span>${parseFloat(produccion.cantidad_producir).toFixed(2)} KG</span></div>
            <div class="campo"><label>Fecha creación</label><span>${new Date(produccion.fecha_creacion).toLocaleDateString("es-CO")}</span></div>
            <div class="campo"><label>Operario asignado</label><span>${operarioNombre}</span></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Materia Prima</th>
                <th style="text-align:center">% Receta</th>
                <th style="text-align:center">Cantidad Necesaria</th>
              </tr>
            </thead>
            <tbody>
              ${filas}
              <tr class="total-row">
                <td style="padding:8px 12px;">TOTAL</td>
                <td style="padding:8px 12px;text-align:center;">100%</td>
                <td style="padding:8px 12px;text-align:center;">${parseFloat(produccion.cantidad_producir).toFixed(2)} KG</td>
              </tr>
            </tbody>
          </table>
          <div class="firma">
            <div>Firma Operario</div>
            <div>Firma Supervisor</div>
          </div>
        </body>
      </html>`;

    const ventana = window.open("", "_blank");
    if (!ventana) return;
    ventana.document.write(html);
    ventana.document.close();
  };

  // ── Estadísticas ────────────────────────────────────────────────
  // Pendientes: conteo global para todos
  // En proceso y Completadas: solo las propias si es operario
  const estadisticas = useMemo(() => {
    const esSoloOperario = !isAdministrador;
    const miId = Number(user?.id_usuario);

    const pendientes = producciones.filter(
      (p) => p.estado === "Pendiente"
    ).length;

    const enProceso = producciones.filter(
      (p) =>
        p.estado === "En proceso" &&
        (!esSoloOperario || Number(p.id_usuario_inicio) === miId)
    ).length;

    const completadas = producciones.filter(
      (p) =>
        p.estado === "Completada" &&
        (!esSoloOperario || Number(p.id_usuario_fin) === miId)
    ).length;

    // Total: para admin es todo el sistema; para operario es lo que puede ver
    const total = esSoloOperario
      ? pendientes + enProceso + completadas
      : producciones.length;

    return { total, pendientes, enProceso, completadas };
  }, [producciones, isAdministrador, user]);

  // ── Filtrado ────────────────────────────────────────────────────
  // Operario: en "En proceso" solo ve sus órdenes propias
  //           en "Completada" solo ve las que él completó
  //           en "Pendiente" ve todas (son globales)
  const produccionesFiltradas = useMemo(() => {
    const esSoloOperario = !isAdministrador;
    const miId = Number(user?.id_usuario);

    let resultado = producciones.filter((p) => {
      if (p.estado !== filtroEstado) return false;

      // Operario viendo tab "En proceso": solo sus órdenes
      if (esSoloOperario && p.estado === "En proceso") {
        return Number(p.id_usuario_inicio) === miId;
      }

      // Operario viendo tab "Completada": solo las que él completó
      if (esSoloOperario && p.estado === "Completada") {
        return Number(p.id_usuario_fin) === miId;
      }

      return true; // Pendientes: todos las ven
    });

  if (busqueda.trim()) {
    const term = busqueda.toLowerCase();
    resultado = resultado.filter((p) =>
      p.nombre_producto?.toLowerCase().includes(term) ||
      p.codigo_orden?.toLowerCase().includes(term) ||
      p.usuario_creador?.toLowerCase().includes(term) ||
      p.usuario_inicio?.toLowerCase().includes(term)
    );
  }

  if (filtroEstado !== "En proceso") {
    if (fechaInicio) {
      const inicio = new Date(fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      resultado = resultado.filter((p) => {
        const campo = filtroEstado === "Completada" ? p.fecha_finalizacion : p.fecha_creacion;
        return campo && new Date(campo) >= inicio;
      });
    }
    if (fechaFin) {
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999);
      resultado = resultado.filter((p) => {
        const campo = filtroEstado === "Completada" ? p.fecha_finalizacion : p.fecha_creacion;
        return campo && new Date(campo) <= fin;
      });
    }
  }

  return resultado.sort(
    (a, b) => new Date(b.fecha_creacion || 0) - new Date(a.fecha_creacion || 0)
  );
}, [producciones, filtroEstado, fechaInicio, fechaFin, busqueda]);

  // ── Calcular materiales desde ingredientes de la receta ─────────
  const calcularMateriales = (ingredientes, cantidad) => {
    if (!ingredientes || !cantidad || isNaN(Number(cantidad))) return [];
    return ingredientes.map((ing) => ({
      nombre: ing.nombre_materia,
      porcentaje: parseFloat(ing.cantidad_porcentaje),
      cantidadNecesaria:
        (parseFloat(ing.cantidad_porcentaje) / 100) * Number(cantidad),
    }));
  };

  // Preview de materiales en el modal
  const previewMateriales = useMemo(() => {
    if (!recetaDetalle?.ingredientes || !formulario.cantidad_producir)
      return null;
    return calcularMateriales(
      recetaDetalle.ingredientes,
      formulario.cantidad_producir,
    );
  }, [recetaDetalle, formulario.cantidad_producir]);

  // ── Badge de estado ─────────────────────────────────────────────
  const getEstadoBadge = (estado) => {
    const config = {
      Pendiente: {
        clase: "bg-yellow-100 text-yellow-700",
        icono: <Clock className="w-4 h-4" />,
        label: "Pendiente",
      },
      "En proceso": {
        clase: "bg-blue-100 text-blue-700",
        icono: <Play className="w-4 h-4" />,
        label: "En Proceso",
      },
      Completada: {
        clase: "bg-green-100 text-green-700",
        icono: <CheckCircle className="w-4 h-4" />,
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
        className={`inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full ${c.clase}`}
      >
        {c.icono}
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900 text-2xl">
            Órdenes de Producción
          </h1>
          <p className="text-gray-600 mt-1">
            Crea y gestiona órdenes de producción
          </p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Crear Orden
        </button>
      </div>

      {/* ── Estadísticas ── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Órdenes</p>
          <p className="text-2xl font-bold text-gray-900">
            {estadisticas.total}
          </p>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
          <p className="text-sm text-yellow-700 mb-1">Pendientes</p>
          <p className="text-2xl font-bold text-yellow-700">
            {estadisticas.pendientes}
          </p>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-sm text-blue-700 mb-1">En Proceso</p>
          <p className="text-2xl font-bold text-blue-700">
            {estadisticas.enProceso}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-4">
          <p className="text-sm text-green-700 mb-1">Completadas</p>
          <p className="text-2xl font-bold text-green-700">
            {estadisticas.completadas}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
  {/* Tabs — siempre visibles */}
  <div className="flex gap-2 flex-wrap">
    {[
      { label: "Pendientes", value: "Pendiente", active: "bg-yellow-600" },
      { label: "En Proceso", value: "En proceso", active: "bg-blue-600"  },
      { label: "Completadas", value: "Completada", active: "bg-green-600" },
    ].map(({ label, value, active }) => (
      <button
        key={value}
        onClick={() => cambiarFiltroEstado(value)}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          filtroEstado === value
            ? `${active} text-white`
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
      >
        {label}
      </button>
    ))}
  </div>

  {/* Búsqueda — siempre visible en todos los estados */}
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
    <input
      type="text"
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
      placeholder="Buscar por producto, código u operario..."
      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>

  {/* Rango de fechas — solo en Completadas */}
  {filtroEstado === "Completada" && (
    <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-gray-100">
      <span className="text-sm font-medium text-gray-500">Fecha completada:</span>
      <div className="flex items-center gap-2">
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
        </div>
        <span className="text-gray-400 font-medium">—</span>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="date"
            value={fechaFin}
            min={fechaInicio || undefined}
            onChange={(e) => setFechaFin(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
          />
        </div>
        {(fechaInicio || fechaFin) && (
          <button
            onClick={() => { setFechaInicio(""); setFechaFin(""); }}
            className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <X className="w-4 h-4" />
            Limpiar
          </button>
        )}
      </div>
    </div>
  )}
</div>

      {/* ── Lista de órdenes ── */}
      <div className="space-y-4">
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
          produccionesFiltradas.map((p) => {
            const esPendiente = p.estado === "Pendiente";
            const esProceso = p.estado === "En proceso";

            const recetaDeOrden = recetas.find(
              (r) => r.id_receta === p.id_receta,
            );
            const materialesOrden = recetaDeOrden?.ingredientes
              ? calcularMateriales(
                  recetaDeOrden.ingredientes,
                  p.cantidad_producir,
                )
              : [];

            return (
              <div
                key={p.id_orden_produccion}
                className="bg-white rounded-lg border-2 border-gray-200 shadow-sm p-6"
              >
                {/* Cabecera */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Factory className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-gray-900">
                          {p.nombre_producto}
                        </h3>
                        {getEstadoBadge(p.estado)}
                      </div>
                      {p.codigo_orden && (
                        <p className="text-sm text-gray-500">
                          {p.codigo_orden}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-wrap justify-end">

                    {/* ── Pendiente ── */}
                    {esPendiente && (
                      <>
                        <button
                          onClick={() => iniciarProduccion(p.id_orden_produccion)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Play className="w-4 h-4" />
                          Iniciar
                        </button>

                        {/* Solo admin: editar cantidad y eliminar */}
                        {isAdministrador && (
                          <>
                            <button
                              onClick={() => abrirModalEditarCantidad(p)}
                              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                            >
                              <Edit className="w-4 h-4" />
                              Editar
                            </button>
                            <button
                              onClick={() =>
                                eliminarProduccion(
                                  p.id_orden_produccion,
                                  p.nombre_producto,
                                )
                              }
                              className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                              Eliminar
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {/* ── En proceso ── */}
                    {esProceso && (
                      <>
                        {/* Imprimir, editar receta y completar — solo el operario asignado o el admin */}
                        {(isAdministrador || Number(p.id_usuario_inicio) === Number(user?.id_usuario)) && (
                          <>
                            <button
                              onClick={() => imprimirOrden(p)}
                              className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                            >
                              <Printer className="w-4 h-4" />
                              Imprimir
                            </button>

                            <button
                              onClick={() => abrirModalEditarReceta(p)}
                              className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                            >
                              <Edit className="w-4 h-4" />
                              Editar receta
                            </button>

                            <button
                              onClick={() => finalizarProduccion(p.id_orden_produccion)}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <Check className="w-4 h-4" />
                              Completar
                            </button>
                          </>
                        )}

                        {/* Reasignar — solo admin */}
                        {isAdministrador && (
                          <button
                            onClick={() => abrirModalReasignar(p)}
                            className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                          >
                            <Users className="w-4 h-4" />
                            Reasignar
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500 mb-1">Cantidad a Producir</p>
                    <p className="font-medium text-gray-900">
                      {p.cantidad_producir} KG
                    </p>
                  </div>
                  {p.fecha_creacion && (
                    <div>
                      <p className="text-gray-500 mb-1">Fecha Creación</p>
                      <p className="font-medium text-gray-900">
                        {new Date(p.fecha_creacion).toLocaleDateString("es-CO")}
                      </p>
                    </div>
                  )}
                  {p.fecha_finalizacion && (
                    <div>
                      <p className="text-gray-500 mb-1">Fecha Completada</p>
                      <p className="font-medium text-gray-900">
                        {new Date(p.fecha_finalizacion).toLocaleDateString(
                          "es-CO",
                        )}
                      </p>
                    </div>
                  )}
                  {p.usuario_creador && (
                    <div>
                      <p className="text-gray-500 mb-1">Creado por</p>
                      <p className="font-medium text-gray-900">
                        {p.usuario_creador}
                      </p>
                    </div>
                  )}
                  {p.usuario_inicio && (
                    <div>
                      <p className="text-gray-500 mb-1">Iniciado por</p>
                      <p className="font-medium text-gray-900">
                        {p.usuario_inicio}
                      </p>
                    </div>
                  )}
                  {p.usuario_fin && (
                    <div>
                      <p className="text-gray-500 mb-1">Completado por</p>
                      <p className="font-medium text-gray-900">
                        {p.usuario_fin}
                      </p>
                    </div>
                  )}
                </div>

                {/* Materiales calculados por porcentaje */}
                {materialesOrden.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Materiales Necesarios:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {materialesOrden.map((mat, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-600" />
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-700">
                                {mat.nombre}
                              </span>
                              <span className="text-xs text-gray-400">
                                {mat.porcentaje}%
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gray-900">
                            {mat.cantidadNecesaria.toFixed(2)} KG
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Modal Crear Orden ── */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-xl">
                Crear Orden de Producción
              </h2>
              <button
                onClick={cerrarModal}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Seleccione Receta
                </label>
                <select
                  value={formulario.id_receta}
                  onChange={(e) =>
                    setFormulario({ ...formulario, id_receta: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  placeholder="Ej: 100"
                  value={formulario.cantidad_producir}
                  onChange={(e) =>
                    setFormulario({
                      ...formulario,
                      cantidad_producir: e.target.value,
                    })
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    formulario.cantidad_producir !== "" &&
                    Number(formulario.cantidad_producir) <= 0
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300"
                  }`}
                />
                {formulario.cantidad_producir !== "" &&
                  Number(formulario.cantidad_producir) <= 0 && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      La cantidad debe ser mayor a 0
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
                <div
                  className={`p-4 rounded-lg border-2 ${
                    stockPreview.posible
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {stockPreview.posible ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <h4
                      className={`font-medium ${
                        stockPreview.posible ? "text-green-900" : "text-red-900"
                      }`}
                    >
                      {stockPreview.posible
                        ? "Stock suficiente — se puede crear la orden"
                        : "Stock insuficiente — no se puede crear la orden"}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {stockPreview.ingredientes.map((ing, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          ing.suficiente
                            ? "bg-white border-gray-200"
                            : "bg-red-100 border-red-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">
                              {ing.nombre_materia}
                            </span>
                            <span className="text-xs text-gray-400">
                              {ing.cantidad_porcentaje}% de la mezcla
                            </span>
                          </div>
                          <div className="text-right text-sm">
                            <p
                              className={`font-bold ${
                                ing.suficiente ? "text-gray-900" : "text-red-700"
                              }`}
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
                            {(
                              ing.cantidad_necesaria - ing.stock_disponible
                            ).toFixed(2)}{" "}
                            KG
                          </p>
                        )}
                      </div>
                    ))}
                    <div className="flex items-center justify-between text-sm p-3 bg-blue-50 rounded-lg border border-blue-100 font-medium">
                      <span className="text-blue-900">Total a consumir</span>
                      <span className="text-blue-900">
                        {stockPreview.ingredientes
                          .reduce((sum, i) => sum + i.cantidad_necesaria, 0)
                          .toFixed(2)}{" "}
                        KG
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
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
        </div>
      )}

      {/* ── Modal Editar Cantidad (solo admin, orden pendiente) ── */}
      {modalEditarCantidad && ordenEditando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-xl">
                Editar Cantidad — {ordenEditando.nombre_producto}
              </h2>
              <button
                onClick={cerrarModalEditarCantidad}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  Nueva Cantidad a Producir (KG)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={nuevaCantidad}
                  onChange={(e) => setNuevaCantidad(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    nuevaCantidad !== "" && Number(nuevaCantidad) <= 0
                      ? "border-red-400 bg-red-50"
                      : "border-gray-300"
                  }`}
                />
                {nuevaCantidad !== "" && Number(nuevaCantidad) <= 0 && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    La cantidad debe ser mayor a 0
                  </p>
                )}
              </div>

              {loadingStockEditar && (
                <p className="text-sm text-gray-400 italic">
                  Verificando stock disponible...
                </p>
              )}

              {!loadingStockEditar && stockPreviewEditar && (
                <div
                  className={`p-4 rounded-lg border-2 ${
                    stockPreviewEditar.posible
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {stockPreviewEditar.posible ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <h4
                      className={`font-medium ${
                        stockPreviewEditar.posible
                          ? "text-green-900"
                          : "text-red-900"
                      }`}
                    >
                      {stockPreviewEditar.posible
                        ? "Stock suficiente para la nueva cantidad"
                        : "Stock insuficiente para la nueva cantidad"}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {stockPreviewEditar.ingredientes.map((ing, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border ${
                          ing.suficiente
                            ? "bg-white border-gray-200"
                            : "bg-red-100 border-red-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-800">
                              {ing.nombre_materia}
                            </span>
                            <span className="text-xs text-gray-400">
                              {ing.cantidad_porcentaje}% de la mezcla
                            </span>
                          </div>
                          <div className="text-right text-sm">
                            <p
                              className={`font-bold ${
                                ing.suficiente ? "text-gray-900" : "text-red-700"
                              }`}
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
                            {(
                              ing.cantidad_necesaria - ing.stock_disponible
                            ).toFixed(2)}{" "}
                            KG
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModalEditarCantidad}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
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
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
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
        </div>
      )}

      {/* ── Modal Editar Receta (admin y operario, orden en proceso) ── */}
      {modalEditarReceta && ordenEditandoReceta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-xl">
                Editar Receta — {ordenEditandoReceta.nombre_producto}
              </h2>
              <button
                onClick={cerrarModalEditarReceta}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingredientes
                </label>
                <div className="space-y-2">
                  {ingredientesEditados.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={ing.id_materia}
                        onChange={(e) =>
                          actualizarIngrediente(idx, "id_materia", e.target.value)
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">Seleccione materia prima</option>
                        {materiasPrimas
                          .filter((m) => m.estado === "Activo")
                          .map((m) => (
                            <option key={m.id_materia} value={m.id_materia}>
                              {m.nombre}
                            </option>
                          ))}
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
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center"
                        placeholder="%"
                      />
                      <span className="text-gray-500 text-sm">%</span>
                      <button
                        type="button"
                        onClick={() => eliminarIngrediente(idx)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={agregarIngrediente}
                  className="mt-3 flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Agregar ingrediente
                </button>
              </div>

              {/* Suma de porcentajes */}
              <div
                className={`p-3 rounded-lg border ${
                  Math.abs(sumaTotal - 100) <= 0.01
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <p
                  className={`text-sm font-medium ${
                    Math.abs(sumaTotal - 100) <= 0.01
                      ? "text-green-800"
                      : "text-red-800"
                  }`}
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
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModalEditarReceta}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarRecetaEditada}
                  disabled={guardandoReceta}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                >
                  {guardandoReceta ? "Guardando..." : "Guardar cambios"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Reasignar Operario (solo admin, orden en proceso) ── */}
      {modalReasignar && ordenReasignando && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-xl">
                Reasignar Operario
              </h2>
              <button
                onClick={cerrarModalReasignar}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                <p className="font-medium mb-1">{ordenReasignando.nombre_producto}</p>
                <p>Cantidad: {ordenReasignando.cantidad_producir} KG</p>
                {ordenReasignando.usuario_creador && (
                  <p>Creado por: {ordenReasignando.usuario_creador}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nuevo Operario
                </label>
                <select
                  value={nuevoOperarioId}
                  onChange={(e) => setNuevoOperarioId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un operario</option>
                  {operarios.map((op) => (
                    <option key={op.id_usuario} value={op.id_usuario}>
                      {op.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModalReasignar}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarReasignacion}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Reasignar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}