const express = require("express");
const router = express.Router();

const recetasController = require("../controllers/recetasController");

router.get("/", recetasController.getAllRecetas);

module.exports = router;