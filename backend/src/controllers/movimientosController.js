const movimientosService = require("../services/movimientosService");
const httpStatus = require("../constants/httpStatus");

const movimientosController = {

  async getAllMovimientos(req, res, next) {
    try {
      const movimientos = await movimientosService.getAllMovimientos();
      res.status(httpStatus.OK).json({
        status: "success",
        result: movimientos.length,
        data: movimientos,
      });
    } catch (error) {
      next(error);
    }
  },

  async getMovimientosFiltrados(req, res, next) {
    try {
      const { tipo, fecha_inicio, fecha_fin } = req.query;
      const movimientos = await movimientosService.getMovimientosFiltrados({
        tipo, fecha_inicio, fecha_fin,
      });
      res.status(httpStatus.OK).json({
        status: "success",
        result: movimientos.length,
        data: movimientos,
      });
    } catch (error) {
      next(error);
    }
  },

  async getLotesByMateria(req, res, next) {
    try {
      const { id_materia } = req.params;
      const lotes = await movimientosService.getLotesByMateria(id_materia);
      res.status(httpStatus.OK).json({
        status: "success",
        result: lotes.length,
        data: lotes,
      });
    } catch (error) {
      next(error);
    }
  },

  async registrarEntrada(req, res, next) {
    try {
      const { id_materia, cantidad, observacion } = req.body;
      const id_usuario = req.user.id;
      const resultado = await movimientosService.registrarEntrada({
        id_materia, cantidad, observacion, id_usuario,
      });
      res.status(httpStatus.CREATED).json({
        status: "success",
        message: resultado.mensaje,
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  },

  async registrarSalida(req, res, next) {
    try {
      const { id_materia, id_lote, cantidad, observacion } = req.body;
      const id_usuario = req.user.id;
      const resultado = await movimientosService.registrarSalida({
        id_materia, id_lote, cantidad, observacion, id_usuario,
      });
      res.status(httpStatus.CREATED).json({
        status: "success",
        message: resultado.mensaje,
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  },
// POST /api/movimientos/devolucion
async registrarDevolucion(req, res, next) {
  try {
    const { id_materia, id_lote, cantidad, observacion } = req.body;
    const id_usuario = req.user.id;
    const resultado  = await movimientosService.registrarDevolucion({
      id_materia, id_lote, cantidad, observacion, id_usuario,
    });
    res.status(httpStatus.CREATED).json({
      status:  "success",
      message: resultado.mensaje,
      data:    resultado,
    });
  } catch (error) {
    next(error);
  }
},

// GET /api/movimientos/lotes-devolucion/:id_materia
async getLotesParaDevolucion(req, res, next) {
  try {
    const { id_materia } = req.params;
    const lotes = await movimientosService.getLotesParaDevolucion(id_materia);
    res.status(httpStatus.OK).json({
      status: "success",
      result: lotes.length,
      data:   lotes,
    });
  } catch (error) {
    next(error);
  }
},

};

module.exports = movimientosController;