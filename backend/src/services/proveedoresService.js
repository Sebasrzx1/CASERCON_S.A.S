const proveedoresModel = require("../models/proveedoresModel");
const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");

const proveedoresService = {
  // Obtener todos los proveedores
  async getAllProveedores() {
    try {
      const proveedores = await proveedoresModel.findAll();
      return proveedores;
    } catch (error) {
      console.error("Error en service proveedores:", error);
      throw error;
    }
  },

  // Obtener un proveedor por ID
  async getById(id) {
    const proveedor = await proveedoresModel.findById(id);

    if (!proveedor) {
      throw new AppError("Proveedor no encontrado", httpStatus.NOT_FOUND);
    }

    return proveedor;
  },

  // Crear proveedores
  async createProveedor(proveedorData) {
    const { email, nombre_proveedor, nombre_empresa } = proveedorData;

    if (!nombre_proveedor) {
      throw new AppError(
        "El nombre del proveedor es obligatorio",
        httpStatus.BAD_REQUEST,
      );
    }

    if (!email) {
      throw new AppError("El email es obligatorio", httpStatus.BAD_REQUEST);
    }
    const existingEmail = await proveedoresModel.findByEmail(email);
    if (existingEmail) {
      throw new AppError(
        "El correo ya está registrado",
        httpStatus.BAD_REQUEST,
      );
    }

    const existingNombre = await proveedoresModel.findByNombre(
      nombre_empresa || nombre_proveedor,
    );

    if (existingNombre) {
      throw new AppError(
        "El nombre del proveedor ya está registrado",
        httpStatus.BAD_REQUEST,
      );
    }

    return await proveedoresModel.create(proveedorData);
  },

  // Actualizar proveedores
  async updateProveedor(id, proveedorData) {
    // 🔥 Validar que exista
    await this.getById(id);

    // Validar email único si viene
    if (proveedorData.email) {
      const existeEmail = await proveedoresModel.findByEmail(proveedorData.email);

      if (existeEmail && existeEmail.id_proveedor != id) {
        throw new AppError("Ese email ya está en uso", httpStatus.BAD_REQUEST);
      }
    }

    if (proveedorData.nombre_empresa) {
      const existeEmpresa = await proveedoresModel.findByNombre(proveedorData.nombre_empresa);

      if (existeEmpresa && existeEmpresa.id_proveedor != id) {
        throw new AppError("El nombre de empresa ya se encuentra en uso", httpStatus.BAD_REQUEST);
      }
    }

    await proveedoresModel.update(id, proveedorData);
  },

  // Eliminar proveedores (soft delete)
  async deleteProveedor(id) {
    await this.getById(id);
    await proveedoresModel.delete(id);
  },

  async habilitarProveedor(id) {
    await this.getById(id);
    await proveedoresModel.cambiarEstado(id);
  },
};

module.exports = proveedoresService;
