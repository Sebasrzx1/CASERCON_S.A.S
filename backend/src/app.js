express = require("express");
cors = require("cors");
helmet = require("helmet"); //Helmet es un middleware esencial para Node.js (especialmente con Express) que aumenta la seguridad de la aplicación configurando automáticamente varios encabezados HTTP. Protege contra vulnerabilidades comunes como ataques XSS, inyección de contenido, clickjacking y rastreo MIME
const path = require('path');
const AppError = require('./errors/AppError');
const globalErrorHandler = require('./middlewares/errorHandler');
require('dotenv').config()
//Le decimos que nuestro archivo app va a trabajar sobre express
const app = express();


//Configurar CORS para permitir acceso desde angular y react
app.use(
  cors({
    origin: ["http://localhost:4200", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

//Configurar Helmet con politicas relajadas para desarrollo
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false, //Desactivar CSP en desarrollo para evitar bloqueos
  }),
);

app.use(express.json())

/* ---------------------------------------------------------------------------------------------------- */

// IMPORTAR LAS RUTAS.
const atuhRoutes = require('./routes/authRoutes')
const materiasPrimasRoutes = require('./routes/materiasPrimasRoutes')
const recetasRoutes = require('./routes/recetasRoutes');
const movimientosRoutes = require('./routes/movimientosRoutes');
const proveedoresRoutes = require('./routes/proveedoresRoutes')
const userRoutes = require('./routes/userRoutes')
const produccionRoutes = require('./routes/produccionRoutes')
const pedidosRouter = require('./routes/pedidosRoutes')

// Ruta de autenticacion para los usuarios.
app.use('/api/auth', atuhRoutes)

//Ruta para las materias primas
app.use('/api/materias-primas', materiasPrimasRoutes)

//Ruta para las recetas
app.use('/api/recetas', recetasRoutes)

//Ruta para los movimientos
app.use('/api/movimientos', movimientosRoutes)

//Ruta para usuarios
app.use("/api/usuarios", userRoutes);

//Ruta para los proveedores
app.use('/api/proveedores', proveedoresRoutes)

//Ruta para produccion
app.use('/api/produccion', produccionRoutes)

//Ruta para pedidos
app.use('/api/pedidos', pedidosRouter)

//Manejo de rutas no encontradas (404)
app.all(/(.*)/, (req, res, next)=>{
    next(new AppError(`No se pudo encontrar ${req.originalUrl} en este servidor`, 404))
})

app.use(globalErrorHandler)

module.exports = app;