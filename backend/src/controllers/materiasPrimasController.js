const materiasPrimasService = require('../services/materiasPrimasService');

const materiasPrimasController = {

  // ─── Ya existente: GET /api/materias ──────────────────────────────────────
async getAllMaterias(req, res) {
    try {
    const materiasPrimas = await materiasPrimasService.getAllMaterias();
    res.status(200).json(materiasPrimas);
    } catch (error) {
    console.error("Error en el controlador getAllMaterias:", error);
    res.status(500).json({ message: "Error al obtener materias primas" });
    }
},

  // ─── GET /api/materias/categorias ─────────────────────────────────────────
async getAllCategorias(req, res) {
    try {
    const categorias = await materiasPrimasService.getAllCategorias();
    res.status(200).json(categorias);
    } catch (error) {
    console.error("Error en el controlador getAllCategorias:", error);
    res.status(500).json({ message: "Error al obtener categorías" });
    }
},

  // ─── GET /api/materias/:id/lotes ──────────────────────────────────────────
async getLotesByMateria(req, res) {
    try {
    const lotes = await materiasPrimasService.getLotesByMateria(req.params.id);
    res.status(200).json(lotes);
    } catch (error) {
    console.error("Error en el controlador getLotesByMateria:", error);
    const status = error.status || 500;
    res.status(status).json({ message: error.msg || "Error al obtener lotes" });
    }
},

  // ─── POST /api/materias ───────────────────────────────────────────────────
async createMateria(req, res) {
    try {
    const result = await materiasPrimasService.createMateria(req.body);
    res.status(201).json(result);
    } catch (error) {
    console.error("Error en el controlador createMateria:", error);
    const status = error.status || 500;
    res.status(status).json({ message: error.msg || "Error al crear materia prima" });
    }
},

  // ─── PUT /api/materias/:id ────────────────────────────────────────────────
async updateMateria(req, res) {
    try {
    const result = await materiasPrimasService.updateMateria(req.params.id, req.body);
    res.status(200).json(result);
    } catch (error) {
    console.error("Error en el controlador updateMateria:", error);
    const status = error.status || 500;
    res.status(status).json({ message: error.msg || "Error al actualizar materia prima" });
    }
},

  // ─── DELETE /api/materias/:id ─────────────────────────────────────────────
async deleteMateria(req, res) {
    try {
    const result = await materiasPrimasService.deleteMateria(req.params.id);
    res.status(200).json(result);
    } catch (error) {
    console.error("Error en el controlador deleteMateria:", error);
    const status = error.status || 500;
    res.status(status).json({ message: error.msg || "Error al eliminar materia prima" });
    }
},

async habilitarMateria(req, res) {
try {
    const result = await materiasPrimasService.habilitarMateria(req.params.id);
    res.status(200).json(result);
} catch (error) {
    console.error("Error en el controlador habilitarMateria:", error);
    const status = error.status || 500;
    res.status(status).json({ message: error.msg || "Error al habilitar materia prima" });
}
},
};

module.exports = materiasPrimasController;