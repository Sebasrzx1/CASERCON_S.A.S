const db = require("../config/conexion_db");

const ProveedoresModel = {
  async findAll() {
    const query = `
            SELECT * FROM proveedores;
        `;
    const [rows] = await db.execute(query);

    return rows;
  },

  async findByEmail(email) {
    const query = `
        SELECT * FROM proveedores
        WHERE email = ?
        
        `;
    const [rows] = await db.execute(query, [email]);
    return rows[0];
  },

  // Buscar por ID
  async findById(id) {
    const query = `
      SELECT * FROM proveedores
      WHERE id_proveedor = ?;
    `;
    const [rows] = await db.execute(query, [id]);
    return rows[0];
  },

  async create(proveedor) {
    const {
      nombre_proveedor,
      nombre_empresa,
      email,
      telefono,
      direccion,
      observaciones,
    } = proveedor;

    const query = `
      INSERT INTO proveedores (nombre_proveedor, nombre_empresa, email, telefono, direccion, observaciones)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      nombre_proveedor,
      nombre_empresa,
      email,
      telefono,
      direccion,
      observaciones,
    ]);

    return result.insertId;
  },

  // 🔥 🔹 UPDATE DINÁMICO (igual que usuarios)
  async update(id, data) {
    const campos = [];
    const valores = [];

    for (const key in data) {
      campos.push(`${key} = ?`);
      valores.push(data[key]);
    }

    valores.push(id);

    const query = `
      UPDATE proveedores
      SET ${campos.join(", ")}
      WHERE id_proveedor = ?
    `;

    await db.execute(query, valores);
  },

  // 🔹 Soft delete
  async delete(id) {
    const query = `
      UPDATE proveedores
      SET estado = 'Inhabilitado'
      WHERE id_proveedor = ?
    `;

    await db.execute(query, [id]);
  },

  async cambiarEstado(id) {
    const query = `
    UPDATE proveedores
    SET estado = 'Activo'
    WHERE id_proveedor = ?
  `;

    await db.execute(query, [id]);
  },
};

module.exports = ProveedoresModel;
