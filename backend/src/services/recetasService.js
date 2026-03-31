const recetasModel = require("../models/recetasModel");

const recetasService = {

  async getAllRecetas() {
    try {
      const recetas = await recetasModel.findAll();

      // Por cada receta traemos su detalle
      const recetasConDetalle = await Promise.all(
        recetas.map(async (receta) => {
          const materiales = await recetasModel.findDetalleByReceta(receta.id_receta);

          return {
            id: receta.id_receta,
            nombre: receta.nombre,
            materiales
          };
        })
      );

      return recetasConDetalle;

    } catch (error) {
      console.error("Error en service recetas:", error);
      throw error;
    }
  }

};

module.exports = recetasService;