const materiasPrimasModel = require("../models/materiasPrimasModel");

// Lógica de negocio: calcula el estado de stock de una materia prima
const calcularEstadoStock = (stockActual, stockMinimo) => {
  if (stockActual <= stockMinimo * 0.5) return "Critico";  // ≤ 50 % del mínimo
  if (stockActual <= stockMinimo)        return "Bajo";     // entre 50 % y 100 %
  return "Suficiente";
};

const materiasPrimasService = {

  // ─── Ya existente: usada en Dashboard ─────────────────────────────────────
  async getAllMaterias() {
    try {
      const materias = await materiasPrimasModel.findAll();

      return materias.map((m) => ({
        ...m,
        estado: calcularEstadoStock(m.stockActual, m.stockMinimo),
      }));
    } catch (error) {
      console.error("Error en service getAllMaterias:", error);
      throw error;
    }
  },

  // ─── Categorías para el select del formulario ──────────────────────────────
  async getAllCategorias() {
    try {
      return await materiasPrimasModel.findAllCategorias();
    } catch (error) {
      console.error("Error en service getAllCategorias:", error);
      throw error;
    }
  },

  // ─── Lotes de una materia (modal "Ver Lotes") ──────────────────────────────
  async getLotesByMateria(id) {
    try {
      const materia = await materiasPrimasModel.findById(id);
      if (!materia) throw { status: 404, msg: "Materia prima no encontrada" };

      return await materiasPrimasModel.findLotesByMateria(id);
    } catch (error) {
      console.error("Error en service getLotesByMateria:", error);
      throw error;
    }
  },

  // ─── Crear ─────────────────────────────────────────────────────────────────
  async createMateria(body) {
    try {
      const { nombre, codigo, abreviacion, id_categoria_materia, stock_min } = body;

      if (!nombre || !codigo || !abreviacion || !id_categoria_materia) {
        throw { status: 400, msg: "Faltan campos requeridos: nombre, codigo, abreviacion, id_categoria_materia" };
      }

      const id = await materiasPrimasModel.create({
        nombre, codigo, abreviacion, id_categoria_materia, stock_min,
      });

      return { id_materia: id, msg: "Materia prima creada correctamente" };
    } catch (error) {
      console.error("Error en service createMateria:", error);
      throw error;
    }
  },

  // ─── Actualizar ────────────────────────────────────────────────────────────
  async updateMateria(id, body) {
    try {
      const materia = await materiasPrimasModel.findById(id);
      if (!materia) throw { status: 404, msg: "Materia prima no encontrada" };

      const { nombre, codigo, abreviacion, id_categoria_materia, stock_min } = body;

      if (!nombre || !codigo || !abreviacion || !id_categoria_materia) {
        throw { status: 400, msg: "Faltan campos requeridos" };
      }

      await materiasPrimasModel.update(id, {
        nombre, codigo, abreviacion, id_categoria_materia, stock_min,
      });

      return { msg: "Materia prima actualizada correctamente" };
    } catch (error) {
      console.error("Error en service updateMateria:", error);
      throw error;
    }
  },

  // Reemplaza deleteMateria por esto:
async deleteMateria(id) {
  try {
    const materia = await materiasPrimasModel.findById(id);
    if (!materia) throw { status: 404, msg: "Materia prima no encontrada" };
    if (materia.estado === 'Inhabilitado') throw { status: 400, msg: "La materia prima ya está inhabilitada" };

    await materiasPrimasModel.inhabilitar(id);
    return { msg: "Materia prima inhabilitada correctamente" };
  } catch (error) {
    console.error("Error en service deleteMateria:", error);
    throw error;
  }
},

// Agrega esta función nueva:
async habilitarMateria(id) {
  try {
    const materia = await materiasPrimasModel.findById(id);
    if (!materia) throw { status: 404, msg: "Materia prima no encontrada" };
    if (materia.estado === 'Activo') throw { status: 400, msg: "La materia prima ya está activa" };

    await materiasPrimasModel.habilitar(id);
    return { msg: "Materia prima habilitada correctamente" };
  } catch (error) {
    console.error("Error en service habilitarMateria:", error);
    throw error;
  }
},
};

module.exports = materiasPrimasService;