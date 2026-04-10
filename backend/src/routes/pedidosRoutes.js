const express = require('express')
const router = express.Router()

const pedidosController = require('../controllers/pedidosController');

router.get('/', pedidosController.getAllPedidos)

module.exports = router;