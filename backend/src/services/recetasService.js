const recetasModel = require("../models/recetasModel");
const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");

const recetasService = {

  async getAllRecetas() {
    const recetas = await recetasModel.findAll();
    const recetasConDetalle = await Promise.all(
      recetas.map(async (receta) => {
        const ingredientes = await recetasModel.findDetalleByReceta(receta.id_receta);
        return {
          id_receta: receta.id_receta,
          nombre_producto: receta.nombre_producto,
          estado: receta.estado,
          fecha_creacion: receta.fecha_creacion,
          ingredientes,
        };
      })
    );
    return recetasConDetalle;
  },

  async getById(id_receta) {
    const receta = await recetasModel.findById(id_receta);
    if (!receta) throw new AppError("Receta no encontrada", httpStatus.NOT_FOUND);
    const ingredientes = await recetasModel.findDetalleByReceta(id_receta);
    return { ...receta, ingredientes };
  },

  async createReceta(nombre_producto, ingredientes) {
    if (!nombre_producto || nombre_producto.trim() === "")
      throw new AppError("El nombre del producto es obligatorio", httpStatus.BAD_REQUEST);

    const existe = await recetasModel.findByNombre(nombre_producto.trim());
    if (existe)
      throw new AppError("Ya existe una receta con ese nombre", httpStatus.BAD_REQUEST);

    if (!ingredientes || ingredientes.length === 0)
      throw new AppError("La receta debe tener al menos un ingrediente", httpStatus.BAD_REQUEST);

    const total = ingredientes.reduce((sum, ing) => sum + parseFloat(ing.cantidad_porcentaje), 0);
    if (Math.abs(total - 100) > 0.01)
      throw new AppError(`Los porcentajes deben sumar exactamente 100%. Suma actual: ${total.toFixed(2)}%`, httpStatus.BAD_REQUEST);

    for (const ing of ingredientes) {
      if (parseFloat(ing.cantidad_porcentaje) <= 0)
        throw new AppError("Todos los porcentajes deben ser mayores a cero", httpStatus.BAD_REQUEST);
    }

    const id_receta = await recetasModel.create(nombre_producto.trim());
    await recetasModel.createDetalle(id_receta, ingredientes);
    return await this.getById(id_receta);
  },

  async updateReceta(id_receta, nombre_producto, ingredientes) {
    const receta = await recetasModel.findById(id_receta);
    if (!receta) throw new AppError("Receta no encontrada", httpStatus.NOT_FOUND);
    if (receta.estado === "Inhabilitado")
      throw new AppError("No se puede editar una receta inhabilitada", httpStatus.BAD_REQUEST);

    if (!nombre_producto || nombre_producto.trim() === "")
      throw new AppError("El nombre del producto es obligatorio", httpStatus.BAD_REQUEST);

    const existe = await recetasModel.findByNombre(nombre_producto.trim());
    if (existe && existe.id_receta != id_receta)
      throw new AppError("Ya existe una receta con ese nombre", httpStatus.BAD_REQUEST);

    if (!ingredientes || ingredientes.length === 0)
      throw new AppError("La receta debe tener al menos un ingrediente", httpStatus.BAD_REQUEST);

    const total = ingredientes.reduce((sum, ing) => sum + parseFloat(ing.cantidad_porcentaje), 0);
    if (Math.abs(total - 100) > 0.01)
      throw new AppError(`Los porcentajes deben sumar exactamente 100%. Suma actual: ${total.toFixed(2)}%`, httpStatus.BAD_REQUEST);

    for (const ing of ingredientes) {
      if (parseFloat(ing.cantidad_porcentaje) <= 0)
        throw new AppError("Todos los porcentajes deben ser mayores a cero", httpStatus.BAD_REQUEST);
    }

    await recetasModel.update(id_receta, nombre_producto.trim());
    await recetasModel.deleteDetalle(id_receta);
    await recetasModel.createDetalle(id_receta, ingredientes);
    return await this.getById(id_receta);
  },

  async inhabilitarReceta(id_receta) {
    const receta = await recetasModel.findById(id_receta);
    if (!receta) throw new AppError("Receta no encontrada", httpStatus.NOT_FOUND);
    if (receta.estado === "Inhabilitado")
      throw new AppError("La receta ya está inhabilitada", httpStatus.BAD_REQUEST);

    const tieneOrdenes = await recetasModel.tieneOrdenesActivas(id_receta);
    if (tieneOrdenes)
      throw new AppError("No se puede inhabilitar: la receta tiene órdenes de producción activas", httpStatus.BAD_REQUEST);

    await recetasModel.inhabilitar(id_receta);
  },

  async habilitarReceta(id_receta) {
    const receta = await recetasModel.findById(id_receta);
    if (!receta) throw new AppError("Receta no encontrada", httpStatus.NOT_FOUND);
    if (receta.estado === "Activo")
      throw new AppError("La receta ya está activa", httpStatus.BAD_REQUEST);
    await recetasModel.habilitar(id_receta);
  },

};

module.exports = recetasService;