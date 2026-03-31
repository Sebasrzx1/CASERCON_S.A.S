const bcrypt = require("bcrypt");
const UserService = require("../services/userService");
const UserModel = require("../models/userModel");
const AppError = require("../errors/AppError");
const errorDictionary = require("../errors/errorDictionary");
const httpStatus = require("../constants/httpStatus");
const { signToken } = require("../utils/jwtToken");

const AuthService = {
  async registerUser(userData) {
    //Delegamos toda la lógica de creación al UserService

    //Él se encarga de validar duplicados y hashear la contraseña.

    const newUser = await UserService.createUser(userData);

    //Retornamos los datos limpios

    return {
      id: newUser.id,
      nombre: newUser.nombre,
      email: newUser.email,
    };
  },

  async loginUser(credentials) {
    const { email, contraseña } = credentials;

    //1. Buscar usuario por email (usamos el modelo que ya creamos)
    const user = await UserModel.findByEmail(email);

    //2. verificar si el email existe
    if (!user) {
      throw new AppError("Credenciales invalidas", httpStatus.UNAUTHORIZED);
    }

    //3. Comparar contraseñas (Texto plano vs hash en DB)
    const isMatch = await bcrypt.compare(contraseña, user.contraseña);

    if (!isMatch) {
      throw new AppError("Credenciales invalidas", httpStatus.UNAUTHORIZED);
    }

    //4. Generar Token JWT
    const token = signToken(user.id_usuario, user.id_rol);

    //5. Retornar datos (Sin la contraseña)
    //Eliminamos la contraseña del objeto antes de enviarlo.

    delete user.contraseña;

    return { user, token };
  }
};

module.exports = AuthService
