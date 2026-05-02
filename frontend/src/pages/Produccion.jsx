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
import { toast } from "sonner";

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
  const [modalConfirmarInicio, setModalConfirmarInicio] = useState(false);
  const [ordenParaIniciar, setOrdenParaIniciar] = useState(null);
  const [modalConfirmarFinalizar, setModalConfirmarFinalizar] = useState(false);
  const [ordenParaFinalizar, setOrdenParaFinalizar] = useState(null);

  // Stock preview al crear orden
  const [stockPreview, setStockPreview] = useState(null);
  const [loadingStock, setLoadingStock] = useState(false);
  const [erroresFormulario, setErroresFormulario] = useState({});

  const [formulario, setFormulario] = useState({
    id_receta: "",
    cantidad_producir: "",
  });

  // ── Filtros de fecha ───────────────────────────────────────────
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const cambiarFiltroEstado = (valor) => {
  setFiltroEstado(valor);
  setFechaInicio("");
  setFechaFin("");
  setBusqueda("");
};

  // ── Modal editar cantidad ───────────────────────────────────────
  const [modalEditarCantidad, setModalEditarCantidad] = useState(false);
  const [ordenEditando, setOrdenEditando] = useState(null);
  const [nuevaCantidad, setNuevaCantidad] = useState("");
  const [nuevaRecetaId, setNuevaRecetaId] = useState("");
  const [stockPreviewEditar, setStockPreviewEditar] = useState(null);
  const [loadingStockEditar, setLoadingStockEditar] = useState(false);

  // ── Modal editar receta ─────────────────────────────────────────
  const [modalEditarReceta, setModalEditarReceta] = useState(false);
  const [ordenEditandoReceta, setOrdenEditandoReceta] = useState(null);
  const [ingredientesEditados, setIngredientesEditados] = useState([]);
  const [motivoModificacion, setMotivoModificacion] = useState("");
  const [guardandoReceta, setGuardandoReceta] = useState(false);
  const [stockEdicion, setStockEdicion] = useState({});

  // ── Modal reasignar operario ────────────────────────────────────
  const [modalReasignar, setModalReasignar] = useState(false);
  const [ordenReasignando, setOrdenReasignando] = useState(null);
  const [nuevoOperarioId, setNuevoOperarioId] = useState("");

  const token = localStorage.getItem("token");

  // ── Fetches ─────────────────────────────────────────────────────
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

  const fetchOperarios = async () => {
    try {
      const res = await fetch(
        "http://localhost:3000/api/produccion/operarios",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
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
        const res = await fetch(
          // 👇 agrega id_orden al query string
          `http://localhost:3000/api/produccion/verificar-stock?id_receta=${nuevaRecetaId}&cantidad_producir=${nuevaCantidad}&id_orden=${ordenEditando.id_orden_produccion}`,
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
    const errores = {};
    if (!formulario.id_receta) errores.id_receta = "Seleccione una receta";
    if (!formulario.cantidad_producir)
      errores.cantidad_producir = "Ingrese una cantidad";

    if (Object.keys(errores).length > 0) {
      setErroresFormulario(errores);
      return;
    }

    setErroresFormulario({});
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
        const res = await fetch(
          `http://localhost:3000/api/produccion/${ordenEditandoReceta.id_orden_produccion}/verificar-stock-edicion`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              ingredientes: ingredientesEditados.filter((i) => i.id_materia),
              cantidad_producir: ordenEditandoReceta.cantidad_producir,
            }),
          },
        );
        const data = await res.json();
        if (data.status === "success") {
          // Convertir a mapa por id_materia para acceso rápido
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

  // ── Iniciar producción ──────────────────────────────────────────
  const iniciarProduccion = async () => {
    try {
      await fetch(
        `http://localhost:3000/api/produccion/${ordenParaIniciar.id_orden_produccion}/iniciar`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setModalConfirmarInicio(false);
      setOrdenParaIniciar(null);
      fetchProducciones();
      toast.success("¡Orden iniciada correctamente!");
    } catch (error) {
      console.error(error);
    }
  };
  // ── Finalizar producción ────────────────────────────────────────
  const finalizarProduccion = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/produccion/${ordenParaFinalizar.id_orden_produccion}/finalizar`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
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
      toast.success("Orden eliminada correctamente");
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
    setErroresFormulario({});
  };

  // ── Editar cantidad ─────────────────────────────────────────────
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
      toast.error("Ingrese una cantidad válida");
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

  // ── Editar receta de la orden en proceso ────────────────────────
  const abrirModalEditarReceta = (produccion) => {
    // Si la orden tiene ingredientes propios editados, úsalos; si no, usa la receta base
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
      copia[idx].cantidad_porcentaje = num < 0 ? 0 : num; // 👈 no permite negativos
    }
    setIngredientesEditados(copia);
  };

  const sumaTotal = ingredientesEditados.reduce(
    (sum, ing) => sum + ing.cantidad_porcentaje,
    0,
  );

  const guardarRecetaEditada = async () => {
    if (ingredientesEditados.some((ing) => ing.cantidad_porcentaje <= 0)) {
      toast.error("Los porcentajes deben ser mayores a 0%");
      return;
    }

    if (ingredientesEditados.some((ing) => !ing.id_materia)) {
      toast.error(
        "Todos los ingredientes deben tener una materia prima seleccionada",
      );
      return;
    }

    if (Math.abs(sumaTotal - 100) > 0.01) {
      toast.error(
        `La suma de porcentajes debe ser 100%. Suma actual: ${sumaTotal.toFixed(2)}%`,
      );
      return;
    }

    if (!motivoModificacion.trim()) {
      toast.error("Debe especificar el motivo de la modificación");
      return;
    }

    // ── Validar stock disponible para cada ingrediente ──────────────
    const faltantesStock = ingredientesEditados.filter((ing) => {
      if (!ing.id_materia) return false;
      const info = stockEdicion[String(ing.id_materia)];
      return info && !info.suficiente;
    });

    if (faltantesStock.length > 0) {
      toast.error(
        `Stock insuficiente para: ${faltantesStock
          .map((ing) => {
            const info = stockEdicion[String(ing.id_materia)];
            return `${ing.nombre_materia} (necesita ${info.cantidad_necesaria.toFixed(2)} kg, disponible ${info.stock_disponible.toFixed(2)} kg)`;
          })
          .join(" | ")}`,
        { duration: 6000 },
      );
      return;
    }
    // ───────────────────────────────────────────────────────────────

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
      toast.error("Seleccione un operario");
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

  // ── Imprimir orden (mejorado con badge de receta modificada) ────
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
      produccion.usuario_inicio || // 👈 fallback: ya viene en el objeto de la orden
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

        // 👇 Buscar stock disponible real desde materiasPrimas
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
      <h4 style="color:#92400e;margin:0 0 8px 0;font-size:14px;">⚠️ RECETA MODIFICADA</h4>
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
            <div class="info-item">
              <label>Código de Orden</label>
              <span>${produccion.codigo_orden || `OP-${produccion.id_orden_produccion}`}</span>
            </div>
            <div class="info-item">
              <label>Estado</label>
              <span>EN PROCESO</span>
            </div>
            <div class="info-item">
              <label>Receta</label>
              <span>${receta.nombre_producto}</span>
            </div>
            <div class="info-item">
              <label>Peso Total a Producir</label>
              <span>${parseFloat(produccion.cantidad_producir).toFixed(2)} KG</span>
            </div>
            <div class="info-item">
              <label>Fecha de Creación</label>
              <span>${fechaFormateada}</span>
            </div>
            <div class="info-item">
              <label>Operario Asignado</label>
              <span>${operarioNombre}</span>
            </div>
          </div>
        </div>

        <div class="info-section">
          <h3>Ingredientes y Cantidades Necesarias</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Materia Prima</th>
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
          <div class="firma-box">
            <div class="firma-line"></div>
            <label>Operario de Producción</label>
          </div>
          <div class="firma-box">
            <div class="firma-line"></div>
            <label>Supervisor / Gerente</label>
          </div>
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

  // ── Estadísticas ────────────────────────────────────────────────
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

  // ── Filtrado ────────────────────────────────────────────────────
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

    if (filtroEstado !== "En proceso") {
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
    isAdministrador,
    user,
  ]);

  // ── Calcular materiales ─────────────────────────────────────────
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
        {isAdministrador && (
          <button
            onClick={() => setModalAbierto(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Crear Orden
          </button>
        )}
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

      {/* ── Filtros ── */}
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

        {filtroEstado !== "En proceso" && (
          <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              {filtroEstado === "Completada"
                ? "Fecha completada:"
                : "Fecha creación:"}
            </span>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-400 text-sm">—</span>
              <input
                type="date"
                value={fechaFin}
                min={fechaInicio || undefined}
                onChange={(e) => setFechaFin(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {(fechaInicio || fechaFin) && (
              <button
                onClick={() => {
                  setFechaInicio("");
                  setFechaFin("");
                }}
                className="text-sm text-gray-400 hover:text-gray-600 underline"
              >
                Limpiar
              </button>
            )}
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

            // Ingredientes propios de la orden o receta base
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

            // Detectar ingredientes nuevos o modificados respecto a la receta base
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
                        {/* Badge receta modificada */}
                        {recetaFueModificada && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full border border-yellow-200">
                            ⚠️ Receta modificada
                          </span>
                        )}
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
                    {esPendiente && (
                      <>
                        <button
                          onClick={() => {
                            setOrdenParaIniciar(p);
                            setModalConfirmarInicio(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <Play className="w-4 h-4" />
                          Iniciar
                        </button>
                        {/* ── Modal Confirmar Inicio ── */}
                        {modalConfirmarInicio && ordenParaIniciar && (
                          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
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
                                    <strong>
                                      "{ordenParaIniciar.nombre_producto}"
                                    </strong>{" "}
                                    por{" "}
                                    <strong>
                                      {ordenParaIniciar.cantidad_producir} KG
                                    </strong>
                                    ? Usted será asignado como responsable de
                                    esta producción.
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModalConfirmarInicio(false);
                                    setOrdenParaIniciar(null);
                                  }}
                                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={iniciarProduccion}
                                  className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium"
                                >
                                  Confirmar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
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

                    {esProceso && (
                      <>
                        {(isAdministrador ||
                          Number(p.id_usuario_inicio) ===
                            Number(user?.id_usuario)) && (
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
                              onClick={() => {
                                setOrdenParaFinalizar(p);
                                setModalConfirmarFinalizar(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                            >
                              <Check className="w-4 h-4" />
                              Completar
                            </button>
                          </>
                        )}
                        {/* ── Modal Confirmar Finalizar ── */}
                        {modalConfirmarFinalizar && ordenParaFinalizar && (
                          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
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
                                    <strong>
                                      "{ordenParaFinalizar.nombre_producto}"
                                    </strong>{" "}
                                    ha sido completada? Esto actualizará el
                                    inventario y consumirá los materiales.
                                  </p>
                                </div>
                              </div>

                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModalConfirmarFinalizar(false);
                                    setOrdenParaFinalizar(null);
                                  }}
                                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  onClick={finalizarProduccion}
                                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                                >
                                  Confirmar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
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

                {/* Materiales con colores si fue modificada */}
                {materialesOrden.length > 0 && (
                  <div className="border-t border-gray-200 pt-4">
                    <p className="text-sm font-medium text-gray-700 mb-3">
                      Materiales Necesarios:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {materialesOrden.map((mat, idx) => {
                        const esNuevo = nuevosIds.includes(mat.id_materia);
                        const esEditado = modificadosIds.includes(
                          mat.id_materia,
                        );
                        return (
                          <div
                            key={idx}
                            className={`flex items-center justify-between p-3 rounded-lg ${
                              esNuevo
                                ? "bg-green-50 border border-green-200"
                                : esEditado
                                  ? "bg-yellow-50 border border-yellow-200"
                                  : "bg-gray-50"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Package
                                className={`w-4 h-4 ${esNuevo ? "text-green-600" : esEditado ? "text-yellow-600" : "text-gray-600"}`}
                              />
                              <div className="flex flex-col">
                                <span
                                  className={`text-sm ${esNuevo || esEditado ? "font-semibold" : ""} text-gray-700`}
                                >
                                  {mat.nombre}
                                </span>
                                {esNuevo && (
                                  <span className="text-xs text-green-600 font-medium">
                                    ✨ Nuevo ingrediente
                                  </span>
                                )}
                                {esEditado && (
                                  <span className="text-xs text-yellow-600 font-medium">
                                    ✏️ Cantidad modificada
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
                              className={`text-sm font-bold ${esNuevo ? "text-green-700" : esEditado ? "text-yellow-700" : "text-gray-900"}`}
                            >
                              {mat.cantidadNecesaria.toFixed(2)} KG
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Badge de receta modificada con motivo */}
                {recetaFueModificada && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-900 font-medium mb-2">
                      ⚠️ Receta Modificada
                    </p>
                    {p.observaciones && (
                      <p className="text-sm text-yellow-700 mb-2">
                        <strong>Motivo:</strong> {p.observaciones}
                      </p>
                    )}

                    {/* Ingredientes eliminados */}
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

                    {/* Ingredientes agregados */}
                    {nuevosIds.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 mb-1">
                          ✨ Ingredientes agregados:
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
                <div className="relative">
                  <select
                    value={formulario.id_receta}
                    onChange={(e) => {
                      setFormulario({
                        ...formulario,
                        id_receta: e.target.value,
                      });
                      setErroresFormulario((prev) => ({
                        ...prev,
                        id_receta: undefined,
                      }));
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
                  {erroresFormulario.id_receta && (
                    <div className="absolute left-2 top-full mt-1 z-50 flex items-center gap-1.5 bg-gray-800 text-white text-xs px-3 py-1.5 rounded shadow-lg whitespace-nowrap">
                      <div className="absolute -top-1.5 left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-800" />
                      <span className="bg-yellow-400 text-gray-900 font-bold rounded-sm px-1 text-xs">
                        !
                      </span>
                      {erroresFormulario.id_receta}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad a Producir (KG)
                </label>
                <div className="relative">
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
                      setFormulario({
                        ...formulario,
                        cantidad_producir: valor,
                      });
                      setErroresFormulario((prev) => ({
                        ...prev,
                        cantidad_producir: undefined,
                      }));
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      formulario.cantidad_producir !== "" &&
                      Number(formulario.cantidad_producir) <= 0
                        ? "border-red-400 bg-red-50"
                        : erroresFormulario.cantidad_producir
                          ? "border-red-400 bg-red-50"
                          : "border-gray-300"
                    }`}
                  />
                  {erroresFormulario.cantidad_producir && (
                    <div className="absolute left-2 top-full mt-1 z-50 flex items-center gap-1.5 bg-gray-800 text-white text-xs px-3 py-1.5 rounded shadow-lg whitespace-nowrap">
                      <div className="absolute -top-1.5 left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-800" />
                      <span className="bg-yellow-400 text-gray-900 font-bold rounded-sm px-1 text-xs">
                        !
                      </span>
                      {erroresFormulario.cantidad_producir}
                    </div>
                  )}
                  {formulario.cantidad_producir !== "" &&
                    Number(formulario.cantidad_producir) <= 0 && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        La cantidad debe ser mayor a 0
                      </p>
                    )}
                </div>
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
                  className={`p-4 rounded-lg border-2 ${stockPreview.posible ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {stockPreview.posible ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <h4
                      className={`font-medium ${stockPreview.posible ? "text-green-900" : "text-red-900"}`}
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
                        className={`p-3 rounded-lg border ${ing.suficiente ? "bg-white border-gray-200" : "bg-red-100 border-red-300"}`}
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

      {/* ── Modal Editar Cantidad ── */}
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
                  className={`p-4 rounded-lg border-2 ${stockPreviewEditar.posible ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    {stockPreviewEditar.posible ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <h4
                      className={`font-medium ${stockPreviewEditar.posible ? "text-green-900" : "text-red-900"}`}
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
                        className={`p-3 rounded-lg border ${ing.suficiente ? "bg-white border-gray-200" : "bg-red-100 border-red-300"}`}
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

      {/* ── Modal Editar Receta ── */}
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
                          className={`w-24 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-center ${
                            ing.cantidad_porcentaje <= 0
                              ? "border-red-400 bg-red-50"
                              : "border-gray-300"
                          }`}
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

                      {ing.id_materia &&
                        ing.cantidad_porcentaje > 0 &&
                        (() => {
                          const info = stockEdicion[String(ing.id_materia)];
                          if (!info) return null;
                          const sinStock = !info.suficiente;
                          return (
                            <span
                              className={`text-xs px-2 py-1 rounded-lg whitespace-nowrap w-fit ml-1 ${
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
                  <Plus className="w-4 h-4" />
                  Agregar ingrediente
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

      {/* ── Modal Reasignar Operario ── */}
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
                <p className="font-medium mb-1">
                  {ordenReasignando.nombre_producto}
                </p>
                <p>Cantidad: {ordenReasignando.cantidad_producir} KG</p>
                {ordenReasignando.usuario_inicio && (
                  <p>Operario actual: {ordenReasignando.usuario_inicio}</p>
                )}
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
