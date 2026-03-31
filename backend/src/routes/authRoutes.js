const express = require('express');
const AuthController = require('../controllers/AuthController');
// const { protect } = require('../middlewares/authMiddleware'); // Proteger una ruta
// const { restrictTo } = require('../middlewares/roleMiddleware'); // Restricción según roles

const router = express.Router();

// Importaciones de las rutas de autenticación
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

module.exports = router;
