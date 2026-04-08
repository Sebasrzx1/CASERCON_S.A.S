const UserService = require("../services/userService");
const httpStatus = require("../constants/httpStatus");

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
    const data = await UserService.updateUsuario(req.params.id, req.body);
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    await UserService.deleteUsuario(id);
    res.status(httpStatus.OK).json({
      status: "success",
      message: "Usuario inhabilitado",
    });
  } catch (error) {
    next(error);
  }
};

exports.habilitarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;

    await UserService.habilitarUsuario(id);

    res.status(httpStatus.OK).json({
      status: "success",
      message: "Usuario habilitado correctamente",
    });
  } catch (error) {
    next(error);
  }
};
