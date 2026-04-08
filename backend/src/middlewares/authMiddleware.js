const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const UserModel = require("../models/userModel");
const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");
const errorDictionary = require("../errors/errorDictionary");

const protect = async (req, res, next) => {
  try {
    //1. Obtener el token del header

    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new AppError(
        "No has iniciado sesión. Por favor ingresa para obtener acceso",
        httpStatus.UNAUTHORIZED,
      );
    }

    //2. verificar el token (verify)
    //Convierte una función que usa callbacks en una función que devuelve una Promesa
    //📌 Un callback es una función que se pasa como argumento a otra función para que se ejecute después.
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    //3. verificar si el usuario todavia existe
    const currentUser = await UserModel.findById(decoded.id);

    if (!currentUser) {
      throw new AppError(
        "El usuario dueño de este token ya no existe",
        httpStatus.UNAUTHORIZED,
      );
    }

    //4. verificar si el usuario cambio la contraseña después de emitir el token
    //Esto se hace comparando 'iat' (issued at) con un campo 'passwordChangedAt' en DB.

    //!ACCESO CONCEDIDO! ponemos el usuario en la request para que el controlador lo use

    req.user = currentUser;
    next();
  } catch (error) {
    //Capturar errores especificos de JWT
    if (error.name === "JsonWebTokenError") {
      return next(
        new AppError(
          "Token invalido. Inicia sesión de nuevo.",
          httpStatus.UNAUTHORIZED,
        ),
      );
    }
    if (error.name === "TokenExpiredError") {
      return next(
        new AppError(
          "Tu sesion ha expirado. Inicia sesión de nuevo.",
          httpStatus.UNAUTHORIZED,
        ),
      );
    }

    next(error);
  }
};

//Middleware para restringir acceso por roles
//Uso: restricTo('Administrador','Empleado')

const restricTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError(
          "Debes estar autenticado para acceder a este recurso",
          httpStatus.UNAUTHORIZED,
        ),
      );
    }
    if (!roles.includes(req.user.rol_nombre)) {
      return next(
        new AppError(
          "No tienes permiso para realizar esta acción",
          httpStatus.FORBIDEN,
        ),
      );
    }
    next();
  };
};

module.exports = {protect, restricTo};