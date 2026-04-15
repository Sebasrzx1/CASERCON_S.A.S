const producccionService = require("../services/produccionService");
const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");

const produccionController = {
  async getAllProducciones(req, res, next) {
    try {
      const producciones = await producccionService.getAllProducciones();
      res.status(httpStatus.OK).json({
        status: "success",
        result: producciones.length,
        data: producciones,
      });
    } catch (error) {
      next(error);
    }
  },

  async getByIdProduccion(req, res, next) {
    try {
      const { id } = req.params;
      const produccion = await producccionService.getByIdProduccion(id);
      res.status(httpStatus.OK).json({
        status: "Success",
        result: produccion.length,
        data: produccion,
      });
    } catch (error) {
      next(error);
    }
  },

  async createProduccion(req, res, next) {
    try {
      const produccionNueva = await producccionService.createOrdenProduccion(
        req.body,
      );
      res.status(httpStatus.OK).json({
        status: "Success",
        result: produccionNueva.length,
        data: produccionNueva,
      });
    } catch (error) {
      next(error);
    }
  },

  async iniciarProduccion(req, res, next) {
    try {
      const userId = req.user.id;
      await producccionService.iniciarProduccion(req.params.id, userId);
      res.status(httpStatus.OK).json({
        status: "success",
        message: "Produccion Iniciada",
      });
    } catch (error) {
      next(error);
    }
  },

  async finalizarProduccion(req, res, next) {
    try {
      const userId = req.user.id;
      await producccionService.finalizarProduccion(req.params.id, userId);
      res.status(httpStatus.OK).json({
        status: "success",
        message: "Produccion Finalizada",
      });
    } catch (error) {
      next(error);
    }
  },
  async deleteProduccion(req, res, next) {
    try {
      const result = await producccionService.deleteProduccion(req.params.id);

      res.status(httpStatus.OK).json({
        status: "success",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = produccionController;
