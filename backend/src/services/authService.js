const bcrypt = require("bcrypt");
const UserService = require("../services/userService");
const UserModel = require("../models/userModel");
const AppError = require("../errors/AppError");
const errorDictionary = require("../errors/errorDictionary");
const httpStatus = require("../constants/httpStatus");
const { signToken } = require("../utils/jwtToken");

const AuthService = {
  async loginUser(credentials) {
    const { email, contraseña } = credentials;

    //1. Buscar usuario por email (usamos el modelo que ya creamos)
    const user = await UserModel.findByEmailWithProcesos(email);

    //2.1 verificar si el email existe
    if (!user) {
      throw new AppError("Credenciales invalidas", httpStatus.UNAUTHORIZED);
    }
    // 2.2 verificar si esta activo en el sistema
    if (user.estado !== "Activo") {
      throw new AppError("Usuario inhabilitado del sistema", httpStatus.FORBIDEN);
    }
    //3. Comparar contraseñas (Texto plano vs hash en DB)
    const isMatch = await bcrypt.compare(contraseña, user.contraseña);

    if (!isMatch) {
      throw new AppError("Credenciales invalidas", httpStatus.UNAUTHORIZED);
    }

    //4. Generar Token JWT
    const token = signToken(user);

    //5. Retornar datos (Sin la contraseña)
    //Eliminamos la contraseña del objeto antes de enviarlo.

    delete user.contraseña;

    return { user, token };
  },
};

module.exports = AuthService;
