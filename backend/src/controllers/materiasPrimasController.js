const materiasPrimasService = require('../services/materiasPrimasService');

const materiasPrimasController = {

    async getAllMaterias(req, res){

        try{
        const materiasPrimas = await materiasPrimasService.getAllMaterias();

        res.status(200).json(materiasPrimas);   

        }catch(error){
            console.error("Error en el controlador de materias primas", error);
            
            res.status(500).json({
                message: "Error al obtener materias primas"
            })
        }
    }
}

module.exports = materiasPrimasController;