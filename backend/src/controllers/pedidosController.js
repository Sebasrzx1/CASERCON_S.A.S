const pedidosService = require('../services/pedidosService');
const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");

const pedidosController = {
    async getAllPedidos(req, res, next){
        try{
            const pedidos = await pedidosService.getAllPedidos()
            res.status(httpStatus.OK).json({
                status: 'success',
                result: pedidos.length,
                data: pedidos
            })
        }catch(error){
            next(error)
        }
    }
}

module.exports = pedidosController;