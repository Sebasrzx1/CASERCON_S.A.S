
class AppError extends Error{ //Clase personalizada para el manejo de errores, esta clase hereda de la clase Error
    constructor(message, statusCode){ //Sus constructores propios
        super(message); //Este lo hereda de la clase Error
        this.statusCode = statusCode 
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'; //Pregunta si el error comienza con 400 si es asi entonces es un fail por parte del cliente si no entonces es un error del sistema.
        this.isOperational = true; //Diferencia errores logica de errores de sistema 
    
        Error.captureStackTrace(this, this.constructor)
    }

}

module.exports = AppError;