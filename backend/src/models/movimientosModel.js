const db = require("../config/conexion_db");

const movimientosModel = {
  async findAll() {
    const query = `
      SELECT
        mi.id_movimiento,
        mi.tipo_movimiento,
        mi.cantidad,
        mi.fecha,
        mi.observacion,
        mp.nombre        AS nombre_materia,
        mp.codigo        AS codigo_materia,
        cm.nombre_categoria_materia AS categoria,
        l.codigo_lote,
        l.stock_restante AS stock_lote,
        u.nombre         AS usuario,
        p.id_pedido,
        p.no_orden_compra AS codigo_orden,
        p.tipo_pedido,
        op.id_orden_produccion,
        op.codigo_orden  AS codigo_orden_produccion
      FROM movimientos_inventario mi
      INNER JOIN materias_primas mp ON mi.id_materia = mp.id_materia
      INNER JOIN categoria_materias cm ON mp.id_categoria_materia = cm.id_categoria_materia
      LEFT  JOIN lotes l             ON mi.id_lote = l.id_lote
      LEFT  JOIN usuarios u          ON mi.id_usuario = u.id_usuario
      LEFT  JOIN pedidos p           ON mi.id_pedido = p.id_pedido
      LEFT  JOIN ordenes_produccion op ON mi.id_orden_produccion = op.id_orden_produccion
      ORDER BY mi.fecha DESC;
    `;
    const [rows] = await db.execute(query);
    return rows;
  },

  async findByFiltros({ tipo, fecha_inicio, fecha_fin }) {
    let query = `
      SELECT
        mi.id_movimiento,
        mi.tipo_movimiento,
        mi.cantidad,
        mi.fecha,
        mi.observacion,
        mp.nombre        AS nombre_materia,
        mp.codigo        AS codigo_materia,
        cm.nombre_categoria_materia AS categoria,
        l.codigo_lote,
        u.nombre         AS usuario,
        p.no_orden_compra AS codigo_orden
      FROM movimientos_inventario mi
      INNER JOIN materias_primas mp ON mi.id_materia = mp.id_materia
      INNER JOIN categoria_materias cm ON mp.id_categoria_materia = cm.id_categoria_materia
      LEFT  JOIN lotes l             ON mi.id_lote = l.id_lote
      LEFT  JOIN usuarios u          ON mi.id_usuario = u.id_usuario
      LEFT  JOIN pedidos p           ON mi.id_pedido = p.id_pedido
      WHERE 1=1
    `;
    const params = [];

    if (tipo && tipo !== "Todos") {
      query += ` AND mi.tipo_movimiento = ?`;
      params.push(tipo);
    }
    if (fecha_inicio) {
      query += ` AND DATE(mi.fecha) >= ?`;
      params.push(fecha_inicio);
    }
    if (fecha_fin) {
      query += ` AND DATE(mi.fecha) <= ?`;
      params.push(fecha_fin);
    }

    query += ` ORDER BY mi.fecha DESC;`;
    const [rows] = await db.execute(query, params);
    return rows;
  },

  async findLotesActivosByMateria(id_materia) {
    const query = `
      SELECT
        l.id_lote,
        l.codigo_lote,
        l.numero_lote,
        l.stock_restante,
        l.fecha_ingreso
      FROM lotes l
      WHERE l.id_materia = ?
        AND l.estado = 'activo'
        AND l.stock_restante > 0
      ORDER BY l.fecha_ingreso ASC;
    `;
    const [rows] = await db.execute(query, [id_materia]);
    return rows;
  },

  async getNextNumeroLote(id_materia) {
    const query = `
      SELECT COALESCE(MAX(numero_lote), 0) + 1 AS siguiente
      FROM lotes
      WHERE id_materia = ?;
    `;
    const [rows] = await db.execute(query, [id_materia]);
    return rows[0].siguiente;
  },

  async createLote({ id_materia, abreviacion, cantidad, numero_lote }) {
    const fecha = new Date();
    const dd = String(fecha.getDate()).padStart(2, "0");
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const yyyy = fecha.getFullYear();
    const codigo_lote = `${abreviacion}-${String(numero_lote).padStart(3, "0")}-${dd}${mm}${yyyy}`;

    const query = `
      INSERT INTO lotes
        (id_materia, numero_lote, id_detalle_pedido, codigo_lote, stock_inicial, stock_restante, estado)
      VALUES (?, ?, NULL, ?, ?, ?, 'activo');
    `;
    const [result] = await db.execute(query, [
      id_materia,
      numero_lote,
      codigo_lote,
      cantidad,
      cantidad,
    ]);
    return { id_lote: result.insertId, codigo_lote };
  },

  async createEntrada({
    id_materia,
    id_lote,
    id_usuario,
    cantidad,
    observacion,
  }) {
    const query = `
      INSERT INTO movimientos_inventario
        (id_materia, id_lote, id_usuario, tipo_movimiento, cantidad, observacion)
      VALUES (?, ?, ?, 'Entrada', ?, ?);
    `;
    const [result] = await db.execute(query, [
      id_materia,
      id_lote,
      id_usuario,
      cantidad,
      observacion || null,
    ]);
    return result.insertId;
  },

  async createSalida({
    id_materia,
    id_lote,
    id_usuario,
    cantidad,
    observacion,
  }) {
    const query = `
      INSERT INTO movimientos_inventario
        (id_materia, id_lote, id_usuario, tipo_movimiento, cantidad, observacion)
      VALUES (?, ?, ?, 'Salida', ?, ?);
    `;
    const [result] = await db.execute(query, [
      id_materia,
      id_lote,
      id_usuario,
      cantidad,
      observacion || null,
    ]);
    return result.insertId;
  },

  async descontarStockLote(id_lote, cantidad) {
    const query = `
      UPDATE lotes
      SET stock_restante = stock_restante - ?
      WHERE id_lote = ?;
    `;
    await db.execute(query, [cantidad, id_lote]);
  },

  async findLoteById(id_lote) {
    const query = `
      SELECT id_lote, id_materia, stock_restante, estado
      FROM lotes WHERE id_lote = ?;
    `;
    const [rows] = await db.execute(query, [id_lote]);
    return rows[0] || null;
  },

  async findMateriaById(id_materia) {
    const query = `
      SELECT mp.id_materia, mp.nombre, mp.abreviacion, mp.estado
      FROM materias_primas mp
      WHERE mp.id_materia = ?;
    `;
    const [rows] = await db.execute(query, [id_materia]);
    return rows[0] || null;
  },
  async registrarDevolucion({
    id_materia,
    id_lote,
    id_usuario,
    cantidad,
    observacion,
  }) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // 1. Descontar cantidad del lote
      await conn.execute(
        `UPDATE lotes SET stock_restante = stock_restante - ? WHERE id_lote = ?`,
        [cantidad, id_lote],
      );

      // 2. Si el stock queda en 0, marcar como agotado
      await conn.execute(
        `UPDATE lotes SET estado = 'agotado' WHERE id_lote = ? AND stock_restante <= 0`,
        [id_lote],
      );

      // 3. Generar código de orden de devolución
      const fecha = new Date();
      const dd = String(fecha.getDate()).padStart(2, "0");
      const mm = String(fecha.getMonth() + 1).padStart(2, "0");
      const yyyy = fecha.getFullYear();

      const [countRows] = await conn.execute(
        `SELECT COUNT(*) AS total FROM pedidos WHERE tipo_pedido = 'devolucion'`,
      );
      const numero = String(countRows[0].total + 1).padStart(3, "0");
      const codigo = `OD-${numero}-${dd}${mm}${yyyy}`;

      // 4. Buscar el proveedor real del lote (lote → detalle_pedido → pedido compra → proveedor)
      const [provRows] = await conn.execute(
        `SELECT p.id_proveedor
         FROM lotes l
         INNER JOIN detalle_pedidos dp ON l.id_detalle_pedido = dp.id_detalle_pedido
         INNER JOIN pedidos p ON dp.id_pedido = p.id_pedido AND p.tipo_pedido = 'compra'
         WHERE l.id_lote = ?`,
        [id_lote],
      );
      // Si el lote vino de un pedido de compra, usar ese proveedor; si no, usar proveedor 1 por defecto
      const id_proveedor_real = provRows.length > 0 ? provRows[0].id_proveedor : 1;

      // 5. Crear pedido de devolución con el proveedor real
      const [pedidoResult] = await conn.execute(
        `INSERT INTO pedidos
         (id_proveedor, no_orden_compra, tipo_pedido, observaciones, estado, id_usuario_creador)
       VALUES (?, ?, 'devolucion', ?, 'pendiente', ?)`,
        [
          id_proveedor_real,
          codigo,
          observacion && observacion.trim() !== "" ? observacion.trim() : null,
          id_usuario,
        ],
      );
      const id_pedido = pedidoResult.insertId;

      // 5. Agregar detalle al pedido
      await conn.execute(
        `INSERT INTO detalle_pedidos (id_pedido, id_materia, cantidad_solicitada)
       VALUES (?, ?, ?)`,
        [id_pedido, id_materia, cantidad],
      );

      // 6. Registrar movimiento de devolución vinculado al pedido
      // Esto permite al delete encontrar el lote y restaurar el stock si se cancela
      await conn.execute(
        `INSERT INTO movimientos_inventario
         (id_materia, id_lote, id_usuario, tipo_movimiento, cantidad, id_pedido, observacion)
       VALUES (?, ?, ?, 'Devolucion', ?, ?, ?)`,
        [
          id_materia,
          id_lote,
          id_usuario,
          cantidad,
          id_pedido,
          observacion && observacion.trim() !== "" ? observacion.trim() : null,
        ],
      );

      await conn.commit();
      return { codigo_devolucion: codigo, id_pedido };
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  },

  // ── Obtener lotes activos y en_devolucion de una materia (para devolución)
  async findLotesParaDevolucion(id_materia) {
    const query = `
    SELECT
      l.id_lote,
      l.codigo_lote,
      l.numero_lote,
      l.stock_restante,
      l.estado,
      l.fecha_ingreso
    FROM lotes l
    WHERE l.id_materia = ?
      AND l.estado = 'activo'
      AND l.stock_restante > 0
    ORDER BY l.fecha_ingreso ASC;
  `;
    const [rows] = await db.execute(query, [id_materia]);
    return rows;
  },
};

module.exports = movimientosModel;