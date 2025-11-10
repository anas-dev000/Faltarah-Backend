import * as installmentsService from "./installments.service.js";
import { validateSchema } from "../../shared/utils/validateSchema.js";
import {
  createInstallmentSchema,
  updateInstallmentSchema,
  installmentIdSchema,
  createInstallmentPaymentSchema,
  updateInstallmentPaymentSchema,
  paymentIdSchema,
} from "./installments.schema.js";

// ==============================================
// INSTALLMENTS CONTROLLERS
// ==============================================

/**
 * Get all installments
 */
export async function getAllInstallments(request, reply) {
  try {
    const currentUser = request.user;

    const installments = await installmentsService.getAllInstallments(
      request.server.prisma,
      currentUser
    );

    return reply.send({
      success: true,
      data: installments,
      count: installments.length,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get installment by ID
 */
export async function getInstallmentById(request, reply) {
  try {
    const { id } = request.params;
    const validation = validateSchema(installmentIdSchema, { id: Number(id) });

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Invalid installment ID",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    const installment = await installmentsService.getInstallmentById(
      request.server.prisma,
      Number(id),
      currentUser
    );

    return reply.send({
      success: true,
      data: installment,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Create installment
 */
export async function createInstallment(request, reply) {
  try {
    const validation = validateSchema(createInstallmentSchema, request.body);

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    const installment = await installmentsService.createInstallment(
      request.server.prisma,
      request.body,
      currentUser
    );

    return reply.status(201).send({
      success: true,
      message: "Installment created successfully",
      data: installment,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Update installment
 */
export async function updateInstallment(request, reply) {
  try {
    const { id } = request.params;
    const idValidation = validateSchema(installmentIdSchema, {
      id: Number(id),
    });

    if (!idValidation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Invalid installment ID",
        details: idValidation.errors,
      });
    }

    const validation = validateSchema(updateInstallmentSchema, request.body);

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    const installment = await installmentsService.updateInstallment(
      request.server.prisma,
      Number(id),
      request.body,
      currentUser
    );

    return reply.send({
      success: true,
      message: "Installment updated successfully",
      data: installment,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Delete installment
 */
export async function deleteInstallment(request, reply) {
  try {
    const { id } = request.params;
    const validation = validateSchema(installmentIdSchema, { id: Number(id) });

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Invalid installment ID",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    await installmentsService.deleteInstallment(
      request.server.prisma,
      Number(id),
      currentUser
    );

    return reply.send({
      success: true,
      message: "Installment deleted successfully",
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

// ==============================================
// INSTALLMENT PAYMENTS CONTROLLERS
// ==============================================

/**
 * Get all installment payments
 */
export async function getAllPayments(request, reply) {
  try {
    const currentUser = request.user;
    const filters = request.query;

    const payments = await installmentsService.getAllPayments(
      request.server.prisma,
      currentUser,
      filters
    );

    return reply.send({
      success: true,
      data: payments,
      count: payments.length,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Get payment by ID
 */
export async function getPaymentById(request, reply) {
  try {
    const { id } = request.params;
    const validation = validateSchema(paymentIdSchema, { id: Number(id) });

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Invalid payment ID",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    const payment = await installmentsService.getPaymentById(
      request.server.prisma,
      Number(id),
      currentUser
    );

    return reply.send({
      success: true,
      data: payment,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Count pending payments
 */
export async function countPendingPayments(request, reply) {
  try {
    const currentUser = request.user;

    const count = await installmentsService.countPendingPayments(
      request.server.prisma,
      currentUser
    );

    return reply.send({
      success: true,
      data: { count },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Count overdue payments
 */
export async function countOverduePayments(request, reply) {
  try {
    const currentUser = request.user;

    const count = await installmentsService.countOverduePayments(
      request.server.prisma,
      currentUser
    );

    return reply.send({
      success: true,
      data: { count },
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Create installment payment
 */
export async function createPayment(request, reply) {
  try {
    const validation = validateSchema(
      createInstallmentPaymentSchema,
      request.body
    );

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    const payment = await installmentsService.createPayment(
      request.server.prisma,
      request.body,
      currentUser
    );

    return reply.status(201).send({
      success: true,
      message: "Payment created successfully",
      data: payment,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Update installment payment
 */
export async function updatePayment(request, reply) {
  try {
    const { id } = request.params;
    const idValidation = validateSchema(paymentIdSchema, { id: Number(id) });

    if (!idValidation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Invalid payment ID",
        details: idValidation.errors,
      });
    }

    const validation = validateSchema(
      updateInstallmentPaymentSchema,
      request.body
    );

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    const payment = await installmentsService.updatePayment(
      request.server.prisma,
      Number(id),
      request.body,
      currentUser
    );

    return reply.send({
      success: true,
      message: "Payment updated successfully",
      data: payment,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}

/**
 * Delete installment payment
 */
export async function deletePayment(request, reply) {
  try {
    const { id } = request.params;
    const validation = validateSchema(paymentIdSchema, { id: Number(id) });

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Invalid payment ID",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    await installmentsService.deletePayment(
      request.server.prisma,
      Number(id),
      currentUser
    );

    return reply.send({
      success: true,
      message: "Payment deleted successfully",
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}