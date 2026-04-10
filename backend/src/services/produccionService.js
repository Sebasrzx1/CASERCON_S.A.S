const produccionModel = require('../models/producccionModel');

const producccionService = {
    async getAllProducciones(){
        try{
            const producciones = await produccionModel.findAll()
            return producciones
        }catch(error){
            console.error('Erro en produccionService')
            throw error
        }
    }
}

module.exports = producccionService;