const express = require("express");
const router = express.Router();
const movimientosController = require("../controllers/movimientosController");
const { protect, restricTo } = require("../middlewares/authMiddleware");

router.get("/", movimientosController.getAllMovimientos);
router.get("/filtros", protect, movimientosController.getMovimientosFiltrados);
router.get("/lotes/:id_materia", protect, movimientosController.getLotesByMateria);
router.post("/entrada", protect, restricTo("Administrador"), movimientosController.registrarEntrada);
router.post("/salida", protect, restricTo("Administrador"), movimientosController.registrarSalida);
router.get("/lotes-devolucion/:id_materia", protect, movimientosController.getLotesParaDevolucion);
router.post("/devolucion", protect, restricTo("Administrador"), movimientosController.registrarDevolucion);
module.exports = router;