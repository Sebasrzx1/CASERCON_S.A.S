const express = require("express");
const router = express.Router();
const recetasController = require("../controllers/recetasController");
const { protect } = require("../middlewares/authMiddleware")

router.get("/", protect, recetasController.getAllRecetas);
router.get("/:id", protect, recetasController.getRecetaById);
router.post("/", protect, recetasController.createReceta);
router.put("/:id", protect, recetasController.updateReceta);
router.delete("/:id", protect, recetasController.inhabilitarReceta);
router.patch("/:id/habilitar", protect, recetasController.habilitarReceta);

module.exports = router;