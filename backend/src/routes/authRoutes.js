const express = require('express');
const AuthController = require('../controllers/AuthController');
// const { protect } = require('../middlewares/authMiddleware'); // Proteger una ruta
// const { restrictTo } = require('../middlewares/roleMiddleware'); // Restricción según roles

const router = express.Router();

// Importaciones de las rutas de autenticación
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Importaciones de las rutas para la recuperacion de contraseña

//1. El usuario ingresa el email y recibe el codigo de 6 digitos.
router.post("/forgot-password", AuthController.forgotPassword)
//2. El usuario ingresa el código y su nueva contraseña
router.post("/reset-password", AuthController.resetPassword)
router.post("/verify-code", AuthController.verificarCodigo);
module.exports = router;

