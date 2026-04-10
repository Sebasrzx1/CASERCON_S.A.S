const pedidosModel = require('../models/pedidosModel');

const pedidosService = {
    async getAllPedidos(){
        try{
            const pedidos = await pedidosModel.findAll()
            return pedidos
        }catch(error){
            console.error('Error en pedidosService')
            throw error
        }
    }
}

module.exports = pedidosService;