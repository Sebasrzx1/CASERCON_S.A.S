import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  Users,
  Plus,
  Edit,
  Eye,
  EyeOff,
  Ban,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "../components/card";
import { toast } from "sonner";
import API_URL from "../service/api";

// ── Bloquear scroll del body mientras haya un modal abierto ──────
function useLockBodyScroll() {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, []);
}

// ── Wrapper que bloquea scroll solo cuando está montado ──────────
function LockScroll() {
  useLockBodyScroll();
  return null;
}

// ── Overlay base reutilizable ────────────────────────────────────
const ModalOverlay = ({ children, onClose }) => {
  useLockBodyScroll();
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
    >
      {children}
    </div>
  );
};

// ── Modal de confirmación reutilizable ───────────────────────────
function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  onConfirmar,
  onCancelar,
  tipo = "danger",
}) {
  if (!abierto) return null;

  const colores = {
    danger: {
      icono: "bg-red-100 text-red-600",
      boton: "bg-red-600 hover:bg-red-700 text-white",
    },
    success: {
      icono: "bg-green-100 text-green-600",
      boton: "bg-green-600 hover:bg-green-700 text-white",
    },
  };
  const estilo = colores[tipo];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        backgroundColor: "rgba(15, 23, 42, 0.55)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && onCancelar) onCancelar();
      }}
    >
      <LockScroll />
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-5 sm:p-6">
        <div className="text-center">
          <div
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${estilo.icono}`}
          >
            <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
            {titulo}
          </h3>
          <p className="text-gray-500 text-sm mb-6">{mensaje}</p>
          <div className="flex gap-3">
            <button
              onClick={onCancelar}
              className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirmar}
              className={`flex-1 py-2.5 rounded-lg transition text-sm font-medium ${estilo.boton}`}
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Formulario de operario — FUERA del componente principal ──────
// Definirlo dentro causaría que React lo desmonte/monte en cada
// render, perdiendo el foco del input con cada tecla pulsada.
function FormularioOperario({
  formulario,
  setFormulario,
  usuarioEditando,
  mostrarContraseña,
  setMostrarContraseña,
  onSubmit,
  onCancelar,
  textoBoton,
}) {
  const handleNombreChange = (e) => {
    const soloLetras = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, "");
    setFormulario((prev) => ({ ...prev, nombre: soloLetras }));
  };

  return (
    <form
      onSubmit={onSubmit}
      className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1"
    >
      {/* Nombre */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre Completo
        </label>
        <input
          type="text"
          placeholder="Nombre"
          value={formulario.nombre}
          onChange={handleNombreChange}
          maxLength={45}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          required
        />
        <p className="text-xs text-gray-400 mt-1 text-right">
          {formulario.nombre.length}/45
        </p>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          placeholder="Email"
          value={formulario.email}
          onChange={(e) =>
            setFormulario((prev) => ({ ...prev, email: e.target.value }))
          }
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          required
        />
        <p className="text-xs text-gray-500 mt-1">
          El operario usará este email para iniciar sesión
        </p>
      </div>

      {/* Contraseña */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Contraseña
        </label>
        <div className="relative">
          <input
            type={mostrarContraseña ? "text" : "password"}
            placeholder="Contraseña (5 a 8 caracteres)"
            value={formulario.contraseña}
            onChange={(e) =>
              setFormulario((prev) => ({ ...prev, contraseña: e.target.value }))
            }
            minLength={5}
            maxLength={8}
            className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            required={!usuarioEditando}
          />
          <button
            type="button"
            onClick={() => setMostrarContraseña((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {mostrarContraseña ? (
              <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
            ) : (
              <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Recuerda compartir estas credenciales con el operario
        </p>
      </div>

      {/* Sectores */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sectores
        </label>
        <div className="flex flex-wrap gap-3 sm:gap-4">
          {["recepcion", "produccion"].map((sector) => (
            <label
              key={sector}
              className="inline-flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                value={sector}
                checked={formulario.procesos.includes(sector)}
                onChange={(e) =>
                  setFormulario((prev) => ({
                    ...prev,
                    procesos: e.target.checked
                      ? [...prev.procesos, sector]
                      : prev.procesos.filter((s) => s !== sector),
                  }))
                }
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <span className="text-sm capitalize">
                {sector === "recepcion" ? "Recepción" : "Producción"}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-900 font-medium mb-1">
          Información importante:
        </p>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Selecciona al menos un sector para el operario</li>
          <li>• Puede tener acceso a ambos sectores simultáneamente</li>
          <li>• Solo verá las funciones de sus sectores asignados</li>
        </ul>
      </div>

      {/* Botones */}
      <div className="flex gap-3 pt-2 pb-1">
        <button
          type="button"
          onClick={onCancelar}
          className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          {textoBoton}
        </button>
      </div>
    </form>
  );
}

// ── Componente principal ─────────────────────────────────────────
export default function Usuarios() {
  const { isAdministrador } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [mostrarContraseña, setMostrarContraseña] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [filtro, setFiltro] = useState("habilitadas");

  const [confirmacion, setConfirmacion] = useState({
    abierto: false,
    titulo: "",
    mensaje: "",
    tipo: "danger",
    onConfirmar: null,
  });

  const [formulario, setFormulario] = useState({
    nombre: "",
    email: "",
    contraseña: "",
    procesos: [],
  });

  const pedirConfirmacion = ({
    titulo,
    mensaje,
    tipo = "danger",
    onConfirmar,
  }) => {
    setConfirmacion({ abierto: true, titulo, mensaje, tipo, onConfirmar });
  };

  const cerrarConfirmacion = () => {
    setConfirmacion((prev) => ({ ...prev, abierto: false, onConfirmar: null }));
  };

  // ── GET usuarios ─────────────────────────────────────────────────
  const obtenerUsuarios = async () => {
    try {
      const res = await fetch(`${API_URL}/usuarios`);
      const data = await res.json();
      setUsuarios(
        data.data.map((u) => ({ ...u, habilitado: u.estado === "Activo" })),
      );
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  // ── Modales ───────────────────────────────────────────────────────
  const abrirModal = () => {
    setFormulario({ nombre: "", email: "", contraseña: "", procesos: [] });
    setMostrarContraseña(false);
    setModalAbierto(true);
  };
  const cerrarModal = () => {
    setModalAbierto(false);
  };

  const abrirModalEditar = (usuario) => {
    setUsuarioEditando(usuario);
    setFormulario({
      nombre: usuario.nombre,
      email: usuario.email,
      contraseña: usuario.contraseña,
      procesos: usuario.procesos || [],
    });
    setMostrarContraseña(false);
    setModalEditarAbierto(true);
  };
  const cerrarModalEditar = () => {
    setModalEditarAbierto(false);
    setUsuarioEditando(null);
  };

  // ── Crear usuario ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formulario.procesos.length === 0) {
      toast.error("Debe seleccionar al menos un sector para el operario.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/usuarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formulario, rol: "Operario" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message);
        return;
      }
      await obtenerUsuarios();
      cerrarModal();
      toast.success("¡Usuario creado exitosamente!");
    } catch (error) {
      console.error(error);
    }
  };

  // ── Editar usuario ────────────────────────────────────────────────
  const handleSubmitEditar = async (e) => {
    e.preventDefault();
    if (!usuarioEditando) return;
    if (formulario.procesos.length === 0) {
      toast.error("Debe seleccionar al menos un sector para el operario.");
      return;
    }
    if (formulario.contraseña && formulario.contraseña.length < 5) {
      toast.error("La contraseña debe tener entre 5 y 8 caracteres.");
      return;
    }
    const payload = {
      nombre: formulario.nombre,
      email: formulario.email,
      ...(formulario.contraseña ? { contraseña: formulario.contraseña } : {}),
      procesos: formulario.procesos,
    };
    try {
      const res = await fetch(
        `${API_URL}/usuarios/${usuarioEditando.id_usuario}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error("Error al actualizar usuario");
      toast.success("Usuario actualizado exitosamente");
      await obtenerUsuarios();
      cerrarModalEditar();
    } catch (error) {
      console.error(error);
      toast.error("Ocurrió un error al actualizar el usuario");
    }
  };

  // ── Inhabilitar ───────────────────────────────────────────────────
  const inhabilitarUsuario = (id) => {
    pedirConfirmacion({
      titulo: "¿Inhabilitar operario?",
      mensaje: "El operario perderá acceso al sistema inmediatamente.",
      tipo: "danger",
      onConfirmar: async () => {
        cerrarConfirmacion();
        try {
          const res = await fetch(`${API_URL}/usuarios/${id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          if (res.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("casercon_user");
            window.location.href = "/";
            return;
          }
          await obtenerUsuarios();
          toast.success("Operario inhabilitado");
        } catch (error) {
          console.error(error);
        }
      },
    });
  };

  // ── Habilitar ─────────────────────────────────────────────────────
  const habilitarUsuario = (id) => {
    pedirConfirmacion({
      titulo: "¿Habilitar operario?",
      mensaje: "El operario recuperará acceso al sistema.",
      tipo: "success",
      onConfirmar: async () => {
        cerrarConfirmacion();
        try {
          await fetch(`${API_URL}/usuarios/${id}/habilitar`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          await obtenerUsuarios();
          toast.success("Operario habilitado");
        } catch (error) {
          console.error(error);
        }
      },
    });
  };

  const usuariosFiltrados =
    filtro === "habilitadas"
      ? usuarios.filter((u) => u.habilitado)
      : usuarios.filter((u) => !u.habilitado);

  if (!isAdministrador) return <p>No tienes permisos</p>;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-gray-900 text-xl sm:text-2xl">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Administra los operarios del sistema
          </p>
        </div>
        <button
          onClick={abrirModal}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" /> Crear Operario
        </button>
      </div>

      {/* ── Estadística ── */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-gray-600 mb-1">Total Operarios</p>
        <p className="text-xl sm:text-2xl font-bold text-gray-900">
          {usuarios.length}
        </p>
      </div>

      {/* ── Filtros ── */}
      <Card>
        <CardContent className="pt-4 pb-4 sm:pt-6 sm:pb-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-medium text-gray-700">
              Filtrar por:
            </span>
            <div
              className="flex gap-2 overflow-x-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <button
                onClick={() => setFiltro("habilitadas")}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  filtro === "habilitadas"
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Habilitados ({usuarios.filter((u) => u.habilitado).length})
                </span>
              </button>
              <button
                onClick={() => setFiltro("inhabilitadas")}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  filtro === "inhabilitadas"
                    ? "bg-red-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Inhabilitados ({usuarios.filter((u) => !u.habilitado).length})
                </span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Lista ── */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {usuarios.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No hay operarios registrados</p>
            <p className="text-sm text-gray-400 mt-1">
              Crea un operario para que pueda acceder al sistema
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {usuariosFiltrados.map((usuario) => (
              <div
                key={usuario.id_usuario}
                className="p-4 sm:p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">
                        {usuario.nombre}
                      </h3>
                      <div className="space-y-1 text-xs sm:text-sm mt-1">
                        <p className="text-gray-600 truncate">
                          <span className="font-medium">Correo:</span>{" "}
                          {usuario.email}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Contraseña:</span>{" "}
                          {usuario.contraseña}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Rol:</span>{" "}
                          <span className="inline-flex px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">
                            Operario
                          </span>
                        </p>
                        {usuario.procesos?.length > 0 && (
                          <p className="text-gray-600">
                            <span className="font-medium">Procesos:</span>{" "}
                            <span className="inline-flex px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded capitalize">
                              {usuario.procesos.join(", ")}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
                    {usuario.habilitado ? (
                      <button
                        onClick={() => inhabilitarUsuario(usuario.id_usuario)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Inhabilitar operario"
                      >
                        <Ban className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => habilitarUsuario(usuario.id_usuario)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Habilitar operario"
                      >
                        <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => abrirModalEditar(usuario)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar operario"
                    >
                      <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Confirmar (z-index más alto, siempre al final) ── */}
      <ModalConfirmacion
        abierto={confirmacion.abierto}
        titulo={confirmacion.titulo}
        mensaje={confirmacion.mensaje}
        tipo={confirmacion.tipo}
        onConfirmar={confirmacion.onConfirmar}
        onCancelar={cerrarConfirmacion}
      />

      {/* ── Modal Crear ── */}
      {modalAbierto && (
        <ModalOverlay onClose={cerrarModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="font-bold text-gray-900 text-lg sm:text-xl">
                Crear Nuevo Operario
              </h2>
              <button
                onClick={cerrarModal}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FormularioOperario
              formulario={formulario}
              setFormulario={setFormulario}
              usuarioEditando={null}
              mostrarContraseña={mostrarContraseña}
              setMostrarContraseña={setMostrarContraseña}
              onSubmit={handleSubmit}
              onCancelar={cerrarModal}
              textoBoton="Crear Operario"
            />
          </div>
        </ModalOverlay>
      )}

      {/* ── Modal Editar ── */}
      {modalEditarAbierto && (
        <ModalOverlay onClose={cerrarModalEditar}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-gray-200 flex-shrink-0">
              <h2 className="font-bold text-gray-900 text-lg sm:text-xl">
                Editar Operario
              </h2>
              <button
                onClick={cerrarModalEditar}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <FormularioOperario
              formulario={formulario}
              setFormulario={setFormulario}
              usuarioEditando={usuarioEditando}
              mostrarContraseña={mostrarContraseña}
              setMostrarContraseña={setMostrarContraseña}
              onSubmit={handleSubmitEditar}
              onCancelar={cerrarModalEditar}
              textoBoton="Actualizar Operario"
            />
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
