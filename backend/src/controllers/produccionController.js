const producccionService = require('../services/produccionService');
const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");

const produccionController = {
    async getAllProducciones(req, res, next){
        try{
            const producciones = await producccionService.getAllProducciones()
            res.status(httpStatus.OK).json({
                status: 'success',
                result: producciones.length,
                data: producciones
            })
        }catch(error){
            next(error)
        }
    }
}

module.exports = produccionController