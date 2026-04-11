const db = require("../config/conexion_db");

const UserModel = {
  // Buscar usuario por email (login) para el Login con procesos incluidos
  async findByEmailWithProcesos(email) {
    const query = `
    SELECT 
      u.id_usuario,
      u.nombre,
      u.email,
      u.estado,
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

    // convertir string → array
    user.procesos = user.procesos
      ? user.procesos.split(",").map((p) => p.toLowerCase())
      : [];

    return user;
  },

  // Crear un usuario nuevo
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

    const fields = [];
    const values = [];

    if (nombre) {
      fields.push("nombre = ?");
      values.push(nombre);
    }
    if (email) {
      fields.push("email = ?");
      values.push(email);
    }
    if (contraseña) {
      fields.push("contraseña = ?");
      values.push(contraseña);
    }
    if (id_rol) {
      fields.push("id_rol = ?");
      values.push(id_rol);
    }

    if (fields.length === 0) return 0; // nada que actualizar

    const query = `UPDATE usuarios SET ${fields.join(", ")} WHERE id_usuario = ?`;
    values.push(id_usuario);

    const [result] = await db.execute(query, values);
    return result.affectedRows;
  },

  // Buscar por ID (con rol)
  async findById(id) {
    const query = `
      SELECT 
        u.id_usuario,
        u.estado,
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

  // Listar todos los usuarios (con rol) pero filtramos solo operarios ya que no habra crud para administradores
  async findAll() {
    const query = `
    SELECT 
      u.id_usuario,
      u.estado,
      u.nombre,
      u.email,
      u.id_rol,
      r.nombre_rol,
      GROUP_CONCAT(p.nombre_proceso) AS procesos
    FROM usuarios u
    JOIN roles r ON u.id_rol = r.id_rol
    LEFT JOIN usuario_procesos up ON u.id_usuario = up.id_usuario
    LEFT JOIN procesos p ON up.id_proceso = p.id_proceso
    WHERE u.id_rol = 2
    GROUP BY u.id_usuario
  `;

    const [rows] = await db.execute(query);

    // 🔥 convertir string → array
    return rows.map((user) => ({
      ...user,
      procesos: user.procesos
        ? user.procesos.split(",").map((p) => p.toLowerCase())
        : [],
    }));
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

  //Obtener un proceso por su nombre

  async getProcesoByNombre(nombre) {
    const [rows] = await db.execute(
      "SELECT id_proceso FROM procesos WHERE LOWER(nombre_proceso) = ?",
      [nombre.toLowerCase()],
    );
    return rows[0];
  },

  //Asignar un proceso a un usuario
  async insertUsuarioProceso(id_usuario, id_proceso) {
    await db.execute(
      "INSERT INTO usuario_procesos (id_usuario, id_proceso) VALUES (?, ?)",
      [id_usuario, id_proceso],
    );
  },

  //Eliminar un proceso a un usuario
  async deleteProcesosByUsuario(id_usuario) {
    await db.execute("DELETE FROM usuario_procesos WHERE id_usuario = ?", [
      id_usuario,
    ]);
  },

  // 🔹 Soft delete
  async delete(id) {
    const query = `
      UPDATE usuarios
      SET estado = 'Inhabilitado'
      WHERE id_usuario = ?
    `;

    await db.execute(query, [id]);
  },

  async cambiarEstado(id) {
    const query = `
    UPDATE usuarios
    SET estado = 'Activo'
    WHERE id_usuario = ?
  `;

    await db.execute(query, [id]);
  },
};

module.exports = UserModel;
