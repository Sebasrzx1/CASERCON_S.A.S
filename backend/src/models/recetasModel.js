const db = require("../config/conexion_db");

const recetasModel = {

    //Consultar todas las recetas
  async findAll() {
    const query = `
      SELECT 
        r.id_receta,
        r.nombre_producto
      FROM recetas r;
    `;

    const [rows] = await db.execute(query);
    return rows;
  },

  //Consultar el detalle de las recetas
  async findDetalleByReceta(id_receta) {
    const query = `
      SELECT 
        dr.id_materia,
        mp.nombre,
        dr.cantidad_porcentaje
      FROM detalle_receta dr
      INNER JOIN materias_primas mp 
        ON dr.id_materia = mp.id_materia
      WHERE dr.id_receta = ?;
    `;

    const [rows] = await db.execute(query, [id_receta]);
    return rows;
  }

};

module.exports = recetasModel;