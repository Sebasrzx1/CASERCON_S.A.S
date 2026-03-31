const materiasPrimasModel = require("../models/materiasPrimasModel");

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