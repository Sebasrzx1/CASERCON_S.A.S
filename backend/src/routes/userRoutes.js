const express = require("express");
const router = express.Router();

const {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} = require("../controllers/userController");
const { getUsuario } = require("../services/userService");

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

module.exports = router;