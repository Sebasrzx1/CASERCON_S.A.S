const jwt = require("jsonwebtoken");
const { promisify } = require("util");
const UserModel = require("../models/userModel");
const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");

const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Obtener token del header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    console.log("TOKEN RECIBIDO:", token);

    if (!token) {
      throw new AppError("No has iniciado sesión", httpStatus.UNAUTHORIZED);
    }

    // 2. Verificar token
    const decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_SECRET
    );

    console.log("DECODED TOKEN:", decoded);

    // 3. Buscar usuario en DB
    const currentUser = await UserModel.findById(decoded.id);

    console.log("USUARIO ENCONTRADO:", currentUser);

    if (!currentUser) {
      throw new AppError("El usuario ya no existe", httpStatus.UNAUTHORIZED);
    }

    // 4. Guardar usuario en request (normalizado)
    req.user = {
      id: currentUser.id_usuario,
      estado: currentUser.estado,
      rol_nombre: currentUser.nombre_rol.toLowerCase().trim(),
    };

    console.log("REQ.USER:", req.user);

    next();
  } catch (error) {
    console.error("ERROR EN PROTECT:", error);

    if (error.name === "JsonWebTokenError") {
      return next(new AppError("Token inválido", httpStatus.UNAUTHORIZED));
    }

    if (error.name === "TokenExpiredError") {
      return next(new AppError("Sesión expirada", httpStatus.UNAUTHORIZED));
    }

    next(error);
  }
};

// 🔐 Middleware para roles
const restricTo = (...roles) => {
  return (req, res, next) => {
    console.log("ROLES PERMITIDOS:", roles);
    console.log("ROL DEL USUARIO:", req.user?.rol_nombre);

    if (!req.user) {
      return next(
        new AppError(
          "Debes estar autenticado",
          httpStatus.UNAUTHORIZED
        )
      );
    }

    const rolesPermitidos = roles.map((r) =>
      r.toLowerCase().trim()
    );

    if (!rolesPermitidos.includes(req.user.rol_nombre)) {
      return next(
        new AppError(
          "No tienes permiso para realizar esta acción",
          httpStatus.FORBIDDEN
        )
      );
    }

    next();
  };
};

module.exports = { protect, restricTo };