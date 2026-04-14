const db = require("../config/conexion_db");

const pedidosModel = {
  async findAll() {
    const query =  `SELECT 
      p.id_pedido,
      pr.nombre_proveedor,
      p.no_orden_compra,
      p.fecha_creacion,
      p.tipo_pedido,
      p.estado,
      uc.nombre AS usuario_creador,
      ur.nombre AS usuario_receptor
    FROM pedidos p
    INNER JOIN proveedores pr 
      ON p.id_proveedor = pr.id_proveedor
    INNER JOIN usuarios uc 
      ON p.id_usuario_creador = uc.id_usuario
    LEFT JOIN usuarios ur 
      ON p.id_usuario_receptor = ur.id_usuario
    ORDER BY p.fecha_creacion DESC;
  `;

    const [rows] = await db.execute(query);
    return rows;
  },
};


module.exports = pedidosModel;