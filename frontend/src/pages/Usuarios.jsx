import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Users, Plus, Edit, Eye, EyeOff, Ban, Check, X } from "lucide-react";
import { Card, CardContent } from "../components/card";

export default function Usuarios() {
  const { isAdministrador } = useAuth();

  const [usuarios, setUsuarios] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [mostrarContraseña, setMostrarContraseña] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [filtro, setFiltro] = useState("habilitadas");

  const [formulario, setFormulario] = useState({
    nombre: "",
    email: "",
    contraseña: "",
    procesos: [],
  });

  // ========================
  // GET usuarios
  // ========================
  const obtenerUsuarios = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/usuarios");
      const data = await res.json();

      const usuariosNormalizados = data.data.map((u) => ({
        ...u,
        habilitado: u.estado === "Activo",
      }));
      setUsuarios(usuariosNormalizados);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  // ========================
  // MODALES
  // ========================
  const abrirModal = () => {
    setFormulario({
      nombre: "",
      email: "",
      contraseña: "",
      procesos: [],
    });
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setMostrarContraseña(false);
  };

  const abrirModalEditar = (usuario) => {
    console.log("Click editar 👍🏻", usuario);
    setUsuarioEditando(usuario);
    setFormulario({
      nombre: usuario.nombre,
      email: usuario.email,
      contraseña: usuario.contraseña,
      procesos: usuario.procesos || [],
    });
    setModalEditarAbierto(true);
  };

  const cerrarModalEditar = () => {
    setModalEditarAbierto(false);
    setUsuarioEditando(null);
  };

  // ========================
  // CREAR USUARIO
  // ========================
  const handleSubmit = async (e) => {
    e.preventDefault();
    //validamos de que se haya seleccionado un sector para el operario.
    if (formulario.procesos.length === 0) {
      alert("Debe seleccionar al menos un sector para el operario.");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formulario,
          rol: "Operario",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.msg || "Error al crear");
        return;
      }

      await obtenerUsuarios();
      cerrarModal();
    } catch (error) {
      console.error(error);
    }
  };

  // ========================
  // EDITAR USUARIO
  // ========================
  const handleSubmitEditar = async (e) => {
    e.preventDefault();

    if (!usuarioEditando) return;

    //validamos de que se haya seleccionado un sector para el operario.
    if (formulario.procesos.length === 0) {
      alert("Debe seleccionar al menos un sector para el operario.");
      return;
    }

    const payload = {
      nombre: formulario.nombre,
      email: formulario.email,
      // solo enviamos contraseña si se ha escrito algo
      ...(formulario.contraseña ? { contraseña: formulario.contraseña } : {}),
      procesos: formulario.procesos, // si manejas procesos
    };

    try {
      const res = await fetch(
        `http://localhost:3000/api/usuarios/${usuarioEditando.id_usuario}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!res.ok) throw new Error("Error al actualizar usuario");

      alert("Usuario actualizado exitosamente");
      await obtenerUsuarios();
      cerrarModalEditar();

      // refresca usuarios llamando a tu función de carga
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al actualizar el usuario");
    }
  };

  // ==============================
  // INHABILITAR
  // ==============================
  const inhabilitarUsuario = async (id) => {
    if (!confirm("¿Está seguro de inhabilitar este usuario?")) return;

    try {
      await fetch(`http://localhost:3000/api/usuarios/${id}`, {
        method: "DELETE",
      });

      await obtenerUsuarios();
    } catch (error) {
      console.error(error);
    }
  };
  // ==============================
  // HABILITAR
  // ==============================
  const habilitarUsuario = async (id) => {
    if (!confirm("¿Está seguro de habilitar este usuario?")) return;

    try {
      await fetch(`http://localhost:3000/api/usuarios/${id}/habilitar`, {
        method: "PATCH",
      });

      await obtenerUsuarios();
    } catch (error) {
      console.error(error);
    }
  };

  const usuariosFiltrados =
    filtro === "habilitadas"
      ? usuarios.filter((u) => u.habilitado)
      : usuarios.filter((u) => !u.habilitado);
  // ========================
  // PERMISOS
  // ========================
  if (!isAdministrador) {
    return <p>No tienes permisos</p>;
  }

  // ========================
  // UI
  // ========================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bold text-gray-900 text-2xl">
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-1">
            {" "}
            Administra los operarios del sistema
          </p>
        </div>

        <button
          onClick={abrirModal}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Crear Operario
        </button>
      </div>

      {/* Estadística */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-sm text-gray-600 mb-1">Total Operarios</p>
        <p className="text-2xl font-bold text-gray-900">{usuarios.length}</p>
      </div>

      {/*Filtros por estado */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              Filtrar por:
            </span>
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
                  Habilitados ({usuarios.filter((u) => u.habilitado).length})
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
                  Inhabilitados ({usuarios.filter((u) => !u.habilitado).length})
                </span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
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
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900">
                        {usuario.nombre}
                      </h3>

                      <div className="space-y-1 text-sm mt-1">
                        <p className="text-gray-600">
                          <span className="font-medium">Correo:</span>{" "}
                          {usuario.email}
                        </p>

                        <p className="text-gray-600">
                          <span className="font-medium">Contraseña:</span>{" "}
                          {usuario.contraseña}
                        </p>

                        <p className="text-gray-600">
                          <span className="font-medium">Rol:</span>{" "}
                          <span className="inline-flex px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                            Operario
                          </span>
                        </p>

                        {usuario.procesos?.length > 0 && (
                          <p className="text-gray-600">
                            <span className="font-medium">Procesos:</span>{" "}
                            <span className="inline-flex px-2 py-1 bg-green-100 text-green-700 text-xs rounded capitalize">
                              {usuario.procesos.join(", ")}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {usuario.habilitado ? (
                      <button
                        onClick={() => inhabilitarUsuario(usuario.id_usuario)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Inhabilitar operario"
                      >
                        <Ban className="w-5 h-5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => habilitarUsuario(usuario.id_usuario)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Habilitar operario"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => abrirModalEditar(usuario)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar operario"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-xl">
                Crear Nuevo Operario
              </h2>
              <button
                onClick={cerrarModal}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nombre completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="Nombre"
                  value={formulario.nombre}
                  onChange={(e) =>
                    setFormulario({ ...formulario, nombre: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/*Input de email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="Email"
                  value={formulario.email}
                  onChange={(e) =>
                    setFormulario({ ...formulario, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  El operario usará este email para iniciar sesión
                </p>
              </div>

              {/*Input de contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={mostrarContraseña ? "text" : "password"}
                    placeholder="Contraseña"
                    value={formulario.contraseña}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        contraseña: e.target.value,
                      })
                    }
                    className="w-full border p-2 rounded"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarContraseña(!mostrarContraseña)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarContraseña ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recuerda compartir estas credenciales con el operario
                </p>
              </div>

              {/*Sectores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sectores
                </label>
                <div className="flex gap-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      value="recepcion"
                      checked={formulario.procesos.includes("recepcion")}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          procesos: e.target.checked
                            ? [...formulario.procesos, "recepcion"]
                            : formulario.procesos.filter(
                                (s) => s !== "recepcion",
                              ),
                        })
                      }
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Recepción</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      value="produccion"
                      checked={formulario.procesos.includes("produccion")}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          procesos: e.target.checked
                            ? [...formulario.procesos, "produccion"]
                            : formulario.procesos.filter(
                                (s) => s !== "produccion",
                              ),
                        })
                      }
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Producción</span>
                  </label>
                </div>
              </div>

              {/* Información adicional */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-medium mb-1">
                  Información importante:
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Selecciona al menos un sector para el operario</li>
                  <li>• Puede tener acceso a ambos sectores simultáneamente</li>
                  <li>• Solo verá las funciones de sus sectores asignados</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear Operario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {modalEditarAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="font-bold text-gray-900 text-xl">
                Editar Operario
              </h2>
              <button
                onClick={cerrarModalEditar}
                className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitEditar} className="p-6 space-y-4">
              {/*Nombre completo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={formulario.nombre}
                  onChange={(e) =>
                    setFormulario({ ...formulario, nombre: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/*Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formulario.email}
                  onChange={(e) =>
                    setFormulario({ ...formulario, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  El operario usará este email para iniciar sesión
                </p>
              </div>

              {/*Contraseña */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={mostrarContraseña ? "text" : "password"}
                    placeholder="Nueva contraseña para el Operario"
                    value={formulario.contraseña}
                    onChange={(e) =>
                      setFormulario({
                        ...formulario,
                        contraseña: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarContraseña(!mostrarContraseña)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {mostrarContraseña ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recuerda compartir estas credenciales con el operario
                </p>
              </div>

              {/*Sectores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sectores
                </label>
                <div className="flex gap-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      value="recepcion"
                      checked={formulario.procesos.includes("recepcion")}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          procesos: e.target.checked
                            ? [...formulario.procesos, "recepcion"]
                            : formulario.procesos.filter(
                                (s) => s !== "recepcion",
                              ),
                        })
                      }
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Recepción</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      value="produccion"
                      checked={formulario.procesos.includes("produccion")}
                      onChange={(e) =>
                        setFormulario({
                          ...formulario,
                          procesos: e.target.checked
                            ? [...formulario.procesos, "produccion"]
                            : formulario.procesos.filter(
                                (s) => s !== "produccion",
                              ),
                        })
                      }
                      className="form-checkbox h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Producción</span>
                  </label>
                </div>
              </div>

              {/* Información adicional */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900 font-medium mb-1">
                  Información importante:
                </p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Selecciona al menos un sector para el operario</li>
                  <li>• Puede tener acceso a ambos sectores simultáneamente</li>
                  <li>• Solo verá las funciones de sus sectores asignados</li>
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={cerrarModalEditar}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Actualizar Operario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
