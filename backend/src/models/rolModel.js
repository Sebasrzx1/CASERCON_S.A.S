const db = require("../config/conexion_db");
const { findAll } = require("./userModel");

const RoleModel = {
  //obtener todos los roles
  async findAll() {
    const query = `
        SELECT id_rol, nombre 
        FROM roles
        `;
    const [rows] = await db.execute(query);
    return rows;
  },

  //Obtener un rol por ID
  async findById(id) {
    const query = `
        SELECT id_rol, nombre 
        FROM roles 
        WHERE id_rol = ?
        `;

    const [rows] = await db.execute(query, [id]);
    return rows[0];
  }
};

module.exports = RoleModel