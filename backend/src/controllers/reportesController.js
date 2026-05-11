const reportesService = require("../services/reportesService");
const httpStatus = require("../constants/httpStatus");

const reportesController = {
  async getEstadoInventario(req, res, next) {
    try {
      const data = await reportesService.getEstadoInventario();
      res.status(httpStatus.OK).json({ status: "success", result: data.length, data });
    } catch (error) { next(error); }
  },

  async getConsumoPorMateria(req, res, next) {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      const data = await reportesService.getConsumoPorMateria({ fecha_inicio, fecha_fin });
      res.status(httpStatus.OK).json({ status: "success", result: data.length, data });
    } catch (error) { next(error); }
  },

  async getActividadProveedores(req, res, next) {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      const data = await reportesService.getActividadProveedores({ fecha_inicio, fecha_fin });
      res.status(httpStatus.OK).json({ status: "success", result: data.length, data });
    } catch (error) { next(error); }
  },

  async getReporteProduccion(req, res, next) {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      const data = await reportesService.getReporteProduccion({ fecha_inicio, fecha_fin });
      res.status(httpStatus.OK).json({ status: "success", result: data.length, data });
    } catch (error) { next(error); }
  },

  async getBalanceInventario(req, res, next) {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      const data = await reportesService.getBalanceInventario({ fecha_inicio, fecha_fin });
      res.status(httpStatus.OK).json({ status: "success", result: data.length, data });
    } catch (error) { next(error); }
  },

  async getMovimientosFiltrados(req, res, next) {
    try {
      const { tipo, fecha_inicio, fecha_fin } = req.query;
      const data = await reportesService.getMovimientosFiltrados({ tipo, fecha_inicio, fecha_fin });
      res.status(httpStatus.OK).json({ status: "success", result: data.length, data });
    } catch (error) { next(error); }
  },

  async getReporteEjecutivo(req, res, next) {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      const data = await reportesService.getReporteEjecutivo({ fecha_inicio, fecha_fin });
      res.status(httpStatus.OK).json({ status: "success", data });
    } catch (error) { next(error); }
  },
};

module.exports = reportesController;