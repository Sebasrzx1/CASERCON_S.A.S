const proveedoresService = require("../services/proveedoresService");

const proveedoresController = {

  async getAllProveedores(req, res) {
    try {
      const proveedores = await proveedoresService.getAllProveedores();

      res.status(200).json(proveedores);

    } catch (error) {
      console.error("Error en controller proveedores:", error);

      res.status(500).json({
        message: "Error al obtener movimientos"
      });
    }
  },

  async createProveedor(req, res) {
    try {
      const result = await proveedoresService.createProveedor(req.body);

      res.status(201).json({
        ok: true,
        message: "Proveedor creado con exito",
        result,
      });

    } catch (error) {
      console.error("Error en controller createProveedor:", error);

      res.status(400).json({
        message: error.message
      });
    }
  }

};

module.exports = proveedoresController;