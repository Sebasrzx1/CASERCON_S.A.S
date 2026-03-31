// src/models/usuarioProceso.model.js
const db = require('../config/conexion_db');

const UsuarioProcesoModel = {

  // Asignar procesos a un usuario
  asignar: async (id_usuario, id_proceso) => {
    await db.query(
      `INSERT INTO usuario_procesos (id_usuario, id_proceso)
       VALUES (?, ?)`,
      [id_usuario, id_proceso]
    );
  },

  // Obtener procesos de un usuario
  obtenerProcesos: async (id_usuario) => {
    const [rows] = await db.query(
      `SELECT p.*
       FROM usuario_procesos up
       JOIN procesos p ON up.id_proceso = p.id_proceso
       WHERE up.id_usuario = ?`,
      [id_usuario]
    );

    return rows;
  },

  // Validar acceso
  tieneAcceso: async (id_usuario, id_proceso) => {
    const [rows] = await db.query(
      `SELECT * FROM usuario_procesos
       WHERE id_usuario = ? AND id_proceso = ?`,
      [id_usuario, id_proceso]
    );

    return rows.length > 0;
  }

};

module.exports = UsuarioProceso;