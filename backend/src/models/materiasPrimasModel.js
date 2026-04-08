const db = require("../config/conexion_db");

const materiasPrimasModel = {

  async findAll() {
  const query = `
    SELECT
      mp.id_materia,
      mp.abreviacion,
      mp.codigo,
      mp.nombre,
      mp.estado,
      mp.stock_min                                            AS stockMinimo,
      cm.id_categoria_materia,
      cm.nombre_categoria_materia                             AS categoria,
      ROUND(COALESCE(SUM(
        CASE WHEN l.estado = 'activo' THEN l.stock_restante ELSE 0 END
      ), 0), 2)                                              AS stockActual,
      ROUND(COALESCE((
        SELECT SUM(dr.cantidad_porcentaje / 100 * op.cantidad_producir)
        FROM   ordenes_produccion op
        JOIN   detalle_receta dr ON op.id_receta = dr.id_receta
        WHERE  op.estado IN ('Pendiente', 'En proceso')
        AND    dr.id_materia = mp.id_materia
      ), 0), 2)                                              AS stockComprometido,
      'kg'                                                    AS unidad
    FROM materias_primas mp
    LEFT JOIN categoria_materias cm
          ON mp.id_categoria_materia = cm.id_categoria_materia
    LEFT JOIN lotes l
          ON mp.id_materia = l.id_materia AND l.estado = 'activo'
    GROUP BY mp.id_materia, mp.abreviacion, mp.codigo,
            mp.nombre, mp.stock_min, mp.estado,
            cm.id_categoria_materia, cm.nombre_categoria_materia
    ORDER BY mp.nombre ASC;
  `;
  const [rows] = await db.execute(query);
  return rows.map(r => ({
    ...r,
    stockDisponible: Math.max(0, r.stockActual - r.stockComprometido),
  }));
},


  // ─── Una sola materia prima por ID ───────────────────────────────────────
  async findById(id) {
    const query = `
      SELECT mp.*, cm.nombre_categoria_materia AS categoria
      FROM   materias_primas mp
      LEFT   JOIN categoria_materias cm
            ON mp.id_categoria_materia = cm.id_categoria_materia
      WHERE  mp.id_materia = ?;
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  },

  // ─── Todas las categorías (para el select del formulario) ────────────────
  async findAllCategorias() {
    const query = `
      SELECT id_categoria_materia, nombre_categoria_materia
      FROM   categoria_materias
      ORDER  BY nombre_categoria_materia ASC;
    `;
    const [rows] = await db.execute(query);
    return rows;
  },

  // ─── Lotes activos de una materia (modal "Ver Lotes") ────────────────────
async findLotesByMateria(id_materia) {
  const query = `
    SELECT
      l.id_lote,
      l.numero_lote,
      l.codigo_lote,
      l.stock_inicial,
      l.stock_restante,
      l.fecha_ingreso,
      l.estado,
      dp.id_pedido,
      p.no_orden_compra   AS numero_orden_compra,
      pv.nombre_proveedor AS proveedor
    FROM   lotes l
    LEFT JOIN detalle_pedidos dp ON l.id_detalle_pedido = dp.id_detalle_pedido
    LEFT JOIN pedidos p          ON dp.id_pedido        = p.id_pedido
    LEFT JOIN proveedores pv     ON p.id_proveedor      = pv.id_proveedor
    WHERE  l.id_materia = ?
    ORDER  BY l.fecha_ingreso DESC;
  `;
  const [rows] = await db.execute(query, [id_materia]);
  return rows;
},

  // ─── Crear materia prima ──────────────────────────────────────────────────
  async create({ nombre, codigo, abreviacion, id_categoria_materia, stock_min }) {
    const query = `
      INSERT INTO materias_primas (nombre, codigo, abreviacion, id_categoria_materia, stock_min)
      VALUES (?, ?, ?, ?, ?);
    `;
    const [result] = await db.execute(query, [
      nombre, codigo, abreviacion, id_categoria_materia, stock_min ?? 0,
    ]);
    return result.insertId;
  },

  // ─── Crear lote inicial al registrar una materia prima ────────────────────
async createLote({ id_materia, abreviacion, stock_inicial }) {
  const numero_lote = 1;
  const fecha = new Date();
  const dd    = String(fecha.getDate()).padStart(2, "0");
  const mm    = String(fecha.getMonth() + 1).padStart(2, "0");
  const yyyy  = fecha.getFullYear();
  const codigo_lote = `${abreviacion}-${String(numero_lote).padStart(3, "0")}-${dd}${mm}${yyyy}`;

  const query = `
    INSERT INTO lotes
      (id_materia, numero_lote, id_detalle_pedido, codigo_lote, stock_inicial, stock_restante, estado)
    VALUES (?, ?, NULL, ?, ?, ?, 'activo');
  `;
  const [result] = await db.execute(query, [
    id_materia, numero_lote, codigo_lote, stock_inicial, stock_inicial,
  ]);
  return result.insertId;
},

// ─── Registrar movimiento de entrada inicial ──────────────────────────────
async createMovimientoEntrada({ id_materia, id_lote, id_usuario, cantidad }) {
  const query = `
    INSERT INTO movimientos_inventario
      (id_materia, id_lote, id_usuario, tipo_movimiento, cantidad, observacion)
    VALUES (?, ?, ?, 'Entrada', ?, 'Stock inicial al registrar materia prima');
  `;
  const [result] = await db.execute(query, [id_materia, id_lote, id_usuario, cantidad]);
  return result.insertId;
},

  // ─── Actualizar metadatos (el stock solo cambia por movimientos/lotes) ───
  async update(id, { nombre, codigo, abreviacion, id_categoria_materia, stock_min }) {
    const query = `
      UPDATE materias_primas
      SET    nombre               = ?,
            codigo               = ?,
            abreviacion          = ?,
            id_categoria_materia = ?,
            stock_min            = ?
      WHERE  id_materia = ?;
    `;
    const [result] = await db.execute(query, [
      nombre, codigo, abreviacion, id_categoria_materia, stock_min, id,
    ]);
    return result.affectedRows;
  },

  async inhabilitar(id) {
  const query = `
    UPDATE materias_primas SET estado = 'Inhabilitado' WHERE id_materia = ?;
  `;
  const [result] = await db.execute(query, [id]);
  return result.affectedRows;
},

// Rehabilitar
async habilitar(id) {
  const query = `
    UPDATE materias_primas SET estado = 'Activo' WHERE id_materia = ?;
  `;
  const [result] = await db.execute(query, [id]);
  return result.affectedRows;
},

};

module.exports = materiasPrimasModel;