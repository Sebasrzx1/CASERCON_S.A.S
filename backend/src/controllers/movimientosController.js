const movimientosService = require("../services/movimientosService");

const movimientosController = {

  async getAllMovimientos(req, res) {
    try {
      const movimientos = await movimientosService.getAllMovimientos();

      res.status(200).json(movimientos);

    } catch (error) {
      console.error("Error en controller movimientos:", error);

      res.status(500).json({
        message: "Error al obtener movimientos"
      });
    }
  },

  async createMovimiento(req, res) {
    try {
      const result = await movimientosService.createMovimiento(req.body);

      res.status(201).json(result);

    } catch (error) {
      console.error("Error en controller createMovimiento:", error);

      res.status(400).json({
        message: error.message
      });
    }
  }

};

module.exports = movimientosController;