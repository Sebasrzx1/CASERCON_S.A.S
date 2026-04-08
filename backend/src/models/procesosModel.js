const db = require('../config/conexion_db');

//Aqui se haran el modelo de consultas CRUD para los procesos que tiene un usuario mas que todo con rol operador es decir si se desempeñara como RECEPCIONSITA o en PRODUCCION.

const ProcesosModel = {

  async findAll() {
    const query = `
      SELECT id_proceso, nombre
      FROM procesos
    `;
    const [rows] = await db.execute(query);
    return rows;
  },

  async findById(id) {
    const query = `
      SELECT id_proceso, nombre
      FROM procesos
      WHERE id_proceso = ?
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }
};

module.exports = ProcesosModel;