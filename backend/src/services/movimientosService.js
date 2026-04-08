const movimientosModel = require("../models/movimientosModel");


//Todas estas funciones async apuntan hacia el Model los (services) en el backend sirven como capa intermedia entre los controladores (controladores API) y el modelo (base de datos), encapsulando la lógica de negocio, validando datos y gestionando la manipulación de información. 

const movimientosService = {

  async getAllMovimientos() {
    try {
      const movimientos = await movimientosModel.findAll();
      return movimientos;

    } catch (error) {
      console.error("Error en service movimientos:", error);
      throw error;
    }
  },

  async createMovimiento(data) {
    try {
      const { id_materia, tipo, cantidad } = data;

      // 🔥 Validación básica
      if (!id_materia || !tipo || !cantidad) {
        throw new Error("Todos los campos son obligatorios");
      }

      if (tipo !== "entrada" && tipo !== "salida") {
        throw new Error("Tipo inválido");
      }

      const id = await movimientosModel.create(data);

      return {
        message: "Movimiento creado correctamente",
        id
      };

    } catch (error) {
      console.error("Error en service createMovimiento:", error);
      throw error;
    }
  }

};

module.exports = movimientosService;