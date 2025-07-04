// src/middlewares/errorHandler.js
export const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Ocurrió un error inesperado en el servidor.";

  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
  });
};