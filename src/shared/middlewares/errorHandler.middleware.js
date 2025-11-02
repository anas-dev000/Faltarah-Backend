import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";

export function errorHandler(error, request, reply) {
  const { log } = request;

  // Prisma Errors
  if (error.code === "P2002") {
    return reply.status(409).send({
      error: "DUPLICATE_ENTRY",
      message: "Record already exists",
      field: error.meta?.target,
    });
  }

  if (error.code === "P2025") {
    return reply.status(404).send({
      error: "NOT_FOUND",
      Message: "Record not found",
    });
  }

  // Validation Errors (Zod)
  if (error.validation) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      Message: "Incorrect data",
      details: error.validation,
    });
  }

  // Custom AppError
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: ERROR_CODES[error.message] || "ERROR",
      message: error.message,
      timestamp: error.timestamp,
    });
  }

  // Unknown Errors
  log.error(error);
  return reply.status(500).send({
    error: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
  });
}
