const proveedoresModel = require("../models/proveedoresModel");
const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");

const proveedoresService = {
  // 🔹 Obtener todos
  async getAllProveedores() {
    try {
      const proveedores = await proveedoresModel.findAll();
      return proveedores;
    } catch (error) {
      console.error("Error en service proveedores:", error);
      throw error;
    }
  },

  // 🔹 Obtener uno (🔥 TE FALTABA ESTE)
  async getById(id) {
    const proveedor = await proveedoresModel.findById(id);

    if (!proveedor) {
      throw new AppError(
        "Proveedor no encontrado",
        httpStatus.NOT_FOUND
      );
    }

    return proveedor;
  },

  // 🔹 Crear
  async createProveedor(proveedorData) {
    const { email, nombre_proveedor } = proveedorData;

    if (!nombre_proveedor) {
      throw new AppError(
        "El nombre del proveedor es obligatorio",
        httpStatus.BAD_REQUEST
      );
    }

    if (!email) {
      throw new AppError(
        "El email es obligatorio",
        httpStatus.BAD_REQUEST
      );
    }

    // 🔥 Validar duplicado
    const existingProv = await proveedoresModel.findByEmail(email);

    if (existingProv) {
      throw new AppError(
        "El proveedor ya está registrado",
        httpStatus.BAD_REQUEST
      );
    }

    return await proveedoresModel.create(proveedorData);
  },

  // 🔹 Actualizar
  async updateProveedor(id, proveedorData) {
    // 🔥 Validar que exista
    await this.getById(id);

    // 🔥 Validar email único si viene
    if (proveedorData.email) {
      const existe = await proveedoresModel.findByEmail(
        proveedorData.email
      );

      if (existe && existe.id_proveedor != id) {
        throw new AppError(
          "Ese email ya está en uso",
          httpStatus.BAD_REQUEST
        );
      }
    }

    await proveedoresModel.update(id, proveedorData);
  },

  // 🔹 Eliminar (soft delete)
  async deleteProveedor(id) {
    await this.getById(id);
    await proveedoresModel.delete(id);
  },
};

module.exports = proveedoresService;