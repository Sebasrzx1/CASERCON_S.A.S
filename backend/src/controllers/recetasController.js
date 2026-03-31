const recetasService = require("../services/recetasService");

const recetasController = {

  async getAllRecetas(req, res) {
    try {
      const recetas = await recetasService.getAllRecetas();

      res.status(200).json(recetas);

    } catch (error) {
      console.error("Error en controller recetas:", error);

      res.status(500).json({
        message: "Error al obtener recetas"
      });
    }
  }

};

module.exports = recetasController;