const db = require("../config/conexion_db");

const materiasPrimasModel = {

  //Consultar todas las materias primas.
  async findAll() {
    const query = `
      SELECT 
        mp.id_materia AS id,
        mp.nombre,
        mp.stock_min AS stockMinimo,
        COALESCE(SUM(l.stock_restante), 0) AS stockActual,
        'kg' AS unidad
      FROM materias_primas mp
      LEFT JOIN lotes l 
        ON mp.id_materia = l.id_materia 
        AND l.estado = 'activo'
      GROUP BY mp.id_materia, mp.nombre, mp.stock_min;
    `;

    const [rows] = await db.execute(query);
    return rows;
  },
};

module.exports = materiasPrimasModel;