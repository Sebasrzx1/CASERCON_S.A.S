const express = require("express");
const router = express.Router();
const reportesController = require("../controllers/reportesController");
const { protect, restricTo } = require("../middlewares/authMiddleware");

// Todos los reportes requieren autenticación y rol Administrador
router.use(protect, restricTo("Administrador"));

router.get("/inventario",   reportesController.getEstadoInventario);
router.get("/consumo",      reportesController.getConsumoPorMateria);
router.get("/proveedores",  reportesController.getActividadProveedores);
router.get("/produccion",   reportesController.getReporteProduccion);
router.get("/balance",      reportesController.getBalanceInventario);
router.get("/movimientos",  reportesController.getMovimientosFiltrados);
router.get("/ejecutivo",    reportesController.getReporteEjecutivo);

module.exports = router;