const db = require("../config/conexion_db");

const ReportesModel = {
  // ══════════════════════════════════════════════════════════════
  // 1. ESTADO DE INVENTARIO — Fotografía actual del almacén
  // ══════════════════════════════════════════════════════════════
  async getEstadoInventario() {
    const query = `
      SELECT
        mp.id_materia,
        mp.nombre,
        mp.codigo,
        mp.abreviacion,
        mp.stock_min,
        cm.nombre_categoria_materia AS categoria,
        ROUND(COALESCE(SUM(l.stock_restante), 0), 2) AS stock_actual,
        CASE
          WHEN ROUND(COALESCE(SUM(l.stock_restante), 0), 2) <= mp.stock_min THEN 'Critico'
          WHEN ROUND(COALESCE(SUM(l.stock_restante), 0), 2) <= mp.stock_min * 2 THEN 'Bajo'
          ELSE 'Suficiente'
        END AS estado_stock,
        CASE
          WHEN mp.stock_min > 0 THEN ROUND((COALESCE(SUM(l.stock_restante), 0) / mp.stock_min) * 100, 1)
          ELSE 0
        END AS porcentaje_cobertura
      FROM materias_primas mp
      INNER JOIN categoria_materias cm ON mp.id_categoria_materia = cm.id_categoria_materia
      LEFT JOIN lotes l ON mp.id_materia = l.id_materia AND l.estado = 'activo'
      WHERE mp.estado = 'Activo'
      GROUP BY mp.id_materia, mp.nombre, mp.codigo, mp.abreviacion, mp.stock_min, cm.nombre_categoria_materia
      ORDER BY
        FIELD(
          CASE
            WHEN ROUND(COALESCE(SUM(l.stock_restante), 0), 2) <= mp.stock_min THEN 'Critico'
            WHEN ROUND(COALESCE(SUM(l.stock_restante), 0), 2) <= mp.stock_min * 2 THEN 'Bajo'
            ELSE 'Suficiente'
          END,
          'Critico', 'Bajo', 'Suficiente'
        ),
        cm.nombre_categoria_materia,
        mp.nombre;
    `;
    const [rows] = await db.execute(query);
    return rows;
  },

  // ══════════════════════════════════════════════════════════════
  // 2. CONSUMO POR MATERIA PRIMA — Análisis de uso en período
  // ══════════════════════════════════════════════════════════════
  async getConsumoPorMateria({ fecha_inicio, fecha_fin }) {
    let where = `AND mi.tipo_movimiento = 'Salida'`;
    const params = [];
    if (fecha_inicio) { where += ` AND DATE(mi.fecha) >= ?`; params.push(fecha_inicio); }
    if (fecha_fin)    { where += ` AND DATE(mi.fecha) <= ?`; params.push(fecha_fin); }

    const query = `
      SELECT
        mp.id_materia,
        mp.nombre,
        mp.abreviacion,
        cm.nombre_categoria_materia AS categoria,
        ROUND(SUM(mi.cantidad), 2) AS total_consumido,
        COUNT(mi.id_movimiento) AS total_movimientos,
        ROUND(AVG(mi.cantidad), 2) AS promedio_por_movimiento,
        MIN(mi.fecha) AS primera_salida,
        MAX(mi.fecha) AS ultima_salida
      FROM movimientos_inventario mi
      INNER JOIN materias_primas mp ON mi.id_materia = mp.id_materia
      INNER JOIN categoria_materias cm ON mp.id_categoria_materia = cm.id_categoria_materia
      WHERE 1=1 ${where}
      GROUP BY mp.id_materia, mp.nombre, mp.abreviacion, cm.nombre_categoria_materia
      ORDER BY total_consumido DESC;
    `;
    const [rows] = await db.execute(query, params);
    return rows;
  },

  // ══════════════════════════════════════════════════════════════
  // 3. ACTIVIDAD POR PROVEEDOR — Evaluación de proveedores
  //    Compras: pedidos tipo 'compra' agrupados por proveedor
  //    Devoluciones: pedidos tipo 'devolucion' agrupados por proveedor
  //    NOTA: las devoluciones manuales (desde Movimientos) siempre asignan
  //    id_proveedor = 1 (hardcodeado). Para datos 100% precisos, se debería
  //    agregar un selector de proveedor en el formulario de devolución manual.
  // ══════════════════════════════════════════════════════════════
  async getActividadProveedores({ fecha_inicio, fecha_fin }) {
    let whereCompra = `AND p.tipo_pedido = 'compra'`;
    let whereDevol  = `AND p.tipo_pedido = 'devolucion'`;
    const paramsCompra = [];
    const paramsDevol  = [];

    if (fecha_inicio) {
      whereCompra += ` AND DATE(p.fecha_creacion) >= ?`; paramsCompra.push(fecha_inicio);
      whereDevol  += ` AND DATE(p.fecha_creacion) >= ?`; paramsDevol.push(fecha_inicio);
    }
    if (fecha_fin) {
      whereCompra += ` AND DATE(p.fecha_creacion) <= ?`; paramsCompra.push(fecha_fin);
      whereDevol  += ` AND DATE(p.fecha_creacion) <= ?`; paramsDevol.push(fecha_fin);
    }

    const query = `
      SELECT
        pr.id_proveedor,
        pr.nombre_proveedor,
        pr.nombre_empresa,
        -- Órdenes de compra
        COALESCE(compras.total_ordenes, 0)   AS total_ordenes,
        COALESCE(compras.ordenes_recibidas, 0) AS ordenes_recibidas,
        COALESCE(compras.ordenes_pendientes, 0) AS ordenes_pendientes,
        ROUND(COALESCE(compras.total_kg_solicitado, 0), 2) AS total_kg_solicitado,
        -- Devoluciones
        COALESCE(devols.total_devoluciones, 0) AS total_devoluciones,
        ROUND(COALESCE(devols.total_kg_devuelto, 0), 2) AS total_kg_devuelto,
        -- % devolución
        CASE
          WHEN COALESCE(compras.total_kg_solicitado, 0) > 0
          THEN ROUND((COALESCE(devols.total_kg_devuelto, 0) / compras.total_kg_solicitado) * 100, 1)
          ELSE 0
        END AS porcentaje_devolucion
      FROM proveedores pr
      LEFT JOIN (
        SELECT
          p.id_proveedor,
          COUNT(DISTINCT p.id_pedido) AS total_ordenes,
          SUM(CASE WHEN p.estado = 'recibido' THEN 1 ELSE 0 END) AS ordenes_recibidas,
          SUM(CASE WHEN p.estado = 'pendiente' THEN 1 ELSE 0 END) AS ordenes_pendientes,
          SUM(dp.cantidad_solicitada) AS total_kg_solicitado
        FROM pedidos p
        INNER JOIN detalle_pedidos dp ON p.id_pedido = dp.id_pedido
        WHERE 1=1 ${whereCompra}
        GROUP BY p.id_proveedor
      ) compras ON pr.id_proveedor = compras.id_proveedor
      LEFT JOIN (
        SELECT
          p.id_proveedor,
          COUNT(DISTINCT p.id_pedido) AS total_devoluciones,
          SUM(dp.cantidad_solicitada) AS total_kg_devuelto
        FROM pedidos p
        INNER JOIN detalle_pedidos dp ON p.id_pedido = dp.id_pedido
        WHERE 1=1 ${whereDevol}
        GROUP BY p.id_proveedor
      ) devols ON pr.id_proveedor = devols.id_proveedor
      WHERE pr.estado = 'Activo'
        AND (COALESCE(compras.total_ordenes, 0) > 0 OR COALESCE(devols.total_devoluciones, 0) > 0)
      ORDER BY total_kg_solicitado DESC;
    `;
    const [rows] = await db.execute(query, [...paramsCompra, ...paramsDevol]);
    return rows;
  },

  // ══════════════════════════════════════════════════════════════
  // 4. PRODUCCIÓN — Rendimiento operativo
  // ══════════════════════════════════════════════════════════════
  async getReporteProduccion({ fecha_inicio, fecha_fin }) {
    let where = "";
    const params = [];
    if (fecha_inicio) { where += ` AND DATE(op.fecha_creacion) >= ?`; params.push(fecha_inicio); }
    if (fecha_fin)    { where += ` AND DATE(op.fecha_creacion) <= ?`; params.push(fecha_fin); }

    const query = `
      SELECT
        op.id_orden_produccion,
        op.codigo_orden,
        r.nombre_producto,
        op.cantidad_producir,
        op.estado,
        op.fecha_creacion,
        op.fecha_finalizacion,
        uc.nombre AS usuario_creador,
        ui.nombre AS usuario_inicio,
        uf.nombre AS usuario_fin,
        op.observaciones,
        CASE
          WHEN op.fecha_finalizacion IS NOT NULL AND op.fecha_creacion IS NOT NULL
          THEN TIMESTAMPDIFF(HOUR, op.fecha_creacion, op.fecha_finalizacion)
          ELSE NULL
        END AS horas_produccion
      FROM ordenes_produccion op
      INNER JOIN recetas r ON op.id_receta = r.id_receta
      INNER JOIN usuarios uc ON op.id_usuario_creador = uc.id_usuario
      LEFT JOIN usuarios ui ON op.id_usuario_inicio = ui.id_usuario
      LEFT JOIN usuarios uf ON op.id_usuario_fin = uf.id_usuario
      WHERE 1=1 ${where}
      ORDER BY op.fecha_creacion DESC;
    `;
    const [rows] = await db.execute(query, params);
    return rows;
  },

  // ══════════════════════════════════════════════════════════════
  // 5. ENTRADAS VS SALIDAS — Balance de inventario por categoría
  // ══════════════════════════════════════════════════════════════
  async getBalanceInventario({ fecha_inicio, fecha_fin }) {
    let where = "";
    const params = [];
    if (fecha_inicio) { where += ` AND DATE(mi.fecha) >= ?`; params.push(fecha_inicio); }
    if (fecha_fin)    { where += ` AND DATE(mi.fecha) <= ?`; params.push(fecha_fin); }

    const query = `
      SELECT
        cm.nombre_categoria_materia AS categoria,
        ROUND(COALESCE(SUM(CASE WHEN mi.tipo_movimiento = 'Entrada' THEN mi.cantidad ELSE 0 END), 0), 2) AS total_entradas,
        ROUND(COALESCE(SUM(CASE WHEN mi.tipo_movimiento = 'Salida' THEN mi.cantidad ELSE 0 END), 0), 2) AS total_salidas,
        ROUND(COALESCE(SUM(CASE WHEN mi.tipo_movimiento = 'Devolucion' THEN mi.cantidad ELSE 0 END), 0), 2) AS total_devoluciones,
        ROUND(
          COALESCE(SUM(CASE WHEN mi.tipo_movimiento = 'Entrada' THEN mi.cantidad ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN mi.tipo_movimiento = 'Salida' THEN mi.cantidad ELSE 0 END), 0) -
          COALESCE(SUM(CASE WHEN mi.tipo_movimiento = 'Devolucion' THEN mi.cantidad ELSE 0 END), 0),
        2) AS balance_neto,
        COUNT(mi.id_movimiento) AS total_movimientos
      FROM movimientos_inventario mi
      INNER JOIN materias_primas mp ON mi.id_materia = mp.id_materia
      INNER JOIN categoria_materias cm ON mp.id_categoria_materia = cm.id_categoria_materia
      WHERE 1=1 ${where}
      GROUP BY cm.nombre_categoria_materia
      ORDER BY balance_neto ASC;
    `;
    const [rows] = await db.execute(query, params);
    return rows;
  },

  // ══════════════════════════════════════════════════════════════
  // 6. MOVIMIENTOS FILTRADOS — Listado detallado (reporte actual mejorado)
  // ══════════════════════════════════════════════════════════════
  async getMovimientosFiltrados({ tipo, fecha_inicio, fecha_fin }) {
    let where = "";
    const params = [];
    if (tipo && tipo !== "Todos") { where += ` AND mi.tipo_movimiento = ?`; params.push(tipo); }
    if (fecha_inicio) { where += ` AND DATE(mi.fecha) >= ?`; params.push(fecha_inicio); }
    if (fecha_fin)    { where += ` AND DATE(mi.fecha) <= ?`; params.push(fecha_fin); }

    const query = `
      SELECT
        mi.id_movimiento,
        mi.tipo_movimiento,
        mi.cantidad,
        mi.fecha,
        mi.observacion,
        mp.nombre AS nombre_materia,
        mp.codigo AS codigo_materia,
        cm.nombre_categoria_materia AS categoria,
        l.codigo_lote,
        u.nombre AS usuario,
        p.no_orden_compra AS codigo_orden
      FROM movimientos_inventario mi
      INNER JOIN materias_primas mp ON mi.id_materia = mp.id_materia
      INNER JOIN categoria_materias cm ON mp.id_categoria_materia = cm.id_categoria_materia
      LEFT JOIN lotes l ON mi.id_lote = l.id_lote
      LEFT JOIN usuarios u ON mi.id_usuario = u.id_usuario
      LEFT JOIN pedidos p ON mi.id_pedido = p.id_pedido
      WHERE 1=1 ${where}
      ORDER BY mi.fecha DESC;
    `;
    const [rows] = await db.execute(query, params);
    return rows;
  },
};

module.exports = ReportesModel;