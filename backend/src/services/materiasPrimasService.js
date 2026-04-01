const materiasPrimasModel = require("../models/materiasPrimasModel");

//Todas estas funciones async apuntan hacia el Model los (services) en el backend sirven como capa intermedia entre los controladores (controladores API) y el modelo (base de datos), encapsulando la lógica de negocio, validando datos y gestionando la manipulación de información. 

//Funcion que nos ayudara más adelante a calcular el estado de cada materia prima.
const calcularEstadoStock = (stockActual, stockMinimo) => {
  if (stockActual <= stockMinimo) return "Critico";
  if (stockActual <= stockMinimo * 1.5) return "Bajo";
  return "Suficiente"
};

const materiasPrimasService = {

  async getAllMaterias() {
    try {
      const materias = await materiasPrimasModel.findAll();

      // 🔥 Transformamos los datos
      const materiasConEstado = materias.map((m) => ({
        ...m,
        estado: calcularEstadoStock(m.stockActual, m.stockMinimo),
      }));

      return materiasConEstado;

    } catch (error) {
      console.error("Error en service getAllMaterias:", error);
      throw error; // lo maneja el controller
    }
  }

};

module.exports = materiasPrimasService;