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
  XCircle,
} from "lucide-react";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/dialog";
import { Button } from "../components/Button";
import { Input } from "../components/input";
import { Label } from "../components/label";
import { Textarea } from "../components/textarea";
import { Card, CardContent } from "../components/card";
import { toast } from "sonner";

// ══════════════════════════════════════════
// Modal de Confirmación Reutilizable
// ══════════════════════════════════════════
function ModalConfirmacion({ abierto, titulo, mensaje, onConfirmar, onCancelar, tipo = "danger" }) {
  if (!abierto) return null;

  const estilos = {
    danger: {
      icono: "bg-red-100 text-red-600",
      boton: "bg-red-600 hover:bg-red-700 text-white",
      iconoComponente: <AlertTriangle className="w-7 h-7" />,
    },
    success: {
      icono: "bg-green-100 text-green-600",
      boton: "bg-green-600 hover:bg-green-700 text-white",
      iconoComponente: <CheckCircle className="w-7 h-7" />,
    },
    warning: {
      icono: "bg-yellow-100 text-yellow-600",
      boton: "bg-yellow-500 hover:bg-yellow-600 text-white",
      iconoComponente: <AlertTriangle className="w-7 h-7" />,
    },
  };

  const estilo = estilos[tipo] || estilos.danger;

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[60] p-4 w-full h-full">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${estilo.icono}`}>
            {estilo.iconoComponente}
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">{titulo}</h3>
          <p className="text-gray-500 text-sm mb-6">{mensaje}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancelar}
              className="flex-1 py-2.5 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              className={`flex-1 py-2.5 rounded-xl transition-colors text-sm font-medium ${estilo.boton}`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════
// Schema de validación
// ══════════════════════════════════════════
const proveedorSchema = z.object({
  nombre: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(100, "Máximo 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s&.,\-]+$/, "Solo letras, números y caracteres básicos"),
  contacto: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .max(80, "Máximo 80 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/, "Solo se permiten letras y espacios"),
  telefono: z
    .string()
    .min(7, "Teléfono inválido")
    .max(15, "Teléfono muy largo")
    .regex(/^[0-9+\-\s()]+$/, "Solo se permiten números y caracteres: + - ( )"),
  email: z.string().email("Correo electrónico inválido"),
  direccion: z
    .string()
    .min(5, "Dirección muy corta")
    .max(200, "Dirección muy larga"),
  observaciones: z
    .string()
    .max(500, "Máximo 500 caracteres")
    .optional(),
});

// ══════════════════════════════════════════
// Helpers de sanitización
// ══════════════════════════════════════════
const soloLetrasYEspacios = (valor) =>
  valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, "");

const soloNombreEmpresa = (valor) =>
  valor.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ0-9\s&.,\-]/g, "");

const soloTelefono = (valor) =>
  valor.replace(/[^0-9+\-\s()]/g, "");

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

  const [confirmacion, setConfirmacion] = useState({
    abierto: false,
    titulo: "",
    mensaje: "",
    tipo: "danger",
    onConfirmar: null,
  });

  const [formData, setFormData] = useState({
    nombre: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
    observaciones: "",
  });

  const pedirConfirmacion = ({ titulo, mensaje, tipo = "danger", onConfirmar }) => {
    setConfirmacion({ abierto: true, titulo, mensaje, tipo, onConfirmar });
  };

  const cerrarConfirmacion = () => {
    setConfirmacion((prev) => ({ ...prev, abierto: false, onConfirmar: null }));
  };

  // ==============================
  // CARGAR PROVEEDORES
  // ==============================
  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/proveedores");
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
      const res = await fetch("http://localhost:3000/api/proveedores", {
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
      const res = await fetch(`http://localhost:3000/api/proveedores/${proveedorEditando}`, {
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
  // INHABILITAR
  // ==============================
  const inhabilitarProveedor = (id, nombre) => {
    pedirConfirmacion({
      titulo: "¿Inhabilitar proveedor?",
      mensaje: `"${nombre}" ya no aparecerá disponible en el sistema.`,
      tipo: "danger",
      onConfirmar: async () => {
        cerrarConfirmacion();
        try {
          await fetch(`http://localhost:3000/api/proveedores/${id}`, {
            method: "DELETE",
          });
          toast.success("Proveedor inhabilitado correctamente");
          await fetchProveedores();
        } catch (error) {
          console.error(error);
          toast.error("Error al inhabilitar el proveedor");
        }
      },
    });
  };

  // ==============================
  // HABILITAR
  // ==============================
  const habilitarProveedor = (id, nombre) => {
    pedirConfirmacion({
      titulo: "¿Habilitar proveedor?",
      mensaje: `"${nombre}" volverá a estar disponible en el sistema.`,
      tipo: "success",
      onConfirmar: async () => {
        cerrarConfirmacion();
        try {
          await fetch(`http://localhost:3000/api/proveedores/${id}/habilitar`, {
            method: "PATCH",
          });
          toast.success("Proveedor habilitado correctamente");
          await fetchProveedores();
        } catch (error) {
          console.error(error);
          toast.error("Error al habilitar el proveedor");
        }
      },
    });
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

    if (exito) {
      setModalAbierto(false);
      resetForm();
    }
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
    <div className="space-y-6">

      {/* Modal de confirmación */}
      <ModalConfirmacion
        abierto={confirmacion.abierto}
        titulo={confirmacion.titulo}
        mensaje={confirmacion.mensaje}
        tipo={confirmacion.tipo}
        onConfirmar={confirmacion.onConfirmar}
        onCancelar={cerrarConfirmacion}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600 mt-1">Gestión de proveedores</p>
        </div>
        <Button onClick={abrirModalNuevo} className="bg-yellow-400 hover:bg-yellow-500 text-gray-900">
          <Plus className="w-5 h-5 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Buscador */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por nombre, email o contacto..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filtros por estado */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Filtrar por:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFiltro("habilitadas")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filtro === "habilitadas"
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  Habilitados ({proveedores.filter((p) => p.habilitado !== false).length})
                </span>
              </button>
              <button
                onClick={() => setFiltro("inhabilitadas")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filtro === "inhabilitadas"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Ban className="w-4 h-4" />
                  Inhabilitados ({proveedores.filter((p) => p.habilitado === false).length})
                </span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de proveedores */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {proveedoresFiltrados.map((p) => (
          <Card key={p.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6 pb-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="font-bold">{p.nombre}</h3>
                    <p className="text-sm text-gray-500">{p.contacto}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{p.telefono}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{p.email}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{p.direccion}</span>
                </div>
                {p.observaciones && (
                  <div className="flex items-start gap-2 text-sm">
                    <p className="text-sm text-gray-600 line-clamp-2">
                      <span className="font-bold">Observaciones:</span> {p.observaciones}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={() => abrirModalEditar(p)} variant="outline" size="sm" className="flex-1">
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </Button>

                {p.habilitado ? (
                  <Button
                    onClick={() => inhabilitarProveedor(p.id, p.nombre)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Inhabilitar proveedor"
                  >
                    <Ban className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => habilitarProveedor(p.id, p.nombre)}
                    variant="outline"
                    size="sm"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    title="Habilitar proveedor"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {proveedoresFiltrados.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchTerm
                ? "No se encontraron proveedores que coincidan con la búsqueda"
                : filtro === "habilitadas"
                  ? "No hay proveedores habilitados"
                  : filtro === "inhabilitadas"
                    ? "No hay proveedores inhabilitados"
                    : "No hay proveedores registrados"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* MODAL formulario */}
      <Dialog
        open={modalAbierto}
        onOpenChange={(open) => {
          if (!open) {
            setModalAbierto(false);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {proveedorEditando ? "Editar" : "Nuevo"} Proveedor
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Nombre empresa */}
              <div>
                <Label htmlFor="nombre">
                  Nombre de la empresa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  placeholder="Empresa S.A.S"
                  value={formData.nombre}
                  maxLength={100}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: soloNombreEmpresa(e.target.value) })
                  }
                  className={errores.nombre ? "border-red-400 focus:ring-red-400" : ""}
                />
                {errores.nombre && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {errores.nombre}
                  </p>
                )}
              </div>

              {/* Contacto */}
              <div>
                <Label htmlFor="contacto">
                  Persona de Contacto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contacto"
                  placeholder="Nombre del contacto"
                  value={formData.contacto}
                  maxLength={80}
                  onChange={(e) =>
                    setFormData({ ...formData, contacto: soloLetrasYEspacios(e.target.value) })
                  }
                  className={errores.contacto ? "border-red-400 focus:ring-red-400" : ""}
                />
                {errores.contacto && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {errores.contacto}
                  </p>
                )}
              </div>

              {/* Teléfono */}
              <div>
                <Label htmlFor="telefono">
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="telefono"
                  placeholder="300 123 4567"
                  value={formData.telefono}
                  maxLength={15}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: soloTelefono(e.target.value) })
                  }
                  className={errores.telefono ? "border-red-400 focus:ring-red-400" : ""}
                />
                {errores.telefono && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {errores.telefono}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">
                  Correo Electrónico <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  placeholder="correo@empresa.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={errores.email ? "border-red-400 focus:ring-red-400" : ""}
                />
                {errores.email && (
                  <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> {errores.email}
                  </p>
                )}
              </div>
            </div>

            {/* Dirección */}
            <div>
              <Label htmlFor="direccion">
                Dirección <span className="text-red-500">*</span>
              </Label>
              <Input
                id="direccion"
                placeholder="Calle 123 # 45-67, Ciudad"
                value={formData.direccion}
                maxLength={200}
                onChange={(e) =>
                  setFormData({ ...formData, direccion: e.target.value })
                }
                className={errores.direccion ? "border-red-400 focus:ring-red-400" : ""}
              />
              {errores.direccion && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> {errores.direccion}
                </p>
              )}
            </div>

            {/* Observaciones */}
            <div>
              <Label htmlFor="observaciones">
                Observaciones{" "}
                <span className="text-gray-400 text-xs font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="observaciones"
                placeholder="Notas adicionales sobre el proveedor..."
                value={formData.observaciones}
                maxLength={500}
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
              />
              <p className="text-xs text-gray-400 mt-1 text-right">
                {formData.observaciones.length}/500
              </p>
              {errores.observaciones && (
                <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <XCircle className="w-3 h-3" /> {errores.observaciones}
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button
                type="button"
                variant="outline"
                className="hover:bg-amber-50"
                onClick={() => { setModalAbierto(false); resetForm(); }}
                disabled={cargando}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-yellow-400 text-black hover:bg-amber-400"
                disabled={cargando}
              >
                {cargando ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}