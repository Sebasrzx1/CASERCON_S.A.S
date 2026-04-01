const UserService = require("../services/userService");

exports.getAllUsuarios = async (req, res) => {
  try {
    const data = await UserService.getUsuarios();
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getUsuarioById = async (req, res) => {
  try {
    const usuario = await UserService.getUsuarioById(req.params.id);
    res.json({ data: usuario });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

exports.createUsuario = async (req, res) => {
  try {
    const data = await UserService.createUsuario(req.body);
    res.json({ data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateUsuario = async (req, res) => {
  try {
    const data = await UserService.updateUsuario(
      req.params.id,
      req.body
    );
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUsuario = async (req, res) => {
  try {
    await UserService.deleteUsuario(req.params.id);
    res.json({ message: "Usuario eliminado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};