const express = require("express");
const router  = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const PedidosController = require("../controllers/pedidosController");

router.get("/proveedores", protect, PedidosController.getProveedores);
router.get("/materias",    protect, PedidosController.getMateriasPrimas);
router.get("/",            protect, PedidosController.getAllPedidos);
router.get("/:id",         protect, PedidosController.getPedidoById);
router.post("/",           protect, PedidosController.createPedido);
router.put("/:id",         protect, PedidosController.updatePedido);
router.put("/:id/recibir", protect, PedidosController.recibirPedido);
router.delete("/:id",      protect, PedidosController.deletePedido);

module.exports = router;