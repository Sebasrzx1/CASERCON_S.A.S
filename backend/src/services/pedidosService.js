const PedidosModel = require("../models/pedidosModel");
const { validateCreateRecepcion, validateUpdateRecepcion } = require("../validations/pedidosValidator");
const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");

const PedidosService = {

  async getAllPedidos() {
    try {
      return await PedidosModel.findAll();
    } catch (error) {
      console.error("Error en PedidosService.getAllPedidos:", error);
      throw error;
    }
  },

  async getPedidoById(id) {
    try {
      const pedido = await PedidosModel.findById(id);
      if (!pedido) throw new AppError("Pedido no encontrado", httpStatus.NOT_FOUND);
      const items = await PedidosModel.findDetallesByPedido(id);
      return { ...pedido, items };
    } catch (error) {
      console.error("Error en PedidosService.getPedidoById:", error);
      throw error;
    }
  },

  async createPedido(data) {
    try {
      const { id_proveedor, fecha_entrega, observaciones, items, id_usuario_creador } = data;

      const result = validateCreateRecepcion({ id_proveedor, fecha_entrega, observaciones, items });
      if (!result.success) {
        const mensajes = result.error.issues.map(i => i.message).join(", ");
        throw new AppError(mensajes, httpStatus.BAD_REQUEST);
      }

      const id = await PedidosModel.create(
        { id_proveedor, fecha_entrega, observaciones, id_usuario_creador },
        items
      );
      return { id_pedido: id };
    } catch (error) {
      console.error("Error en PedidosService.createPedido:", error);
      throw error;
    }
  },

  async updatePedido(id, data) {
    try {
      const pedido = await PedidosModel.findById(id);
      if (!pedido) throw new AppError("Pedido no encontrado", httpStatus.NOT_FOUND);
      if (pedido.estado !== "pendiente") {
        throw new AppError("Solo se pueden editar pedidos pendientes", httpStatus.BAD_REQUEST);
      }

      const result = validateUpdateRecepcion(data);
      if (!result.success) {
        const mensajes = result.error.issues.map(i => i.message).join(", ");
        throw new AppError(mensajes, httpStatus.BAD_REQUEST);
      }

      const { id_proveedor, fecha_entrega, observaciones, items } = data;
      await PedidosModel.update(id, { id_proveedor, fecha_entrega, observaciones }, items);
      return { message: "Pedido actualizado correctamente" };
    } catch (error) {
      console.error("Error en PedidosService.updatePedido:", error);
      throw error;
    }
  },

  // ✅ Cancelar = eliminar físicamente (solo pendientes sin lotes)
  async deletePedido(id) {
    try {
      const pedido = await PedidosModel.findById(id);
      if (!pedido) throw new AppError("Pedido no encontrado", httpStatus.NOT_FOUND);
      if (pedido.estado !== "pendiente") {
        throw new AppError("Solo se pueden cancelar pedidos pendientes", httpStatus.BAD_REQUEST);
      }
      const tieneLotes = await PedidosModel.hasLotes(id);
      if (tieneLotes) {
        throw new AppError(
          "No se puede cancelar: el pedido ya tiene lotes de inventario asociados",
          httpStatus.BAD_REQUEST
        );
      }
      await PedidosModel.delete(id);
      return { message: "Pedido cancelado correctamente" };
    } catch (error) {
      console.error("Error en PedidosService.deletePedido:", error);
      throw error;
    }
  },

  async recibirPedido(id, id_usuario_receptor, itemsDevolucion = []) {
    try {
      const pedido = await PedidosModel.findById(id);
      if (!pedido) throw new AppError("Pedido no encontrado", httpStatus.NOT_FOUND);
      if (pedido.estado !== "pendiente") {
        throw new AppError("Solo se pueden recibir pedidos pendientes", httpStatus.BAD_REQUEST);
      }

      const items = await PedidosModel.findDetallesByPedido(id);
      if (!items || items.length === 0) {
        throw new AppError("El pedido no tiene items", httpStatus.BAD_REQUEST);
      }

      for (const dev of itemsDevolucion) {
        const item = items.find(i => i.id_materia === dev.id_materia);
        if (!item) continue;
        if (Number(dev.cantidad_devuelta) > Number(item.cantidad_solicitada)) {
          throw new AppError(
            `La cantidad devuelta de "${item.nombre_materia}" excede la cantidad pedida`,
            httpStatus.BAD_REQUEST
          );
        }
        if (!dev.observacion || !dev.observacion.trim()) {
          throw new AppError(
            `La observación es obligatoria para "${item.nombre_materia}"`,
            httpStatus.BAD_REQUEST
          );
        }
      }

      const lotes = await PedidosModel.recibirPedido(id, id_usuario_receptor, itemsDevolucion);
      return { message: "Pedido recibido correctamente", lotes };
    } catch (error) {
      console.error("Error en PedidosService.recibirPedido:", error);
      throw error;
    }
  },

  async getProveedores() {
    try {
      return await PedidosModel.findProveedoresActivos();
    } catch (error) {
      console.error("Error en PedidosService.getProveedores:", error);
      throw error;
    }
  },

  async getMateriasPrimas() {
    try {
      return await PedidosModel.findMateriasPrimasActivas();
    } catch (error) {
      console.error("Error en PedidosService.getMateriasPrimas:", error);
      throw error;
    }
  },
};

module.exports = PedidosService;