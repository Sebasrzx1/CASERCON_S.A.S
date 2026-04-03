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
} from "lucide-react";

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

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtro, setFiltro] = useState("habilitadas");

  const [formData, setFormData] = useState({
    nombre: "",
    contacto: "",
    telefono: "",
    email: "",
    direccion: "",
    observaciones: "",
  });

  // ==============================
  // 🔄 CARGAR PROVEEDORES
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
    }
  };

  // ==============================
  // 🧹 RESET FORM
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
  };

  // ==============================
  // 🆕 CREAR
  // ==============================
  const agregarProveedor = async () => {
    try {
      await fetch("http://localhost:3000/api/proveedores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre_proveedor: formData.contacto,
          nombre_empresa: formData.nombre,
          telefono: formData.telefono,
          email: formData.email,
          direccion: formData.direccion,
          observaciones: formData.observaciones,
        }),
      });

      fetchProveedores();
    } catch (error) {
      console.error(error);
    }
  };

  // ==============================
  // ✏️ ACTUALIZAR
  // ==============================
  const actualizarProveedor = async () => {
    try {
      await fetch(
        `http://localhost:3000/api/proveedores/${proveedorEditando}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            nombre_proveedor: formData.contacto,
            nombre_empresa: formData.nombre,
            telefono: formData.telefono,
            email: formData.email,
            direccion: formData.direccion,
            observaciones: formData.observaciones,
          }),
        },
      );

      fetchProveedores();
    } catch (error) {
      console.error(error);
    }
  };

  // ==============================
  // INHABILITAR
  // ==============================
  const inhabilitarProveedor = async (id) => {
    if (!confirm("¿Está seguro de inhabilitar este proveedor?")) return;

    try {
      await fetch(`http://localhost:3000/api/proveedores/${id}`, {
        method: "DELETE",
      });

      fetchProveedores();
    } catch (error) {
      console.error(error);
    }
  };

  // ==============================
  // 🔄 HABILITAR (requiere endpoint PATCH)
  // ==============================
  const habilitarProveedor = async (id) => {
    if (!confirm("¿Está seguro de habilitar este proveedor?")) return;

    try {
      await fetch(`http://localhost:3000/api/proveedores/${id}/habilitar`, {
        method: "PATCH",
      });

      fetchProveedores();
    } catch (error) {
      console.error(error);
    }
  };

  // ==============================
  // MODAL
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

    if (proveedorEditando) {
      await actualizarProveedor();
    } else {
      await agregarProveedor();
    }

    setModalAbierto(false);
    resetForm();
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Proveedores</h1>
          <p className="text-gray-600 mt-1">Gestión de proveedores</p>
        </div>
        <Button
          onClick={abrirModalNuevo}
          className="bg-yellow-400 hover:bg-yellow-500 text-gray-900"
        >
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
                  Habilitados (
                  {proveedores.filter((p) => p.habilitado !== false).length})
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
                  Inhabilitados (
                  {proveedores.filter((p) => p.habilitado === false).length})
                </span>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de proveedores*/}
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
                <div className="flex items-start gap-2 text-sm">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    <span className="font-bold">Observaciones:</span>{" "}
                    {p.observaciones}
                  </p>
                </div>
              </div>

              {/*Modal de editar */}
              <div className="flex gap-2">
                <Button
                  onClick={() => abrirModalEditar(p)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </Button>

                {p.habilitado ? (
                  <Button
                    onClick={() => inhabilitarProveedor(p.id)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-200"
                    title="Inhabilitar proveedor"
                  >
                    <Ban className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => habilitarProveedor(p.id)}
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

      {/* MODAL formulario*/}
      <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {proveedorEditando ? "Editar" : "Nuevo"} Proveedor
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label for="nombre">
                  Nombre de la empresa <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombre"
                  placeholder="Empresa"
                  required
                  value={formData.nombre}
                  onChange={(e) =>
                    setFormData({ ...formData, nombre: e.target.value })
                  }
                />
              </div>

              <div>
                <Label for="contacto">
                  Persona de Contacto <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="contacto"
                  placeholder="Contacto"
                  required
                  value={formData.contacto}
                  onChange={(e) =>
                    setFormData({ ...formData, contacto: e.target.value })
                  }
                />
              </div>

              <div>
                <Label for="telefono">
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="telefono"
                  placeholder="Teléfono"
                  required
                  value={formData.telefono}
                  onChange={(e) =>
                    setFormData({ ...formData, telefono: e.target.value })
                  }
                />
              </div>

              <div>
                <Label for="email">
                  Correo Electrónico <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  placeholder="Email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label for="direccion">
                Dirección <span className="text-red-500">*</span>
              </Label>
              <Input
                id="direccion"
                placeholder="Dirección"
                required
                value={formData.direccion}
                onChange={(e) =>
                  setFormData({ ...formData, direccion: e.target.value })
                }
              />
            </div>
            <div>
              <Label for="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                placeholder="Observaciones"
                value={formData.observaciones}
                onChange={(e) =>
                  setFormData({ ...formData, observaciones: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
              className="hover:bg-amber-100"
                type="button"
                variant="outline"
                onClick={() => {
                  setModalAbierto(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" className=" bg-yellow-400 text-black hover:bg-amber-400">
                Guardar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
