const produccionModel = require("../models/producccionModel");
const AppError = require("../errors/AppError");
const httpStatus = require("../constants/httpStatus");
const db = require("../config/conexion_db");

const producccionService = {
  async getAllProducciones() {
    try {
      const producciones = await produccionModel.findAll();
      return producciones;
    } catch (error) {
      console.error("Error en produccionService");
      throw error;
    }
  },

  async getByIdProduccion(id) {
    try {
      const produccion = await produccionModel.findById(id);
      if (!produccion) {
        throw new AppError(
          "Orden de produccion no encontrada",
          httpStatus.NOT_FOUND,
        );
      }

      return produccion;
    } catch (error) {
      console.error("Error en produccion, service");
      throw error;
    }
  },

  // Valida stock disponible antes de crear la orden
  async createOrdenProduccion(data) {
    try {
      if (
        !data.id_receta ||
        !data.id_usuario_creador ||
        !data.cantidad_producir
      ) {
        throw new AppError("Faltan datos obligatorios", httpStatus.BAD_REQUEST);
      }

      // Consultar ingredientes de la receta directamente por id_receta
      const queryIngredientes = `
        SELECT 
          dr.id_materia,
          mp.nombre AS nombre_materia,
          dr.cantidad_porcentaje
        FROM detalle_receta dr
        INNER JOIN materias_primas mp ON dr.id_materia = mp.id_materia
        WHERE dr.id_receta = ?;
      `;
      const [ingredientesReceta] = await db.execute(queryIngredientes, [
        data.id_receta,
      ]);

      if (!ingredientesReceta || ingredientesReceta.length === 0) {
        throw new AppError(
          "La receta no tiene ingredientes registrados",
          httpStatus.BAD_REQUEST,
        );
      }

      // Verificar stock disponible para cada ingrediente
      const faltantes = [];
      for (const ing of ingredientesReceta) {
        const cantidadNecesaria =
          (parseFloat(ing.cantidad_porcentaje) / 100) *
          parseFloat(data.cantidad_producir);

        const stockDisponible = await produccionModel.findStockDisponible(
          ing.id_materia,
        );

        if (stockDisponible < cantidadNecesaria) {
          faltantes.push(
            `${ing.nombre_materia} (necesita ${cantidadNecesaria.toFixed(2)} kg, disponible ${stockDisponible.toFixed(2)} kg)`,
          );
        }
      }

      if (faltantes.length > 0) {
        throw new AppError(
          `Stock insuficiente para: ${faltantes.join(" | ")}`,
          httpStatus.BAD_REQUEST,
        );
      }

      const produccionNueva = await produccionModel.create(data);
      return produccionNueva;
    } catch (error) {
      console.error("Error en produccionService al crear");
      throw error;
    }
  },

  async iniciarProduccion(id, id_usuario) {
    try {
      const ordenProduccion = await produccionModel.findById(id);

      if (!ordenProduccion) {
        throw new AppError(
          "Orden de produccion no encontrada",
          httpStatus.NOT_FOUND,
        );
      }

      if (ordenProduccion.estado !== "Pendiente") {
        throw new AppError(
          "Esta orden de produccion ya esta iniciada",
          httpStatus.FORBIDEN,
        );
      }

      await produccionModel.iniciarOrden(id, id_usuario);
    } catch (error) {
      console.error("Error en produccionService");
      throw error;
    }
  },

  // Descuenta stock por FIFO y registra movimientos de salida
  async finalizarProduccion(id, id_usuario) {
    try {
      const ordenProduccion = await produccionModel.findById(id);

      if (!ordenProduccion) {
        throw new AppError(
          "Orden de producion no existe",
          httpStatus.NOT_FOUND,
        );
      }

      if (ordenProduccion.estado !== "En proceso") {
        throw new AppError(
          "Solo se pueden finalizar órdenes en proceso",
          httpStatus.FORBIDEN,
        );
      }

      let ingredientes =
        await produccionModel.findIngredientesPropiosByOrden(id);

      if (!ingredientes || ingredientes.length === 0) {
        ingredientes = await produccionModel.findIngredientesByOrden(id);
      }

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();

        for (const ing of ingredientes) {
          let cantidadRestante =
            (parseFloat(ing.cantidad_porcentaje) / 100) *
            parseFloat(ordenProduccion.cantidad_producir);

          const lotes = await produccionModel.findLotesFIFO(ing.id_materia);

          for (const lote of lotes) {
            if (cantidadRestante <= 0) break;

            const consumir = Math.min(
              Number(lote.stock_restante),
              cantidadRestante,
            );

            // El trigger trg_salida_lote descuenta stock_restante automáticamente
            await conn.execute(
              `INSERT INTO movimientos_inventario
                (id_materia, id_lote, id_usuario, tipo_movimiento, cantidad, id_orden_produccion, observacion)
               VALUES (?, ?, ?, 'Salida', ?, ?, 'Consumo en orden de producción')`,
              [ing.id_materia, lote.id_lote, id_usuario, consumir, id],
            );

            const nuevoStock = Number(lote.stock_restante) - consumir;
            if (nuevoStock <= 0) {
              await conn.execute(
                `UPDATE lotes SET estado = 'agotado' WHERE id_lote = ?`,
                [lote.id_lote],
              );
            }

            cantidadRestante -= consumir;
          }

          if (cantidadRestante > 0.001) {
            await conn.rollback();
            throw new AppError(
              `Stock insuficiente para "${ing.nombre_materia}" al descontar lotes`,
              httpStatus.BAD_REQUEST,
            );
          }
        }

        await conn.execute(
          `UPDATE ordenes_produccion
           SET estado = 'Completada', id_usuario_fin = ?, fecha_finalizacion = NOW()
           WHERE id_orden_produccion = ?`,
          [id_usuario, id],
        );

        await conn.commit();
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }

      return { message: "Producción finalizada" };
    } catch (error) {
      console.error("Error en finalizarProduccion:", error);
      throw error;
    }
  },

  async deleteProduccion(id) {
    try {
      const orden = await produccionModel.findById(id);

      if (!orden) {
        throw new AppError("Orden no encontrada", httpStatus.NOT_FOUND);
      }

      // Para poder eliminarse evaluasmos que su estado este en pendiente
      if (orden.estado !== "Pendiente") {
        throw new AppError(
          "Solo puedes eliminar órdenes en estado Pendiente",
          httpStatus.BAD_REQUEST,
        );
      }

      // Y evaluamos que no tenga movimientos asociados
      const tieneMovimientos = await produccionModel.hasMovimientos(id);

      if (tieneMovimientos) {
        throw new AppError(
          "No puedes eliminar la orden porque tiene movimientos asociados",
          httpStatus.BAD_REQUEST,
        );
      }

      await produccionModel.deleteOrden(id);

      return { message: "Orden eliminada correctamente" };
    } catch (error) {
      console.error("Error en deleteProduccion:", error);
      throw error;
    }
  },

  // Verifica stock por ingrediente para el preview del frontend
  async verificarStockParaOrden(
    id_receta,
    cantidad_producir,
    excluir_orden_id = null,
  ) {
    try {
      const queryIngredientes = `
      SELECT dr.id_materia, mp.nombre AS nombre_materia, dr.cantidad_porcentaje
      FROM detalle_receta dr
      INNER JOIN materias_primas mp ON dr.id_materia = mp.id_materia
      WHERE dr.id_receta = ?;
    `;
      const [ingredientesReceta] = await db.execute(queryIngredientes, [
        id_receta,
      ]);

      if (!ingredientesReceta || ingredientesReceta.length === 0) {
        throw new AppError(
          "La receta no tiene ingredientes registrados",
          httpStatus.BAD_REQUEST,
        );
      }

      const ingredientes = [];
      for (const ing of ingredientesReceta) {
        const cantidadNecesaria =
          (parseFloat(ing.cantidad_porcentaje) / 100) *
          parseFloat(cantidad_producir);

        // 👇 pasa excluir_orden_id para no contar el comprometido de esta orden
        const stockDisponible = await produccionModel.findStockDisponible(
          ing.id_materia,
          excluir_orden_id,
        );

        ingredientes.push({
          id_materia: ing.id_materia,
          nombre_materia: ing.nombre_materia,
          cantidad_porcentaje: parseFloat(ing.cantidad_porcentaje),
          cantidad_necesaria: parseFloat(cantidadNecesaria.toFixed(4)),
          stock_disponible: parseFloat(stockDisponible.toFixed(4)),
          suficiente: stockDisponible >= cantidadNecesaria,
        });
      }

      const posible = ingredientes.every((i) => i.suficiente);
      return { posible, ingredientes };
    } catch (error) {
      console.error("Error en verificarStockParaOrden:", error);
      throw error;
    }
  },

  async verificarStockParaEdicion(id_orden, ingredientes, cantidad_producir) {
    try {
      const resultado = [];
      for (const ing of ingredientes) {
        const cantidadNecesaria =
          (parseFloat(ing.cantidad_porcentaje) / 100) *
          parseFloat(cantidad_producir);

        // Excluye el comprometido de esta misma orden
        const stockDisponible = await produccionModel.findStockDisponible(
          ing.id_materia,
          id_orden,
        );

        resultado.push({
          id_materia: ing.id_materia,
          nombre_materia: ing.nombre_materia,
          cantidad_porcentaje: parseFloat(ing.cantidad_porcentaje),
          cantidad_necesaria: parseFloat(cantidadNecesaria.toFixed(4)),
          stock_disponible: parseFloat(stockDisponible.toFixed(4)),
          suficiente: stockDisponible >= cantidadNecesaria,
        });
      }

      const posible = resultado.every((i) => i.suficiente);
      return { posible, ingredientes: resultado };
    } catch (error) {
      console.error("Error en verificarStockParaEdicion:", error);
      throw error;
    }
  },

  // Reasigna el operario de una orden en proceso
  async reasignarProduccion(id, id_usuario_inicio) {
    try {
      const orden = await produccionModel.findById(id);

      if (!orden) {
        throw new AppError("Orden no encontrada", httpStatus.NOT_FOUND);
      }

      if (orden.estado !== "En proceso") {
        throw new AppError(
          "Solo se puede reasignar el operario de órdenes en proceso",
          httpStatus.BAD_REQUEST,
        );
      }

      await produccionModel.reasignarOrden(id, id_usuario_inicio);

      return { message: "Operario reasignado correctamente" };
    } catch (error) {
      console.error("Error en reasignarProduccion:", error);
      throw error;
    }
  },

  // Lista los operarios activos (para el select del modal de reasignación)
  async getOperarios() {
    try {
      const operarios = await produccionModel.findOperarios();
      return operarios;
    } catch (error) {
      console.error("Error en getOperarios:", error);
      throw error;
    }
  },

  // Editar cantidad e id_receta de una orden pendiente
  async editarOrden(id, cantidad_producir, id_receta) {
    try {
      const orden = await produccionModel.findById(id);

      if (!orden) {
        throw new AppError("Orden no encontrada", httpStatus.NOT_FOUND);
      }

      if (orden.estado !== "Pendiente") {
        throw new AppError(
          "Solo se puede editar una orden en estado Pendiente",
          httpStatus.BAD_REQUEST,
        );
      }

      if (!cantidad_producir || Number(cantidad_producir) <= 0) {
        throw new AppError(
          "La cantidad debe ser mayor a 0",
          httpStatus.BAD_REQUEST,
        );
      }

      if (!id_receta) {
        throw new AppError(
          "Debe seleccionar una receta",
          httpStatus.BAD_REQUEST,
        );
      }

      await produccionModel.editarOrden(id, cantidad_producir, id_receta);

      return { message: "Orden actualizada correctamente" };
    } catch (error) {
      console.error("Error en editarOrden:", error);
      throw error;
    }
  },

  async editarRecetaOrden(id, ingredientes, motivo, id_usuario, rolNombre) {
    try {
      const orden = await produccionModel.findById(id);

      if (!orden)
        throw new AppError("Orden no encontrada", httpStatus.NOT_FOUND);
      if (orden.estado !== "En proceso") {
        throw new AppError(
          "Solo se pueden editar ingredientes de órdenes en proceso",
          httpStatus.BAD_REQUEST,
        );
      }
      if (
        rolNombre !== "administrador" &&
        Number(orden.id_usuario_inicio) !== Number(id_usuario)
      ) {
        throw new AppError(
          "No tienes permiso para editar esta orden",
          httpStatus.FORBIDEN,
        );
      }

      const sumaTotal = ingredientes.reduce(
        (sum, ing) => sum + parseFloat(ing.cantidad_porcentaje),
        0,
      );
      if (Math.abs(sumaTotal - 100) > 0.01) {
        throw new AppError(
          `Los porcentajes deben sumar 100%. Suma actual: ${sumaTotal.toFixed(2)}%`,
          httpStatus.BAD_REQUEST,
        );
      }

      // ── Verificar stock excluyendo el comprometido de esta misma orden ──
      const faltantes = [];
      for (const ing of ingredientes) {
        const cantidadNecesaria =
          (parseFloat(ing.cantidad_porcentaje) / 100) *
          parseFloat(orden.cantidad_producir);

        // 👇 excluir_orden_id = id para no contar el comprometido actual de esta orden
        const stockDisponible = await produccionModel.findStockDisponible(
          ing.id_materia,
          id,
        );

        if (stockDisponible < cantidadNecesaria) {
          faltantes.push(
            `${ing.nombre_materia} (necesita ${cantidadNecesaria.toFixed(2)} kg, disponible ${stockDisponible.toFixed(2)} kg)`,
          );
        }
      }

      if (faltantes.length > 0) {
        throw new AppError(
          `Stock insuficiente para: ${faltantes.join(" | ")}`,
          httpStatus.BAD_REQUEST,
        );
      }
      // ───────────────────────────────────────────────────────────────────

      const conn = await db.getConnection();
      try {
        await conn.beginTransaction();
        await produccionModel.guardarIngredientesOrden(conn, id, ingredientes);
        await conn.execute(
          `UPDATE ordenes_produccion SET observaciones = ? WHERE id_orden_produccion = ?`,
          [motivo, id],
        );
        await conn.commit();
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }

      return { message: "Receta de la orden actualizada correctamente" };
    } catch (error) {
      console.error("Error en editarRecetaOrden:", error);
      throw error;
    }
  },
};

module.exports = producccionService;
