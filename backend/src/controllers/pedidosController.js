const PedidosService = require("../services/pedidosService");
const httpStatus = require("../constants/httpStatus");

const PedidosController = {

  async getAllPedidos(req, res, next) {
    try {
      const pedidos = await PedidosService.getAllPedidos();
      res.status(httpStatus.OK).json({
        status: "success",
        result: pedidos.length,
        data: pedidos,
      });
    } catch (error) { next(error); }
  },

  async getPedidoById(req, res, next) {
    try {
      const pedido = await PedidosService.getPedidoById(req.params.id);
      res.status(httpStatus.OK).json({ status: "success", data: pedido });
    } catch (error) { next(error); }
  },

  async createPedido(req, res, next) {
    try {
      const result = await PedidosService.createPedido({
        ...req.body,
        id_usuario_creador: req.user.id,
      });
      res.status(httpStatus.OK).json({ status: "success", data: result });
    } catch (error) { next(error); }
  },

  async updatePedido(req, res, next) {
    try {
      const result = await PedidosService.updatePedido(req.params.id, req.body);
      res.status(httpStatus.OK).json({ status: "success", message: result.message });
    } catch (error) { next(error); }
  },

  async deletePedido(req, res, next) {
    try {
      const result = await PedidosService.deletePedido(req.params.id);
      res.status(httpStatus.OK).json({ status: "success", message: result.message });
    } catch (error) { next(error); }
  },

  async recibirPedido(req, res, next) {
    try {
      const { itemsDevolucion = [] } = req.body;
      const result = await PedidosService.recibirPedido(
        req.params.id,
        req.user.id,
        itemsDevolucion
      );
      res.status(httpStatus.OK).json({ status: "success", message: result.message });
    } catch (error) { next(error); }
  },

  async getProveedores(req, res, next) {
    try {
      const proveedores = await PedidosService.getProveedores();
      res.status(httpStatus.OK).json({ status: "success", data: proveedores });
    } catch (error) { next(error); }
  },

  async getMateriasPrimas(req, res, next) {
    try {
      const materias = await PedidosService.getMateriasPrimas();
      res.status(httpStatus.OK).json({ status: "success", data: materias });
    } catch (error) { next(error); }
  },
};

module.exports = PedidosController;