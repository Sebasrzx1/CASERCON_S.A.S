const express = require('express')
const router = express.Router()
const { protect } = require("../middlewares/authMiddleware")
const produccionController = require('../controllers/produccionController')
const checkUserActivo = require("../middlewares/checkUserActivo");

router.get("/", protect, checkUserActivo, produccionController.getAllProducciones)
router.get("/verificar-stock", protect, checkUserActivo, produccionController.verificarStock)
router.get("/operarios", protect, checkUserActivo, produccionController.getOperarios)
router.get("/:id", protect, checkUserActivo, produccionController.getByIdProduccion)
router.post("/", protect, checkUserActivo, produccionController.createProduccion)
router.post("/:id/verificar-stock-edicion", protect, checkUserActivo, produccionController.verificarStockEdicion)
router.put("/:id/iniciar", protect, checkUserActivo, produccionController.iniciarProduccion)
router.put("/:id/finalizar", protect, checkUserActivo, produccionController.finalizarProduccion)
router.put("/:id/cantidad", protect, checkUserActivo, produccionController.editarOrden)
router.put("/:id/reasignar", protect, checkUserActivo, produccionController.reasignarProduccion)
router.put("/:id/receta", protect, checkUserActivo, produccionController.editarRecetaOrden)
router.delete('/:id', protect, checkUserActivo, produccionController.deleteProduccion)

module.exports = router