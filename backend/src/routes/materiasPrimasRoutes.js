const express = require('express');
<<<<<<< HEAD
const router = express.Router()
const materiasPrimasController = require('../controllers/materiasPrimasController');

router.get("/", materiasPrimasController.getAllMaterias)
=======
const router  = express.Router();
const materiasPrimasController = require('../controllers/materiasPrimasController');

router.get("/",                    materiasPrimasController.getAllMaterias);
router.get("/categorias",          materiasPrimasController.getAllCategorias);
router.get("/:id/lotes",           materiasPrimasController.getLotesByMateria);
router.post("/",                   materiasPrimasController.createMateria);
router.put("/:id",                 materiasPrimasController.updateMateria);
router.delete("/:id",              materiasPrimasController.deleteMateria);   // inhabilita
router.patch("/:id/habilitar",     materiasPrimasController.habilitarMateria); // reactiva
>>>>>>> feature/modulo-inventario

module.exports = router;