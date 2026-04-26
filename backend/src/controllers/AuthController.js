const AuthService = require("../services/authService");
const {
  validateRegister,
  validateLogin,
} = require("../validations/authValidator");
const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");

const AuthController = {
  //Controlador para el registro de usuarios
  async register(req, res, next) {
    try {
      //1. Validacion de estructura zod
      const validation = validateRegister(req.body);

      if (!validation.success) {
        //Formateamos los errores de zod

        const errorMessage = validation.error.issues
          .map((e) => e.message)
          .join(", ");
        throw new AppError(errorMessage, httpStatus.BAD_REQUEST);
      }

      //2. Llamada al servicio
      const user = await AuthService.registerUser(validation.data);

      //3. Respuesta
      res.status(httpStatus.CREATED).json({
        status: "success",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  /*------------------------------------------------------------------------*/

  //Controlador para el login de usuarios
  async login(req, res, next) {
    try {
      // 1. validación de entrada con zod
      const validation = validateLogin(req.body);

      if (!validation.success) {
        const errorMessage = validation.error.issues
          .map((e) => e.message)
          .join(", ");
        throw new AppError(errorMessage, httpStatus.BAD_REQUEST);
      }

      // 2. Lógica del servicio
      const { user, token } = await AuthService.loginUser(validation.data);
      console.log("Respuesta backend:", { user, token });

      // 3. Respuesta
      res.status(httpStatus.OK).json({
        status: "success",
        token,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  },

  //Solicitar codigo de recuperacion.
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        throw new AppError("El correo es requerido", httpStatus.BAD_REQUEST);
      }

      await AuthService.solicitarReset(email);

      //Siempre respondemos 200 para no revelar si el email existe

      res.status(httpStatus.OK).json({
        status: "succes",
        message:
          "Si el correo esta registrado, recibirias un codigo en los proximos minutos",
      });
    } catch (error) {
      next(error);
    }
  },

  //Restablecer contraseña
  async resetPassword(req, res, next) {
    try {
      const { codigo, contraseña } = req.body;

      if (!codigo || !contraseña) {
        throw new AppError(
          "El codigo y la contraseña son requeridos.",
          httpStatus.BAD_REQUEST,
        );
      }

      if (contraseña.length < 6) {
        throw new AppError("La Contraseña debe tener al menos 6 caracteres.");
      }

      await AuthService.resetPassword(codigo, contraseña);

      res.status(httpStatus.OK).json({
        status: "success",
        message: "Contraseña actualizada correctamente",
      });
    } catch (error) {
      next(error);
    }
  },
  async verificarCodigo(req, res, next) {
    try {
      const { codigo } = req.body;

      if (!codigo) {
        throw new AppError("El código es requerido", httpStatus.BAD_REQUEST);
      }

      await AuthService.verificarCodigo(codigo);

      res.status(httpStatus.OK).json({
        status: "success",
        message: "Código válido.",
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = AuthController;
