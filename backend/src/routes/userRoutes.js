const express = require("express");
const router = express.Router();

const {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  habilitarUsuario
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
router.delete("/:id", deleteUsuario);

// Habilitar usuario
router.patch("/:id/habilitar", habilitarUsuario)

module.exports = router;