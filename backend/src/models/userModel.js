const db = require("../config/conexion_db");

const UserModel = {
  // Buscar usuario por email (login)
  // 🔐 Login con procesos incluidos
  async findByEmailWithProcesos(email) {
    const query = `
    SELECT 
      u.id_usuario,
      u.nombre,
      u.email,
      u.contraseña,
      u.id_rol,
      r.nombre_rol,
      GROUP_CONCAT(p.nombre_proceso) AS procesos
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN usuario_procesos up ON u.id_usuario = up.id_usuario
    LEFT JOIN procesos p ON up.id_proceso = p.id_proceso
    WHERE u.email = ?
    GROUP BY u.id_usuario
  `;

    const [rows] = await db.execute(query, [email]);

    if (!rows[0]) return null;

    const user = rows[0];

    // 🔥 convertir string → array
    user.procesos = user.procesos
      ? user.procesos.split(",").map((p) => p.toLowerCase())
      : [];

    return user;
  },

  // Crear usuario
  async create(user) {
    const { nombre, email, contraseña, id_rol } = user;

    const query = `
      INSERT INTO usuarios (nombre, email, contraseña, id_rol)
      VALUES (?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      nombre,
      email,
      contraseña,
      id_rol,
    ]);

    return result.insertId;
  },

  // Actualizar usuario
  async update(user) {
    const { id_usuario, nombre, email, contraseña, id_rol } = user;

    const query = `
      UPDATE usuarios 
      SET nombre = ?, email = ?, contraseña = ?, id_rol = ?
      WHERE id_usuario = ?
    `;

    const [result] = await db.execute(query, [
      nombre,
      email,
      contraseña,
      id_rol,
      id_usuario,
    ]);

    return result.affectedRows;
  },

  // Buscar por ID (con rol)
  async findById(id) {
    const query = `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.email,
        u.contraseña,
        u.id_rol,
        r.nombre_rol
      FROM usuarios u
      JOIN roles r ON u.id_rol = r.id_rol
      WHERE u.id_usuario = ?
    `;

    const [rows] = await db.execute(query, [id]);
    return rows[0];
  },

  // Listar todos los usuarios (con rol)
  async findAll() {
    const query = `
      SELECT 
        u.id_usuario,
        u.nombre,
        u.email,
        u.id_rol,
        r.nombre_rol
      FROM usuarios u
      JOIN roles r ON u.id_rol = r.id_rol
    `;

    const [rows] = await db.execute(query);
    return rows;
  },

  // ❌ Eliminar usuario
  async deleteById(id) {
    const query = `
      DELETE FROM usuarios 
      WHERE id_usuario = ?
    `;

    const [result] = await db.execute(query, [id]);
    return result.affectedRows;
  },

  // 🔥 PRO: usuario con rol y procesos
};

module.exports = UserModel;
