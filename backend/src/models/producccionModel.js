const db = require("../config/conexion_db");

const ProduccionModel = {
  // Obtener todas las órdenes de producción
  async findAll() {
    const query = `
    SELECT 
      op.id_orden_produccion,
      op.codigo_orden,
      r.id_receta,
      r.nombre_producto,
      uc.nombre AS usuario_creador,
      ui.nombre AS usuario_inicio,
      uf.nombre AS usuario_fin,
      op.cantidad_producir,
      op.estado,
      op.fecha_creacion,
      op.fecha_finalizacion,
      op.id_usuario_inicio,
      op.id_usuario_fin,
      op.observaciones,
      (
        SELECT JSON_ARRAYAGG(
          JSON_OBJECT(
            'id_materia', dop.id_materia,
            'nombre_materia', mp2.nombre,
            'cantidad_porcentaje', dop.cantidad_porcentaje
          )
        )
        FROM detalle_orden_produccion dop
        INNER JOIN materias_primas mp2 ON dop.id_materia = mp2.id_materia
        WHERE dop.id_orden_produccion = op.id_orden_produccion
      ) AS ingredientes_orden
    FROM ordenes_produccion op
    INNER JOIN recetas r 
      ON op.id_receta = r.id_receta
    INNER JOIN usuarios uc 
      ON op.id_usuario_creador = uc.id_usuario
    LEFT JOIN usuarios ui
      ON op.id_usuario_inicio = ui.id_usuario
    LEFT JOIN usuarios uf
      ON op.id_usuario_fin = uf.id_usuario
    ORDER BY op.fecha_creacion ASC;
  `;

    const [rows] = await db.execute(query);
    return rows;
  },

  // 🔍 Obtener una orden por ID
  async findById(id) {
    const query = `
      SELECT 
        op.*,
        r.nombre_producto
      FROM ordenes_produccion op
      INNER JOIN recetas r 
        ON op.id_receta = r.id_receta
      WHERE op.id_orden_produccion = ?;
    `;

    const [rows] = await db.execute(query, [id]);
    return rows[0];
  },

  // 🧾 Crear una orden de producción
  async create(data) {
    const query = `
      INSERT INTO ordenes_produccion (
        id_receta,
        id_usuario_creador,
        cantidad_producir,
        estado
      ) VALUES (?, ?, ?, 'Pendiente');
    `;

    const values = [
      data.id_receta,
      data.id_usuario_creador,
      data.cantidad_producir,
    ];

    const [result] = await db.execute(query, values);
    const id = result.insertId;

    //Generar codigo de orden de produccion
    const fecha = new Date();
    const dd = String(fecha.getDate()).padStart(2, "0");
    const mm = String(fecha.getMonth() + 1).padStart(2, "0");
    const yyyy = fecha.getFullYear();
    const codigo_orden = `OP-${String(id).padStart(3, "0")}-${dd}${mm}${yyyy}`;

    await db.execute(
      `UPDATE ordenes_produccion SET codigo_orden = ? WHERE id_orden_produccion = ?`,
      [codigo_orden, id],
    );

    return id;
  },

  // ▶️ Iniciar producción
  async iniciarOrden(id, id_usuario_inicio) {
    const query = `
      UPDATE ordenes_produccion
      SET 
        estado = 'En proceso',
        id_usuario_inicio = ?
      WHERE id_orden_produccion = ?;
    `;

    await db.execute(query, [id_usuario_inicio, id]);
  },

  // ✅ Finalizar producción
  async finalizarOrden(id, id_usuario_fin) {
    const query = `
      UPDATE ordenes_produccion
      SET 
        estado = 'Completada',
        id_usuario_fin = ?,
        fecha_finalizacion = NOW()
      WHERE id_orden_produccion = ?;
    `;

    await db.execute(query, [id_usuario_fin, id]);
  },

  async hasMovimientos(id) {
    const query = `
    SELECT COUNT(*) AS total
    FROM movimientos_inventario
    WHERE id_orden_produccion = ?;
  `;

    const [rows] = await db.execute(query, [id]);
    return rows[0].total > 0;
  },

  async deleteOrden(id) {
    const query = `
    DELETE FROM ordenes_produccion
    WHERE id_orden_produccion = ?;
  `;

    await db.execute(query, [id]);
  },

  // ── NUEVOS MÉTODOS PARA MODIFICAR LOS PORCENTAJES DE LA MATERIA PRIMA DE LA RECETA ──────────────────────────────────────────────────────────

  // Trae los ingredientes de la receta vinculada a una orden
  async findIngredientesByOrden(id_orden_produccion) {
    const query = `
      SELECT 
        dr.id_materia,
        mp.nombre AS nombre_materia,
        dr.cantidad_porcentaje
      FROM ordenes_produccion op
      INNER JOIN detalle_receta dr ON op.id_receta = dr.id_receta
      INNER JOIN materias_primas mp ON dr.id_materia = mp.id_materia
      WHERE op.id_orden_produccion = ?;
    `;

    const [rows] = await db.execute(query, [id_orden_produccion]);
    return rows;
  },

  // Lotes activos FIFO para una materia prima
  async findLotesFIFO(id_materia) {
    const query = `
      SELECT id_lote, codigo_lote, stock_restante
      FROM lotes
      WHERE id_materia = ? AND estado = 'activo' AND stock_restante > 0
      ORDER BY fecha_ingreso ASC;
    `;

    const [rows] = await db.execute(query, [id_materia]);
    return rows;
  },

  // Stock disponible real (total lotes activos menos comprometido)
  async findStockDisponible(id_materia, excluir_orden_id = null) {
    const query = `
    SELECT
      ROUND(COALESCE(SUM(l.stock_restante), 0), 4) AS stock_total,
      ROUND(COALESCE((
        SELECT SUM(ingrediente_porcentaje / 100 * op.cantidad_producir)
        FROM ordenes_produccion op
        JOIN (
          -- Órdenes con ingredientes propios (detalle_orden_produccion)
          SELECT
            dop.id_orden_produccion,
            dop.id_materia,
            dop.cantidad_porcentaje AS ingrediente_porcentaje
          FROM detalle_orden_produccion dop
          WHERE dop.id_materia = ?

          UNION ALL

          -- Órdenes sin ingredientes propios (usan receta base)
          SELECT
            op2.id_orden_produccion,
            dr.id_materia,
            dr.cantidad_porcentaje AS ingrediente_porcentaje
          FROM ordenes_produccion op2
          JOIN detalle_receta dr ON op2.id_receta = dr.id_receta
          WHERE dr.id_materia = ?
            AND NOT EXISTS (
              SELECT 1 FROM detalle_orden_produccion dop2
              WHERE dop2.id_orden_produccion = op2.id_orden_produccion
            )
        ) AS ingredientes ON ingredientes.id_orden_produccion = op.id_orden_produccion
        WHERE op.estado IN ('Pendiente', 'En proceso')
        AND (? IS NULL OR op.id_orden_produccion != ?)
      ), 0), 4) AS stock_comprometido
    FROM lotes l
    WHERE l.id_materia = ? AND l.estado = 'activo' AND l.stock_restante > 0;
  `;

    const [rows] = await db.execute(query, [
      id_materia, // para dop.id_materia
      id_materia, // para dr.id_materia
      excluir_orden_id, // IS NULL check
      excluir_orden_id, // != orden actual
      id_materia, // para lotes
    ]);

    const { stock_total, stock_comprometido } = rows[0];
    return Math.max(0, Number(stock_total) - Number(stock_comprometido));
  },
  // Editar cantidad e id_receta de una orden pendiente
  async editarOrden(id, cantidad_producir, id_receta) {
    const query = `
      UPDATE ordenes_produccion
      SET cantidad_producir = ?, id_receta = ?
      WHERE id_orden_produccion = ?;
    `;

    await db.execute(query, [cantidad_producir, id_receta, id]);
  },

  // Reasignar operario a una orden en proceso
  // Solo actualiza id_usuario_inicio — el campo que ya registra quién lleva la orden
  async reasignarOrden(id, id_usuario_inicio) {
    const query = `
      UPDATE ordenes_produccion
      SET id_usuario_inicio = ?
      WHERE id_orden_produccion = ?;
    `;

    await db.execute(query, [id_usuario_inicio, id]);
  },

  // Listar usuarios con rol Operario activos (para el select de reasignación)
  async findOperarios() {
    const query = `
      SELECT u.id_usuario, u.nombre, u.email
      FROM usuarios u
      INNER JOIN roles r ON u.id_rol = r.id_rol
      WHERE r.nombre_rol = 'Operario'
        AND u.estado = 'Activo'
      ORDER BY u.nombre ASC;
    `;

    const [rows] = await db.execute(query);
    return rows;
  },

  // Trae ingredientes propios de la orden (si fueron editados)
  async findIngredientesPropiosByOrden(id_orden_produccion) {
    const query = `
    SELECT 
      dop.id_materia,
      mp.nombre AS nombre_materia,
      dop.cantidad_porcentaje
    FROM detalle_orden_produccion dop
    INNER JOIN materias_primas mp ON dop.id_materia = mp.id_materia
    WHERE dop.id_orden_produccion = ?;
  `;
    const [rows] = await db.execute(query, [id_orden_produccion]);
    return rows;
  },

  // Guarda ingredientes editados solo para esta orden
  async guardarIngredientesOrden(conn, id_orden_produccion, ingredientes) {
    // Borra los anteriores de esta orden
    await conn.execute(
      `DELETE FROM detalle_orden_produccion WHERE id_orden_produccion = ?`,
      [id_orden_produccion],
    );
    // Inserta los nuevos
    for (const ing of ingredientes) {
      await conn.execute(
        `INSERT INTO detalle_orden_produccion (id_orden_produccion, id_materia, cantidad_porcentaje)
       VALUES (?, ?, ?)`,
        [
          id_orden_produccion,
          ing.id_materia,
          parseFloat(ing.cantidad_porcentaje),
        ],
      );
    }
  },
};

module.exports = ProduccionModel;
