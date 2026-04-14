const proveedoresService = require("../services/proveedoresService");
const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");
const {
  validateCreateProveedor,
} = require("../validations/proveedoresValidator");

const proveedoresController = {
  //Obtener todos los proveedores
  async getAllProveedores(req, res, next) {
    try {
      const proveedores = await proveedoresService.getAllProveedores();

      res.status(httpStatus.OK).json({
        status: "success",
        result: proveedores.length,
        data: proveedores,
      });
    } catch (error) {
      next(error);
    }
  },

  async getProveedorById(req, res, next) {
    try{
      const {id} = req.params;
      const proveedor = await proveedoresService.getById(id);
      
      res.status(httpStatus.OK).json({
        proveedor,
      });
    }catch(error){
      next(error)
    }
  },

  //Crear un nuevo proveedor
  async createProveedor(req, res, next) {
    try {
      const validation = validateCreateProveedor(req.body);

      if (!validation.success) {
        const errors =
          validation.error?.errors || validation.error?.issues || [];
        const errorMessage = errors.map((e) => e.message).join(", ");
        throw new AppError(errorMessage, httpStatus.BAD_REQUEST);
      }

      const result = await proveedoresService.createProveedor(validation.data);

      res.status(httpStatus.CREATED).json({
        status: "success",
        message: "Proveedor creado con exito",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateProveedor(req, res, next) {
    try {
      const { id } = req.params;

      await proveedoresService.updateProveedor(id, req.body);

      res.json({
        ok: true,
        message: "Proveedor actualizado correctamente",
      });
    } catch (error) {
      next(error)
    }
  },

  async deleteProveedor(req, res, next) {
    try {
      const { id } = req.params;
      await proveedoresService.deleteProveedor(id);
      res.status(httpStatus.OK).json({
        status: "success",
        message: "Proveedor inhabilitado",
      });
    } catch (error) {
      next(error);
    }
  },

  async habilitarProveedor(req, res, next) {
    try {
      const { id } = req.params;

      await proveedoresService.habilitarProveedor(id);

      res.status(httpStatus.OK).json({
        status: "success",
        message: "Proveedor habilitado correctamente",
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = proveedoresController;
