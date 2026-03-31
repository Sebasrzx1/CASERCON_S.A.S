const express = require('express');
const router = express.Router()
const materiasPrimasController = require('../controllers/materiasPrimasController');

router.get("/", materiasPrimasController.getAllMaterias)

module.exports = router;