module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status|| 'error';

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        //Solo mostrar stack en desarrollo
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    })
}