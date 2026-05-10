const reportesModel = require("../models/reportesModel");
const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");

const reportesService = {
  async getEstadoInventario() {
    return await reportesModel.getEstadoInventario();
  },

  async getConsumoPorMateria({ fecha_inicio, fecha_fin }) {
    if (fecha_inicio && fecha_fin && fecha_inicio > fecha_fin) {
      throw new AppError(
        "La fecha de inicio no puede ser posterior a la fecha de fin",
        httpStatus.BAD_REQUEST,
      );
    }
    return await reportesModel.getConsumoPorMateria({
      fecha_inicio,
      fecha_fin,
    });
  },

  async getActividadProveedores({ fecha_inicio, fecha_fin }) {
    if (fecha_inicio && fecha_fin && fecha_inicio > fecha_fin) {
      throw new AppError(
        "La fecha de inicio no puede ser posterior a la fecha de fin",
        httpStatus.BAD_REQUEST,
      );
    }
    return await reportesModel.getActividadProveedores({
      fecha_inicio,
      fecha_fin,
    });
  },

  async getReporteProduccion({ fecha_inicio, fecha_fin }) {
    if (fecha_inicio && fecha_fin && fecha_inicio > fecha_fin) {
      throw new AppError(
        "La fecha de inicio no puede ser posterior a la fecha de fin",
        httpStatus.BAD_REQUEST,
      );
    }
    return await reportesModel.getReporteProduccion({
      fecha_inicio,
      fecha_fin,
    });
  },

  async getBalanceInventario({ fecha_inicio, fecha_fin }) {
    if (fecha_inicio && fecha_fin && fecha_inicio > fecha_fin) {
      throw new AppError(
        "La fecha de inicio no puede ser posterior a la fecha de fin",
        httpStatus.BAD_REQUEST,
      );
    }
    return await reportesModel.getBalanceInventario({
      fecha_inicio,
      fecha_fin,
    });
  },

  async getMovimientosFiltrados({ tipo, fecha_inicio, fecha_fin }) {
    if (fecha_inicio && fecha_fin && fecha_inicio > fecha_fin) {
      throw new AppError(
        "La fecha de inicio no puede ser posterior a la fecha de fin",
        httpStatus.BAD_REQUEST,
      );
    }
    return await reportesModel.getMovimientosFiltrados({
      tipo,
      fecha_inicio,
      fecha_fin,
    });
  },

  // Reporte ejecutivo: combina inventario + balance + consumo
  async getReporteEjecutivo({ fecha_inicio, fecha_fin }) {
    const [inventario, balance, consumo, produccion, proveedores] =
      await Promise.all([
        reportesModel.getEstadoInventario(),
        reportesModel.getBalanceInventario({ fecha_inicio, fecha_fin }),
        reportesModel.getConsumoPorMateria({ fecha_inicio, fecha_fin }),
        reportesModel.getReporteProduccion({ fecha_inicio, fecha_fin }),
        reportesModel.getActividadProveedores({ fecha_inicio, fecha_fin }),
      ]);

    // Resúmenes calculados
    const resumenInventario = {
      total_materias: inventario.length,
      criticos: inventario.filter((m) => m.estado_stock === "Critico").length,
      bajos: inventario.filter((m) => m.estado_stock === "Bajo").length,
      suficientes: inventario.filter((m) => m.estado_stock === "Suficiente")
        .length,
      total_kg: inventario.reduce((s, m) => s + Number(m.stock_actual), 0),
    };

    const resumenBalance = {
      total_entradas: balance.reduce((s, b) => s + Number(b.total_entradas), 0),
      total_salidas: balance.reduce((s, b) => s + Number(b.total_salidas), 0),
      total_devoluciones: balance.reduce(
        (s, b) => s + Number(b.total_devoluciones),
        0,
      ),
      balance_neto: balance.reduce((s, b) => s + Number(b.balance_neto), 0),
    };

    const resumenProduccion = {
      total_ordenes: produccion.length,
      completadas: produccion.filter((p) => p.estado === "Completada").length,
      en_proceso: produccion.filter((p) => p.estado === "En proceso").length,
      pendientes: produccion.filter((p) => p.estado === "Pendiente").length,
      total_kg_producidos: produccion
        .filter((p) => p.estado === "Completada")
        .reduce((s, p) => s + Number(p.cantidad_producir), 0),
    };

    return {
      resumenInventario,
      resumenBalance,
      resumenProduccion,
      inventarioCriticos: inventario.filter(
        (m) => m.estado_stock === "Critico",
      ),
      inventarioBajos: inventario.filter((m) => m.estado_stock === "Bajo"),
      top10Consumo: consumo.slice(0, 10),
      balancePorCategoria: balance,
      proveedores,
      produccion,
    };
  },
};

module.exports = reportesService;
