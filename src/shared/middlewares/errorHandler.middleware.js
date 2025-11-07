import { AppError } from "../errors/AppError.js";
import { ERROR_CODES } from "../errors/errorCodes.js";
import { Prisma } from "@prisma/client";

export function errorHandler(error, request, reply) {
  const { log } = request;

  // ==============================================================
  // 🔹 Prisma Known Errors (e.g., unique constraint, relation errors)
  // ==============================================================
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
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
        message: "Record not found",
      });
    }

    return reply.status(400).send({
      error: "PRISMA_KNOWN_ERROR",
      message: error.message.split("\n")[0],
      code: error.code,
      meta: error.meta || {},
    });
  }

  // ==============================================================
  // 🔹 Prisma Validation Errors (like Unknown field in select)
  // ==============================================================
  if (error instanceof Prisma.PrismaClientValidationError) {
    return reply.status(400).send({
      error: "PRISMA_VALIDATION_ERROR",
      message: "Invalid Prisma query. Check your field names and relations.",
      details: error.message.split("\n").slice(0, 2).join(" "),
    });
  }

  // ==============================================================
  // 🔹 Prisma Initialization / Rust Errors
  // ==============================================================
  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return reply.status(500).send({
      error: "PRISMA_ENGINE_ERROR",
      message: "Database engine panic. Restart the server.",
    });
  }

  // ==============================================================
  // 🔹 Zod Validation Errors
  // ==============================================================
  if (error.validation) {
    return reply.status(400).send({
      error: "VALIDATION_ERROR",
      message: "Incorrect data",
      details: error.validation,
    });
  }

  // ==============================================================
  // 🔹 Custom AppError
  // ==============================================================
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      error: ERROR_CODES[error.message] || "APP_ERROR",
      message: error.message,
      timestamp: error.timestamp,
    });
  }

  // ==============================================================
  // 🔹 Unknown Errors (fallback)
  // ==============================================================
  // Handle raw Prisma validation-like errors (missing args, etc.)
  if (
    typeof error.message === "string" &&
    error.message.includes("Invalid `prisma.")
  ) {
    return reply.status(400).send({
      error: "PRISMA_QUERY_ERROR",
      message:
        "Invalid Prisma query. Check your parameters or query structure.",
      details: error.message.split("\n").slice(0, 3).join(" "),
    });
  }

  log.error(error);
  return reply.status(500).send({
    error: "INTERNAL_ERROR",
    message: "An unexpected error occurred",
    details: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
}
