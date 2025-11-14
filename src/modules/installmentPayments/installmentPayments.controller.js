// ============================================
// FILE 1: installmentPayments.controller.js
// ============================================

import * as installmentPaymentsService from "./installmentPayments.service.js";
import { validateSchema } from "../../shared/utils/validateSchema.js";
import {
  createPaymentSchema,
  updatePaymentSchema,
  paymentIdSchema,
  installmentIdSchema,
} from "./installmentPayments.schema.js";

/**
 * Get all installment payments
 */
export async function getAllPayments(request, reply) {
  try {
    const currentUser = request.user;
    const filters = request.query;

    const payments = await installmentPaymentsService.getAllPayments(
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
 * ⭐ NEW: Get all payments for a specific installment
 */
export async function getPaymentsByInstallmentId(request, reply) {
  try {
    const { installmentId } = request.params;
    const validation = validateSchema(installmentIdSchema, {
      id: Number(installmentId),
    });

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Invalid installment ID",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    const payments =
      await installmentPaymentsService.getPaymentsByInstallmentId(
        request.server.prisma,
        Number(installmentId),
        currentUser
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
    const payment = await installmentPaymentsService.getPaymentById(
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

    const count = await installmentPaymentsService.countPendingPayments(
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

    const count = await installmentPaymentsService.countOverduePayments(
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
 * Create payment (first payment for new installment)
 */
export async function createPayment(request, reply) {
  try {
    const validation = validateSchema(createPaymentSchema, request.body);

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    const payment = await installmentPaymentsService.createPayment(
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
 * Update payment (process payment with new amount)
 * This will close current payment and create next one
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

    const validation = validateSchema(updatePaymentSchema, request.body);

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    const payment = await installmentPaymentsService.updatePayment(
      request.server.prisma,
      Number(id),
      request.body,
      currentUser
    );

    return reply.send({
      success: true,
      message:
        "Payment updated successfully. Next payment created automatically.",
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
 * Delete payment (developer only)
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
    await installmentPaymentsService.deletePayment(
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

/**
 * Get installment summary
 */
export async function getInstallmentSummary(request, reply) {
  try {
    const { installmentId } = request.params;
    const validation = validateSchema(installmentIdSchema, {
      id: Number(installmentId),
    });

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Invalid installment ID",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    const summary = await installmentPaymentsService.getInstallmentSummary(
      request.server.prisma,
      Number(installmentId),
      currentUser
    );

    return reply.send({
      success: true,
      data: summary,
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}
