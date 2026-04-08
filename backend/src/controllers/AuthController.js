const AuthService = require("../services/authService");
const {validateRegister, validateLogin} = require("../validations/authValidator");
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
      console.log("Respuesta backend:", {user, token});
      
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
};

module.exports = AuthController;