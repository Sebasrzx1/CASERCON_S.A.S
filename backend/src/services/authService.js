const bcrypt = require("bcrypt");
const UserService = require("../services/userService");
const UserModel = require("../models/userModel");
const AppError = require("../errors/AppError");
const errorDictionary = require("../errors/errorDictionary");
const httpStatus = require("../constants/httpStatus");
const { signToken } = require("../utils/jwtToken");
const EmailService = require("../utils/emailService");

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
      throw new AppError(
        "Usuario inhabilitado del sistema",
        httpStatus.FORBIDEN,
      );
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

  // Solicitar codigo de recuperacion.
  async solicitarReset(email) {
    const user = await UserModel.findByEmail(email);

    //No revelar si el email existe o no (seguridad)
    if (!user) {
      throw new AppError(
        "El correo no esta registrado en el sistema.",
        httpStatus.NOT_FOUND,
      );
    }

    //Generar código númerico de 6 digitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();

    //Guardar codigo en DB (con expiracion a 15 min)
    await UserModel.saveCodigoRecuperacion(user.id_usuario, codigo);

    // ── Agrega esto temporalmente ──
    try {
      await EmailService.sendPasswordReset(user.email, codigo);
      console.log("✅ Correo enviado a:", user.email);
    } catch (err) {
      console.error("❌ Error al enviar correo:", err.message);
    }
  },

  //Restablecer contraseña con codigo
  async resetPassword(codigo, nuevaContraseña) {
    // Buscar usuario con ese código (válido y no expirado)
    const user = await UserModel.findByCodigoRecuperacion(codigo);

    if (!user) {
      throw new AppError(
        "El código es inválido o ya expiró",
        httpStatus.BAD_REQUEST,
      );
    }

    // Hashear la nueva contraseña
    const hash = await bcrypt.hash(nuevaContraseña, 10);

    // Actualizar contraseña y limpiar código
    await UserModel.updatePasswordAndClearCodigo(user.id_usuario, hash);
  },

  // Verificar que el código sea válido sin cambiarlo
  async verificarCodigo(codigo) {
    const user = await UserModel.findByCodigoRecuperacion(codigo);

    if (!user) {
      throw new AppError(
        "El código es inválido o ya expiró",
        httpStatus.BAD_REQUEST,
      );
    }

    return true;
  },
};

module.exports = AuthService;
