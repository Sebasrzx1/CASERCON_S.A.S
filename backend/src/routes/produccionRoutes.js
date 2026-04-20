const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const produccionController = require("../controllers/produccionController");

//GET para traer todas las producciones
router.get("/", produccionController.getAllProducciones);
router.get("/verificar-stock", protect, produccionController.verificarStock);
router.get("/operarios", protect, produccionController.getOperarios);
router.get("/:id", produccionController.getByIdProduccion);
router.post("/", protect, produccionController.createProduccion);
router.put("/:id/iniciar", protect, produccionController.iniciarProduccion);
router.put("/:id/finalizar", protect, produccionController.finalizarProduccion);
router.put("/:id/reasignar", protect, produccionController.reasignarProduccion)
router.delete("/:id", protect, produccionController.deleteProduccion);

module.exports = router;
