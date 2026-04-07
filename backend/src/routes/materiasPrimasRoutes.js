const express = require('express');
const router  = express.Router();
const materiasPrimasController = require('../controllers/materiasPrimasController');

// GET  /api/materias                → listar todas con stock calculado
// GET  /api/materias/categorias     → categorías para el select del formulario
// GET  /api/materias/:id/lotes      → lotes de una materia (modal "Ver Lotes")
// POST /api/materias                → crear materia prima
// PUT  /api/materias/:id            → editar metadatos
// DELETE /api/materias/:id          → eliminar

// ⚠️  /categorias debe ir ANTES de /:id para que Express no lo interprete como un ID
router.get("/",                    materiasPrimasController.getAllMaterias);
router.get("/categorias",          materiasPrimasController.getAllCategorias);
router.get("/:id/lotes",           materiasPrimasController.getLotesByMateria);
router.post("/",                   materiasPrimasController.createMateria);
router.put("/:id",                 materiasPrimasController.updateMateria);
router.delete("/:id",              materiasPrimasController.deleteMateria);   // inhabilita
router.patch("/:id/habilitar",     materiasPrimasController.habilitarMateria); // reactiva

module.exports = router;