const express = require("express");
const router = express.Router();
const recetasController = require("../controllers/recetasController");


router.get("/", recetasController.getAllRecetas);
router.get("/:id", recetasController.getRecetaById);
router.post("/", recetasController.createReceta);
router.put("/:id", recetasController.updateReceta);
router.delete("/:id", recetasController.inhabilitarReceta);
router.patch("/:id/habilitar", recetasController.habilitarReceta);

module.exports = router;