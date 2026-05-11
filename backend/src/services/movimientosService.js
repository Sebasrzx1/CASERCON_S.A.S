const movimientosModel = require("../models/movimientosModel");
const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");

const movimientosService = {

  async getAllMovimientos() {
    return await movimientosModel.findAll();
  },

  async getMovimientosFiltrados({ tipo, fecha_inicio, fecha_fin }) {
    if (fecha_inicio && fecha_fin && fecha_inicio > fecha_fin) {
      throw new AppError(
        "La fecha de inicio no puede ser posterior a la fecha de fin",
        httpStatus.BAD_REQUEST
      );
    }
    return await movimientosModel.findByFiltros({ tipo, fecha_inicio, fecha_fin });
  },

  async getLotesByMateria(id_materia) {
    const materia = await movimientosModel.findMateriaById(id_materia);
    if (!materia) throw new AppError("Materia prima no encontrada", httpStatus.NOT_FOUND);
    return await movimientosModel.findLotesActivosByMateria(id_materia);
  },

  async registrarEntrada({ id_materia, cantidad, observacion, id_usuario }) {
    if (!id_materia) throw new AppError("La materia prima es obligatoria", httpStatus.BAD_REQUEST);
    if (!cantidad || parseFloat(cantidad) <= 0)
      throw new AppError("La cantidad debe ser mayor a cero", httpStatus.BAD_REQUEST);

    const materia = await movimientosModel.findMateriaById(id_materia);
    if (!materia) throw new AppError("Materia prima no encontrada", httpStatus.NOT_FOUND);
    if (materia.estado !== "Activo")
      throw new AppError("La materia prima está inhabilitada", httpStatus.BAD_REQUEST);

    const numero_lote = await movimientosModel.getNextNumeroLote(id_materia);
    const { id_lote, codigo_lote } = await movimientosModel.createLote({
      id_materia,
      abreviacion: materia.abreviacion,
      cantidad: parseFloat(cantidad),
      numero_lote,
    });

    await movimientosModel.createEntrada({
      id_materia, id_lote, id_usuario,
      cantidad: parseFloat(cantidad),
      observacion,
    });

    return { mensaje: "Entrada registrada correctamente", codigo_lote, numero_lote };
  },

  async registrarSalida({ id_materia, id_lote, cantidad, observacion, id_usuario }) {
    if (!id_materia) throw new AppError("La materia prima es obligatoria", httpStatus.BAD_REQUEST);
    if (!id_lote) throw new AppError("El lote es obligatorio", httpStatus.BAD_REQUEST);
    if (!cantidad || parseFloat(cantidad) <= 0)
      throw new AppError("La cantidad debe ser mayor a cero", httpStatus.BAD_REQUEST);

    const lote = await movimientosModel.findLoteById(id_lote);
    if (!lote) throw new AppError("Lote no encontrado", httpStatus.NOT_FOUND);
    if (lote.estado !== "activo")
      throw new AppError("El lote no está activo", httpStatus.BAD_REQUEST);
    if (parseFloat(cantidad) > parseFloat(lote.stock_restante))
      throw new AppError(
        `Cantidad supera el stock disponible del lote (${lote.stock_restante} kg)`,
        httpStatus.BAD_REQUEST
      );

    await movimientosModel.createSalida({
      id_materia, id_lote, id_usuario,
      cantidad: parseFloat(cantidad),
      observacion,
    });

    return { mensaje: "Salida registrada correctamente" };
  },

// ── Registrar devolución
async registrarDevolucion({ id_materia, id_lote, cantidad, observacion, id_usuario }) {
  if (!id_materia) throw new AppError("La materia prima es obligatoria", httpStatus.BAD_REQUEST);
  if (!id_lote)    throw new AppError("El lote es obligatorio", httpStatus.BAD_REQUEST);
  if (!cantidad || parseFloat(cantidad) <= 0)
    throw new AppError("La cantidad debe ser mayor a cero", httpStatus.BAD_REQUEST);

  const lote = await movimientosModel.findLoteById(id_lote);
  if (!lote) throw new AppError("Lote no encontrado", httpStatus.NOT_FOUND);
  if (lote.estado !== "activo")
    throw new AppError("Solo se pueden devolver lotes activos", httpStatus.BAD_REQUEST);
  if (parseFloat(cantidad) > parseFloat(lote.stock_restante))
    throw new AppError(
      `Cantidad supera el stock disponible del lote (${lote.stock_restante} kg)`,
      httpStatus.BAD_REQUEST
    );

  const resultado = await movimientosModel.registrarDevolucion({
    id_materia, id_lote, id_usuario,
    cantidad: parseFloat(cantidad),
    observacion,
  });

  return {
    mensaje: "Devolución registrada correctamente",
    ...resultado,
  };
},

// ── Lotes disponibles para devolución
async getLotesParaDevolucion(id_materia) {
  const materia = await movimientosModel.findMateriaById(id_materia);
  if (!materia) throw new AppError("Materia prima no encontrada", httpStatus.NOT_FOUND);
  return await movimientosModel.findLotesParaDevolucion(id_materia);
},

};

module.exports = movimientosService;