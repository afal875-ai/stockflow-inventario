const AppError = require("../utils/AppError");

function notFoundHandler(request, response) {
  response.status(404).json({
    error: "Ruta no encontrada",
    message: `No existe el recurso ${request.method} ${request.originalUrl}.`
  });
}

// Centralizar las respuestas de error mantiene el contrato de la API uniforme.
function errorHandler(error, _request, response, _next) {
  const isControlled = error instanceof AppError;
  const statusCode = isControlled ? error.statusCode : 500;

  if (!isControlled) {
    console.error(error);
  }

  response.status(statusCode).json({
    error: isControlled ? error.name : "InternalServerError",
    message: isControlled ? error.message : "Ocurrió un error inesperado.",
    details: isControlled ? error.details : null
  });
}

module.exports = { errorHandler, notFoundHandler };
