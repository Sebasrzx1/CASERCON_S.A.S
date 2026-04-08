const express = require("express");
const router = express.Router();

const movimientosController = require("../controllers/movimientosController");

// GET todos
router.get("/", movimientosController.getAllMovimientos);

// POST crear movimiento
router.post("/", movimientosController.createMovimiento);

module.exports = router;