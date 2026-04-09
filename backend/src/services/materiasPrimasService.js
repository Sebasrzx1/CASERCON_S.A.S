const materiasPrimasModel = require("../models/materiasPrimasModel");

// Lógica de negocio: calcula el estado de stock de una materia prima
const calcularEstadoStock = (stockActual, stockMinimo) => {
  if (stockActual <= stockMinimo * 0.5) return "Critico";  // ≤ 50 % del mínimo
  if (stockActual <= stockMinimo)        return "Bajo";     // entre 50 % y 100 %
  return "Suficiente";
};

const materiasPrimasService = {

  // ─── Ya existente: usada en Dashboard ─────────────────────────────────────
  async getAllMaterias() {
    try {
      const materias = await materiasPrimasModel.findAll();

      return materias.map((m) => ({
        ...m,
        estadoStock: calcularEstadoStock(m.stockActual, m.stockMinimo),
      }));
    } catch (error) {
      console.error("Error en service getAllMaterias:", error);
      throw error;
    }
  },

  // ─── Categorías para el select del formulario ──────────────────────────────
  async getAllCategorias() {
    try {
      return await materiasPrimasModel.findAllCategorias();
    } catch (error) {
      console.error("Error en service getAllCategorias:", error);
      throw error;
    }
  },

  // ─── Lotes de una materia (modal "Ver Lotes") ──────────────────────────────
  async getLotesByMateria(id) {
    try {
      const materia = await materiasPrimasModel.findById(id);
      if (!materia) throw { status: 404, msg: "Materia prima no encontrada" };

      return await materiasPrimasModel.findLotesByMateria(id);
    } catch (error) {
      console.error("Error en service getLotesByMateria:", error);
      throw error;
    }
  },

  // ─── Crear ─────────────────────────────────────────────────────────────────
  async createMateria(body) {
  const db = require("../config/conexion_db");
  const conn = await db.getConnection(); // transacción para que todo o nada
  try {
    await conn.beginTransaction();

    const { nombre, codigo, abreviacion, id_categoria_materia, stock_min, stock_inicial, id_usuario } = body;

    if (!nombre || !codigo || !abreviacion || !id_categoria_materia) {
      throw { status: 400, msg: "Faltan campos requeridos: nombre, codigo, abreviacion, id_categoria_materia" };
    }
    if (!stock_inicial || parseFloat(stock_inicial) <= 0) {
      throw { status: 400, msg: "El stock inicial debe ser mayor a 0" };
    }
    if (!id_usuario) {
      throw { status: 400, msg: "Se requiere el id del usuario" };
    }

    // 1. Crear la materia prima
    const [mpResult] = await conn.execute(
      `INSERT INTO materias_primas (nombre, codigo, abreviacion, id_categoria_materia, stock_min)
      VALUES (?, ?, ?, ?, ?)`,
      [nombre, codigo, abreviacion, id_categoria_materia, stock_min ?? 0]
    );
    const id_materia = mpResult.insertId;

    // 2. Generar código de lote
    const fecha = new Date();
    const dd    = String(fecha.getDate()).padStart(2, "0");
    const mm    = String(fecha.getMonth() + 1).padStart(2, "0");
    const yyyy  = fecha.getFullYear();
    const codigo_lote = `${abreviacion}-001-${dd}${mm}${yyyy}`;

    // 3. Crear el lote inicial
    const [loteResult] = await conn.execute(
      `INSERT INTO lotes
          (id_materia, numero_lote, id_detalle_pedido, codigo_lote, stock_inicial, stock_restante, estado)
      VALUES (?, 1, NULL, ?, ?, ?, 'activo')`,
      [id_materia, codigo_lote, stock_inicial, stock_inicial]
    );
    const id_lote = loteResult.insertId;

    // 4. Registrar movimiento de entrada
    await conn.execute(
      `INSERT INTO movimientos_inventario
          (id_materia, id_lote, id_usuario, tipo_movimiento, cantidad, observacion)
      VALUES (?, ?, ?, 'Entrada', ?, 'Stock inicial al registrar materia prima')`,
      [id_materia, id_lote, id_usuario, stock_inicial]
    );

    await conn.commit();
    return { id_materia, msg: "Materia prima creada correctamente con stock inicial" };

  } catch (error) {
    await conn.rollback();
    console.error("Error en service createMateria:", error);
    throw error;
  } finally {
    conn.release();
  }
},

  // ─── Actualizar ────────────────────────────────────────────────────────────
  async updateMateria(id, body) {
  const db = require("../config/conexion_db");
  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    const materia = await materiasPrimasModel.findById(id);
    if (!materia) throw { status: 404, msg: "Materia prima no encontrada" };

    const {
      nombre,
      codigo,
      abreviacion,
      id_categoria_materia,
      stock_min,
      stock_inicial
    } = body;

    if (!nombre || !codigo || !abreviacion || !id_categoria_materia) {
      throw { status: 400, msg: "Faltan campos requeridos" };
    }

    // actualizar metadata
    await materiasPrimasModel.update(id, {
      nombre,
      codigo,
      abreviacion,
      id_categoria_materia,
      stock_min
    });

    // ─── lógica del stock inicial ─────────────────────
    if (stock_inicial !== undefined) {

      const loteInicial = await materiasPrimasModel.findLoteInicial(id);

      if (!loteInicial) {
        throw { status: 400, msg: "No existe lote inicial para esta materia" };
      }

      // si se usó en producción
      if (loteInicial.stock_restante !== loteInicial.stock_inicial) {
        throw {
          status: 400,
          msg: "No se puede modificar el stock inicial porque el lote ya fue usado en producción"
        };
      }

      // actualizar lote
      await materiasPrimasModel.updateStockLote(
        loteInicial.id_lote,
        stock_inicial
      );
    }

    await conn.commit();

    return { msg: "Materia prima actualizada correctamente" };

  } catch (error) {
    await conn.rollback();
    console.error("Error en service updateMateria:", error);
    throw error;
  } finally {
    conn.release();
  }
},

  // Reemplaza deleteMateria por esto:
async deleteMateria(id) {
  try {
    const materia = await materiasPrimasModel.findById(id);
    if (!materia) throw { status: 404, msg: "Materia prima no encontrada" };
    if (materia.estado === 'Inhabilitado') throw { status: 400, msg: "La materia prima ya está inhabilitada" };

    await materiasPrimasModel.inhabilitar(id);
    return { msg: "Materia prima inhabilitada correctamente" };
  } catch (error) {
    console.error("Error en service deleteMateria:", error);
    throw error;
  }
},

// Agrega esta función nueva:
async habilitarMateria(id) {
  try {
    const materia = await materiasPrimasModel.findById(id);
    if (!materia) throw { status: 404, msg: "Materia prima no encontrada" };
    if (materia.estado === 'Activo') throw { status: 400, msg: "La materia prima ya está activa" };

    await materiasPrimasModel.habilitar(id);
    return { msg: "Materia prima habilitada correctamente" };
  } catch (error) {
    console.error("Error en service habilitarMateria:", error);
    throw error;
  }
},
};

module.exports = materiasPrimasService;