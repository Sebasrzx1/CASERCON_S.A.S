const recetasModel = require("../models/recetasModel");

//Todas estas funciones async apuntan hacia el Model los (services) en el backend sirven como capa intermedia entre los controladores (controladores API) y el modelo (base de datos), encapsulando la lógica de negocio, validando datos y gestionando la manipulación de información. 

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