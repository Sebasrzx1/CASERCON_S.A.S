const express = require("express");
const router  = express.Router();
const { protect } = require("../middlewares/authMiddleware");
const checkUserActivo = require("../middlewares/checkUserActivo");
const PedidosController = require("../controllers/pedidosController");

router.get("/proveedores", protect, checkUserActivo, PedidosController.getProveedores);
router.get("/materias",    protect, checkUserActivo, PedidosController.getMateriasPrimas);
router.get("/",            protect, checkUserActivo, PedidosController.getAllPedidos);
router.get("/:id",         protect, checkUserActivo, PedidosController.getPedidoById);
router.post("/",           protect, checkUserActivo, PedidosController.createPedido);
router.put("/:id",         protect, checkUserActivo, PedidosController.updatePedido);
router.put("/:id/recibir", protect, checkUserActivo, PedidosController.recibirPedido);
router.delete("/:id",      protect, checkUserActivo, PedidosController.deletePedido);

module.exports = router;