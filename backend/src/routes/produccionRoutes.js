const express = require('express')
const router = express.Router()

const produccionController = require('../controllers/produccionController')

//GET para traer todas las producciones
router.get("/", produccionController.getAllProducciones)


module.exports = router