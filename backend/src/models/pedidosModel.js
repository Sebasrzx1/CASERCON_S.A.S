const db = require("../config/conexion_db");

const PedidosModel = {

async findAll() {
  const query = `
    SELECT
      p.id_pedido,
      p.no_orden_compra,
      p.fecha_creacion,
      p.tipo_pedido,
      p.fecha_entrega,
      p.observaciones,
      p.estado,
      pr.id_proveedor,
      pr.nombre_proveedor,
      pr.nombre_empresa,
      uc.nombre AS usuario_creador,
      ur.nombre AS usuario_receptor,
      dp.id_detalle_pedido,
      dp.id_materia,
      dp.cantidad_solicitada,
      mp.nombre AS nombre_materia,
      COALESCE((
        SELECT SUM(dp2.cantidad_solicitada)
        FROM pedidos pd2
        INNER JOIN detalle_pedidos dp2 ON pd2.id_pedido = dp2.id_pedido
        WHERE pd2.tipo_pedido = 'devolucion'
          AND pd2.id_pedido_origen = p.id_pedido
          AND dp2.id_materia = dp.id_materia
      ), 0) AS cantidad_devuelta,
      -- Observación del movimiento de devolución para este item
      (
        SELECT mi.observacion
        FROM movimientos_inventario mi
        WHERE mi.id_pedido = p.id_pedido
          AND mi.id_materia = dp.id_materia
          AND mi.tipo_movimiento = 'Devolucion'
        LIMIT 1
      ) AS observacion_devolucion
    FROM pedidos p
    INNER JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
    INNER JOIN usuarios uc ON p.id_usuario_creador = uc.id_usuario
    LEFT JOIN usuarios ur ON p.id_usuario_receptor = ur.id_usuario
    LEFT JOIN detalle_pedidos dp ON p.id_pedido = dp.id_pedido
    LEFT JOIN materias_primas mp ON dp.id_materia = mp.id_materia
    WHERE p.tipo_pedido IN ('compra', 'devolucion')
    ORDER BY p.fecha_creacion DESC, dp.id_detalle_pedido ASC;
  `;

  const [rows] = await db.execute(query);

  const map = {};
  for (const row of rows) {
    if (!map[row.id_pedido]) {
      map[row.id_pedido] = {
        id_pedido:            row.id_pedido,
        no_orden_compra:      row.no_orden_compra,
        fecha_creacion:       row.fecha_creacion,
        tipo_pedido:          row.tipo_pedido,
        fecha_entrega:        row.fecha_entrega,
        observaciones:        row.observaciones,
        estado:               row.estado,
        id_proveedor:         row.id_proveedor,
        nombre_proveedor:     row.nombre_proveedor,
        nombre_empresa:       row.nombre_empresa,
        usuario_creador:      row.usuario_creador,
        usuario_receptor:     row.usuario_receptor,
        items: [],
      };
    }
    if (row.id_detalle_pedido) {
      map[row.id_pedido].items.push({
        id_detalle_pedido:     row.id_detalle_pedido,
        id_materia:            row.id_materia,
        nombre_materia:        row.nombre_materia,
        cantidad_solicitada:   row.cantidad_solicitada,
        cantidad_devuelta:     row.cantidad_devuelta,
        cantidad_ingresada:    Number(row.cantidad_solicitada) - Number(row.cantidad_devuelta),
        observacion_devolucion: row.observacion_devolucion || null,
      });
    }
  }
  return Object.values(map);
},

  async findById(id) {
    const query = `
      SELECT
        p.id_pedido, p.no_orden_compra, p.fecha_creacion,
        p.tipo_pedido, p.fecha_entrega, p.observaciones,
        p.estado, pr.id_proveedor, pr.nombre_proveedor,
        pr.nombre_empresa, uc.nombre AS usuario_creador,
        ur.nombre AS usuario_receptor
      FROM pedidos p
      INNER JOIN proveedores pr ON p.id_proveedor = pr.id_proveedor
      INNER JOIN usuarios uc ON p.id_usuario_creador = uc.id_usuario
      LEFT JOIN usuarios ur ON p.id_usuario_receptor = ur.id_usuario
      WHERE p.id_pedido = ?;
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  },

  async findDetallesByPedido(id_pedido) {
    const query = `
      SELECT
        dp.id_detalle_pedido, dp.id_materia,
        dp.cantidad_solicitada, mp.nombre AS nombre_materia,
        mp.abreviacion, mp.codigo
      FROM detalle_pedidos dp
      INNER JOIN materias_primas mp ON dp.id_materia = mp.id_materia
      WHERE dp.id_pedido = ?;
    `;
    const [rows] = await db.execute(query, [id_pedido]);
    return rows;
  },

  async create(data, items) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [countRows] = await conn.execute(
        `SELECT COUNT(*) AS total FROM pedidos WHERE tipo_pedido = 'compra'`
      );
      const numero = String(countRows[0].total + 1).padStart(3, "0");
      const hoy    = new Date();
      const dd     = String(hoy.getDate()).padStart(2, "0");
      const mm     = String(hoy.getMonth() + 1).padStart(2, "0");
      const yyyy   = hoy.getFullYear();
      const no_orden_compra = `OR-${numero}-${dd}${mm}${yyyy}`;

      const [result] = await conn.execute(
        `INSERT INTO pedidos
           (id_proveedor, no_orden_compra, tipo_pedido, fecha_entrega, observaciones, estado, id_usuario_creador)
         VALUES (?, ?, 'compra', ?, ?, 'pendiente', ?)`,
        [data.id_proveedor, no_orden_compra, data.fecha_entrega || null,
         data.observaciones || null, data.id_usuario_creador]
      );

      const id_pedido = result.insertId;
      for (const item of items) {
        await conn.execute(
          `INSERT INTO detalle_pedidos (id_pedido, id_materia, cantidad_solicitada) VALUES (?, ?, ?)`,
          [id_pedido, item.id_materia, item.cantidad_solicitada]
        );
      }

      await conn.commit();
      return id_pedido;
    } catch (e) { await conn.rollback(); throw e; }
    finally { conn.release(); }
  },

  async update(id, data, items) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(
        `UPDATE pedidos SET id_proveedor=?, fecha_entrega=?, observaciones=? WHERE id_pedido=?`,
        [data.id_proveedor, data.fecha_entrega || null, data.observaciones || null, id]
      );
      await conn.execute(`DELETE FROM detalle_pedidos WHERE id_pedido=?`, [id]);
      for (const item of items) {
        await conn.execute(
          `INSERT INTO detalle_pedidos (id_pedido, id_materia, cantidad_solicitada) VALUES (?, ?, ?)`,
          [id, item.id_materia, item.cantidad_solicitada]
        );
      }
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; }
    finally { conn.release(); }
  },


  async delete(id) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute(`DELETE FROM detalle_pedidos WHERE id_pedido=?`, [id]);
      await conn.execute(`DELETE FROM pedidos WHERE id_pedido=?`, [id]);
      await conn.commit();
    } catch (e) { await conn.rollback(); throw e; }
    finally { conn.release(); }
  },

  async recibirPedido(id_pedido, id_usuario_receptor, itemsDevolucion = []) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      const [detalles] = await conn.execute(
        `SELECT dp.id_detalle_pedido, dp.id_materia, dp.cantidad_solicitada, mp.abreviacion
         FROM detalle_pedidos dp
         INNER JOIN materias_primas mp ON dp.id_materia = mp.id_materia
         WHERE dp.id_pedido = ?`,
        [id_pedido]
      );

      const [pedidoRows] = await conn.execute(
        `SELECT id_proveedor, no_orden_compra FROM pedidos WHERE id_pedido=?`,
        [id_pedido]
      );
      const pedido = pedidoRows[0];

      const fecha    = new Date();
      const fechaStr = String(fecha.getDate()).padStart(2, "0") +
                       String(fecha.getMonth() + 1).padStart(2, "0") +
                       fecha.getFullYear();

      const devMap = {};
      for (const d of itemsDevolucion) {
        devMap[d.id_materia] = {
          cantidad:    d.cantidad_devuelta,
          observacion: d.observacion,
        };
      }

      const lotesCreados = [];

      for (const detalle of detalles) {
        const devInfo      = devMap[detalle.id_materia];
        const cantDevuelta = devInfo ? Number(devInfo.cantidad) : 0;
        const cantIngresa  = Number(detalle.cantidad_solicitada) - cantDevuelta;

        if (cantIngresa > 0) {
          const [loteRows] = await conn.execute(
            `SELECT COALESCE(MAX(numero_lote),0)+1 AS siguiente FROM lotes WHERE id_materia=?`,
            [detalle.id_materia]
          );
          const numeroLote = loteRows[0].siguiente;
          const codigoLote = `${detalle.abreviacion}-${String(numeroLote).padStart(3,"0")}-${fechaStr}`;

          const [loteResult] = await conn.execute(
            `INSERT INTO lotes
               (id_materia, numero_lote, id_detalle_pedido, codigo_lote, stock_inicial, stock_restante)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [detalle.id_materia, numeroLote, detalle.id_detalle_pedido,
             codigoLote, cantIngresa, cantIngresa]
          );

          await conn.execute(
            `INSERT INTO movimientos_inventario
               (id_materia, id_lote, id_usuario, tipo_movimiento, cantidad, id_pedido, observacion)
             VALUES (?, ?, ?, 'Entrada', ?, ?, ?)`,
            [detalle.id_materia, loteResult.insertId, id_usuario_receptor,
             cantIngresa, id_pedido,
             `Ingreso por orden de recepción ${pedido.no_orden_compra}`]
          );

          lotesCreados.push({ id_materia: detalle.id_materia, id_lote: loteResult.insertId });
        }

        if (cantDevuelta > 0) {
          await conn.execute(
            `INSERT INTO movimientos_inventario
               (id_materia, id_lote, id_usuario, tipo_movimiento, cantidad, id_pedido, observacion)
             VALUES (?, NULL, ?, 'Devolucion', ?, ?, ?)`,
            [detalle.id_materia, id_usuario_receptor, cantDevuelta, id_pedido,
             devInfo.observacion || `Devolución de ${pedido.no_orden_compra}`]
          );
        }
      }

      if (itemsDevolucion.length > 0) {
        const [odRows] = await conn.execute(
          `SELECT COUNT(*) AS total FROM pedidos WHERE tipo_pedido='devolucion'`
        );
        const odNumero = String(odRows[0].total + 1).padStart(3, "0");
        const odCodigo = `OD-${odNumero}-${fechaStr}`;

        const [odResult] = await conn.execute(
          `INSERT INTO pedidos
             (id_proveedor, no_orden_compra, tipo_pedido, fecha_entrega,
              observaciones, estado, id_usuario_creador, id_pedido_origen)
           VALUES (?, ?, 'devolucion', NULL, ?, 'pendiente', ?, ?)`,
          [pedido.id_proveedor, odCodigo,
           `Devolución automática de ${pedido.no_orden_compra}`,
           id_usuario_receptor, id_pedido]
        );

        const id_od = odResult.insertId;
        for (const d of itemsDevolucion) {
          await conn.execute(
            `INSERT INTO detalle_pedidos (id_pedido, id_materia, cantidad_solicitada) VALUES (?, ?, ?)`,
            [id_od, d.id_materia, d.cantidad_devuelta]
          );
        }
      }

      await conn.execute(
        `UPDATE pedidos SET estado='recibido', id_usuario_receptor=?, fecha_entrega=NOW()
         WHERE id_pedido=?`,
        [id_usuario_receptor, id_pedido]
      );

      await conn.commit();
      return lotesCreados;
    } catch (e) { await conn.rollback(); throw e; }
    finally { conn.release(); }
  },

  async hasLotes(id_pedido) {
    const [rows] = await db.execute(
      `SELECT COUNT(*) AS total
       FROM detalle_pedidos dp
       INNER JOIN lotes l ON dp.id_detalle_pedido = l.id_detalle_pedido
       WHERE dp.id_pedido=?`,
      [id_pedido]
    );
    return rows[0].total > 0;
  },

  async findProveedoresActivos() {
    const [rows] = await db.execute(
      `SELECT id_proveedor, nombre_proveedor, nombre_empresa, email, telefono
       FROM proveedores WHERE estado='Activo' ORDER BY nombre_proveedor ASC`
    );
    return rows;
  },

  async findMateriasPrimasActivas() {
    const [rows] = await db.execute(
      `SELECT id_materia, nombre, abreviacion, codigo
       FROM materias_primas WHERE estado='Activo' ORDER BY nombre ASC`
    );
    return rows;
  },
};

module.exports = PedidosModel;