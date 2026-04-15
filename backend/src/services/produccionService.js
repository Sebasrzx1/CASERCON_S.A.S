const produccionModel = require("../models/producccionModel");
const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");

const producccionService = {
  async getAllProducciones() {
    try {
      const producciones = await produccionModel.findAll();
      return producciones;
    } catch (error) {
      console.error("Error en produccionService");
      throw error;
    }
  },

  async getByIdProduccion(id) {
    try {
      const produccion = await produccionModel.findById(id);
      if (!produccion) {
        throw new AppError(
          "Orden de produccion no encontrada",
          httpStatus.NOT_FOUND,
        );
      }

      return produccion;
    } catch (error) {
      console.error("Error en produccion, service");
      throw error;
    }
  },

  async createOrdenProduccion(data) {
    try {
      if (
        !data.id_receta ||
        !data.id_usuario_creador ||
        !data.cantidad_producir
      ) {
        throw new AppError("Faltan datos obligatorios", httpStatus.BAD_REQUEST);
      }

      const produccionNueva = await produccionModel.create(data);
      return produccionNueva;
    } catch (error) {
      console.error("Error en produccionService");
      throw error;
    }
  },

  async iniciarProduccion(id, id_usuario) {
    try {
      const ordenProduccion = await produccionModel.findById(id);

      if (!ordenProduccion) {
        throw new AppError(
          "Orden de produccion no encontrada",
          httpStatus.NOT_FOUND,
        );
      }

      if (ordenProduccion.estado !== "Pendiente") {
        throw new AppError(
          "Esta orden de produccion ya esta iniciada",
          httpStatus.FORBIDEN,
        );
      }

      await produccionModel.iniciarOrden(id, id_usuario);
    } catch (error) {
      console.error("Error en produccionService");
      throw error;
    }
  },

  async finalizarProduccion(id, id_usuario) {
    try {
      const ordenProduccion = await produccionModel.findById(id);

      if (!ordenProduccion) {
        throw new AppError(
          "Orden de producion no existe",
          httpStatus.NOT_FOUND,
        );
      }

      if (ordenProduccion.estado !== "En proceso") {
        throw new AppError(
          "Solo se pueden finalizar órdenes en proceso",
          httpStatus.FORBIDEN,
        );
      }

      await produccionModel.finalizarOrden(id, id_usuario);

      return { message: "Producción finalizada" };
    } catch (error) {
      console.error("Error en finalizarProduccion:", error);
      throw error;
    }
  },

  async deleteProduccion(id) {
    try {
      const orden = await produccionModel.findById(id);

      if (!orden) {
        throw new AppError("Orden no encontrada", httpStatus.NOT_FOUND);
      }

      // Para poder eliminarse evaluasmos que su estado este en pendiente
      if (orden.estado !== "Pendiente") {
        throw new AppError(
          "Solo puedes eliminar órdenes en estado Pendiente",
          httpStatus.BAD_REQUEST,
        );
      }

      // Y evaluamos que no tenga movimientos asociados 
      const tieneMovimientos = await produccionModel.hasMovimientos(id);

      if (tieneMovimientos) {
        throw new AppError(
          "No puedes eliminar la orden porque tiene movimientos asociados",
          httpStatus.BAD_REQUEST,
        );
      }

      await produccionModel.deleteOrden(id);

      return { message: "Orden eliminada correctamente" };
    } catch (error) {
      console.error("Error en deleteProduccion:", error);
      throw error;
    }
  },
};

module.exports = producccionService;
