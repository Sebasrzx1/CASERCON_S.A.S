const express = require("express");
const router = express.Router();

//Middlewares
const { protect, restricTo } = require("../middlewares/authMiddleware");
const  checkUserActivo = require("../middlewares/checkUserActivo");

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
  checkUserActivo,
  restricTo("administrador"),
  deleteUsuario,
);

// Habilitar usuario
router.patch(
  "/:id/habilitar",
  protect,
  checkUserActivo,
  restricTo("administrador"),
  habilitarUsuario,
);

module.exports = router;
