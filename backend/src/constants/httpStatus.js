//Aqui se almacenara todos los codigos y los estados http.

module.exports = {
    OK: 200, // 
    CREATED: 201, // --> Se creo algo correctamente.
    BAD_REQUEST: 400, // --> Peticion incorrecta.
    UNAUTHORIZED: 401, // --> No autorizado, es decir lanza que no se ha procesado porque carece de credenciales de autenticacion validas.
    FORBIDEN: 403, // --> Prohibido, el servidor entiende la peticion pero se niega a autorizarla
    NOT_FOUND: 404, // --> NO se encontro algo.
    INTERNAL_SERVER_ERROR: 500 //--> Fallos internos del servidor.
}