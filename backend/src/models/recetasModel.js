const db = require("../config/conexion_db");

const recetasModel = {

  async findAll() {
    const query = `
      SELECT id_receta, nombre_producto, estado, fecha_creacion
      FROM recetas
      ORDER BY fecha_creacion DESC;
    `;
    const [rows] = await db.execute(query);
    return rows;
  },

  async findDetalleByReceta(id_receta) {
    const query = `
      SELECT 
        dr.id_detalle_receta,
        dr.id_materia,
        mp.nombre AS nombre_materia,
        dr.cantidad_porcentaje
      FROM detalle_receta dr
      INNER JOIN materias_primas mp ON dr.id_materia = mp.id_materia
      WHERE dr.id_receta = ?;
    `;
    const [rows] = await db.execute(query, [id_receta]);
    return rows;
  },

  async findById(id_receta) {
    const query = `
      SELECT id_receta, nombre_producto, estado, fecha_creacion
      FROM recetas WHERE id_receta = ?;
    `;
    const [rows] = await db.execute(query, [id_receta]);
    return rows[0];
  },

  async findByNombre(nombre_producto) {
    const query = `
      SELECT id_receta FROM recetas
      WHERE LOWER(nombre_producto) = LOWER(?);
    `;
    const [rows] = await db.execute(query, [nombre_producto]);
    return rows[0];
  },

  async create(nombre_producto) {
    const query = `INSERT INTO recetas (nombre_producto) VALUES (?);`;
    const [result] = await db.execute(query, [nombre_producto]);
    return result.insertId;
  },

  async createDetalle(id_receta, ingredientes) {
    const query = `
      INSERT INTO detalle_receta (id_receta, id_materia, cantidad_porcentaje)
      VALUES (?, ?, ?);
    `;
    for (const ing of ingredientes) {
      await db.execute(query, [id_receta, ing.id_materia, ing.cantidad_porcentaje]);
    }
  },

  async update(id_receta, nombre_producto) {
    const query = `UPDATE recetas SET nombre_producto = ? WHERE id_receta = ?;`;
    await db.execute(query, [nombre_producto, id_receta]);
  },

  async deleteDetalle(id_receta) {
    const query = `DELETE FROM detalle_receta WHERE id_receta = ?;`;
    await db.execute(query, [id_receta]);
  },

  async inhabilitar(id_receta) {
    const query = `UPDATE recetas SET estado = 'Inhabilitado' WHERE id_receta = ?;`;
    await db.execute(query, [id_receta]);
  },

  async habilitar(id_receta) {
    const query = `UPDATE recetas SET estado = 'Activo' WHERE id_receta = ?;`;
    await db.execute(query, [id_receta]);
  },

  async tieneOrdenesActivas(id_receta) {
    const query = `
      SELECT COUNT(*) AS total FROM ordenes_produccion
      WHERE id_receta = ? AND estado IN ('Pendiente', 'En proceso');
    `;
    const [rows] = await db.execute(query, [id_receta]);
    return rows[0].total > 0;
  },

};

module.exports = recetasModel;