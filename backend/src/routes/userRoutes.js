const express = require("express");
const router = express.Router();

//Middlewares
const { protect, restricTo } = require("../middlewares/authMiddleware");
const validarUsuarioActivo = require("../middlewares/validarUsuarioActivo");

const {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  habilitarUsuario,
} = require("../controllers/userController");

// 🔥 Rutas de usuarios

// Obtener todos
router.get("/", getAllUsuarios);

//Obtener por id
router.get("/:id", getUsuarioById);

// Crear usuario
router.post("/", createUsuario);

// Actualizar usuario
router.put("/:id", updateUsuario);

// Eliminar usuario
router.delete(
  "/:id",
  protect,
  validarUsuarioActivo,
  restricTo("administrador"),
  deleteUsuario,
);

// Habilitar usuario
router.patch(
  "/:id/habilitar",
  protect,
  validarUsuarioActivo,
  restricTo("administrador"),
  habilitarUsuario,
);

module.exports = router;
