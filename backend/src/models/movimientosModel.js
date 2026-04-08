const db = require("../config/conexion_db");

const movimientosModel = {

  async findAll() {
    const query = `
      SELECT 
        m.id_movimiento,
        m.tipo_movimiento,
        m.cantidad,
        m.fecha,
        mp.nombre AS materia
      FROM movimientos_inventario m
      INNER JOIN materias_primas mp 
        ON m.id_materia = mp.id_materia
      ORDER BY m.fecha DESC;
    `;

    const [rows] = await db.execute(query);
    return rows;
  },

  async create({ id_materia, tipo, cantidad }) {
    const query = `
      INSERT INTO movimientos (id_materia, tipo, cantidad, fecha)
      VALUES (?, ?, ?, NOW());
    `;

    const [result] = await db.execute(query, [
      id_materia,
      tipo,
      cantidad
    ]);

    return result.insertId;
  }

};

module.exports = movimientosModel;