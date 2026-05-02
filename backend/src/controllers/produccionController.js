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
      const userId = req.user.id;
      const produccionNueva = await producccionService.createOrdenProduccion({
        ...req.body,
        id_usuario_creador: userId,
      });
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
      const rolNombre = req.user.rol_nombre; // viene del middleware protect

      // Verificar que el operario sea el asignado a esta orden
      const orden = await producccionService.getByIdProduccion(req.params.id);
      if (
        rolNombre !== "administrador" &&
        Number(orden.id_usuario_inicio) !== Number(userId)
      ) {
        throw new AppError(
          "No tienes permiso para finalizar esta orden",
          httpStatus.FORBIDEN,
        );
      }

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

  // Verifica si hay stock disponible para una receta y cantidad dadas
  // GET /api/produccion/verificar-stock?id_receta=X&cantidad_producir=Y
  async verificarStock(req, res, next) {
    try {
      const { id_receta, cantidad_producir, id_orden } = req.query;

      if (!id_receta || !cantidad_producir) {
        throw new AppError(
          "Faltan parámetros: id_receta y cantidad_producir",
          httpStatus.BAD_REQUEST,
        );
      }

      const resultado = await producccionService.verificarStockParaOrden(
        id_receta,
        cantidad_producir,
        id_orden || null, // 👈 pasa el id_orden si viene
      );

      res.status(httpStatus.OK).json({
        status: "success",
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  },

  async verificarStockEdicion(req, res, next) {
    try {
      const { id } = req.params;
      const { ingredientes, cantidad_producir } = req.body;

      if (!ingredientes || !cantidad_producir) {
        throw new AppError("Faltan parámetros", httpStatus.BAD_REQUEST);
      }

      const resultado = await producccionService.verificarStockParaEdicion(
        id,
        ingredientes,
        cantidad_producir,
      );

      res.status(httpStatus.OK).json({
        status: "success",
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  },

  // Reasigna el operario de una orden en proceso
  // PUT /api/produccion/:id/reasignar
  async reasignarProduccion(req, res, next) {
    try {
      const { id_usuario_inicio } = req.body;

      if (!id_usuario_inicio) {
        throw new AppError(
          "Falta el campo id_usuario_inicio",
          httpStatus.BAD_REQUEST,
        );
      }

      const result = await producccionService.reasignarProduccion(
        req.params.id,
        id_usuario_inicio,
      );

      res.status(httpStatus.OK).json({
        status: "success",
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  // Lista los operarios activos para el select del modal de reasignación
  // GET /api/produccion/operarios
  async getOperarios(req, res, next) {
    try {
      const operarios = await producccionService.getOperarios();
      res.status(httpStatus.OK).json({
        status: "success",
        data: operarios,
      });
    } catch (error) {
      next(error);
    }
  },

  // Editar cantidad e id_receta de una orden pendiente
  // PUT /api/produccion/:id/cantidad
  async editarOrden(req, res, next) {
    try {
      const { cantidad_producir, id_receta } = req.body;

      const result = await producccionService.editarOrden(
        req.params.id,
        cantidad_producir,
        id_receta,
      );

      res.status(httpStatus.OK).json({
        status: "success",
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },

  async editarRecetaOrden(req, res, next) {
    try {
      console.log("BODY recibido:", JSON.stringify(req.body, null, 2)); // 👈 agrega esto
      console.log("USER:", req.user); // 👈 y esto
      const { ingredientes, motivo } = req.body;
      const userId = req.user.id;
      const rolNombre = req.user.rol_nombre;

      if (
        !ingredientes ||
        !Array.isArray(ingredientes) ||
        ingredientes.length === 0
      ) {
        throw new AppError(
          "Los ingredientes son obligatorios",
          httpStatus.BAD_REQUEST,
        );
      }

      if (!motivo || !motivo.trim()) {
        throw new AppError(
          "El motivo de modificación es obligatorio",
          httpStatus.BAD_REQUEST,
        );
      }

      const result = await producccionService.editarRecetaOrden(
        req.params.id,
        ingredientes,
        motivo,
        userId,
        rolNombre,
      );

      res.status(httpStatus.OK).json({
        status: "success",
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = produccionController;
