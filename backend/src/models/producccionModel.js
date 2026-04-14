const db = require('../config/conexion_db');

const ProduccionModel = {

  // Obtener todas las órdenes de producción
  async findAll() {
    const query = `
      SELECT 
        op.id_orden_produccion,
        r.nombre_producto,
        u.nombre AS usuario_creador,
        op.cantidad_producir,
        op.estado,
        op.fecha_creacion,
        op.fecha_finalizacion
      FROM ordenes_produccion op
      INNER JOIN recetas r 
        ON op.id_receta = r.id_receta
      INNER JOIN usuarios u 
        ON op.id_usuario_creador = u.id_usuario
      ORDER BY op.fecha_creacion DESC;
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
      data.cantidad_producir
    ];

    const [result] = await db.execute(query, values);
    return result.insertId;
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
  }

};

module.exports = ProduccionModel;