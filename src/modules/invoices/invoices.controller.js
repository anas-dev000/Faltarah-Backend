import * as invoicesService from "./invoices.service.js";
import { validateSchema } from "../../shared/utils/validateSchema.js";
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceIdSchema,
  createInvoiceItemSchema,
  createInstallmentSchema,
  createInstallmentPaymentSchema,
  updateInstallmentPaymentSchema,
} from "./invoices.schema.js";

// ==============================================
// INVOICES CONTROLLERS
// ==============================================

/**
 * Get all invoices with optional filters
 */
export async function getAllInvoices(request, reply) {
  try {
    const currentUser = request.user;
    const filters = request.query;

    const invoices = await invoicesService.getAllInvoices(
      request.server.prisma,
      currentUser,
      filters
    );

    return reply.send({
      success: true,
      data: invoices,
      count: invoices.length,
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
 * Get invoice by ID
 */
export async function getInvoiceById(request, reply) {
  try {
    const { id } = request.params;
    const validation = validateSchema(invoiceIdSchema, { id: Number(id) });

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Invalid invoice ID",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    const invoice = await invoicesService.getInvoiceById(
      request.server.prisma,
      Number(id),
      currentUser
    );

    return reply.send({
      success: true,
      data: invoice,
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
 * Get recent invoices
 */
export async function getRecentInvoices(request, reply) {
  try {
    const currentUser = request.user;
    const limit = Number(request.query.limit) || 5;

    const invoices = await invoicesService.getRecentInvoices(
      request.server.prisma,
      currentUser,
      limit
    );

    return reply.send({
      success: true,
      data: invoices,
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
 * Get monthly revenue
 */
export async function getMonthlyRevenue(request, reply) {
  try {
    const currentUser = request.user;

    const revenue = await invoicesService.getMonthlyRevenue(
      request.server.prisma,
      currentUser
    );

    return reply.send({
      success: true,
      data: { revenue },
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
 * Create new invoice
 */
export async function createInvoice(request, reply) {
  try {
    const validation = validateSchema(createInvoiceSchema, request.body);

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    const invoice = await invoicesService.createInvoice(
      request.server.prisma,
      request.body,
      currentUser
    );

    return reply.status(201).send({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
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
 * Update invoice
 */
export async function updateInvoice(request, reply) {
  try {
    const { id } = request.params;
    const idValidation = validateSchema(invoiceIdSchema, { id: Number(id) });

    if (!idValidation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Invalid invoice ID",
        details: idValidation.errors,
      });
    }

    const validation = validateSchema(updateInvoiceSchema, request.body);

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    const invoice = await invoicesService.updateInvoice(
      request.server.prisma,
      Number(id),
      request.body,
      currentUser
    );

    return reply.send({
      success: true,
      message: "Invoice updated successfully",
      data: invoice,
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
 * Delete invoice
 */
export async function deleteInvoice(request, reply) {
  try {
    const { id } = request.params;
    const validation = validateSchema(invoiceIdSchema, { id: Number(id) });

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Invalid invoice ID",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    await invoicesService.deleteInvoice(
      request.server.prisma,
      Number(id),
      currentUser
    );

    return reply.send({
      success: true,
      message: "Invoice deleted successfully",
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
// INVOICE ITEMS CONTROLLERS
// ==============================================

/**
 * Get invoice items
 */
export async function getInvoiceItems(request, reply) {
  try {
    const { invoiceId } = request.params;
    const currentUser = request.user;

    const items = await invoicesService.getInvoiceItems(
      request.server.prisma,
      Number(invoiceId),
      currentUser
    );

    return reply.send({
      success: true,
      data: items,
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
 * Create invoice item
 */
export async function createInvoiceItem(request, reply) {
  try {
    const validation = validateSchema(createInvoiceItemSchema, request.body);

    if (!validation.valid) {
      return reply.status(400).send({
        success: false,
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const currentUser = request.user;
    const item = await invoicesService.createInvoiceItem(
      request.server.prisma,
      request.body,
      currentUser
    );

    return reply.status(201).send({
      success: true,
      message: "Invoice item created successfully",
      data: item,
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
 * Update invoice item
 */
export async function updateInvoiceItem(request, reply) {
  try {
    const { id } = request.params;
    const currentUser = request.user;

    const item = await invoicesService.updateInvoiceItem(
      request.server.prisma,
      Number(id),
      request.body,
      currentUser
    );

    return reply.send({
      success: true,
      message: "Invoice item updated successfully",
      data: item,
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
 * Delete invoice item
 */
export async function deleteInvoiceItem(request, reply) {
  try {
    const { id } = request.params;
    const currentUser = request.user;

    await invoicesService.deleteInvoiceItem(
      request.server.prisma,
      Number(id),
      currentUser
    );

    return reply.send({
      success: true,
      message: "Invoice item deleted successfully",
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
// INSTALLMENTS CONTROLLERS
// ==============================================

/**
 * Get all installments
 */
export async function getAllInstallments(request, reply) {
  try {
    const currentUser = request.user;

    const installments = await invoicesService.getAllInstallments(
      request.server.prisma,
      currentUser
    );

    return reply.send({
      success: true,
      data: installments,
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
    const currentUser = request.user;

    const installment = await invoicesService.getInstallmentById(
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
    const installment = await invoicesService.createInstallment(
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
    const currentUser = request.user;

    const installment = await invoicesService.updateInstallment(
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
    const currentUser = request.user;

    await invoicesService.deleteInstallment(
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
export async function getAllInstallmentPayments(request, reply) {
  try {
    const currentUser = request.user;
    const filters = request.query;

    const payments = await invoicesService.getAllInstallmentPayments(
      request.server.prisma,
      currentUser,
      filters
    );

    return reply.send({
      success: true,
      data: payments,
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

    const count = await invoicesService.countPendingPayments(
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

    const count = await invoicesService.countOverduePayments(
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
export async function createInstallmentPayment(request, reply) {
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
    const payment = await invoicesService.createInstallmentPayment(
      request.server.prisma,
      request.body,
      currentUser
    );

    return reply.status(201).send({
      success: true,
      message: "Installment payment created successfully",
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
export async function updateInstallmentPayment(request, reply) {
  try {
    const { id } = request.params;
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
    const payment = await invoicesService.updateInstallmentPayment(
      request.server.prisma,
      Number(id),
      request.body,
      currentUser
    );

    return reply.send({
      success: true,
      message: "Installment payment updated successfully",
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
export async function deleteInstallmentPayment(request, reply) {
  try {
    const { id } = request.params;
    const currentUser = request.user;

    await invoicesService.deleteInstallmentPayment(
      request.server.prisma,
      Number(id),
      currentUser
    );

    return reply.send({
      success: true,
      message: "Installment payment deleted successfully",
    });
  } catch (error) {
    request.log.error(error);
    return reply.status(error.statusCode || 500).send({
      success: false,
      error: error.message,
    });
  }
}