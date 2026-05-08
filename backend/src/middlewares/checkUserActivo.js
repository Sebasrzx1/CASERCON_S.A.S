const UserModel = require("../models/userModel");

const checkUserActivo = async (req, res, next) => {
  try {
    // req.user viene del middleware de autenticación JWT
    const user = await UserModel.findByEmail(req.user.email ?? null) 
               || await UserModel.findById(req.user.id);

    if (!user || user.estado !== "Activo") {
      return res.status(403).json({
        status: "error",
        message: "Usuario inhabilitado del sistema",
        code: "USER_DISABLED"
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = checkUserActivo;