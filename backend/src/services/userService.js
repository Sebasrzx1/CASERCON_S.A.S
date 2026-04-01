const UserModel = require("../models/userModel");
const bcrypt = require("bcrypt");

//Todas estas funciones async apuntan hacia el Model los (services) en el backend sirven como capa intermedia entre los controladores (controladores API) y el modelo (base de datos), encapsulando la lógica de negocio, validando datos y gestionando la manipulación de información.

// Helper para obtener id_rol desde el nombre
async function getIdRolByName(rol) {
  const lower = rol.toLowerCase();
  if (lower === "administrador") return 1;
  if (lower === "operario") return 2;
  return null; // rol inválido
}

const UserService = {
  // crear usuario
  async createUsuario(data) {
    const { nombre, email, rol, procesos } = data;

    const id_rol = await getIdRolByName(rol); // <-- usa el helper
    if (!id_rol) throw new Error("Rol inválido");

    const hashPassword = await bcrypt.hash(data.contraseña, 10);

    const id_usuario = await UserModel.create({
      nombre,
      email,
      contraseña: hashPassword,
      id_rol,
    });

    // 🔥 asignar procesos
    if (procesos?.length) {
      for (const proceso of procesos) {
        const procesoDB = await UserModel.getProcesoByNombre(proceso);

        if (procesoDB) {
          await UserModel.insertUsuarioProceso(
            id_usuario,
            procesoDB.id_proceso,
          );
        }
      }
    }

    return {
      id_usuario,
      nombre,
      email,
      nombre_rol: rol,
      procesos,
    };
  },

  //Actualizar usuario
  async updateUsuario(id, data) {
    const updateData = {};

    if (data.nombre) updateData.nombre = data.nombre;
    if (data.email) updateData.email = data.email;
    if (data.contraseña) {
      updateData.contraseña = await bcrypt.hash(data.contraseña, 10);
    }

    // Si viene el rol como string
    if (data.rol) {
      const id_rol = await getIdRolByName(data.rol);
      if (id_rol) updateData.id_rol = id_rol;
    }

    // Si viene directamente el id_rol
    if (data.id_rol) {
      updateData.id_rol = data.id_rol;
    }

    if (Object.keys(updateData).length > 0) {
      await UserModel.update({ id_usuario: id, ...updateData });
    }

    if (data.procesos) {
      await UserModel.deleteProcesosByUsuario(id);
      for (const proceso of data.procesos) {
        const procesoDB = await UserModel.getProcesoByNombre(proceso);
        if (procesoDB)
          await UserModel.insertUsuarioProceso(id, procesoDB.id_proceso);
      }
    }

    return { message: "Usuario actualizado" };
  },

  async getUsuarios() {
    return await UserModel.findAll();
  },

  async getUsuarioById(id) {
    return await UserModel.findById(id);
  },

  async deleteUsuario(id) {
    return await UserModel.deleteById(id);
  },
};

module.exports = UserService;
