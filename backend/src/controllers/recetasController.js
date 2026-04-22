const recetasService = require("../services/recetasService");
const httpStatus = require("../constants/httpStatus");

const recetasController = {

  async getAllRecetas(req, res, next) {
    try {
      const recetas = await recetasService.getAllRecetas();
      res.status(httpStatus.OK).json({
        status: "success",
        result: recetas.length,
        data: recetas,
      });
    } catch (error) {
      next(error);
    }
  },

  async getRecetaById(req, res, next) {
    try {
      const { id } = req.params;
      const receta = await recetasService.getById(id);
      res.status(httpStatus.OK).json({ status: "success", data: receta });
    } catch (error) {
      next(error);
    }
  },

  async createReceta(req, res, next) {
    try {
      const { nombre_producto, ingredientes } = req.body;
      const receta = await recetasService.createReceta(nombre_producto, ingredientes);
      res.status(httpStatus.CREATED).json({
        status: "success",
        message: "Receta creada exitosamente",
        data: receta,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateReceta(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre_producto, ingredientes } = req.body;
      const receta = await recetasService.updateReceta(id, nombre_producto, ingredientes);
      res.status(httpStatus.OK).json({
        status: "success",
        message: "Receta actualizada exitosamente",
        data: receta,
      });
    } catch (error) {
      next(error);
    }
  },

  async inhabilitarReceta(req, res, next) {
    try {
      const { id } = req.params;
      await recetasService.inhabilitarReceta(id);
      res.status(httpStatus.OK).json({
        status: "success",
        message: "Receta inhabilitada correctamente",
      });
    } catch (error) {
      next(error);
    }
  },

  async habilitarReceta(req, res, next) {
    try {
      const { id } = req.params;
      await recetasService.habilitarReceta(id);
      res.status(httpStatus.OK).json({
        status: "success",
        message: "Receta habilitada correctamente",
      });
    } catch (error) {
      next(error);
    }
  },

};

module.exports = recetasController;