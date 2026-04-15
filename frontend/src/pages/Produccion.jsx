import React, { useEffect, useState } from "react";
import { Factory, Plus, Play, Check, Trash2 } from "lucide-react";

export default function ProduccionPage() {
  const [producciones, setProducciones] = useState([]);
  const [recetas, setRecetas] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);

  const [formulario, setFormulario] = useState({
    id_receta: "",
    cantidad_producir: "",
  });

  const token = localStorage.getItem("token");

  // 🔥 Obtener producciones
  const fetchProducciones = async () => {
    try {
      setLoading(true);

      const res = await fetch("http://localhost:3000/api/produccion", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  // 🔥 Obtener recetas
  const fetchRecetas = async () => {
    try {
      const res = await fetch("http://localhost:3000/api/recetas", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setRecetas(Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.error(error);
      setRecetas([]);
    }
  };

  useEffect(() => {
    fetchProducciones();
    fetchRecetas();
  }, []);

  // 🧾 Crear orden
  const crearProduccion = async () => {
    try {
      if (!formulario.id_receta || !formulario.cantidad_producir) {
        alert("Todos los campos son obligatorios");
        return;
      }

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

      setModalAbierto(false);
      setFormulario({ id_receta: "", cantidad_producir: "" });
      fetchProducciones();
    } catch (error) {
      console.error(error);
    }
  };

  // ▶️ Iniciar producción
  const iniciarProduccion = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/produccion/${id}/iniciar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchProducciones();
    } catch (error) {
      console.error(error);
    }
  };

  // ✅ Finalizar producción
  const finalizarProduccion = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/produccion/${id}/finalizar`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchProducciones();
    } catch (error) {
      console.error(error);
    }
  };

  // ❌ Eliminar
  const eliminarProduccion = async (id) => {
    if (!confirm("¿Eliminar orden?")) return;

    try {
      await fetch(`http://localhost:3000/api/produccion/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      fetchProducciones();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Órdenes de Producción</h1>

        <button
          onClick={() => setModalAbierto(true)}
          className="bg-yellow-400 px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva Orden
        </button>
      </div>

      {/* LISTA */}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="grid gap-4">
          {Array.isArray(producciones) &&
            producciones.map((p) => (
              <div
                key={p.id_orden_produccion}
                className="border rounded-lg p-4 shadow-sm bg-white"
              >
                <div className="flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <Factory className="text-blue-600" />
                    <div>
                      <h3 className="font-bold">{p.nombre_producto}</h3>
                      <p className="text-sm text-gray-500">
                        Cantidad: {p.cantidad_producir}
                      </p>
                      <p className="text-sm">
                        Estado:{" "}
                        <span className="font-semibold">{p.estado}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {p.estado === "Pendiente" && (
                      <>
                        <button
                          onClick={() =>
                            iniciarProduccion(p.id_orden_produccion)
                          }
                          className="bg-blue-600 text-white px-3 py-1 rounded"
                        >
                          <Play className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() =>
                            eliminarProduccion(p.id_orden_produccion)
                          }
                          className="bg-red-600 text-white px-3 py-1 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {p.estado === "En proceso" && (
                      <button
                        onClick={() =>
                          finalizarProduccion(p.id_orden_produccion)
                        }
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* MODAL */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96 space-y-4">
            <h2 className="text-xl font-bold">Nueva Orden</h2>

            {/* SELECT RECETA */}
            <select
              value={formulario.id_receta}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  id_receta: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
            >
              <option value="">Seleccione receta</option>
              {Array.isArray(recetas) &&
                recetas.map((r) => (
                  <option key={r.id_receta} value={r.id_receta}>
                    {r.nombre_producto}
                  </option>
                ))}
            </select>

            {/* INPUT CANTIDAD */}
            <input
              type="number"
              placeholder="Cantidad a producir"
              value={formulario.cantidad_producir}
              onChange={(e) =>
                setFormulario({
                  ...formulario,
                  cantidad_producir: e.target.value,
                })
              }
              className="w-full border p-2 rounded"
            />

            {/* BOTONES */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModalAbierto(false)}
                className="px-4 py-2 border rounded"
              >
                Cancelar
              </button>

              <button
                onClick={crearProduccion}
                className="bg-yellow-400 px-4 py-2 rounded"
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}