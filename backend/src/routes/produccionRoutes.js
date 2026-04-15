const express = require('express')
const router = express.Router()
const {protect} = require("../middlewares/authMiddleware")
const produccionController = require('../controllers/produccionController')

//GET para traer todas las producciones
router.get("/", produccionController.getAllProducciones)
router.get("/:id",produccionController.getByIdProduccion)
router.post("/", produccionController.createProduccion)
router.put("/:id/iniciar", protect, produccionController.iniciarProduccion)
router.put("/:id/finalizar", protect, produccionController.finalizarProduccion)
router.delete('/:id', protect, produccionController.deleteProduccion);

module.exports = router