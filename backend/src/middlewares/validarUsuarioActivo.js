const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");

const validarUsuarioActivo = (req, res, next) => {
  console.log("ESTADO DEL USUARIO:", req.user?.estado);

  if (!req.user) {
    return next(
      new AppError(
        "Usuario no autenticado",
        httpStatus.UNAUTHORIZED
      )
    );
  }

  if (req.user.estado.toLowerCase().trim() === "inhabilitado") {
    return next(
      new AppError(
        "Usuario inhabilitado del sistema",
        httpStatus.FORBIDDEN
      )
    );
  }

  next();
};

module.exports = validarUsuarioActivo;