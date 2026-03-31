const httpStatus = require('../constants/httpStatus')

module.exports = {
    EMAIL_EXISTS: {
        message: 'El correo electronico ya esta registrado',
        status: httpStatus.BAD_REQUEST
    },

    INVALID_DATA: {
        message: "Los datos proporcionados no son válidos",
        status: httpStatus.BAD_REQUEST
    },
    
    DB_ERROR: {
        message: "Error de conexion con la base de datos",
        status: httpStatus.INTERNAL_SERVER_ERROR
    }
}
