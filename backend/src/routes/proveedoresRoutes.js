const express = require("express");
const router = express()

const proveedoresController = require('../controllers/proveedoresController');

router.get("/", proveedoresController.getAllProveedores)
router.post("/", proveedoresController.createProveedor )

module.exports = router;