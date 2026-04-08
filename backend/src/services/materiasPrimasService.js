const materiasPrimasModel = require("../models/materiasPrimasModel");

<<<<<<< HEAD
//Todas estas funciones async apuntan hacia el Model los (services) en el backend sirven como capa intermedia entre los controladores (controladores API) y el modelo (base de datos), encapsulando la lógica de negocio, validando datos y gestionando la manipulación de información. 

//Funcion que nos ayudara más adelante a calcular el estado de cada materia prima.
const calcularEstadoStock = (stockActual, stockMinimo) => {
  if (stockActual <= stockMinimo) return "Critico";
  if (stockActual <= stockMinimo * 1.5) return "Bajo";
  return "Suficiente"
=======
// Lógica de negocio: calcula el estado de stock de una materia prima
const calcularEstadoStock = (stockActual, stockMinimo) => {
  if (stockActual <= stockMinimo * 0.5) return "Critico";  // ≤ 50 % del mínimo
  if (stockActual <= stockMinimo)        return "Bajo";     // entre 50 % y 100 %
  return "Suficiente";
>>>>>>> feature/modulo-inventario
};

const materiasPrimasService = {

<<<<<<< HEAD
=======
  // ─── Ya existente: usada en Dashboard ─────────────────────────────────────
>>>>>>> feature/modulo-inventario
  async getAllMaterias() {
    try {
      const materias = await materiasPrimasModel.findAll();

<<<<<<< HEAD
      // 🔥 Transformamos los datos
      const materiasConEstado = materias.map((m) => ({
        ...m,
        estado: calcularEstadoStock(m.stockActual, m.stockMinimo),
      }));

      return materiasConEstado;

    } catch (error) {
      console.error("Error en service getAllMaterias:", error);
      throw error; // lo maneja el controller
    }
  }

=======
      return materias.map((m) => ({
        ...m,
        estadoStock: calcularEstadoStock(m.stockActual, m.stockMinimo),
      }));
    } catch (error) {
      console.error("Error en service getAllMaterias:", error);
      throw error;
    }
  },

  // ─── Categorías para el select del formulario ──────────────────────────────
  async getAllCategorias() {
    try {
      return await materiasPrimasModel.findAllCategorias();
    } catch (error) {
      console.error("Error en service getAllCategorias:", error);
      throw error;
    }
  },

  // ─── Lotes de una materia (modal "Ver Lotes") ──────────────────────────────
  async getLotesByMateria(id) {
    try {
      const materia = await materiasPrimasModel.findById(id);
      if (!materia) throw { status: 404, msg: "Materia prima no encontrada" };

      return await materiasPrimasModel.findLotesByMateria(id);
    } catch (error) {
      console.error("Error en service getLotesByMateria:", error);
      throw error;
    }
  },

  // ─── Crear ─────────────────────────────────────────────────────────────────
  async createMateria(body) {
  const db = require("../config/conexion_db");
  const conn = await db.getConnection(); // transacción para que todo o nada
  try {
    await conn.beginTransaction();

    const { nombre, codigo, abreviacion, id_categoria_materia, stock_min, stock_inicial, id_usuario } = body;

    if (!nombre || !codigo || !abreviacion || !id_categoria_materia) {
      throw { status: 400, msg: "Faltan campos requeridos: nombre, codigo, abreviacion, id_categoria_materia" };
    }
    if (!stock_inicial || parseFloat(stock_inicial) <= 0) {
      throw { status: 400, msg: "El stock inicial debe ser mayor a 0" };
    }
    if (!id_usuario) {
      throw { status: 400, msg: "Se requiere el id del usuario" };
    }

    // 1. Crear la materia prima
    const [mpResult] = await conn.execute(
      `INSERT INTO materias_primas (nombre, codigo, abreviacion, id_categoria_materia, stock_min)
      VALUES (?, ?, ?, ?, ?)`,
      [nombre, codigo, abreviacion, id_categoria_materia, stock_min ?? 0]
    );
    const id_materia = mpResult.insertId;

    // 2. Generar código de lote
    const fecha = new Date();
    const dd    = String(fecha.getDate()).padStart(2, "0");
    const mm    = String(fecha.getMonth() + 1).padStart(2, "0");
    const yyyy  = fecha.getFullYear();
    const codigo_lote = `${abreviacion}-001-${dd}${mm}${yyyy}`;

    // 3. Crear el lote inicial
    const [loteResult] = await conn.execute(
      `INSERT INTO lotes
          (id_materia, numero_lote, id_detalle_pedido, codigo_lote, stock_inicial, stock_restante, estado)
      VALUES (?, 1, NULL, ?, ?, ?, 'activo')`,
      [id_materia, codigo_lote, stock_inicial, stock_inicial]
    );
    const id_lote = loteResult.insertId;

    // 4. Registrar movimiento de entrada
    await conn.execute(
      `INSERT INTO movimientos_inventario
          (id_materia, id_lote, id_usuario, tipo_movimiento, cantidad, observacion)
      VALUES (?, ?, ?, 'Entrada', ?, 'Stock inicial al registrar materia prima')`,
      [id_materia, id_lote, id_usuario, stock_inicial]
    );

    await conn.commit();
    return { id_materia, msg: "Materia prima creada correctamente con stock inicial" };

  } catch (error) {
    await conn.rollback();
    console.error("Error en service createMateria:", error);
    throw error;
  } finally {
    conn.release();
  }
},

  // ─── Actualizar ────────────────────────────────────────────────────────────
  async updateMateria(id, body) {
    try {
      const materia = await materiasPrimasModel.findById(id);
      if (!materia) throw { status: 404, msg: "Materia prima no encontrada" };

      const { nombre, codigo, abreviacion, id_categoria_materia, stock_min } = body;

      if (!nombre || !codigo || !abreviacion || !id_categoria_materia) {
        throw { status: 400, msg: "Faltan campos requeridos" };
      }

      await materiasPrimasModel.update(id, {
        nombre, codigo, abreviacion, id_categoria_materia, stock_min,
      });

      return { msg: "Materia prima actualizada correctamente" };
    } catch (error) {
      console.error("Error en service updateMateria:", error);
      throw error;
    }
  },

  // Reemplaza deleteMateria por esto:
async deleteMateria(id) {
  try {
    const materia = await materiasPrimasModel.findById(id);
    if (!materia) throw { status: 404, msg: "Materia prima no encontrada" };
    if (materia.estado === 'Inhabilitado') throw { status: 400, msg: "La materia prima ya está inhabilitada" };

    await materiasPrimasModel.inhabilitar(id);
    return { msg: "Materia prima inhabilitada correctamente" };
  } catch (error) {
    console.error("Error en service deleteMateria:", error);
    throw error;
  }
},

// Agrega esta función nueva:
async habilitarMateria(id) {
  try {
    const materia = await materiasPrimasModel.findById(id);
    if (!materia) throw { status: 404, msg: "Materia prima no encontrada" };
    if (materia.estado === 'Activo') throw { status: 400, msg: "La materia prima ya está activa" };

    await materiasPrimasModel.habilitar(id);
    return { msg: "Materia prima habilitada correctamente" };
  } catch (error) {
    console.error("Error en service habilitarMateria:", error);
    throw error;
  }
},
>>>>>>> feature/modulo-inventario
};

module.exports = materiasPrimasService;