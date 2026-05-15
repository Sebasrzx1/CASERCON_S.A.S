import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Ban,
  Check,
  AlertTriangle,
  CheckCircle,
  X,
  XCircle,
} from "lucide-react";
import { z } from "zod";
import { toast } from "sonner";
import API_URL from "../service/api";

// ══════════════════════════════════════════
// Schema de validación
// ══════════════════════════════════════════
const proveedorSchema = z.object({
  nombre: z
    .string()
    .min(10, "Mínimo 10 caracteres")
    .regex(
      /^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s&.,\-]+$/,
      "Solo letras, números y caracteres básicos",
    ),
  contacto: z
    .string()
    .min(5, "Mínimo 5 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, "Solo se permiten letras y espacios"),
  telefono: z
    .string()
    .min(10, "Teléfono inválido")
    .regex(/^[0-9]+$/, "Solo se permiten números"),
  email: z.string().email("Correo electrónico inválido"),
  direccion: z.string().min(5, "Dirección muy corta"),
  observaciones: z.string().max(200, "Máximo 200 caracteres").optional(),
});

// ══════════════════════════════════════════
// Helpers de sanitización
// ══════════════════════════════════════════
const soloLetrasYEspacios = (valor) =>
  valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, "");

const soloNombreEmpresa = (valor) =>
  valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s&.,\-]/g, "");

const soloTelefono = (valor) => valor.replace(/[^0-9]/g, "");

// ══════════════════════════════════════════
// Overlay compartido
// ══════════════════════════════════════════
const overlayStyle = {
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
  backgroundColor: "rgba(15, 23, 42, 0.55)",
};

// ══════════════════════════════════════════
// Componente principal
// ══════════════════════════════════════════
export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtro, setFiltro] = useState("habilitadas");
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  const [formData, setFormData] = useState({
    nombre: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
    observaciones: "",
  });

  // ─── Bloquear scroll del body cuando hay un modal abierto ────────────────
  useEffect(() => {
    const hayModalAbierto = modalAbierto || confirmOpen;
    if (hayModalAbierto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalAbierto, confirmOpen]);

  // ==============================
  // CARGAR PROVEEDORES
  // ==============================
  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      const res = await fetch(`${API_URL}/proveedores`);
      const data = await res.json();
      const adaptados = data.data.map((p) => ({
        id: p.id_proveedor,
        nombre: p.nombre_empresa || p.nombre_proveedor,
        contacto: p.nombre_proveedor,
        telefono: p.telefono,
        email: p.email,
        direccion: p.direccion,
        observaciones: p.observaciones,
        habilitado: p.estado === "Activo",
      }));
      setProveedores(adaptados);
    } catch (error) {
      console.error("Error cargando proveedores:", error);
      toast.error("No se pudieron cargar los proveedores");
    }
  };

  // ==============================
  // RESET FORM
  // ==============================
  const resetForm = () => {
    setFormData({
      nombre: "",
      contacto: "",
      telefono: "",
      email: "",
      direccion: "",
      observaciones: "",
    });
    setProveedorEditando(null);
    setErrores({});
  };

  // ==============================
  // CREAR
  // ==============================
  const agregarProveedor = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/proveedores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_proveedor: formData.contacto,
          nombre_empresa: formData.nombre,
          telefono: formData.telefono,
          email: formData.email,
          direccion: formData.direccion,
          observaciones: formData.observaciones,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || "Error al crear proveedor");
        return false;
      }
      toast.success("¡Proveedor creado exitosamente!");
      await fetchProveedores();
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al crear el proveedor");
      return false;
    } finally {
      setCargando(false);
    }
  };

  // ==============================
  // ACTUALIZAR
  // ==============================
  const actualizarProveedor = async () => {
    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/proveedores/${proveedorEditando}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre_proveedor: formData.contacto,
          nombre_empresa: formData.nombre,
          telefono: formData.telefono,
          email: formData.email,
          direccion: formData.direccion,
          observaciones: formData.observaciones,
        }),
      });
      if (!res.ok) {
        toast.error("Error al actualizar el proveedor");
        return false;
      }
      toast.success("¡Proveedor actualizado exitosamente!");
      await fetchProveedores();
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al actualizar el proveedor");
      return false;
    } finally {
      setCargando(false);
    }
  };

  // ==============================
  // INHABILITAR / HABILITAR
  // ==============================
  const inhabilitarProveedor = (id, nombre) => {
    setConfirmData({ id, nombre, accion: "inhabilitar" });
    setConfirmOpen(true);
  };

  const habilitarProveedor = (id, nombre) => {
    setConfirmData({ id, nombre, accion: "habilitar" });
    setConfirmOpen(true);
  };

  const confirmarAccion = async () => {
    const { id, nombre, accion } = confirmData;
    try {
      if (accion === "inhabilitar") {
        await fetch(`${API_URL}/proveedores/${id}`, { method: "DELETE" });
        toast.success(`"${nombre}" inhabilitado correctamente`);
      } else {
        await fetch(`${API_URL}/proveedores/${id}/habilitar`, {
          method: "PATCH",
        });
        toast.success(`"${nombre}" habilitado correctamente`);
      }
      await fetchProveedores();
    } catch (error) {
      console.error(error);
      toast.error(`Error al ${accion} el proveedor`);
    } finally {
      setConfirmOpen(false);
      setConfirmData(null);
    }
  };

  // ==============================
  // MODALES
  // ==============================
  const abrirModalNuevo = () => {
    resetForm();
    setModalAbierto(true);
  };

  const abrirModalEditar = (proveedor) => {
    setFormData({
      nombre: proveedor.nombre,
      contacto: proveedor.contacto,
      telefono: proveedor.telefono,
      email: proveedor.email,
      direccion: proveedor.direccion,
      observaciones: proveedor.observaciones || "",
    });
    setProveedorEditando(proveedor.id);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = proveedorSchema.safeParse(formData);

    if (!result.success) {
      const erroresForm = {};
      (result.error?.issues || []).forEach((err) => {
        erroresForm[err.path[0]] = err.message;
      });
      setErrores(erroresForm);
      toast.error("Por favor corrige los errores del formulario");
      return;
    }

    setErrores({});
    const exito = proveedorEditando
      ? await actualizarProveedor()
      : await agregarProveedor();

    if (exito) cerrarModal();
  };

  // ==============================
  // FILTROS
  // ==============================
  const proveedoresFiltrados = proveedores
    .filter(
      (p) =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.contacto.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((p) => {
      if (filtro === "habilitadas") return p.habilitado;
      if (filtro === "inhabilitadas") return !p.habilitado;
      return true;
    });

  // ==============================
  // UI
  // ==============================
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-gray-900 text-xl sm:text-2xl">
            Proveedores
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Gestión de proveedores
          </p>
        </div>
        <button
          onClick={abrirModalNuevo}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-yellow-400 text-white rounded-lg hover:bg-yellow-550 transition-colors shadow-sm text-sm font-medium"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Nuevo Proveedor
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Total</p>
          <p className="text-xl sm:text-2xl font-bold text-gray-900">
            {proveedores.length}
          </p>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-green-700 mb-1">Habilitados</p>
          <p className="text-xl sm:text-2xl font-bold text-green-700">
            {proveedores.filter((p) => p.habilitado).length}
          </p>
        </div>
        <div className="bg-red-50 rounded-lg border border-red-200 p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-red-700 mb-1">Inhabilitados</p>
          <p className="text-xl sm:text-2xl font-bold text-red-700">
            {proveedores.filter((p) => !p.habilitado).length}
          </p>
        </div>
      </div>

      {/* Filtros y buscador */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFiltro("habilitadas")}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filtro === "habilitadas"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5 sm:gap-2">
              <Check className="w-4 h-4" />
              Habilitados ({proveedores.filter((p) => p.habilitado).length})
            </span>
          </button>
          <button
            onClick={() => setFiltro("inhabilitadas")}
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filtro === "inhabilitadas"
                ? "bg-red-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className="flex items-center justify-center gap-1.5 sm:gap-2">
              <Ban className="w-4 h-4" />
              Inhabilitados ({proveedores.filter((p) => !p.habilitado).length})
            </span>
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o contacto..."
            className="w-full sm:w-72 pl-9 sm:pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Cards de proveedores */}
      {proveedoresFiltrados.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 px-6 py-12 text-center">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">
            {searchTerm
              ? "No se encontraron proveedores que coincidan con la búsqueda"
              : filtro === "habilitadas"
                ? "No hay proveedores habilitados"
                : "No hay proveedores inhabilitados"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {proveedoresFiltrados.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow"
            >
              {/* Cabecera de card */}
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                    {p.nombre}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    {p.contacto}
                  </p>
                  <span
                    className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${
                      p.habilitado
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {p.habilitado ? (
                      <>
                        <Check className="w-3 h-3" /> Habilitado
                      </>
                    ) : (
                      <>
                        <Ban className="w-3 h-3" /> Inhabilitado
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Info de contacto */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span className="truncate">{p.telefono}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span className="truncate">{p.email}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-gray-400 mt-0.5" />
                  <span className="line-clamp-2">{p.direccion}</span>
                </div>
                {p.observaciones && (
                  <p className="text-xs text-gray-500 line-clamp-2 pt-1 border-t border-gray-100">
                    <span className="font-semibold">Obs:</span>{" "}
                    {p.observaciones}
                  </p>
                )}
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => abrirModalEditar(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Editar
                </button>
                {p.habilitado ? (
                  <button
                    onClick={() => inhabilitarProveedor(p.id, p.nombre)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors font-medium"
                    title="Inhabilitar"
                  >
                    <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Inhabilitar</span>
                  </button>
                ) : (
                  <button
                    onClick={() => habilitarProveedor(p.id, p.nombre)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs sm:text-sm text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors font-medium"
                    title="Habilitar"
                  >
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Habilitar</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Crear / Editar ─────────────────────────────────────────── */}
      {modalAbierto && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={overlayStyle}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-lg sm:text-xl">
                {proveedorEditando ? "Editar Proveedor" : "Nuevo Proveedor"}
              </h2>
              <button
                onClick={cerrarModal}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre empresa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la empresa *
                  </label>
                  <input
                    type="text"
                    placeholder="Empresa S.A.S"
                    maxLength={80}
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nombre: soloNombreEmpresa(e.target.value),
                      })
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                      errores.nombre
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {formData.nombre.length}/80
                  </p>
                  {errores.nombre && (
                    <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />{" "}
                      {errores.nombre}
                    </p>
                  )}
                </div>

                {/* Contacto */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persona de Contacto *
                  </label>
                  <input
                    type="text"
                    placeholder="Nombre del contacto"
                    value={formData.contacto}
                    maxLength={45}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contacto: soloLetrasYEspacios(e.target.value),
                      })
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                      errores.contacto
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {formData.contacto.length}/45
                  </p>
                  {errores.contacto && (
                    <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />{" "}
                      {errores.contacto}
                    </p>
                  )}
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    type="text"
                    placeholder="300 123 4567"
                    value={formData.telefono}
                    maxLength={10}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        telefono: soloTelefono(e.target.value),
                      })
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                      errores.telefono
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  {errores.telefono && (
                    <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />{" "}
                      {errores.telefono}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    placeholder="correo@empresa.com"
                    value={formData.email}
                    maxLength={250}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                      errores.email
                        ? "border-red-500 focus:ring-red-500"
                        : "border-gray-300"
                    }`}
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {formData.email.length}/250
                  </p>
                  {errores.email && (
                    <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                      <AlertTriangle className="w-3 h-3 flex-shrink-0" />{" "}
                      {errores.email}
                    </p>
                  )}
                </div>
              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección *
                </label>
                <input
                  type="text"
                  placeholder="Calle 123 # 45-67, Ciudad"
                  value={formData.direccion}
                  maxLength={80}
                  onChange={(e) =>
                    setFormData({ ...formData, direccion: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                    errores.direccion
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300"
                  }`}
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {formData.direccion.length}/80
                </p>
                {errores.direccion && (
                  <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />{" "}
                    {errores.direccion}
                  </p>
                )}
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones{" "}
                  <span className="text-gray-400 text-xs font-normal">
                    (opcional)
                  </span>
                </label>
                <textarea
                  placeholder="Notas adicionales sobre el proveedor..."
                  value={formData.observaciones}
                  maxLength={300}
                  rows={3}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {formData.observaciones.length}/500
                </p>
                {errores.observaciones && (
                  <p className="flex items-center gap-1 text-red-500 text-xs mt-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />{" "}
                    {errores.observaciones}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-2 pb-1">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={cargando}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {cargando
                    ? "Guardando..."
                    : proveedorEditando
                      ? "Guardar Cambios"
                      : "Crear Proveedor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ───────────────────────────────────────────────── */}
      {confirmOpen && confirmData && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 z-50"
          style={overlayStyle}
        >
          <div className="bg-white rounded-2xl shadow-xl w-full sm:max-w-sm p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              {confirmData.accion === "inhabilitar" ? (
                <Ban className="w-7 h-7 sm:w-8 sm:h-8 text-red-500 flex-shrink-0" />
              ) : (
                <Check className="w-7 h-7 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
              )}
              <h2 className="font-bold text-gray-900 text-base sm:text-lg">
                {confirmData.accion === "inhabilitar"
                  ? "Inhabilitar"
                  : "Habilitar"}{" "}
                proveedor
              </h2>
            </div>
            <p className="text-gray-600 mb-5 text-sm sm:text-base">
              ¿Estás seguro de que deseas{" "}
              {confirmData.accion === "inhabilitar"
                ? "inhabilitar"
                : "habilitar"}{" "}
              a{" "}
              <span className="font-semibold text-gray-900">
                "{confirmData.nombre}"
              </span>
              ?
              {confirmData.accion === "inhabilitar" && (
                <span className="block mt-2 text-sm text-red-600">
                  Ya no aparecerá disponible en el sistema.
                </span>
              )}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmData(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarAccion}
                className={`flex-1 px-4 py-2.5 text-white rounded-lg transition-colors text-sm font-medium ${
                  confirmData.accion === "inhabilitar"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {confirmData.accion === "inhabilitar"
                  ? "Inhabilitar"
                  : "Habilitar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
